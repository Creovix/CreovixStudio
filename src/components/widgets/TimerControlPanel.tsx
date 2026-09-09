import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

import { formatDuration, type TimerFrame } from "@/lib/timer";
import {
  adjustTimer,
  pauseTimer,
  resetTimer,
  setTimer,
  startTimer,
} from "@/lib/timer.functions";

const ADJUSTS: { seconds: number; label: string }[] = [
  { seconds: 60, label: "+1 Min" },
  { seconds: 300, label: "+5 Mins" },
  { seconds: 600, label: "+10 Mins" },
  { seconds: 900, label: "+15 Mins" },
  { seconds: 1800, label: "+30 Mins" },
  { seconds: 3600, label: "+1 Hour" },
  { seconds: -60, label: "−1 Min" },
  { seconds: -300, label: "−5 Mins" },
  { seconds: -900, label: "−15 Mins" },
  { seconds: -1800, label: "−30 Mins" },
];

/** Parses "HH:MM:SS", "MM:SS" or plain minutes into seconds. */
function parseManualTime(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.includes(":")) {
    const parts = value.split(":").map((part) => Number(part.trim()));
    if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
    const seconds =
      parts.length === 3
        ? parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
        : parts.length === 2
          ? parts[0]! * 60 + parts[1]!
          : parts[0]!;
    return Math.round(seconds);
  }
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  return Math.round(minutes * 60);
}


/**
 * Manual streamer overrides for the subathon timer. Every action goes through
 * the authenticated server functions, so the countdown state is persisted in
 * the backend — reloading the dashboard or refreshing the OBS browser source
 * never resets the clock.
 */
export function TimerControlPanel({
  subathonId,
  frame,
  remaining,
  lang,
}: {
  subathonId: string | null;
  frame: TimerFrame | null;
  remaining: number;
  lang: "ar" | "en";
}) {
  const ar = lang === "ar";
  const start = useServerFn(startTimer);
  const pause = useServerFn(pauseTimer);
  const reset = useServerFn(resetTimer);
  const adjust = useServerFn(adjustTimer);
  const setExact = useServerFn(setTimer);

  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);


  const payload = subathonId ? { subathonId } : {};

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const status = frame?.status ?? "IDLE";
  const chip =
    "rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Timer className="size-4 text-primary" aria-hidden />
        {ar ? "تحكم يدوي بالمؤقت" : "Manual timer controls"}
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-2xl font-bold tabular-nums">
          {formatDuration(remaining)}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
            status === "RUNNING"
              ? "bg-primary/20 text-primary"
              : status === "ENDED"
                ? "bg-destructive/20 text-destructive"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ADJUSTS.map((entry) => (
          <button
            key={entry.label}
            type="button"
            disabled={busy}
            className={chip}
            onClick={() => void run(() => adjust({ data: { ...payload, seconds: entry.seconds } }))}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={busy}
          className={chip}
          onClick={() => void run(() => start({ data: payload }))}
        >
          <Play className="mx-auto size-4" aria-hidden />
          {status === "PAUSED" ? (ar ? "استئناف" : "Resume") : ar ? "تشغيل" : "Start"}
        </button>
        <button
          type="button"
          disabled={busy}
          className={chip}
          onClick={() => void run(() => pause({ data: payload }))}
        >
          <Pause className="mx-auto size-4" aria-hidden />
          {ar ? "إيقاف مؤقت" : "Pause"}
        </button>
        <button
          type="button"
          disabled={busy}
          className={chip}
          onClick={() => void run(() => reset({ data: payload }))}
        >
          <RotateCcw className="mx-auto size-4" aria-hidden />
          {ar ? "إعادة ضبط" : "Reset"}
        </button>
      </div>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const seconds = parseManualTime(manual);
          if (seconds === null) {
            setError(ar ? "صيغة وقت غير صحيحة" : "Invalid time format");
            return;
          }
          void run(async () => {
            await setExact({ data: { ...payload, seconds } });
            setManual("");
          });
        }}
      >
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {ar ? "ضبط وقت يدوي" : "Set Manual Time"}
        </label>
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder={ar ? "01:30:00 أو 90 دقيقة" : "HH:MM:SS or minutes"}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button type="submit" disabled={busy} className={chip}>
            {ar ? "تطبيق" : "Apply"}
          </button>
        </div>
      </form>



      <p className="text-[10px] text-muted-foreground">
        {ar
          ? "الوقت محفوظ في الخادم: تحديث المتصفح أو مصدر OBS لا يعيد ضبط العداد."
          : "State is persisted server-side — reloading the page or the OBS source never resets the clock."}
      </p>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
