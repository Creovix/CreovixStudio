import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GiveawayPlatform } from "@/lib/giveaway.server";

export type GiveawaySettings = {
  keyword: string;
  subMultiplier: number;
  subsOnly: boolean;
  spinDuration: number;
  claimSeconds: number;
  isOpen: boolean;
};

export type Participant = {
  id: string;
  platform: string;
  username: string;
  entries: number;
  isSubscriber: boolean;
  createdAt: string;
};

export const DEFAULT_GIVEAWAY: GiveawaySettings = {
  keyword: "+1",
  subMultiplier: 1,
  subsOnly: false,
  spinDuration: 5,
  claimSeconds: 120,
  isOpen: true,
};

function clamp(value: number, min: number, max: number, fallback: number) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export const getGiveawayState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: settings }, { data: participants }] = await Promise.all([
      supabase
        .from("giveaway_settings")
        .select("keyword, sub_multiplier, subs_only, spin_duration, claim_seconds, is_open, last_winner")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("giveaway_participants")
        .select("id, platform, username, entries, is_subscriber, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    return {
      settings: settings
        ? {
            keyword: settings.keyword,
            subMultiplier: settings.sub_multiplier,
            subsOnly: settings.subs_only,
            spinDuration: settings.spin_duration,
            claimSeconds: settings.claim_seconds,
            isOpen: settings.is_open,
          }
        : DEFAULT_GIVEAWAY,
      lastWinner: (settings?.last_winner ?? null) as
        | { username: string; platform: string; at: string }
        | null,
      participants: (participants ?? []).map((row) => ({
        id: row.id,
        platform: row.platform,
        username: row.username,
        entries: row.entries,
        isSubscriber: row.is_subscriber,
        createdAt: row.created_at,
      })) satisfies Participant[],
    };
  });

export const saveGiveawaySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GiveawaySettings) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("giveaway_settings").upsert(
      {
        user_id: context.userId,
        keyword: data.keyword.trim().slice(0, 40) || "+1",
        sub_multiplier: clamp(data.subMultiplier, 1, 10, 1),
        subs_only: Boolean(data.subsOnly),
        spin_duration: clamp(data.spinDuration, 1, 60, 5),
        claim_seconds: clamp(data.claimSeconds, 15, 3600, 120),
        is_open: Boolean(data.isOpen),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const clearGiveawayParticipants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("giveaway_participants")
      .delete()
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Weighted random draw across all participants (entries = ticket count). */
export const pickGiveawayWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: participants } = await supabase
      .from("giveaway_participants")
      .select("platform, username, entries")
      .eq("user_id", userId);

    if (!participants?.length) return { ok: false as const, error: "no_participants" };

    const total = participants.reduce((sum, row) => sum + Math.max(row.entries, 1), 0);
    let ticket = Math.floor(Math.random() * total);
    let winner = participants[0]!;
    for (const row of participants) {
      ticket -= Math.max(row.entries, 1);
      if (ticket < 0) {
        winner = row;
        break;
      }
    }

    const payload = {
      username: winner.username,
      platform: winner.platform,
      at: new Date().toISOString(),
    };
    await supabase
      .from("giveaway_settings")
      .upsert({ user_id: userId, last_winner: payload as never }, { onConflict: "user_id" });

    return { ok: true as const, winner: payload };
  });

/**
 * Entry point used by the dashboard's browser chat listeners (Twitch/Kick)
 * so keyword entries land in the same list as server-side webhook entries.
 */
export const joinGiveaway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { platform: GiveawayPlatform; username: string; text: string; isSubscriber: boolean }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { captureGiveawayEntry } = await import("@/lib/giveaway.server");
    return captureGiveawayEntry(supabaseAdmin, context.userId, data);
  });

/** Posts the winner announcement + claim instructions into the live chat. */
export const announceGiveawayWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { username: string; keyword: string; claimSeconds: number }) => input)
  .handler(async ({ data, context }) => {
    const { sendKickChatMessage } = await import("@/lib/clipCommand.server");
    const message = `🎉 مبروك @${data.username}! أعد كتابة الكلمة المفتاحية (${data.keyword}) في الشات خلال ${data.claimSeconds} ثانية لتأكيد استلام الجائزة!`;
    const sent = await sendKickChatMessage(context.userId, "", message);
    return { ok: sent };
  });

/** Public chat coordinates so the dashboard can watch chat for the keyword. */
export const getGiveawayChatSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveChatSources } = await import("@/lib/chatSources.server");
    return resolveChatSources(supabaseAdmin, context.userId);
  });

export type GiveawayDrawState = {
  phase: "idle" | "shuffling" | "revealing" | "settled";
  winner: { username: string; platform: string } | null;
  claimState: "pending" | "confirmed" | "expired";
  claimUntil: string | null;
  keyword: string;
};

/**
 * Mirrors the dashboard draw animation into the database so the public OBS
 * browser source renders exactly the same phase, winner and claim countdown.
 */
export const publishGiveawayDraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GiveawayDrawState) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("giveaway_settings")
      .update({ draw_state: data as never })
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Private OBS browser-source URL token for the giveaway display. */
export const getGiveawayOverlayToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("giveaway_settings")
      .select("overlay_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.overlay_token) return { token: data.overlay_token as string };
    const { data: created } = await supabase
      .from("giveaway_settings")
      .upsert({ user_id: userId }, { onConflict: "user_id" })
      .select("overlay_token")
      .maybeSingle();
    return { token: (created?.overlay_token as string | undefined) ?? "" };
  });
