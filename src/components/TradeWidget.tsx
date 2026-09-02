import { useState } from "react";
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanSymbol, usePaperPortfolio } from "@/lib/paper-trading";
import { formatUpdatedAt, useLivePrices } from "@/lib/live-prices";
import { fmt } from "@/lib/egx-data";

export function TradeWidget({ symbol }: { symbol: string }) {
  const { cash, sharesOf, trade, loading } = usePaperPortfolio();
  const { priceOf, changeOf, updatedAt, refreshing, refresh, intervalMs } = useLivePrices();
  const [qty, setQty] = useState("100");
  const [busy, setBusy] = useState<"buy" | "sell" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const clean = cleanSymbol(symbol);
  const price = priceOf(clean);
  const changePct = changeOf(clean);
  const shares = Number(qty) || 0;
  const owned = sharesOf(clean);
  const total = shares * price;

  async function execute(side: "buy" | "sell") {
    setMsg(null);
    if (shares <= 0) {
      setMsg({ ok: false, text: "أدخل عددًا صحيحًا من الأسهم." });
      return;
    }
    if (price <= 0) {
      setMsg({ ok: false, text: "لا يوجد سعر متاح لهذا الرمز." });
      return;
    }
    setBusy(side);
    const res = await trade({ symbol: clean, side, shares, price });
    setBusy(null);
    setMsg(
      res.ok
        ? {
            ok: true,
            text: `تم تنفيذ ${side === "buy" ? "شراء" : "بيع"} ${shares} سهم ${clean} بسعر ${fmt(price)} EGP.`,
          }
        : { ok: false, text: res.error },
    );
  }

  return (
    <div className="glow-card rounded-2xl p-4" dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black">
          <Wallet className="size-4 text-primary" /> التداول الافتراضي
        </h3>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
          {clean}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-2.5 py-2">
        <p className="text-[10px] text-muted-foreground">
          آخر تحديث للسعر:{" "}
          <span className="font-bold tabular-nums text-foreground">
            {formatUpdatedAt(updatedAt)}
          </span>
          <span className="mx-1 text-muted-foreground">
            · يتحدّث تلقائيًا كل {Math.round(intervalMs / 1000)} ثانية
          </span>
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          aria-label="تحديث السعر الآن"
          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:text-primary disabled:opacity-60"
        >
          <RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} /> تحديث
        </button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <Cell
          label="السعر الحالي"
          value={`${fmt(price)}`}
          tone={changePct >= 0 ? "text-bull" : "text-bear"}
        />
        <Cell label="كاش متاح" value={fmt(cash, 0)} />
        <Cell label="أسهمك" value={fmt(owned, 0)} />
      </div>

      <label className="block">
        <span className="text-[11px] font-semibold text-muted-foreground">عدد الأسهم</span>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <p className="mt-2 text-[11px] text-muted-foreground">
        القيمة التقديرية: <span className="font-bold text-foreground">{fmt(total)} EGP</span>
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          disabled={busy !== null || loading}
          onClick={() => void execute("buy")}
          className="bg-bull font-black text-background hover:bg-bull/90"
        >
          {busy === "buy" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <TrendingUp className="size-4" />
          )}{" "}
          BUY
        </Button>
        <Button
          disabled={busy !== null || loading}
          onClick={() => void execute("sell")}
          className="bg-bear font-black text-background hover:bg-bear/90"
        >
          {busy === "sell" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <TrendingDown className="size-4" />
          )}{" "}
          SELL
        </Button>
      </div>

      {msg && (
        <p
          className={`mt-3 rounded-xl border p-2.5 text-[11px] font-semibold ${
            msg.ok ? "border-bull/40 bg-bull/10 text-bull" : "border-bear/40 bg-bear/10 text-bear"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-display text-sm font-black tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
