import { Loader2, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { STARTING_CASH, usePaperPortfolio } from "@/lib/paper-trading";
import { formatUpdatedAt, useLivePrices } from "@/lib/live-prices";
import { fmt } from "@/lib/egx-data";
import { TradeWidget } from "@/components/TradeWidget";

export function PaperPortfolio() {
  const { cash, trades, loading, error, stats, startingBalance } = usePaperPortfolio();
  const { updatedAt, refreshing, refresh, intervalMs, error: priceError } = useLivePrices();
  const positive = stats.pnl >= 0;

  return (
    <div className="tab-fade space-y-5" dir="rtl">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="صافي الثروة (EGP)" value={fmt(stats.netWorth)} tone="text-primary" />
        <Card label="الكاش الافتراضي المتاح" value={fmt(cash)} />
        <Card label="قيمة الأسهم" value={fmt(stats.stocksValue)} />
        <Card
          label="الأرباح / الخسائر"
          value={`${positive ? "+" : ""}${fmt(stats.pnl)} (${positive ? "+" : ""}${fmt(stats.pnlPct)}%)`}
          tone={positive ? "text-bull" : "text-bear"}
          icon={positive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel/60 px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          الأسعار تُحدَّث تلقائيًا كل {Math.round(intervalMs / 1000)} ثانية · آخر تحديث:{" "}
          <span className="font-bold tabular-nums text-foreground">
            {formatUpdatedAt(updatedAt)}
          </span>
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> تحديث الأسعار
          الآن
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        رأس المال الافتراضي المبدئي: {fmt(startingBalance || STARTING_CASH, 0)} EGP · محفظة تدريبية
        بأموال وهمية بالكامل.
      </p>

      {(error || priceError) && (
        <p className="rounded-xl border border-bear/40 bg-bear/10 p-3 text-xs text-bear">
          {error ?? priceError}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="glow-card overflow-x-auto rounded-2xl p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black">
            <Wallet className="size-4 text-primary" /> المراكز المفتوحة
          </h3>
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> جاري التحميل…
            </p>
          ) : stats.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا مراكز بعد — استخدم أداة التداول الافتراضي لتنفيذ أول أمر شراء.
            </p>
          ) : (
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 text-start">الرمز</th>
                  <th className="px-2 py-2 text-end">الأسهم</th>
                  <th className="px-2 py-2 text-end">متوسط الشراء</th>
                  <th className="px-2 py-2 text-end">السعر الحالي</th>
                  <th className="px-2 py-2 text-end">القيمة</th>
                  <th className="px-2 py-2 text-end">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((r) => (
                  <tr key={r.symbol} className="border-t border-border/60">
                    <td className="px-2 py-2.5 font-black text-primary">{r.symbol}</td>
                    <td className="px-2 py-2.5 text-end tabular-nums">{fmt(r.shares, 0)}</td>
                    <td className="px-2 py-2.5 text-end tabular-nums">{fmt(r.avg_price)}</td>
                    <td className="px-2 py-2.5 text-end tabular-nums">{fmt(r.price)}</td>
                    <td className="px-2 py-2.5 text-end tabular-nums">{fmt(r.value)}</td>
                    <td
                      className={`px-2 py-2.5 text-end font-bold ${r.pnl >= 0 ? "text-bull" : "text-bear"}`}
                    >
                      {r.pnl >= 0 ? "+" : ""}
                      {fmt(r.pnlPct)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="space-y-4">
          <TradeWidget symbol="COMI" />
          <div className="glow-card rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-black">آخر العمليات</h3>
            {trades.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا عمليات مسجلة.</p>
            ) : (
              <ul className="space-y-2">
                {trades.slice(0, 12).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className={`font-black ${t.side === "buy" ? "text-bull" : "text-bear"}`}>
                      {t.side === "buy" ? "شراء" : "بيع"} {t.symbol}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {fmt(t.shares, 0)} × {fmt(t.price)} = {fmt(t.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  tone = "text-foreground",
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glow-card rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className={`mt-1 font-display text-xl font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
