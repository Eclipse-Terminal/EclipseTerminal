export function Sparkline({
  data,
  tone = "bull",
  className = "",
}: {
  data: number[];
  tone?: "bull" | "bear" | "neutral";
  className?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / span) * 26}`)
    .join(" ");
  const stroke =
    tone === "bull" ? "var(--bull)" : tone === "bear" ? "var(--bear)" : "var(--neutralx)";
  const id = `spark-${tone}`;

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`h-12 w-full ${className}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${pts} 100,30`} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
