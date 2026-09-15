import type { CSSProperties } from "react";
import { createElement } from "react";

import discordPrimary from "@/assets/icons/Discord/Primary.svg";
import instagramPrimary from "@/assets/icons/Instagram/Primary.svg";
import kickPrimary from "@/assets/icons/Kick/Primary.svg";
import linkPrimary from "@/assets/icons/Link/Primary.svg";
import snapchatPrimary from "@/assets/icons/SnapChat/Primary.svg";
import soundCloudPrimary from "@/assets/icons/SoundCloud/Primary.svg";
import spotifyPrimary from "@/assets/icons/Spotify/Primary.svg";
import streamElementsPrimary from "@/assets/icons/StreamElements/Primary.svg";
import streamlabsPrimary from "@/assets/icons/Streamlabs/Primary.svg";
import tiktokPrimary from "@/assets/icons/TikTok/Primary.svg";
import tiktokWhite from "@/assets/icons/TikTok/White.svg";
import twitchPrimary from "@/assets/icons/Twitch/Primary.svg";
import websitePrimary from "@/assets/icons/Website/Primary.svg";
import websiteWhite from "@/assets/icons/Website/White.svg";
import whatsAppPrimary from "@/assets/icons/WhatsApp/Primary.svg";
import xBlack from "@/assets/icons/X/Black.svg";
import xWhite from "@/assets/icons/X/White.svg";
import youTubePrimary from "@/assets/icons/YouTube/Primary.svg";

/** Git index folder names (Linux/Vercel). SnapChat has a capital C. X has no Primary.svg. */
export const PLATFORM_FOLDER = {
  discord: "Discord",
  instagram: "Instagram",
  kick: "Kick",
  link: "Link",
  snapchat: "SnapChat",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  streamelements: "StreamElements",
  streamlabs: "Streamlabs",
  tiktok: "TikTok",
  twitch: "Twitch",
  website: "Website",
  whatsapp: "WhatsApp",
  x: "X",
  youtube: "YouTube",
} as const;

/** Folder names on disk under `src/assets/icons`. */
export type PlatformBrand =
  | "discord"
  | "instagram"
  | "kick"
  | "link"
  | "snapchat"
  | "soundcloud"
  | "spotify"
  | "streamelements"
  | "streamlabs"
  | "tiktok"
  | "twitch"
  | "website"
  | "whatsapp"
  | "x"
  | "youtube";

/** Code keys including aliases used by existing callers. */
export type PlatformAssetName = PlatformBrand | "other" | "custom" | "youtube-play";

/** Kept for callers; every tone resolves to the single Primary file. */
export type IconVariant = "Primary" | "White" | "Black" | "Primary2";

/** One existing file per brand. X aliases White.svg as Primary. */
export const PLATFORM_ASSET_URLS: Record<PlatformBrand, string> = {
  discord: discordPrimary,
  instagram: instagramPrimary,
  kick: kickPrimary,
  link: linkPrimary,
  snapchat: snapchatPrimary,
  soundcloud: soundCloudPrimary,
  spotify: spotifyPrimary,
  streamelements: streamElementsPrimary,
  streamlabs: streamlabsPrimary,
  tiktok: tiktokPrimary,
  twitch: twitchPrimary,
  website: websitePrimary,
  whatsapp: whatsAppPrimary,
  x: xWhite,
  youtube: youTubePrimary,
};

const ALIAS: Record<string, PlatformBrand> = {
  other: "link",
  custom: "link",
  "youtube-play": "youtube",
};

export function resolvePlatformBrand(name: PlatformAssetName | string): PlatformBrand | null {
  const key = name.trim().toLowerCase();
  if (key in ALIAS) return ALIAS[key] ?? null;
  if (key in PLATFORM_ASSET_URLS) return key as PlatformBrand;
  return null;
}

/** Dock/cards: brand Primary on Light; White (or X Black) when the card is dark. */
export function resolveIconVariant(
  brand: PlatformBrand,
  options: {
    variant?: IconVariant | undefined;
    onLight?: boolean;
    onBrand?: boolean;
    surface?: string | undefined;
  } = {},
): IconVariant {
  if (options.variant) return options.variant;
  if (brand === "x") return options.onLight ? "Black" : "White";
  if (brand === "website" || brand === "tiktok") return options.onLight ? "Primary" : "White";
  return "Primary";
}

export function platformAssetUrl(
  name: PlatformAssetName | string,
  options: {
    variant?: IconVariant | undefined;
    onLight?: boolean;
    onBrand?: boolean;
    surface?: string | undefined;
  } = {},
): string | null {
  const brand = resolvePlatformBrand(name);
  if (!brand) return null;
  const tone = resolveIconVariant(brand, options);
  if (brand === "x") return tone === "Black" ? xBlack : xWhite;
  if (brand === "website") return tone === "White" ? websiteWhite : websitePrimary;
  if (brand === "tiktok") return tone === "White" ? tiktokWhite : tiktokPrimary;
  return PLATFORM_ASSET_URLS[brand];
}

export function PlatformAsset({
  name,
  size,
  className,
  style,
  label,
  onLight,
  variant,
}: {
  name: PlatformAssetName | string;
  size: number;
  fit?: "contain" | "auto";
  onLight?: boolean;
  onBrand?: boolean;
  surface?: string | undefined;
  variant?: IconVariant | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  label?: string | undefined;
}) {
  const brand = resolvePlatformBrand(name);
  if (!brand) return null;
  const src = platformAssetUrl(name, { onLight, variant });
  if (!src) return null;
  const tone = resolveIconVariant(brand, { onLight, variant });
  const box: CSSProperties = {
    height: size,
    width: size,
    display: "block",
    flex: "0 0 auto",
    overflow: "visible",
    objectFit: "contain",
    ...style,
  };

  return createElement("img", {
    key: `${PLATFORM_FOLDER[brand]}/${tone}`,
    className,
    src,
    alt: label ?? "",
    draggable: false,
    style: box,
  });
}
