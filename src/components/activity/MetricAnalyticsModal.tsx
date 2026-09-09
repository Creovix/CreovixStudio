import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MetricKey = "followers" | "subs" | "tips" | "bits";

export type MetricEvent = {
  id: string;
  event_type: string;
  amount: number | null;
  quantity: number;
  created_at: string;
};

const RANGES = [
  { id: "7", label: "7 Days", days: 7 },
  { id: "30", label: "30 Days", days: 30 },
  { id: "90", label: "90 Days", days: 90 },
  { id: "all", label: "All Time", days: 0 },
] as const;

/** Returns how much a single event contributes to the given metric. */
function contribution(metric: MetricKey, event: MetricEvent): number {
  const qty = event.quantity > 0 ? event.quantity : 1;
  const amount = Number(event.amount ?? 0);
  const type = event.event_type;

  if (metric === "followers") return type === "FOLLOW" ? qty : 0;
  if (metric === "subs") return type === "SUBSCRIPTION" || type === "GIFT_SUB" ? qty : 0;
  if (metric === "tips") return type === "DONATION" && Number.isFinite(amount) ? amount : 0;
  if (type !== "BITS") return 0;
  return Number.isFinite(amount) && amount > 0 ? amount : qty;
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDay(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function MetricAnalyticsModal({
  metric,
  title,
  accent,
  money,
  events,
  onClose,
}: {
  metric: MetricKey;
  title: string;
  accent: string;
  money?: boolean;
  events: MetricEvent[];
  onClose: () => void;
}) {
  const [range, setRange] = useState<string>("30");

  const { series, total } = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? 0;
    const cutoff = days ? Date.now() - days * 86400000 : 0;

    const buckets = new Map<string, number>();
    let sum = 0;
    for (const event of events) {
      const time = new Date(event.created_at).getTime();
      if (cutoff && time < cutoff) continue;
      const value = contribution(metric, event);
      if (value <= 0) continue;
      const key = dayKey(event.created_at);
      buckets.set(key, (buckets.get(key) ?? 0) + value);
      sum += value;
    }

    const keys = [...buckets.keys()].sort();
    return {
      total: sum,
      series: keys.map((key) => ({
        date: key,
        label: formatDay(key),
        value: Number(buckets.get(key)!.toFixed(2)),
      })),
    };
  }, [events, metric, range]);

  const fmt = (n: number) => (money ? `$${n.toFixed(2)}` : Math.round(n).toLocaleString("en-US"));

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(6,8,13,0.78)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} analytics`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-in w-full max-w-4xl rounded-3xl border p-5 sm:p-7"
        style={{
          background: "rgba(15,17,23,0.92)",
          borderColor: "rgba(255,255,255,0.1)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-5 flex items-center gap-2 rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[oklch(1_0_0/0.09)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Activity Feed
        </button>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: accent }}>
              {fmt(total)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGES.map((option) => {
              const on = option.id === range;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRange(option.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    on
                      ? "text-foreground"
                      : "border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.03)] text-muted-foreground hover:bg-[oklch(1_0_0/0.07)]"
                  }`}
                  style={
                    on
                      ? {
                          borderColor: `color-mix(in oklab, ${accent} 45%, transparent)`,
                          background: `color-mix(in oklab, ${accent} 18%, transparent)`,
                          boxShadow: `0 0 18px color-mix(in oklab, ${accent} 25%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl border p-3"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {series.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              No {title.toLowerCase()} recorded in this period yet.
            </p>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {money ? (
                  <AreaChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ stroke: accent, strokeOpacity: 0.35 }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <ChartTip
                            date={String(payload[0]!.payload.date)}
                            value={fmt(Number(payload[0]!.value))}
                            accent={accent}
                          />
                        ) : null
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={accent}
                      strokeWidth={2}
                      fill="url(#metricFill)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <ChartTip
                            date={String(payload[0]!.payload.date)}
                            value={fmt(Number(payload[0]!.value))}
                            accent={accent}
                          />
                        ) : null
                      }
                    />
                    <Bar dataKey="value" fill={accent} radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartTip({ date, value, accent }: { date: string; value: string; accent: string }) {
  const pretty = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs"
      style={{
        background: "rgba(12,14,20,0.95)",
        backdropFilter: "blur(10px)",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
      }}
    >
      <p className="text-muted-foreground">{pretty}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
