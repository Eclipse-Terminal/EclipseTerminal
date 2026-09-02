import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PayChannel, PlanCycle } from "@/lib/payments.server";

export type CheckoutInput = { cycle: PlanCycle; channel: PayChannel; phone?: string };

export type CheckoutResponse =
  | { status: "configured"; kind: "iframe" | "redirect"; url: string }
  | { status: "configured"; kind: "reference"; reference: string }
  | { status: "unconfigured"; paymentId: string; message: string }
  | { status: "error"; message: string };

export const startProCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CheckoutInput) => input)
  .handler(async ({ data, context }): Promise<CheckoutResponse> => {
    const { PRICES, readPaymobConfig, createPaymobCheckout, isWallet } =
      await import("@/lib/payments.server");

    const cycle: PlanCycle = data.cycle === "yearly" ? "yearly" : "monthly";
    const channel = data.channel;
    const phone = (data.phone ?? "").replace(/\s+/g, "");

    if (isWallet(channel) && !/^01\d{9}$/.test(phone)) {
      return { status: "error", message: "أدخل رقم محفظة مصري صحيح (11 رقم يبدأ بـ 01)." };
    }

    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        channel,
        plan_cycle: cycle,
        amount_cents: PRICES[cycle],
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[payments] insert failed", error);
      return { status: "error", message: "تعذّر إنشاء عملية الدفع، حاول مرة أخرى." };
    }

    const cfg = readPaymobConfig();
    if (!cfg) {
      return {
        status: "unconfigured",
        paymentId: row.id,
        message: "بوابة الدفع غير مُهيأة بعد. أضف مفاتيح Paymob لتشغيل الدفع الفعلي.",
      };
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();

      const result = await createPaymobCheckout({
        cfg,
        channel,
        cycle,
        email: profile?.email ?? "customer@egxpulse.app",
        phone: phone || "01000000000",
        paymentId: row.id,
      });

      await supabase
        .from("payments")
        .update({
          provider_order_id: result.orderId,
          reference_code: result.kind === "reference" ? result.reference : null,
        })
        .eq("id", row.id);

      if (result.kind === "reference") {
        return { status: "configured", kind: "reference", reference: result.reference };
      }
      return { status: "configured", kind: result.kind, url: result.url };
    } catch (err) {
      console.error("[payments] paymob checkout failed", err);
      await supabase.from("payments").update({ status: "failed" }).eq("id", row.id);
      return { status: "error", message: "فشل الاتصال ببوابة الدفع. حاول لاحقاً." };
    }
  });
