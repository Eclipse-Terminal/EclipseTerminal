import { useMemo, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  normalizeTradingViewSymbol,
  TradingViewEgyptScreener,
  TradingViewSingleQuote,
} from "@/components/TradingViewEmbed";
import { STOCKS, fmt } from "@/lib/egx-data";

type Holding = { id: number; symbol: string; qty: number; buy: number };

const sectorFor = (symbol: string) => {
  const clean = symbol.replace("EGX:", "").replace(".CA", "");
  return STOCKS.find((stock) => stock.symbol === clean)?.sector ?? "EGX Listed";
};

export function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbol, setSymbol] = useState("ARAB");
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");

  const rows = holdings.map((h) => {
    const cost = h.buy * h.qty;
    const tvSymbol = normalizeTradingViewSymbol(h.symbol);
    return { ...h, tvSymbol, sector: sectorFor(tvSymbol), cost };
  });

  const cost = rows.reduce((a, r) => a + r.cost, 0);

  const tip = useMemo(() => {
    if (rows.length === 0) return "Add at least two positions to unlock a diversification read.";
    const bySector = new Set(rows.map((r) => r.sector));
    if (bySector.size < 3)
      return `You hold only ${bySector.size} sectors. Adding a bank (COMI.CA) or a technology name (FWRY.CA) would lower single-sector shock risk.`;
    return `Sector spread covers ${bySector.size} areas. Use the live quotes and full screener below before resizing any position.`;
  }, [rows]);

  const add = () => {
    const q = parseFloat(qty);
    const b = parseFloat(buy);
    if (Number.isNaN(q) || Number.isNaN(b) || q <= 0 || b <= 0) return;
    setHoldings((prev) => [
      ...prev,
      { id: Date.now(), symbol: normalizeTradingViewSymbol(symbol), qty: q, buy: b },
    ]);
    setQty("");
    setBuy("");
  };

  return (
    <div className="tab-fade space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Positions", value: `${rows.length}`, tone: "text-foreground" },
          { label: "Invested Cost", value: `${fmt(cost)} EGP`, tone: "text-foreground" },
          { label: "Live Valuation", value: "TradingView", tone: "text-primary" },
        ].map((c) => (
          <div key={c.label} className="glow-card rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`mt-1 text-xl font-black tabular-nums ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glow-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Ticker</span>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="ARAB or EGX:COMI"
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Quantity</span>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="decimal"
              placeholder="e.g., 500"
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Buy Price</span>
            <input
              value={buy}
              onChange={(e) => setBuy(e.target.value)}
              inputMode="decimal"
              placeholder="Your executed buy price"
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <Button
            onClick={add}
            className="mt-1.5 self-end rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="glow-card overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {["Ticker", "Qty", "Buy", "Cost", "Official live quote", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-bold">{r.tvSymbol}</td>
                <td className="px-4 py-3 tabular-nums">{r.qty}</td>
                <td className="px-4 py-3 tabular-nums">{fmt(r.buy)}</td>
                <td className="px-4 py-3 tabular-nums">{fmt(r.cost)}</td>
                <td className="min-w-[280px] px-4 py-3">
                  <TradingViewSingleQuote symbol={r.tvSymbol} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    aria-label={`Remove ${r.tvSymbol}`}
                    onClick={() => setHoldings((p) => p.filter((h) => h.id !== r.id))}
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-bear"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glow-card rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="size-4 text-primary" /> AI Diversification Tip
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tip}</p>
      </div>

      <section className="glow-card rounded-2xl p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-bold">All EGX quotes and sectors</h3>
        <TradingViewEgyptScreener />
      </section>
    </div>
  );
}
