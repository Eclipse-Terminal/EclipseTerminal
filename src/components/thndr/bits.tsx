import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import logo from "@/assets/eclipse-logo.png";
import { fmt } from "@/lib/egx-data";

/** ECLIPSE logo button — same slot Thndr uses for its flag icon. */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const px = size === "sm" ? "size-8" : "size-10";
  return (
    <span
      className={`logo-glow press grid ${px} shrink-0 place-items-center rounded-xl border border-primary/50 bg-panel p-1`}
    >
      <img
        src={logo}
        alt="ECLIPSE"
        width={816}
        height={816}
        className="size-full rounded-lg object-contain"
      />
    </span>
  );
}

/** Green/red delta with a small directional arrow. */
export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${
        up ? "text-bull" : "text-bear"
      } ${className}`}
      dir="ltr"
    >
      <Icon className="size-3.5" strokeWidth={2.6} />
      {up ? "+" : ""}
      {fmt(value)}%
    </span>
  );
}

/** Circular ticker monogram standing in for a company logo. */
export function TickerBadge({ symbol }: { symbol: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[11px] font-black text-primary">
      {symbol.slice(0, 3)}
    </span>
  );
}

/** Dark header block that flows into a light body (Thndr Explore/Profile). */
export function DarkHeader({ children }: { children: ReactNode }) {
  return (
    <header className="rounded-b-[28px] bg-background px-4 pb-6 pt-4 text-foreground">
      {children}
    </header>
  );
}

/** Line-art empty state: illustration + caption + single action. */
export function EmptyState({
  caption,
  actionLabel,
  onAction,
}: {
  caption: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="rise flex flex-col items-center gap-4 py-8 text-center">
      <svg
        viewBox="0 0 120 90"
        className="h-24 w-32 text-primary/60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="8" y="14" width="104" height="64" rx="10" />
        <path d="M8 32h104" />
        <circle cx="20" cy="23" r="2.5" />
        <path d="M24 62l20-18 16 12 14-20 22 26" className="text-neutralx" />
        <path d="M22 44h18M22 52h30" strokeLinecap="round" opacity="0.5" />
      </svg>
      <p className="max-w-[16rem] text-sm text-ink-muted">{caption}</p>
      <button
        type="button"
        onClick={onAction}
        className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground shadow-[0_10px_30px_-14px_rgba(46,91,255,0.9)]"
      >
        {actionLabel}
      </button>
    </div>
  );
}
