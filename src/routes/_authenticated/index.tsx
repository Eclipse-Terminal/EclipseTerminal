import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Terminal as TerminalIcon } from "lucide-react";
import { ThndrShell } from "@/components/thndr/ThndrShell";
import { BrandMark, Delta, TickerBadge } from "@/components/thndr/bits";
import { INDEX_TABS, STOCKS, fmt, type IndexTab } from "@/lib/egx-data";
import { useLivePrices } from "@/lib/live-prices";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/_authenticated/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ECLIPSE — Live EGX Market Home" },
      {
        name: "description",
        content:
          "Live EGX30, EGX70 and EGX100 index cards with a scrollable Egyptian stock list, real-time prices and colour-coded daily moves.",
      },
      { property: "og:title", content: "ECLIPSE — Live EGX Market Home" },
      {
        property: "og:description",
        content: "Track Egyptian indices and stocks in real time inside the ECLIPSE terminal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ThndrShell tone="muted">
      <HomeScreen />
    </ThndrShell>
  ),
});

function HomeScreen() {
  const { priceOf, changeOf } = useLivePrices();
  const { list } = useWatchlist();
  const [tab, setTab] = useState<IndexTab>("ALL");

  const indices = useMemo(
    () =>
      (["EGX30", "EGX70", "EGX100"] as const).map((tag) => {
        const members = STOCKS.filter((s) => s.indices.includes(tag));
        const value = members.reduce((a, s) => a + priceOf(s.symbol), 0);
        const change = members.length
          ? members.reduce((a, s) => a + changeOf(s.symbol), 0) / members.length
          : 0;
        return { tag, value, change };
      }),
    [priceOf, changeOf],
  );

  const rows = useMemo(() => {
    const base =
      tab === "ALL"
        ? STOCKS
        : tab === "WATCHLIST"
          ? STOCKS.filter((s) => list.includes(s.symbol))
          : STOCKS.filter((s) => s.indices.includes(tab as "EGX30" | "EGX70" | "EGX100"));
    return base.map((s) => ({ ...s, live: priceOf(s.symbol), delta: changeOf(s.symbol) }));
  }, [tab, list, priceOf, changeOf]);

  return (
    <div className="rise">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-mono text-base font-black tracking-[0.22em] text-ink">ECLIPSE</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
              EGX Terminal
            </p>
          </div>
        </div>
        <Link
          to="/terminal"
          className="press grid size-10 place-items-center rounded-xl border border-surface-border bg-surface text-ink"
          aria-label="التيرمينال"
        >
          <TerminalIcon className="size-4" />
        </Link>
      </header>

      <div className="no-bar flex gap-3 overflow-x-auto px-4 pb-4">
        {indices.map((idx) => (
          <article key={idx.tag} className="soft-card press w-40 shrink-0 p-4">
            <p className="text-[11px] font-bold text-ink-muted">{idx.tag}</p>
            <p className="mt-1 font-mono text-xl font-black tabular-nums text-ink" dir="ltr">
              {fmt(idx.value, 0)}
            </p>
            <Delta value={idx.change} className="mt-1 text-xs" />
          </article>
        ))}
      </div>

      <section className="min-h-[60vh] rounded-t-[28px] bg-surface pb-6 shadow-[0_-10px_30px_-24px_rgba(10,13,20,0.5)]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-surface-border" />
        <div className="no-bar mt-3 flex gap-5 overflow-x-auto border-b border-surface-border px-4">
          {INDEX_TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`press relative whitespace-nowrap pb-3 text-xs font-black transition-colors ${
                  active ? "text-primary" : "text-ink-muted"
                }`}
              >
                {t === "ALL" ? "الكل" : t === "WATCHLIST" ? "المفضلة" : t}
                <span
                  className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <ul className="px-4">
          {rows.length === 0 && (
            <li className="py-10 text-center text-sm text-ink-muted">
              لا توجد أسهم في هذه القائمة بعد.
            </li>
          )}
          {rows.map((s) => (
            <li
              key={s.symbol}
              className="flex items-center justify-between gap-3 border-b border-surface-border py-3 last:border-0"
            >
              <div className="text-start">
                <p className="font-mono text-sm font-black tabular-nums text-ink" dir="ltr">
                  {fmt(s.live)}
                </p>
                <Delta value={s.delta} className="text-[11px]" />
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0 text-end">
                  <p className="truncate text-sm font-black text-ink">{s.symbol}</p>
                  <p className="truncate text-[11px] text-ink-muted">{s.nameAr}</p>
                </div>
                <TickerBadge symbol={s.symbol} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Link
        to="/terminal"
        className="press mx-4 mb-4 mt-4 flex items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface py-3 text-xs font-black text-ink"
      >
        <Bell className="size-4 text-primary" /> التنبيهات والأدوات المتقدمة
      </Link>
    </div>
  );
}
