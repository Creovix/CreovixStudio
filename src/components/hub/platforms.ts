export type PlatformId = "KICK" | "TWITCH" | "YOUTUBE" | "TIKTOK";

export type PlatformFilter = "ALL" | PlatformId;

export const PLATFORM_META: Record<
  PlatformId,
  { color: string; label: { en: string; ar: string } }
> = {
  KICK: { color: "#53FC18", label: { en: "Kick", ar: "كيك" } },
  TWITCH: { color: "#9146FF", label: { en: "Twitch", ar: "تويتش" } },
  YOUTUBE: { color: "#FF0000", label: { en: "YouTube", ar: "يوتيوب" } },
  TIKTOK: { color: "#FE2C55", label: { en: "TikTok", ar: "تيك توك" } },
};

/** Real catalog platforms — used for “all sources” widgets and the All chip. */
export const ALL_PLATFORMS: PlatformId[] = ["KICK", "TWITCH", "YOUTUBE", "TIKTOK"];

export const FILTER_ORDER: PlatformFilter[] = ["ALL", "KICK", "TWITCH", "YOUTUBE", "TIKTOK"];

export function platformAccent(platforms: PlatformId[]): string {
  const first = platforms[0];
  return first ? PLATFORM_META[first].color : PLATFORM_META.KICK.color;
}
