// Pure server-rendered SVG sparkline. No interactivity, no client JS.
export function Sparkline({
  values,
  width = 120,
  height = 32,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const nums = values.filter((v) => typeof v === "number");
  if (nums.length < 2) {
    return <div style={{ height }} className="flex items-center text-xs text-muted">—</div>;
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (nums.length - 1);

  const points = nums.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={d}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill="var(--color-accent-2)" />
    </svg>
  );
}
