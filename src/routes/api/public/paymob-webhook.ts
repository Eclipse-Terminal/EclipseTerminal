import { createFileRoute } from "@tanstack/react-router";

type PaymobCallback = {
  type?: string;
  obj?: Record<string, unknown>;
};

export const Route = createFileRoute("/api/public/paymob-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYMOB_HMAC_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const url = new URL(request.url);
        const received = url.searchParams.get("hmac") ?? request.headers.get("x-paymob-hmac") ?? "";
        if (!received) return new Response("Missing hmac", { status: 401 });

        const body = (await request.json()) as PaymobCallback;
        const tx = body.obj;
        if (!tx) return new Response("Missing transaction", { status: 400 });

        const { verifyPaymobHmac } = await import("@/lib/payments.server");
        if (!(await verifyPaymobHmac(tx, received, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        const order = (tx["order"] ?? {}) as Record<string, unknown>;
        const merchantOrderId = order["merchant_order_id"];
        const success = tx["success"] === true || tx["success"] === "true";
        if (typeof merchantOrderId !== "string") {
          return new Response("Missing merchant_order_id", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: payment, error: findError } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, plan_cycle, status")
          .eq("id", merchantOrderId)
          .maybeSingle();

        if (findError || !payment) {
          console.error("[paymob] payment not found", merchantOrderId, findError);
          return new Response("Unknown payment", { status: 404 });
        }

        const { error: payError } = await supabaseAdmin
          .from("payments")
          .update({ status: success ? "paid" : "failed" })
          .eq("id", payment.id);
        if (payError) console.error("[paymob] payment update failed", payError);

        if (success) {
          const expires = new Date();
          if (payment.plan_cycle === "yearly") expires.setFullYear(expires.getFullYear() + 1);
          else expires.setMonth(expires.getMonth() + 1);

          const { error: planError } = await supabaseAdmin
            .from("profiles")
            .update({ plan: "pro", plan_expires_at: expires.toISOString() })
            .eq("id", payment.user_id);
          if (planError) {
            console.error("[paymob] plan upgrade failed", planError);
            return new Response("Plan update failed", { status: 500 });
          }
        }

        return Response.json({ ok: true, upgraded: success });
      },
    },
  },
});
