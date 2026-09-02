import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { STOCKS, fmt, type Stock } from "@/lib/egx-data";
import { sectorName, stockName, useLang } from "@/lib/i18n";

/** Lightweight fuzzy score: exact > prefix > substring > subsequence. */
function score(haystack: string, needle: string) {
  const h = haystack.toLowerCase();
  if (!needle) return 1;
  if (h === needle) return 1000;
  if (h.startsWith(needle)) return 500 - h.length;
  const idx = h.indexOf(needle);
  if (idx >= 0) return 300 - idx;
  let i = 0;
  for (const ch of h) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return 100;
  }
  return -1;
}

export function matchStocks(term: string, lang: string) {
  const q = term.trim().toLowerCase();
  if (!q) return STOCKS.slice(0, 12);
  return STOCKS.map((s) => {
    const best = Math.max(
      score(s.symbol, q),
      score(s.suffix, q),
      score(s.nameEn, q),
      score(s.nameEs, q),
      score(s.nameAr, term.trim()),
      score(s.sector, q) - 150,
      score(s.sectorAr, term.trim()) - 150,
      score(s.sectorEs, q) - 150,
    );
    return { s, best };
  })
    .filter((r) => r.best > 0)
    .sort((a, b) => b.best - a.best)
    .slice(0, 12)
    .map((r) => r.s);
}

export function SmartSearch({
  onSelect,
  value,
  onQueryChange,
}: {
  onSelect: (s: Stock) => void;
  value?: string;
  onQueryChange?: (q: string) => void;
}) {
  const { t, lang } = useLang();
  const [q, setQ] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => matchStocks(q, lang), [q, lang]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-panel/80 px-4 py-3 focus-within:border-primary/60 focus-within:shadow-[0_0_25px_-10px_var(--neutralx)]">
        <Search className="size-4 shrink-0 text-primary" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onQueryChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (
        <div className="absolute z-40 mt-2 max-h-[60vh] w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl">
          {results.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">{t("noResults")}</p>
          )}
          {results.map((s) => (
            <button
              key={s.symbol}
              onMouseDown={() => {
                onSelect(s);
                setQ(s.symbol);
                onQueryChange?.("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-accent/60"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-[11px] font-bold text-primary">
                {s.symbol.slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {s.symbol} · {stockName(s, lang)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {sectorName(s, lang)}
                </span>
              </span>
              <span className="shrink-0 text-end">
                <span className="block font-display text-sm font-bold">{fmt(s.price)}</span>
                <span
                  className={`block text-[11px] font-bold ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}
                >
                  {s.changePct >= 0 ? "+" : ""}
                  {fmt(s.changePct)}%
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
