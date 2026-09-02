import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Maximize2, Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  normalizeTradingViewSymbol,
  TradingViewEgyptScreener,
  TradingViewRowQuote,
  TradingViewSingleQuote,
  TradingViewSymbolInfo,
  TradingViewTechnicalAnalysis,
} from "@/components/TradingViewEmbed";
import { TradingViewChart, type Timeframe } from "@/components/TradingViewChart";
import { SmartSearch } from "@/components/SmartSearch";
import { INDEX_TABS, STOCKS, type IndexTab } from "@/lib/egx-data";
import { sectorName, stockName, useLang } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";
import { useAccount } from "@/lib/plan";
import { TradeWidget } from "@/components/TradeWidget";
import { SmartAnalysis } from "@/components/SmartAnalysis";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "1Y", "5Y", "ALL"];
const DEFAULT_SYMBOL = "EGX:COMI";

const symbolLabel = (symbol: string) => symbol.replace("EGX:", "");

function FullScreenChart({
  symbol,
  timeframe,
  onTimeframe,
  onClose,
}: {
  symbol: string;
  timeframe: Timeframe;
  onTimeframe: (tf: Timeframe) => void;
  onClose: () => void;
}) {
  const { t } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/98 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((f) => (
            <Button
              key={f}
              type="button"
              size="sm"
              variant={timeframe === f ? "default" : "secondary"}
              onClick={() => onTimeframe(f)}
              className="font-bold"
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{t("escHint")}</span>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-lg border border-border bg-panel p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <div className="h-full [&>div]:h-full">
          <TradingViewChart
            key={`fs-${symbol}-${timeframe}`}
            symbol={symbol}
            timeframe={timeframe}
            fill
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function MarketLive({ focusSymbol }: { focusSymbol?: string }) {
  const { t, lang } = useLang();
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [draftSymbol, setDraftSymbol] = useState(symbolLabel(DEFAULT_SYMBOL));
  const [tf, setTf] = useState<Timeframe>("1M");
  const [expanded, setExpanded] = useState(false);
  const { isPro, openUpgrade } = useAccount();
  const [tab, setTab] = useState<IndexTab>("ALL");
  const { list: watchlist, has, toggle } = useWatchlist();

  const loadSymbol = (value: string) => {
    const next = normalizeTradingViewSymbol(value);
    setSymbol(next);
    setDraftSymbol(symbolLabel(next));
  };

  useEffect(() => {
    if (focusSymbol) loadSymbol(focusSymbol);
  }, [focusSymbol]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadSymbol(draftSymbol);
  };

  const active = useMemo(() => STOCKS.find((s) => s.symbol === symbolLabel(symbol)), [symbol]);

  const rows = useMemo(
    () =>
      STOCKS.filter((s) => {
        if (tab === "ALL") return true;
        if (tab === "WATCHLIST") return watchlist.includes(s.symbol);
        return s.indices.includes(tab);
      }),
    [tab, watchlist],
  );

  return (
    <div className="tab-fade space-y-5">
      <div className="glow-card space-y-4 rounded-2xl p-4 sm:p-5">
        <SmartSearch onSelect={(s) => loadSymbol(s.tv)} />

        <form
          onSubmit={onSubmit}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
        >
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">{t("fullSymbol")}</span>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 focus-within:border-primary">
              <Search className="size-4 shrink-0 text-primary" />
              <input
                value={draftSymbol}
                onChange={(event) => setDraftSymbol(event.target.value)}
                placeholder="COMI, EAST, EGX:SWDY"
                className="min-w-0 flex-1 bg-transparent text-sm uppercase outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </label>
          <Button type="submit" className="h-11 px-6 font-bold">
            {t("loadChart")}
          </Button>
        </form>

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

        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("emptyWatchlist")}</p>
          ) : (
            <table className="w-full min-w-[340px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 text-start">EGX</th>
                  <th className="px-2 py-2 text-end">{t("price")}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.symbol}
                    onClick={() => loadSymbol(s.tv)}
                    aria-selected={symbolLabel(symbol) === s.symbol}
                    className={`cursor-pointer border-t border-border/60 transition-colors hover:bg-accent/40 ${
                      symbolLabel(symbol) === s.symbol ? "bg-accent/30" : ""
                    }`}
                  >
                    <td className="px-2 py-2.5">
                      <span className="block font-bold text-primary">{s.symbol}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {stockName(s, lang)} · {sectorName(s, lang)}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex justify-end" dir="ltr">
                        <TradingViewRowQuote symbol={s.tv} />
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(s.symbol);
                        }}
                        aria-label={has(s.symbol) ? t("removeWatchlist") : t("addWatchlist")}
                        className={
                          has(s.symbol)
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      >
                        <Star className={`size-4 ${has(s.symbol) ? "fill-current" : ""}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <TradingViewSymbolInfo symbol={symbol} />

          <div className="glow-card rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map((f) => (
                  <Button
                    key={f}
                    type="button"
                    size="sm"
                    variant={tf === f ? "default" : "secondary"}
                    onClick={() => setTf(f)}
                    className="font-bold"
                  >
                    {f}
                  </Button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => (isPro ? setExpanded(true) : openUpgrade("feature"))}
                aria-label={t("fullScreen")}
                title={t("fullScreen")}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-panel p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Maximize2 className="size-4" />
                {!isPro && <span className="text-[10px] font-black text-primary">PRO 🔒</span>}
              </button>
            </div>
            <TradingViewChart key={`${symbol}-${tf}`} symbol={symbol} timeframe={tf} />
          </div>
        </section>

        <aside className="space-y-4">
          {active && <SmartAnalysis stock={active} tvSymbol={symbol} />}
          <TradeWidget symbol={symbol} />
          <TradingViewSingleQuote symbol={symbol} />
          <TradingViewTechnicalAnalysis symbol={symbol} />
        </aside>
      </div>

      <section className="glow-card rounded-2xl p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <BarChart3 className="size-4 text-primary" /> {t("fullScreener")}
        </h2>
        <TradingViewEgyptScreener />
      </section>

      {expanded && (
        <FullScreenChart
          symbol={symbol}
          timeframe={tf}
          onTimeframe={setTf}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
}
