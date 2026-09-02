import { useState } from "react";
import { Calculator, Copy, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/egx-data";

type Levels = {
  ticker: string;
  pp: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  close: number;
};

export function PivotCalculator() {
  const [ticker, setTicker] = useState("");
  const [high, setHigh] = useState("");
  const [low, setLow] = useState("");
  const [close, setClose] = useState("");
  const [levels, setLevels] = useState<Levels | null>(null);

  const generate = () => {
    const h = parseFloat(high);
    const l = parseFloat(low);
    const c = parseFloat(close);
    if ([h, l, c].some((v) => Number.isNaN(v)) || h <= l) {
      toast.error("Enter a valid High, Low and Close (High must exceed Low).");
      return;
    }
    const pp = (h + l + c) / 3;
    setLevels({
      ticker: ticker.trim().toUpperCase() || "EGX STOCK",
      pp,
      r1: 2 * pp - l,
      r2: pp + (h - l),
      r3: h + 2 * (pp - l),
      s1: 2 * pp - h,
      s2: pp - (h - l),
      s3: l - 2 * (h - pp),
      close: c,
    });
  };

  const snippet = levels
    ? [
        `📊 Nabd EGX Terminal — ${levels.ticker}`,
        `Pivot Point (PP): ${fmt(levels.pp)} EGP`,
        `R1 ${fmt(levels.r1)} | R2 ${fmt(levels.r2)} | R3 ${fmt(levels.r3)}`,
        `S1 ${fmt(levels.s1)} | S2 ${fmt(levels.s2)} | S3 ${fmt(levels.s3)}`,
        levels.close >= levels.pp
          ? `AI View: Close above PP — bias stays bullish while ${fmt(levels.pp)} holds; first target ${fmt(levels.r1)}.`
          : `AI View: Close below PP — bias stays defensive under ${fmt(levels.pp)}; watch ${fmt(levels.s1)} for a bounce.`,
        `Real-time data. Smarter trades. Stronger futures.`,
      ].join("\n")
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Analysis card copied — paste into WhatsApp or Telegram.");
    } catch {
      toast.error("Copy failed. Select the text manually.");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: `Nabd EGX — ${levels?.ticker}`, text: snippet });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    copy();
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    numeric = true,
  ) => (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => setter(e.target.value)}
        inputMode={numeric ? "decimal" : "text"}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
      />
    </label>
  );

  return (
    <div className="tab-fade grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <section className="glow-card rounded-2xl p-5">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Calculator className="size-4 text-primary" /> Precision Pivot Tracker
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Manual override for delayed or inaccurate session feeds.
        </p>
        <div className="mt-4 space-y-3">
          {field("Ticker Symbol", ticker, setTicker, "e.g., COMI.CA", false)}
          {field("Exact High", high, setHigh, "e.g., true high was 15.30 EGP")}
          {field("Exact Low", low, setLow, "e.g., true low was 14.55 EGP")}
          {field("Actual Close", close, setClose, "e.g., official close 15.05 EGP")}
          <button
            onClick={generate}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--gradient-brand)" }}
          >
            Generate AI Targets
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {!levels ? (
          <div className="glow-card grid h-full min-h-64 place-items-center rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Enter your exact session values to render the pivot matrix.
          </div>
        ) : (
          <>
            <div className="glow-card rounded-2xl p-5">
              <h3 className="text-sm font-bold">{levels.ticker} — Session Matrix</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(["r3", "r2", "r1"] as const).map((k) => (
                  <div key={k} className="rounded-xl border border-bull/35 bg-bull/10 p-4">
                    <p className="text-xs font-bold uppercase text-bull">{k}</p>
                    <p className="mt-1 text-xl font-black tabular-nums text-bull">
                      {fmt(levels[k])}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
                <p className="text-xs font-bold uppercase text-primary">Pivot Point</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-primary">
                  {fmt(levels.pp)}
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(["s1", "s2", "s3"] as const).map((k) => (
                  <div key={k} className="rounded-xl border border-bear/35 bg-bear/10 p-4">
                    <p className="text-xs font-bold uppercase text-bear">{k}</p>
                    <p className="mt-1 text-xl font-black tabular-nums text-bear">
                      {fmt(levels[k])}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glow-card rounded-2xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="size-4 text-primary" /> AI Session Insight
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {levels.close >= levels.pp
                  ? `Close settled above the pivot at ${fmt(levels.pp)}. Keep a bullish bias while price holds it intraday; scale into strength toward R1 ${fmt(levels.r1)} and trail stops under S1 ${fmt(levels.s1)}.`
                  : `Close settled below the pivot at ${fmt(levels.pp)}. Stay defensive under it; look for a reaction bounce at S1 ${fmt(levels.s1)} and only flip bullish on an hourly close back above the pivot.`}
              </p>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed">
                {snippet}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={share}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                >
                  <Share2 className="size-3.5" /> Share Analysis Card
                </button>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-bold"
                >
                  <Copy className="size-3.5" /> Copy text
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
