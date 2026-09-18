import { supabase } from "@/lib/supabase/client";

const DEFAULT_RULES = [
  { platform: "TWITCH", event_type: "FOLLOW", seconds_per_unit: 10, unit_amount: 1 },
  { platform: "TWITCH", event_type: "SUBSCRIPTION", seconds_per_unit: 300, unit_amount: 1 },
  { platform: "TWITCH", event_type: "GIFT_SUB", seconds_per_unit: 300, unit_amount: 1 },
  { platform: "TWITCH", event_type: "BITS", seconds_per_unit: 6, unit_amount: 100 },
  { platform: "KICK", event_type: "FOLLOW", seconds_per_unit: 10, unit_amount: 1 },
  { platform: "KICK", event_type: "SUBSCRIPTION", seconds_per_unit: 300, unit_amount: 1 },
  { platform: "KICK", event_type: "GIFT_SUB", seconds_per_unit: 300, unit_amount: 1 },
  { platform: "STREAMELEMENTS", event_type: "DONATION", seconds_per_unit: 60, unit_amount: 1 },
  { platform: "STREAMLABS", event_type: "DONATION", seconds_per_unit: 60, unit_amount: 1 },
] as const;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "subathon";

/** Creates a subathon plus its timer state, overlay and starter rule set. */
export async function createSubathon(userId: string, title: string, initialSeconds = 3600) {
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: subathon, error } = await supabase
    .from("subathons")
    .insert({
      user_id: userId,
      title: title.trim() || "My subathon",
      slug,
      initial_seconds: initialSeconds,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw error;

  const [timer, overlay, rules] = await Promise.all([
    supabase.from("timer_states").insert({
      subathon_id: subathon.id,
      status: "PAUSED",
      remaining_seconds: initialSeconds,
      last_tick_at: new Date().toISOString(),
    }),
    supabase.from("overlays").insert({ subathon_id: subathon.id, is_public: true }),
    supabase
      .from("rules")
      .insert(DEFAULT_RULES.map((rule) => ({ ...rule, subathon_id: subathon.id }))),
  ]);
  if (timer.error) throw timer.error;
  if (overlay.error) throw overlay.error;
  if (rules.error) throw rules.error;

  return subathon.id;
}
