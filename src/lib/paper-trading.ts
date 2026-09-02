import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STOCKS } from "@/lib/egx-data";
import { livePriceOf, useLivePrices } from "@/lib/live-prices";

export const STARTING_CASH = 100000;

export type Holding = { symbol: string; shares: number; avg_price: number };
export type Trade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  created_at: string;
};

export const cleanSymbol = (raw: string) =>
  raw.trim().toUpperCase().replace("EGX:", "").replace(".CA", "");

export function marketPrice(symbol: string) {
  const clean = cleanSymbol(symbol);
  const live = livePriceOf(clean);
  if (live !== null) return live;
  const s = STOCKS.find((x) => x.symbol === clean);
  return s ? s.price : 0;
}

type PortfolioPayload = {
  cash: number;
  starting_balance: number;
  holdings: Holding[];
  trades: Trade[];
};

export function usePaperPortfolio() {
  const { updatedAt: pricesUpdatedAt, refreshing: pricesRefreshing } = useLivePrices();

  const [cash, setCash] = useState(STARTING_CASH);
  const [startingBalance, setStartingBalance] = useState(STARTING_CASH);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.rpc("paper_portfolio");
    if (err) setError(err.message);
    else {
      const p = data as unknown as PortfolioPayload;
      setCash(Number(p.cash ?? STARTING_CASH));
      setStartingBalance(Number(p.starting_balance ?? STARTING_CASH));
      setHoldings(
        (p.holdings ?? []).map((h) => ({
          symbol: h.symbol,
          shares: Number(h.shares),
          avg_price: Number(h.avg_price),
        })),
      );
      setTrades(
        (p.trades ?? []).map((t) => ({
          ...t,
          shares: Number(t.shares),
          price: Number(t.price),
          total: Number(t.total),
        })),
      );
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const trade = useCallback(
    async (input: { symbol: string; side: "buy" | "sell"; shares: number; price: number }) => {
      const { data, error: err } = await supabase.rpc("paper_trade", {
        _symbol: cleanSymbol(input.symbol),
        _side: input.side,
        _shares: input.shares,
        _price: input.price,
      });
      if (err) return { ok: false as const, error: err.message };
      const res = data as unknown as { ok: boolean; error?: string; owned?: number; cash?: number };
      await load();
      if (!res.ok) {
        if (res.error === "insufficient_cash")
          return { ok: false as const, error: "الرصيد النقدي الافتراضي غير كافٍ." };
        if (res.error === "insufficient_shares")
          return {
            ok: false as const,
            error: `لا تملك عددًا كافيًا من الأسهم (المتاح: ${res.owned ?? 0}).`,
          };
        return { ok: false as const, error: res.error ?? "فشل تنفيذ الأمر." };
      }
      return { ok: true as const };
    },
    [load],
  );

  const stats = useMemo(() => {
    const rows = holdings.map((h) => {
      const price = marketPrice(h.symbol) || h.avg_price;
      const value = price * h.shares;
      const cost = h.avg_price * h.shares;
      const pnl = value - cost;
      return { ...h, price, value, cost, pnl, pnlPct: cost > 0 ? (pnl / cost) * 100 : 0 };
    });
    const stocksValue = rows.reduce((a, r) => a + r.value, 0);
    const cost = rows.reduce((a, r) => a + r.cost, 0);
    const netWorth = cash + stocksValue;
    return {
      rows,
      stocksValue,
      cost,
      netWorth,
      pnl: netWorth - startingBalance,
      pnlPct: startingBalance > 0 ? ((netWorth - startingBalance) / startingBalance) * 100 : 0,
      unrealized: stocksValue - cost,
    };
  }, [holdings, cash, startingBalance, pricesUpdatedAt]);

  const sharesOf = useCallback(
    (symbol: string) => holdings.find((h) => h.symbol === cleanSymbol(symbol))?.shares ?? 0,
    [holdings],
  );

  return {
    cash,
    startingBalance,
    holdings,
    trades,
    loading,
    error,
    load,
    trade,
    stats,
    sharesOf,
    pricesUpdatedAt,
    pricesRefreshing,
  };
}
