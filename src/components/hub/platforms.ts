export type PlatformId = "KICK" | "TWITCH" | "YOUTUBE" | "TIKTOK";

export type PlatformFilter = "ALL" | PlatformId;

export const PLATFORM_META: Record<
  PlatformId,
  { color: string; label: { en: string } }
> = {
  KICK: { color: "#53FC18", label: { en: "Kick" } },
  TWITCH: { color: "#9146FF", label: { en: "Twitch" } },
  YOUTUBE: { color: "#FF0000", label: { en: "YouTube" } },
  TIKTOK: { color: "#25F4EE", label: { en: "TikTok" } },
};

/** Hub-only platform mark: a small color dot (TikTok is black / cyan on one circle). */
export function platformDotBackground(id: PlatformId): string {
  if (id === "TIKTOK") {
    return "linear-gradient(90deg, #000 50%, #25F4EE 50%)";
  }
  return PLATFORM_META[id].color;
}

/** Real catalog platforms — used for “all sources” widgets and the All chip. */
export const ALL_PLATFORMS: PlatformId[] = ["KICK", "TWITCH", "YOUTUBE", "TIKTOK"];

export const FILTER_ORDER: PlatformFilter[] = ["ALL", "KICK", "TWITCH", "YOUTUBE", "TIKTOK"];

/** Streamer-hub popularity: Kick → Twitch → YouTube → TikTok */
export const PLATFORM_USAGE_ORDER: PlatformId[] = ["KICK", "TWITCH", "YOUTUBE", "TIKTOK"];

export function sortHubPlatforms(platforms: readonly PlatformId[]): PlatformId[] {
  return [...platforms].sort(
    (a, b) => PLATFORM_USAGE_ORDER.indexOf(a) - PLATFORM_USAGE_ORDER.indexOf(b),
  );
}

export function platformAccent(platforms: PlatformId[]): string {
  const first = platforms[0];
  return first ? PLATFORM_META[first].color : PLATFORM_META.KICK.color;
}
