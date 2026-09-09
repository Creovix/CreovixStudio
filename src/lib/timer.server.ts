import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { computeRemaining, clampRemaining, snapshotFromRow, toFrame } from "@/lib/timer";
import type { TimerFrame, TimerStatus } from "@/lib/timer";

type Client = SupabaseClient<Database>;
type TimerRow = Database["public"]["Tables"]["timer_states"]["Row"];
type TimerUpdate = Database["public"]["Tables"]["timer_states"]["Update"];

export type TimerContext = {
  subathonId: string;
  userId: string;
  maxTimeSeconds: number | null;
  initialSeconds: number;
  row: TimerRow;
};

export class TimerError extends Error {}

/** Loads the timer for a subathon the caller owns (RLS enforces ownership). */
export async function loadTimerContext(
  supabase: Client,
  subathonId?: string,
): Promise<TimerContext> {
  let query = supabase
    .from("subathons")
    .select("id, user_id, max_duration_seconds, initial_seconds, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);
  if (subathonId) query = query.eq("id", subathonId);

  const { data: subathons, error } = await query;
  if (error) throw new TimerError(error.message);
  const subathon = subathons?.[0];
  if (!subathon) throw new TimerError("subathon_not_found");

  const { data: row, error: timerError } = await supabase
    .from("timer_states")
    .select("*")
    .eq("subathon_id", subathon.id)
    .maybeSingle();
  if (timerError) throw new TimerError(timerError.message);
  if (!row) throw new TimerError("timer_not_found");

  return {
    subathonId: subathon.id,
    userId: subathon.user_id,
    maxTimeSeconds: subathon.max_duration_seconds,
    initialSeconds: subathon.initial_seconds,
    row,
  };
}

export function frameFor(ctx: TimerContext, row: TimerRow = ctx.row, nowMs = Date.now()): TimerFrame {
  return toFrame(snapshotFromRow(row, ctx.maxTimeSeconds), nowMs);
}

function snapshotOf(row: TimerRow) {
  return {
    status: row.status,
    remaining_seconds: row.remaining_seconds,
    started_at: row.started_at,
    paused_at: row.paused_at,
    expires_at: row.expires_at,
    total_added_seconds: row.total_added_seconds,
  };
}

/** Applies an update, writes an audit entry carrying the pre-state for undo. */
export async function applyUpdate(
  supabase: Client,
  ctx: TimerContext,
  action: string,
  update: TimerUpdate,
  metadata: Record<string, unknown> = {},
): Promise<TimerFrame> {
  const { data: updated, error } = await supabase
    .from("timer_states")
    .update({ ...update, last_tick_at: new Date().toISOString() })
    .eq("id", ctx.row.id)
    .select("*")
    .single();
  if (error) throw new TimerError(error.message);

  await supabase.from("audit_logs").insert({
    user_id: ctx.userId,
    subathon_id: ctx.subathonId,
    action,
    entity: "timer_state",
    entity_id: ctx.row.id,
    metadata: { ...metadata, prev: snapshotOf(ctx.row), next: snapshotOf(updated) },
  });

  return frameFor(ctx, updated);
}

/** Rebases the running segment so `remaining_seconds` stays the banked value. */
export function rebase(ctx: TimerContext, seconds: number, nowMs = Date.now()): TimerUpdate {
  const capped = clampRemaining(seconds, ctx.maxTimeSeconds);
  const running = ctx.row.status === "RUNNING" && capped > 0;
  return {
    status: (capped === 0 && ctx.row.status !== "IDLE" ? "ENDED" : ctx.row.status) as TimerStatus,
    remaining_seconds: capped,
    started_at: running ? new Date(nowMs).toISOString() : ctx.row.started_at,
    expires_at: running ? new Date(nowMs + capped * 1000).toISOString() : ctx.row.expires_at,
  };
}

export function currentRemaining(ctx: TimerContext, nowMs = Date.now()): number {
  return computeRemaining(snapshotFromRow(ctx.row, ctx.maxTimeSeconds), nowMs);
}

export function startUpdate(ctx: TimerContext, nowMs = Date.now()): TimerUpdate {
  const remaining = ctx.row.status === "RUNNING" ? currentRemaining(ctx, nowMs) : ctx.row.remaining_seconds;
  const capped = clampRemaining(remaining, ctx.maxTimeSeconds);
  return {
    status: "RUNNING",
    remaining_seconds: capped,
    started_at: new Date(nowMs).toISOString(),
    paused_at: null,
    expires_at: new Date(nowMs + capped * 1000).toISOString(),
  };
}

export function pauseUpdate(ctx: TimerContext, nowMs = Date.now()): TimerUpdate {
  return {
    status: "PAUSED",
    remaining_seconds: currentRemaining(ctx, nowMs),
    started_at: null,
    paused_at: new Date(nowMs).toISOString(),
    expires_at: null,
  };
}

export function resetUpdate(ctx: TimerContext): TimerUpdate {
  return {
    status: "IDLE",
    remaining_seconds: clampRemaining(ctx.initialSeconds, ctx.maxTimeSeconds),
    started_at: null,
    paused_at: null,
    expires_at: null,
    total_added_seconds: 0,
  };
}

type AuditRow = { id: string; action: string; metadata: unknown; created_at: string };

/** Finds the most recent timer mutation that has not already been undone. */
export async function findUndoTarget(
  supabase: Client,
  ctx: TimerContext,
): Promise<{ id: string; action: string; prev: TimerUpdate } | null> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, metadata, created_at")
    .eq("subathon_id", ctx.subathonId)
    .eq("entity", "timer_state")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new TimerError(error.message);

  const logs = (data ?? []) as AuditRow[];
  const undone = new Set(
    logs
      .filter((log) => log.action === "timer.undo")
      .map((log) => (log.metadata as { undo_of?: string } | null)?.undo_of)
      .filter((id): id is string => Boolean(id)),
  );

  for (const log of logs) {
    if (log.action === "timer.undo" || undone.has(log.id)) continue;
    const prev = (log.metadata as { prev?: TimerUpdate } | null)?.prev;
    if (!prev) continue;
    return { id: log.id, action: log.action, prev };
  }
  return null;
}

/** Clamps and integer-normalizes an untrusted numeric input. */
export function clampInput(value: unknown, min: number, max: number): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) throw new TimerError("invalid_seconds");
  return Math.min(max, Math.max(min, n));
}
