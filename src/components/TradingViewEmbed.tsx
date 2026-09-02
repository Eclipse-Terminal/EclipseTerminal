import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const WIDGETS = {
  advancedChart: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
  screener: "https://s3.tradingview.com/external-embedding/embed-widget-screener.js",
  singleQuote: "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
  symbolInfo: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
  technicalAnalysis:
    "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
  tickerTape: "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
} as const;

export const EGX_TICKER_TAPE_SYMBOLS = [
  { proName: "EGX:COMI", title: "COMI" },
  { proName: "EGX:HRHO", title: "HRHO" },
  { proName: "EGX:SWDY", title: "SWDY" },
  { proName: "EGX:FWRY", title: "FWRY" },
  { proName: "EGX:EAST", title: "EAST" },
  { proName: "EGX:ARAB", title: "ARAB" },
  { proName: "EGX:OIH", title: "OIH" },
] as const;

type WidgetConfig = Record<string, unknown>;

function TradingViewWidget({
  scriptSrc,
  config,
  title,
  className = "",
  style,
  lazy = false,
  bare = false,
}: {
  scriptSrc: string;
  config: WidgetConfig;
  title: string;
  className?: string;
  style?: CSSProperties;
  /** Only mount the TradingView script once the container scrolls into view. */
  lazy?: boolean;
  /** Drop the panel chrome (border/background) — used for inline table quotes. */
  bare?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configJson = useMemo(() => JSON.stringify(config), [config]);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || visible) return;
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [lazy, visible]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !visible) return;

    // Always tear down the previous widget before mounting a new one.
    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = configJson;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [configJson, scriptSrc, visible]);

  return (
    <div
      ref={containerRef}
      aria-label={title}
      className={`tradingview-widget-container overflow-hidden ${
        bare ? "" : "rounded-xl border border-border bg-panel"
      } ${className}`}
      style={style}
    />
  );
}

export function normalizeTradingViewSymbol(input: string) {
  const raw = input.trim().toUpperCase();
  if (!raw) return "EGX:COMI";
  if (raw.includes(":")) return raw;
  return `EGX:${raw.replace(/\.CA$/, "")}`;
}

export function TradingViewTickerTape() {
  return (
    <TradingViewWidget
      title="TradingView EGX ticker tape"
      scriptSrc={WIDGETS.tickerTape}
      className="h-[52px] rounded-none border-x-0 border-t-0 bg-panel/70"
      config={{
        symbols: EGX_TICKER_TAPE_SYMBOLS,
        showSymbolLogo: true,
        isTransparent: true,
        displayMode: "adaptive",
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}

export function TradingViewSymbolInfo({ symbol }: { symbol: string }) {
  return (
    <TradingViewWidget
      title={`TradingView symbol info for ${symbol}`}
      scriptSrc={WIDGETS.symbolInfo}
      className="h-[220px]"
      config={{
        symbol,
        width: "100%",
        locale: "en",
        colorTheme: "dark",
        isTransparent: true,
      }}
    />
  );
}

export function TradingViewSingleQuote({ symbol }: { symbol: string }) {
  return (
    <TradingViewWidget
      title={`TradingView live quote for ${symbol}`}
      scriptSrc={WIDGETS.singleQuote}
      className="h-[92px]"
      config={{
        symbol,
        width: "100%",
        isTransparent: true,
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}

/** Compact live quote used inside the market table rows (lazy-mounted). */
export function TradingViewRowQuote({ symbol }: { symbol: string }) {
  return (
    <TradingViewWidget
      lazy
      bare
      title={`TradingView live quote for ${symbol}`}
      scriptSrc={WIDGETS.singleQuote}
      className="h-[72px] w-[150px] shrink-0 sm:w-[190px]"
      config={{
        symbol,
        width: "100%",
        isTransparent: true,
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}

export function TradingViewTechnicalAnalysis({ symbol }: { symbol: string }) {
  return (
    <TradingViewWidget
      title={`TradingView technical analysis for ${symbol}`}
      scriptSrc={WIDGETS.technicalAnalysis}
      className="h-[430px]"
      config={{
        interval: "1D",
        width: "100%",
        isTransparent: true,
        height: "100%",
        symbol,
        showIntervalTabs: true,
        displayMode: "single",
        locale: "en",
        colorTheme: "dark",
      }}
    />
  );
}

export function TradingViewEgyptScreener({ className = "h-[680px]" }: { className?: string }) {
  return (
    <TradingViewWidget
      title="TradingView Egypt market screener"
      scriptSrc={WIDGETS.screener}
      className={className}
      config={{
        width: "100%",
        height: "100%",
        defaultColumn: "overview",
        defaultScreen: "most_capitalized",
        market: "egypt",
        exchange: "EGX",
        showToolbar: true,
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}

export { WIDGETS, TradingViewWidget };
