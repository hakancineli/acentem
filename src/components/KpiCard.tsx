type Props = {
  title: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
};

export default function KpiCard({ title, value, hint, trend = "flat" }: Props) {
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-neutral-500";
  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  return (
    <div className="rounded border p-4 bg-white dark:bg-neutral-950">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className={`mt-1 text-xs ${trendColor}`}>{hint ? `${trendIcon} ${hint}` : "\u00A0"}</div>
    </div>
  );
}


