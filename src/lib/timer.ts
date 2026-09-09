/**
 * Pure, isomorphic timer math. The server is the single source of truth:
 * clients only ever render `computeRemaining` against a server timestamp,
 * so local clock drift can never desync the countdown.
 */

export type TimerStatus = "IDLE" | "RUNNING" | "PAUSED" | "ENDED";

export type TimerSnapshot = {
  status: TimerStatus;
  /** Seconds banked at the moment the timer last started/paused. */
  accumulatedSeconds: number;
  /** ISO timestamp of the current RUNNING segment start, null otherwise. */
  startedAt: string | null;
  pausedAt: string | null;
  expiresAt: string | null;
  totalAddedSeconds: number;
  maxTimeSeconds: number | null;
};

export type TimerFrame = TimerSnapshot & {
  remainingSeconds: number;
  /** Server time the frame was computed at (ms epoch). */
  serverTime: number;
};

export function clampRemaining(seconds: number, maxTimeSeconds: number | null): number {
  const floored = Math.max(0, Math.floor(seconds));
  if (maxTimeSeconds == null) return floored;
  return Math.min(floored, Math.max(0, Math.floor(maxTimeSeconds)));
}

/**
 * RUNNING: accumulated - elapsed since startedAt.
 * PAUSED/IDLE: accumulated as-is.
 * ENDED: zero.
 */
export function computeRemaining(state: TimerSnapshot, nowMs: number = Date.now()): number {
  if (state.status === "ENDED") return 0;
  if (state.status !== "RUNNING" || !state.startedAt) {
    return clampRemaining(state.accumulatedSeconds, state.maxTimeSeconds);
  }
  const elapsed = Math.floor((nowMs - new Date(state.startedAt).getTime()) / 1000);
  return clampRemaining(state.accumulatedSeconds - Math.max(0, elapsed), state.maxTimeSeconds);
}

export function toFrame(state: TimerSnapshot, nowMs: number = Date.now()): TimerFrame {
  const remainingSeconds = computeRemaining(state, nowMs);
  return {
    ...state,
    remainingSeconds,
    status: state.status === "RUNNING" && remainingSeconds === 0 ? "ENDED" : state.status,
    serverTime: nowMs,
  };
}

/** Maps a `timer_states` row (+ subathon cap) into a snapshot. */
export function snapshotFromRow(
  row: {
    status: TimerStatus;
    remaining_seconds: number;
    started_at: string | null;
    paused_at: string | null;
    expires_at: string | null;
    total_added_seconds: number;
  },
  maxTimeSeconds: number | null,
): TimerSnapshot {
  return {
    status: row.status,
    accumulatedSeconds: row.remaining_seconds,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    expiresAt: row.expires_at,
    totalAddedSeconds: row.total_added_seconds,
    maxTimeSeconds,
  };
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
