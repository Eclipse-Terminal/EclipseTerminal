import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { STOCKS } from "@/lib/egx-data";

/** How often current EGX prices are pulled again (ms). */
export const PRICE_REFRESH_MS = 60_000;

export const cleanPriceSymbol = (raw: string) =>
  raw.trim().toUpperCase().replace("EGX:", "").replace(".CA", "");

/**
 * Module-level snapshot so non-React helpers (paper trading maths) can read the
 * freshest price without threading context through every call site.
 */
const livePrices = new Map<string, { price: number; changePct: number }>();

export function livePriceOf(symbol: string): number | null {
  const hit = livePrices.get(cleanPriceSymbol(symbol));
  return hit && hit.price > 0 ? hit.price : null;
}

export function liveChangeOf(symbol: string): number | null {
  const hit = livePrices.get(cleanPriceSymbol(symbol));
  return hit ? hit.changePct : null;
}

type PricesState = {
  /** Latest price for a symbol, falling back to the bundled reference price. */
  priceOf: (symbol: string) => number;
  changeOf: (symbol: string) => number;
  updatedAt: Date | null;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  intervalMs: number;
};

const fallbackPrice = (symbol: string) =>
  STOCKS.find((s) => s.symbol === cleanPriceSymbol(symbol))?.price ?? 0;

const fallbackChange = (symbol: string) =>
  STOCKS.find((s) => s.symbol === cleanPriceSymbol(symbol))?.changePct ?? 0;

const PricesCtx = createContext<PricesState>({
  priceOf: fallbackPrice,
  changeOf: fallbackChange,
  updatedAt: null,
  refreshing: false,
  error: null,
  refresh: async () => {},
  intervalMs: PRICE_REFRESH_MS,
});

export function LivePricesProvider({ children }: { children: ReactNode }) {
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    const { data, error: err } = await supabase
      .from("stock_symbols")
      .select("symbol, price, change_pct")
      .eq("is_active", true);

    if (err) {
      setError(err.message);
    } else {
      for (const row of data ?? []) {
        const key = cleanPriceSymbol(row.symbol ?? "");
        if (!key) continue;
        livePrices.set(key, {
          price: Number(row.price ?? 0),
          changePct: Number(row.change_pct ?? 0),
        });
      }
      setError(null);
      setUpdatedAt(new Date());
      setTick((n) => n + 1);
    }
    setRefreshing(false);
    inFlight.current = false;
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), PRICE_REFRESH_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const value = useMemo<PricesState>(
    () => ({
      priceOf: (symbol: string) => livePriceOf(symbol) ?? fallbackPrice(symbol),
      changeOf: (symbol: string) => liveChangeOf(symbol) ?? fallbackChange(symbol),
      updatedAt,
      refreshing,
      error,
      refresh,
      intervalMs: PRICE_REFRESH_MS,
    }),
    [updatedAt, refreshing, error, refresh],
  );

  return <PricesCtx.Provider value={value}>{children}</PricesCtx.Provider>;
}

export const useLivePrices = () => useContext(PricesCtx);

/** "14:32:05" style stamp, Cairo locale, safe for null. */
export function formatUpdatedAt(date: Date | null, locale = "ar-EG") {
  if (!date) return "—";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
