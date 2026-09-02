import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, CreditCard, Loader2, Lock, Smartphone, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startProCheckout, type CheckoutResponse } from "@/lib/payments.functions";
import { PRICE_MONTHLY_EGP, PRICE_YEARLY_EGP, useAccount } from "@/lib/plan";

type Cycle = "monthly" | "yearly";
type Channel = "card" | "vodafone_cash" | "orange_cash" | "we_pay" | "etisalat_cash" | "fawry";

const WALLETS: { id: Channel; label: string }[] = [
  { id: "vodafone_cash", label: "فودافون كاش" },
  { id: "orange_cash", label: "أورنج كاش" },
  { id: "we_pay", label: "WE Pay" },
  { id: "etisalat_cash", label: "اتصالات كاش" },
];

const PRO_FEATURES = [
  "أسئلة ذكاء اصطناعي غير محدودة + سجل دائم",
  "الرسم الشمعداني المتقدم TradingView وشاشة كاملة",
  "متتبع السيولة (Liquidity Tracker)",
  "تنبيهات النماذج الفنية وأولوية التحديثات",
];

export function UpgradeModal() {
  const { upgradeOpen, closeUpgrade, upgradeReason, quota, refresh } = useAccount();
  const checkout = useServerFn(startProCheckout);

  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [channel, setChannel] = useState<Channel>("card");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!upgradeOpen) {
      setResult(null);
      setIframeUrl(null);
      setBusy(false);
      void refresh();
    }
  }, [upgradeOpen, refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeUpgrade();
    };
    if (upgradeOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [upgradeOpen, closeUpgrade]);

  if (!upgradeOpen || typeof document === "undefined") return null;

  const isWallet = WALLETS.some((w) => w.id === channel);
  const price = cycle === "monthly" ? PRICE_MONTHLY_EGP : PRICE_YEARLY_EGP;

  async function pay() {
    setBusy(true);
    setResult(null);
    try {
      const res = await checkout({ data: { cycle, channel, phone } });
      setResult(res);
      if (res.status === "configured" && res.kind === "iframe") setIframeUrl(res.url);
      if (res.status === "configured" && res.kind === "redirect") window.location.href = res.url;
    } catch (err) {
      console.error("[upgrade] checkout failed", err);
      setResult({ status: "error", message: "حدث خطأ غير متوقع. حاول مرة أخرى." });
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      dir="rtl"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="الترقية إلى Pro"
    >
      <div className="glow-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-primary/30 p-5 shadow-[0_0_60px_-20px_var(--neutralx)] sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-black text-primary">
              <Lock className="size-4" /> الترقية إلى PRO
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {upgradeReason === "limit"
                ? `استهلكت ${quota.used}/${quota.limit ?? 3} أسئلة اليوم — فعّل PRO للأسئلة غير المحدودة.`
                : "هذه الميزة متاحة لمشتركي PRO فقط."}
            </p>
          </div>
          <button
            onClick={closeUpgrade}
            aria-label="إغلاق"
            className="rounded-lg border border-border bg-panel p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {iframeUrl ? (
          <iframe
            title="Paymob checkout"
            src={iframeUrl}
            className="h-[70vh] w-full rounded-xl border border-border bg-white"
          />
        ) : (
          <>
            <ul className="mb-4 space-y-2 rounded-2xl border border-border bg-secondary/30 p-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-bull" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["monthly", "yearly"] as Cycle[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`rounded-2xl border p-3 text-start transition-colors ${
                    cycle === c ? "border-primary bg-primary/10" : "border-border bg-panel"
                  }`}
                >
                  <span className="block text-[11px] font-bold text-muted-foreground">
                    {c === "monthly" ? "شهري" : "سنوي (وفّر شهرين)"}
                  </span>
                  <span className="block font-display text-lg font-black">
                    {c === "monthly" ? PRICE_MONTHLY_EGP : PRICE_YEARLY_EGP} ج.م
                  </span>
                </button>
              ))}
            </div>

            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              طريقة الدفع
            </p>
            <div className="mb-3 space-y-2">
              <button
                onClick={() => setChannel("card")}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition-colors ${
                  channel === "card" ? "border-primary bg-primary/10" : "border-border bg-panel"
                }`}
              >
                <CreditCard className="size-4 text-primary" />
                <span className="min-w-0 flex-1 text-start">
                  بطاقات وفين‑تك
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    Visa · Mastercard · Meeza · Telda · InstaPay
                  </span>
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {WALLETS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setChannel(w.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-colors ${
                      channel === w.id ? "border-primary bg-primary/10" : "border-border bg-panel"
                    }`}
                  >
                    <Smartphone className="size-3.5 text-primary" /> {w.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setChannel("fawry")}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition-colors ${
                  channel === "fawry" ? "border-primary bg-primary/10" : "border-border bg-panel"
                }`}
              >
                <Store className="size-4 text-primary" />
                <span className="min-w-0 flex-1 text-start">
                  فوري (كود دفع نقدي)
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    ادفع كاش من أي منفذ فوري بكود مرجعي
                  </span>
                </span>
              </button>
            </div>

            {isWallet && (
              <label className="mb-3 block">
                <span className="text-[11px] font-bold text-muted-foreground">رقم المحفظة</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  placeholder="01xxxxxxxxx"
                  className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            )}

            {result?.status === "error" && (
              <p className="mb-3 rounded-xl border border-bear/40 bg-bear/10 p-3 text-xs text-bear">
                {result.message}
              </p>
            )}
            {result?.status === "unconfigured" && (
              <p className="mb-3 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
                {result.message}
              </p>
            )}
            {result?.status === "configured" && result.kind === "reference" && (
              <div className="mb-3 rounded-xl border border-bull/40 bg-bull/10 p-3">
                <p className="text-xs text-muted-foreground">كود فوري المرجعي</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-display text-xl font-black tracking-widest text-bull">
                    {result.reference}
                  </span>
                  <button
                    onClick={() => void navigator.clipboard?.writeText(result.reference)}
                    aria-label="نسخ الكود"
                    className="rounded-lg border border-border bg-panel p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            <Button onClick={() => void pay()} disabled={busy} className="h-12 w-full font-black">
              {busy ? <Loader2 className="size-4 animate-spin" /> : `ادفع ${price} ج.م`}
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              الدفع آمن عبر Paymob · يتم تفعيل PRO تلقائياً بعد نجاح الدفع.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
