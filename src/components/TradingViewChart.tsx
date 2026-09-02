import { TradingViewWidget, WIDGETS } from "@/components/TradingViewEmbed";

export type Timeframe = "1D" | "1W" | "1M" | "1Y" | "5Y" | "ALL";

const CONFIG: Record<Timeframe, { interval: string; range: string }> = {
  "1D": { interval: "5", range: "1D" },
  "1W": { interval: "30", range: "5D" },
  "1M": { interval: "D", range: "1M" },
  "1Y": { interval: "W", range: "12M" },
  "5Y": { interval: "W", range: "60M" },
  ALL: { interval: "M", range: "ALL" },
};

export function TradingViewChart({
  symbol,
  timeframe,
  className = "h-[340px] sm:h-[460px] xl:h-[600px]",
  fill = false,
}: {
  symbol: string;
  timeframe: Timeframe;
  className?: string;
  fill?: boolean;
}) {
  const { interval, range } = CONFIG[timeframe];

  return (
    <TradingViewWidget
      title={`TradingView advanced chart for ${symbol}`}
      scriptSrc={WIDGETS.advancedChart}
      className={fill ? "h-full w-full min-h-[320px]" : `w-full min-h-[340px] ${className}`}
      style={fill ? { height: "100%", minHeight: 320 } : { minHeight: 340 }}

      config={{
        autosize: true,
        symbol,
        interval,
        range,
        timezone: "Africa/Cairo",
        theme: "dark",
        style: "1",
        locale: "en",
        allow_symbol_change: true,
        save_image: false,
        calendar: false,
        details: true,
        hotlist: false,
        hide_side_toolbar: false,
        withdateranges: true,
        support_host: "https://www.tradingview.com",
      }}
    />
  );
}
