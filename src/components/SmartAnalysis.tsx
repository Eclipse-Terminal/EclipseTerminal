import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { analyzeLiveSnapshot } from "@/lib/smart-analysis.functions";
import { buildLocalAnswer } from "@/lib/stock-context";
import { useLivePrices } from "@/lib/live-prices";
import type { Stock } from "@/lib/egx-data";

/**
 * Bridges the TradingView chart selection with the AI analyst: whenever the
 * active ticker changes, the exact values rendered on screen (live price/change
 * plus volume and levels of the active row) are sent straight to the model.
 */
export function SmartAnalysis({ stock, tvSymbol }: { stock: Stock; tvSymbol?: string }) {
  const { priceOf, changeOf } = useLivePrices();
  const analyze = useServerFn(analyzeLiveSnapshot);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const runId = useRef(0);

  const price = priceOf(stock.symbol);
  const changePct = changeOf(stock.symbol);
  const chartSymbol = tvSymbol ?? stock.tv;

  const run = useCallback(
    async (snapshotPrice: number, snapshotChange: number) => {
      const id = ++runId.current;
      setBusy(true);
      setOffline(false);
      setText(null);
      try {
        const result = await analyze({
          data: {
            symbol: stock.symbol,
            tvSymbol: chartSymbol,
            nameAr: stock.nameAr,
            sectorAr: stock.sectorAr,
            price: snapshotPrice,
            changePct: snapshotChange,
            volume: stock.volume,
            support: stock.support,
            resistance: stock.resistance,
          },
        });
        if (id !== runId.current) return;
        if (!result.text) throw new Error("empty");
        setText(result.text);
      } catch {
        if (id !== runId.current) return;
        setOffline(true);
        setText(buildLocalAnswer(stock.symbol));
      }
      if (id === runId.current) setBusy(false);
    },
    [analyze, chartSymbol, stock],
  );

  // Re-analyze automatically the moment the chart ticker changes.
  useEffect(() => {
    void run(priceOf(stock.symbol), changeOf(stock.symbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock.symbol, chartSymbol]);

  return (
    <div dir="rtl" className="glow-card space-y-3 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="size-4 text-primary" /> التحليل الذكي المباشر
        </h2>
        <Button
          type="button"
          size="sm"
          onClick={() => void run(price, changePct)}
          disabled={busy}
          className="font-bold"
        >
          {busy ? "جارٍ التحليل…" : `تحديث ${stock.symbol}`}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        مرتبط بشارت {chartSymbol} · {price.toFixed(2)} ج.م · {changePct >= 0 ? "+" : ""}
        {changePct.toFixed(2)}% · حجم {Math.round(stock.volume).toLocaleString("en-US")}
      </p>

      {text && (
        <div className="space-y-2 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_li]:mr-4 [&_ol]:list-decimal [&_strong]:text-foreground [&_ul]:list-disc">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}

      {offline && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
          تعذّر الاتصال بمحرك الذكاء الاصطناعي — تم عرض التحليل من بيانات الشاشة المحلية.
        </p>
      )}
    </div>
  );
}
