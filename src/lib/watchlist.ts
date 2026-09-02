import { useCallback, useEffect, useState } from "react";

const KEY = "egx-pulse-watchlist";

export function useWatchlist() {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setList(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback((symbol: string) => {
    setList((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      window.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const has = useCallback((symbol: string) => list.includes(symbol), [list]);

  return { list, toggle, has };
}
