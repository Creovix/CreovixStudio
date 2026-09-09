import { supabase } from "@/integrations/supabase/client";
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
  const { data: widget, error } = await supabase
    .from("widgets")
    .insert({
      user_id: args.userId,
      subathon_id: args.subathonId,
      type: args.type,
      name: args.name?.trim() || WIDGET_LABEL[args.type],
      config: defaultConfig(args.type, args.goalType) as never,
    })
    .select("id, public_token")
    .single();
  if (error) throw error;

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
