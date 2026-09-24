import { supabase } from "@/lib/supabase/client";
import { DEFAULT_OVERLAY_THEME } from "@/lib/overlayTheme";
import { goalTypePreset, type GoalTypeId } from "@/lib/goalTypes";
import {
  DEFAULT_STYLE,
  WIDGET_LABEL,
  parseGoalConfig,
  parseEmoteRainConfig,
  parseSpinConfig,
  parseSpotlightConfig,
  parseTappersConfig,
  parseTapGoalConfig,
  type WidgetType,
} from "@/lib/widgets";

function defaultConfig(type: WidgetType, goalType?: GoalTypeId): Record<string, unknown> {
  switch (type) {
    case "SUBATHON_TIMER":
      return { ...DEFAULT_OVERLAY_THEME };
    case "GOAL_BAR": {
      const preset = goalTypePreset(goalType);
      return {
        ...parseGoalConfig(null),
        goalType: preset.id,
        label: preset.overlayLabel,
        accentColor: preset.accentColor,
      };
    }
    case "SPIN_WHEEL":
      return { ...parseSpinConfig(null) };
    case "EMOTE_RAIN":
      return { ...parseEmoteRainConfig(null) };
    case "CHAT_SPOTLIGHT":
      return { ...parseSpotlightConfig(null) };
    case "TIKTOK_TAPPERS":
      return { ...parseTappersConfig(null) };
    case "TIKTOK_TAP_GOAL":
      return { ...parseTapGoalConfig(null) };
    default:
      return { ...DEFAULT_STYLE };
  }
}

/** Pull a readable message from Error / Postgrest / plain `{ message }` throws. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

/**
 * widgets.user_id → public.users(id). Auth users from OAuth can exist without a
 * public.users row if the callback upsert failed — ensure the row before insert.
 */
export async function ensureUserProfile(userId: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user || user.id !== userId) {
    throw new Error("You must be signed in to open this tool.");
  }

  const meta = user.user_metadata ?? {};
  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      email: user.email ?? null,
      name:
        (typeof meta.name === "string" && meta.name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.preferred_username === "string" && meta.preferred_username) ||
        (typeof meta.username === "string" && meta.username) ||
        null,
      image:
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta.picture === "string" && meta.picture) ||
        (typeof meta.image === "string" && meta.image) ||
        null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

/**
 * Creates a widget (plus its goal row when it is a goal bar) for the signed-in
 * user. RLS scopes every write to the owner.
 */
export async function createWidget(args: {
  userId: string;
  subathonId: string | null;
  type: WidgetType;
  name?: string;
  goalType?: GoalTypeId;
}) {
  if (args.type === "TIKTOK_TAPPERS" || args.type === "TIKTOK_TAP_GOAL") {
    throw new Error("TikTok overlays are Coming Soon until OAuth is ready.");
  }

  await ensureUserProfile(args.userId);

  // Ignore a stale / deleted subathon id so the FK does not block creation.
  let subathonId = args.subathonId;
  if (subathonId) {
    const { data: subathon } = await supabase
      .from("subathons")
      .select("id")
      .eq("id", subathonId)
      .eq("user_id", args.userId)
      .maybeSingle();
    if (!subathon) subathonId = null;
  }

  const { data: widget, error } = await supabase
    .from("widgets")
    .insert({
      user_id: args.userId,
      subathon_id: subathonId,
      type: args.type,
      name: args.name?.trim() || WIDGET_LABEL[args.type],
      config: defaultConfig(args.type, args.goalType) as never,
    })
    .select("id, public_token")
    .single();
  if (error) throw error;
  if (!widget?.id) throw new Error("Widget was created but no id was returned.");

  if (args.type === "GOAL_BAR") {
    const { error: goalError } = await supabase.from("goals").insert({
      widget_id: widget.id,
      user_id: args.userId,
      title: goalTypePreset(args.goalType).title,
      unit: goalTypePreset(args.goalType).unit,
      target_value: goalTypePreset(args.goalType).target,
      current_value: 0,
    });
    if (goalError) throw goalError;
  }

  return widget;
}
