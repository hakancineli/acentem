type Props = { points?: number[] };

export default function TrendSpark({ points = [3, 4, 3, 5, 6, 7, 6, 8] }: Props) {
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * 14} ${30 - (p / max) * 30}`)
    .join(" ");
  const width = (points.length - 1) * 14;
  return (
    <svg width={width} height={30} className="text-emerald-600">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}


