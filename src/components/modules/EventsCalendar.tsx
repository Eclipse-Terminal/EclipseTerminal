import { CalendarDays } from "lucide-react";
import { EVENTS } from "@/lib/egx-data";

const TONE: Record<string, string> = {
  Dividend: "border-bull/40 bg-bull/10 text-bull",
  Coupon: "border-violet/40 bg-violet/10 text-violet",
  AGM: "border-border bg-secondary text-muted-foreground",
  Earnings: "border-primary/40 bg-primary/10 text-primary",
};

export function EventsCalendar() {
  return (
    <div className="tab-fade space-y-3">
      {EVENTS.map((e) => (
        <article
          key={`${e.ticker}-${e.date}`}
          className="glow-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-primary">
              <CalendarDays className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold">
                {e.ticker} · {e.company}
              </h3>
              <p className="truncate text-xs text-muted-foreground">{e.detail}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span
              className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${TONE[e.type]}`}
            >
              {e.type}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">{e.date}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
