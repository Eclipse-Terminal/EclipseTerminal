import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { priceSeries, fmt, type Stock } from "@/lib/egx-data";
import { useLang } from "@/lib/i18n";

export const SCRUB_RANGES = ["1M", "3M", "6M", "1Y"] as const;
export type ScrubRange = (typeof SCRUB_RANGES)[number];

const DAYS: Record<ScrubRange, number> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };

const LOCALE: Record<string, string> = { en: "en-GB", ar: "ar-EG", es: "es-ES" };

function ChartCanvas({
  stock,
  range,
  height,
}: {
  stock: Stock;
  range: ScrubRange;
  height: number | string;
}) {
  const { lang } = useLang();
  const data = useMemo(
    () => priceSeries(stock.symbol, DAYS[range], stock.price, stock.changePct),
    [stock.symbol, stock.price, stock.changePct, range],
  );

  const up = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const color = up ? "var(--bull)" : "var(--bear)";
  const first = data[0]?.price ?? 0;

  const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString(LOCALE[lang] ?? "en-GB", {
      day: "2-digit",
      month: "short",
      year: range === "1Y" ? "2-digit" : undefined,
    });

  return (
    <div style={{ height }} className="w-full select-none" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={fmtDate}
            minTickGap={48}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            width={54}
            orientation="right"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmt(v, v < 10 ? 2 : 0)}
          />
          <ReferenceLine y={first} stroke="var(--border)" strokeDasharray="4 4" />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { t: number; price: number };
              return (
                <div className="rounded-lg border border-primary/50 bg-popover/95 px-3 py-2 shadow-2xl backdrop-blur">
                  <div className="font-display text-sm font-black text-primary">
                    {fmt(p.price)} <span className="text-[10px] text-muted-foreground">EGP</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{fmtDate(p.t)}</div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${stock.symbol})`}
            isAnimationActive={false}
            activeDot={{ r: 5, fill: color, stroke: "var(--background)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RangePills({ range, onRange }: { range: ScrubRange; onRange: (r: ScrubRange) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SCRUB_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onRange(r)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            range === r
              ? "border border-primary/50 bg-primary/15 text-primary"
              : "border border-border bg-panel text-muted-foreground hover:text-foreground"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function ThndrChart({ stock }: { stock: Stock }) {
  const { t } = useLang();
  const [range, setRange] = useState<ScrubRange>("3M");
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [full]);

  const up = stock.changePct >= 0;

  return (
    <div className="glow-card rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted-foreground">
            {t("interactiveChart")}
          </p>
          <p className="font-display text-lg font-black">
            {fmt(stock.price)} <span className="text-[11px] text-muted-foreground">EGP</span>{" "}
            <span className={`text-xs font-bold ${up ? "text-bull" : "text-bear"}`}>
              {up ? "+" : ""}
              {fmt(stock.changePct)}%
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFull(true)}
          aria-label={t("fullScreen")}
          title={t("fullScreen")}
          className="shrink-0 rounded-lg border border-border bg-panel p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      <ChartCanvas stock={stock} range={range} height={280} />

      <div className="mt-3 flex items-center justify-between gap-3">
        <RangePills range={range} onRange={setRange} />
        <span className="hidden text-[11px] text-muted-foreground sm:inline">{t("scrubHint")}</span>
      </div>

      {full &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex flex-col bg-background" dir="ltr">
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
              <RangePills range={range} onRange={setRange} />
              <button
                type="button"
                onClick={() => setFull(false)}
                aria-label={t("close")}
                className="rounded-lg border border-border bg-panel p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 p-2">
              <ChartCanvas stock={stock} range={range} height="100%" />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
