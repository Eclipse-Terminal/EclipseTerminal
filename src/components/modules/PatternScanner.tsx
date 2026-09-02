import { useMemo, useState } from "react";
import { Radar, Star, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradingViewEgyptScreener } from "@/components/TradingViewEmbed";
import { INDEX_TABS, PATTERNS, STOCKS, fmt, type IndexTab } from "@/lib/egx-data";
import { sectorName, stockName, useLang, type DictKey } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";

export function PatternScanner({ onOpenChart }: { onOpenChart?: (symbol: string) => void }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<IndexTab>("ALL");
  const { list: watchlist, has, toggle } = useWatchlist();

  const cards = useMemo(() => {
    return PATTERNS.map((p) => ({ p, stock: STOCKS.find((s) => s.symbol === p.symbol)! }))
      .filter(({ stock }) => {
        if (!stock) return false;
        if (tab === "ALL") return true;
        if (tab === "WATCHLIST") return watchlist.includes(stock.symbol);
        return stock.indices.includes(tab);
      })
      .sort((a, b) => b.p.confidence - a.p.confidence);
  }, [tab, watchlist]);

  return (
    <div className="tab-fade space-y-5">
      <div className="glow-card rounded-2xl p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Radar className="size-4 text-primary" /> {t("detectedPatterns")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {INDEX_TABS.map((idx) => (
            <Button
              key={idx}
              type="button"
              size="sm"
              variant={tab === idx ? "default" : "secondary"}
              onClick={() => setTab(idx)}
              className="font-bold"
            >
              {idx === "ALL" ? t("all") : idx === "WATCHLIST" ? t("watchlist") : idx}
            </Button>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-border bg-panel/60 p-6 text-center text-sm text-muted-foreground">
          {tab === "WATCHLIST" ? t("emptyWatchlist") : t("noResults")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ p, stock }) => {
            const bullish = p.bias === "bullish";
            return (
              <article key={p.id} className="glow-card flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-black text-primary">{stock.symbol}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {stockName(stock, lang)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(stock.symbol)}
                    aria-label={has(stock.symbol) ? t("removeWatchlist") : t("addWatchlist")}
                    className={`shrink-0 rounded-lg border border-border p-1.5 transition-colors ${
                      has(stock.symbol)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className={`size-4 ${has(stock.symbol) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      bullish
                        ? "border border-bull/40 bg-bull/10 text-bull"
                        : "border border-bear/40 bg-bear/10 text-bear"
                    }`}
                  >
                    {bullish ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {bullish ? t("bullish") : t("bearish")}
                  </span>
                  <span className="rounded-full border border-border bg-secondary px-2 py-1 text-[11px] font-bold text-muted-foreground">
                    {p.timeframe}
                  </span>
                </div>

                <p className="text-sm font-semibold">{t(p.pattern as DictKey)}</p>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("confidence")}</span>
                    <span className="font-bold text-foreground">{p.confidence}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${bullish ? "bg-bull" : "bg-bear"}`}
                      style={{ width: `${p.confidence}%` }}
                    />
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <dt className="text-muted-foreground">{t("price")}</dt>
                    <dd className="font-display font-bold">{fmt(stock.price)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("support")}</dt>
                    <dd className="font-display font-bold text-bull">{fmt(stock.support)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("resistance")}</dt>
                    <dd className="font-display font-bold text-bear">{fmt(stock.resistance)}</dd>
                  </div>
                </dl>

                <p className="text-[11px] text-muted-foreground">{sectorName(stock, lang)}</p>

                <Button
                  type="button"
                  size="sm"
                  className="mt-auto font-bold"
                  onClick={() => onOpenChart?.(stock.symbol)}
                >
                  {t("openChart")}
                </Button>
              </article>
            );
          })}
        </div>
      )}

      <section className="glow-card rounded-2xl p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <Radar className="size-4 text-primary" /> {t("fullScreener")}
        </h2>
        <TradingViewEgyptScreener className="h-[640px]" />
      </section>
    </div>
  );
}
