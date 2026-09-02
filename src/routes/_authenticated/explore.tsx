import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Factory,
  Flame,
  Landmark,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { ThndrShell } from "@/components/thndr/ThndrShell";
import { BrandMark, Delta, EmptyState, TickerBadge } from "@/components/thndr/bits";
import { STOCKS, fmt } from "@/lib/egx-data";
import { useLivePrices } from "@/lib/live-prices";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/_authenticated/explore")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Explore EGX Stocks — ECLIPSE" },
      {
        name: "description",
        content:
          "Search Egyptian stocks, filter by sector and build your own watchlists inside the ECLIPSE terminal.",
      },
      { property: "og:title", content: "Explore EGX Stocks — ECLIPSE" },
      { property: "og:description", content: "Search, filter and follow EGX-listed companies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ThndrShell tone="muted">
      <ExploreScreen />
    </ThndrShell>
  ),
});

const CHIPS = [
  { id: "all", label: "الكل", icon: Sparkles },
  { id: "Banks", label: "البنوك", icon: Landmark },
  { id: "Financials", label: "خدمات مالية", icon: Banknote },
  { id: "Real Estate", label: "عقارات", icon: Building2 },
  { id: "Industrials", label: "صناعة", icon: Factory },
  { id: "Energy", label: "طاقة", icon: Flame },
] as const;

function ExploreScreen() {
  const { priceOf, changeOf } = useLivePrices();
  const { list, toggle, has } = useWatchlist();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<string>("all");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return STOCKS.filter((s) => {
      const matchChip = chip === "all" || s.sector === chip;
      const matchQ =
        !needle ||
        s.symbol.toLowerCase().includes(needle) ||
        s.nameAr.includes(q.trim()) ||
        s.nameEn.toLowerCase().includes(needle);
      return matchChip && matchQ;
    }).slice(0, 40);
  }, [q, chip]);

  const watch = STOCKS.filter((s) => list.includes(s.symbol));

  return (
    <div className="rise">
      <header className="rounded-b-[28px] bg-background px-4 pb-6 pt-4">
        <div className="flex items-center justify-between gap-3">
          <BrandMark />
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-neutralx">
            Explore
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-panel px-3 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن سهم أو شركة…"
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      <div className="no-bar -mt-3 flex gap-2 overflow-x-auto px-4 py-4">
        {CHIPS.map((c) => {
          const Icon = c.icon;
          const active = chip === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              className={`press flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-surface-border bg-surface text-ink"
              }`}
            >
              <Icon className="size-3.5" /> {c.label}
            </button>
          );
        })}
      </div>

      <section className="rounded-t-[28px] bg-surface px-4 pb-8 pt-4">
        <h2 className="text-sm font-black text-ink">النتائج</h2>
        <ul className="mt-1">
          {results.map((s) => (
            <li
              key={s.symbol}
              className="flex items-center justify-between gap-3 border-b border-surface-border py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggle(s.symbol)}
                  aria-label="إضافة للمفضلة"
                  className="press text-ink-muted"
                >
                  <Star className={`size-4 ${has(s.symbol) ? "fill-gold text-gold" : ""}`} />
                </button>
                <div className="text-start">
                  <p className="font-mono text-sm font-black tabular-nums text-ink" dir="ltr">
                    {fmt(priceOf(s.symbol))}
                  </p>
                  <Delta value={changeOf(s.symbol)} className="text-[11px]" />
                </div>
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
          {results.length === 0 && (
            <li className="py-8 text-center text-sm text-ink-muted">لا نتائج مطابقة.</li>
          )}
        </ul>

        <h2 className="mt-8 text-sm font-black text-ink">قوائمي</h2>
        {watch.length === 0 ? (
          <EmptyState
            caption="لم تنشئ أي قائمة متابعة بعد. أضف الأسهم التي تهمك لمتابعتها بسرعة."
            actionLabel="إنشاء قائمة جديدة"
            onAction={() => void navigate({ to: "/" })}
          />
        ) : (
          <div className="soft-card mt-3 divide-y divide-surface-border">
            {watch.map((s) => (
              <Link
                key={s.symbol}
                to="/"
                className="press flex items-center justify-between gap-3 px-4 py-3"
              >
                <Delta value={changeOf(s.symbol)} className="text-[11px]" />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-ink">{s.symbol}</span>
                  <TickerBadge symbol={s.symbol} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
