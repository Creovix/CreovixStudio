import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type GiveawayPlatform = "KICK" | "TWITCH" | "YOUTUBE" | "TIKTOK";

export type EntryInput = {
  platform: GiveawayPlatform;
  username: string;
  text: string;
  isSubscriber: boolean;
};

export type EntryResult =
  | { status: "ignored"; reason: string }
  | { status: "entered"; entries: number };

type Admin = SupabaseClient<Database>;

/**
 * Registers a chat viewer into the creator's live participant list when the
 * message matches the configured keyword. Shared by every chat source
 * (Kick/Twitch/YouTube/TikTok) so all platforms behave identically.
 */
export async function captureGiveawayEntry(
  admin: Admin,
  userId: string,
  input: EntryInput,
): Promise<EntryResult> {
  const { data: settings } = await admin
    .from("giveaway_settings")
    .select("keyword, sub_multiplier, subs_only, is_open")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) return { status: "ignored", reason: "giveaway_not_configured" };
  if (!settings.is_open) return { status: "ignored", reason: "giveaway_closed" };

  const keyword = (settings.keyword || "+1").trim().toLowerCase();
  const text = input.text.trim().toLowerCase();
  if (!keyword || !text.includes(keyword)) return { status: "ignored", reason: "no_keyword" };
  if (settings.subs_only && !input.isSubscriber) {
    return { status: "ignored", reason: "subscribers_only" };
  }

  const username = input.username.trim().slice(0, 60);
  if (!username) return { status: "ignored", reason: "no_username" };

  const multiplier = Math.max(Number(settings.sub_multiplier) || 1, 1);
  const entries = input.isSubscriber ? multiplier : 1;

  const { error } = await admin.from("giveaway_participants").upsert(
    {
      user_id: userId,
      platform: input.platform,
      username,
      entries,
      is_subscriber: input.isSubscriber,
    },
    { onConflict: "user_id,platform,username" },
  );
  if (error) return { status: "ignored", reason: error.message };

  return { status: "entered", entries };
}
