import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Filter, Loader2, Newspaper, RefreshCw, WifiOff } from "lucide-react";
import { getLiveNews } from "@/lib/news.functions";

const FILTERS = ["all", "positive", "negative", "neutral"] as const;

export function NewsSentiment() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const fetchNews = useServerFn(getLiveNews);

  const { data, isLoading, isFetching, isError, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["live-news"],
    queryFn: () => fetchNews(),
    refetchInterval: 90_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });

  const all = data?.items ?? [];
  const items = all.filter((n) => filter === "all" || n.verdict === filter);

  const tone = (v: string) =>
    v === "positive"
      ? "border-bull/40 bg-bull/10 text-bull"
      : v === "negative"
        ? "border-bear/40 bg-bear/10 text-bear"
        : "border-border bg-secondary text-muted-foreground";

  return (
    <div className="tab-fade space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-primary" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}

        <div className="ms-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-bull/40 bg-bull/10 px-2.5 py-1 font-bold text-bull">
            <span className="live-dot size-1.5 rounded-full bg-bull" /> LIVE
          </span>
          {dataUpdatedAt > 0 && (
            <span className="hidden sm:inline">
              آخر تحديث{" "}
              {new Date(dataUpdatedAt).toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={() => refetch()}
            aria-label="تحديث الأخبار"
            className="rounded-lg border border-border bg-panel p-1.5 transition-colors hover:text-primary"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-border bg-panel/60"
            />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-bear/30 bg-bear/5 p-4 text-sm text-muted-foreground">
          <WifiOff className="size-4 text-bear" />
          تعذّر جلب الأخبار الحية الآن — ستتم إعادة المحاولة تلقائيًا.
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-panel/60 p-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          لا توجد أخبار مطابقة لهذا الفلتر حاليًا.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((n) => (
          <article key={n.id} className="glow-card rounded-2xl p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-primary">
                  {n.ticker ? `${n.ticker} · ` : ""}
                  {n.publishedLabel}
                </p>
                <h3 className="mt-1 text-sm font-bold leading-snug">{n.headline}</h3>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${tone(n.verdict)}`}
              >
                {n.verdict}
              </span>
            </div>
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
              <Newspaper className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{n.source || "Google News"}</span>
              {n.link && (
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-auto inline-flex shrink-0 items-center gap-1 font-bold text-primary hover:underline"
                >
                  المصدر <ExternalLink className="size-3" />
                </a>
              )}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
