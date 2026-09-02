import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ThndrShell } from "@/components/thndr/ThndrShell";
import { BrandMark, Delta, TickerBadge } from "@/components/thndr/bits";
import { usePaperPortfolio } from "@/lib/paper-trading";
import { fmt } from "@/lib/egx-data";

export const Route = createFileRoute("/_authenticated/portfolio")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Virtual Portfolio — ECLIPSE" },
      {
        name: "description",
        content:
          "Your simulated EGP portfolio: total value, cash, stock value and a sortable holdings list with live profit and loss.",
      },
      { property: "og:title", content: "ECLIPSE Virtual Portfolio" },
      { property: "og:description", content: "Paper-trade Egyptian stocks with virtual capital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ThndrShell tone="blue">
      <PortfolioScreen />
    </ThndrShell>
  ),
});

type SortKey = "value" | "pnl" | "symbol";

function PortfolioScreen() {
  const { cash, loading, stats } = usePaperPortfolio();
  const [sort, setSort] = useState<SortKey>("value");

  const rows = useMemo(() => {
    const copy = [...stats.rows];
    copy.sort((a, b) =>
      sort === "symbol"
        ? a.symbol.localeCompare(b.symbol)
        : sort === "pnl"
          ? b.pnlPct - a.pnlPct
          : b.value - a.value,
    );
    return copy;
  }, [stats.rows, sort]);

  return (
    <div className="rise">
      <header className="flex items-center justify-between px-4 pt-4">
        <BrandMark size="sm" />
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink-muted">المحفظة</p>
      </header>

      <section className="px-4 py-6 text-center">
        <p className="text-xs font-bold text-ink-muted">إجمالي قيمة المحفظة (EGP)</p>
        <p className="mt-1 font-mono text-4xl font-black tabular-nums text-ink" dir="ltr">
          {fmt(stats.netWorth)}
        </p>
        <Delta value={stats.pnlPct} className="mt-1 text-sm" />
      </section>

      <div className="grid grid-cols-3 gap-3 px-4">
        <Stat label="الكاش" value={fmt(cash, 0)} />
        <Stat label="الأسهم" value={fmt(stats.stocksValue, 0)} />
        <Stat
          label="غير محقق"
          value={fmt(stats.unrealized, 0)}
          tone={stats.unrealized >= 0 ? "text-bull" : "text-bear"}
        />
      </div>

      <section className="mt-6 min-h-[45vh] rounded-t-[28px] bg-surface px-4 pb-8 pt-4">
        <div className="flex items-center justify-between gap-2 pb-3">
          <h2 className="text-sm font-black text-ink">مراكزي</h2>
          <div className="flex gap-1.5">
            {(
              [
                { k: "value", l: "القيمة" },
                { k: "pnl", l: "الأداء" },
                { k: "symbol", l: "الرمز" },
              ] as const
            ).map((o) => (
              <button
                key={o.k}
                type="button"
                onClick={() => setSort(o.k)}
                className={`press rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                  sort === o.k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-surface-border text-ink-muted"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" /> جاري التحميل…
          </p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">لا مراكز مفتوحة بعد.</p>
        ) : (
          <ul>
            {rows.map((r) => (
              <li
                key={r.symbol}
                className="flex items-center justify-between gap-3 border-b border-surface-border py-3 last:border-0"
              >
                <div className="text-start">
                  <p className="font-mono text-sm font-black tabular-nums text-ink" dir="ltr">
                    {fmt(r.value)}
                  </p>
                  <Delta value={r.pnlPct} className="text-[11px]" />
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0 text-end">
                    <p className="truncate text-sm font-black text-ink">{r.symbol}</p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {fmt(r.shares, 0)} سهم · متوسط {fmt(r.avg_price)}
                    </p>
                  </div>
                  <TickerBadge symbol={r.symbol} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="soft-card press p-3 text-center">
      <p className="text-[11px] font-bold text-ink-muted">{label}</p>
      <p className={`mt-1 font-mono text-base font-black tabular-nums ${tone}`} dir="ltr">
        {value}
      </p>
    </div>
  );
}
