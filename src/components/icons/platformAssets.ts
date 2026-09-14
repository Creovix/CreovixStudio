import type { CSSProperties } from "react";
import { createElement } from "react";

import discordBlack from "@/assets/icons/Discord/Black.svg";
import discordPrimary from "@/assets/icons/Discord/Primary.svg";
import discordWhite from "@/assets/icons/Discord/White.svg";
import instagramBlack from "@/assets/icons/Instagram/Black.svg";
import instagramPrimary from "@/assets/icons/Instagram/Primary.svg";
import instagramWhite from "@/assets/icons/Instagram/White.svg";
import kickBlack from "@/assets/icons/Kick/Black.svg";
import kickPrimary from "@/assets/icons/Kick/Primary.svg";
import kickWhite from "@/assets/icons/Kick/White.svg";
import linkBlack from "@/assets/icons/Link/Black.svg";
import linkPrimary from "@/assets/icons/Link/Primary.svg";
import linkWhite from "@/assets/icons/Link/White.svg";
import soundCloudBlack from "@/assets/icons/SoundCloud/Black.svg";
import soundCloudPrimary from "@/assets/icons/SoundCloud/Primary.svg";
import soundCloudWhite from "@/assets/icons/SoundCloud/White.svg";
import spotifyBlack from "@/assets/icons/Spotify/Black.svg";
import spotifyPrimary from "@/assets/icons/Spotify/Primary.svg";
import spotifyWhite from "@/assets/icons/Spotify/White.svg";
import streamElementsBlack from "@/assets/icons/StreamElements/Black.svg";
import streamElementsPrimary from "@/assets/icons/StreamElements/Primary.svg";
import streamElementsWhite from "@/assets/icons/StreamElements/White.svg";
import streamlabsBlack from "@/assets/icons/Streamlabs/Black.svg";
import streamlabsPrimary from "@/assets/icons/Streamlabs/Primary.svg";
import streamlabsWhite from "@/assets/icons/Streamlabs/White.svg";
import tiktokBlack from "@/assets/icons/TikTok/Black.svg";
import tiktokPrimary from "@/assets/icons/TikTok/Primary.svg";
import tiktokPrimary2 from "@/assets/icons/TikTok/Primary 2.svg";
import tiktokWhite from "@/assets/icons/TikTok/White.svg";
import twitchBlack from "@/assets/icons/Twitch/Black.svg";
import twitchPrimary from "@/assets/icons/Twitch/Primary.svg";
import twitchWhite from "@/assets/icons/Twitch/White.svg";
import websiteBlack from "@/assets/icons/Website/Black.svg";
import websitePrimary from "@/assets/icons/Website/Primary.svg";
import websiteWhite from "@/assets/icons/Website/White.svg";
import whatsAppBlack from "@/assets/icons/WhatsApp/Black.svg";
import whatsAppPrimary from "@/assets/icons/WhatsApp/Primary.svg";
import whatsAppWhite from "@/assets/icons/WhatsApp/White.svg";
import xBlack from "@/assets/icons/X/Black.svg";
import xWhite from "@/assets/icons/X/White.svg";
import youTubeBlack from "@/assets/icons/YouTube/Black.svg";
import youTubePrimary from "@/assets/icons/YouTube/Primary.svg";
import youTubeWhite from "@/assets/icons/YouTube/White.svg";

/** Folder names on disk under `src/assets/icons`. */
export type PlatformBrand =
  | "discord"
  | "instagram"
  | "kick"
  | "link"
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

export type IconVariant = "Primary" | "White" | "Black" | "Primary2";

type VariantMap = Partial<Record<IconVariant, string>> & { White: string };

export const PLATFORM_ASSET_URLS: Record<PlatformBrand, VariantMap> = {
  discord: { Primary: discordPrimary, White: discordWhite, Black: discordBlack },
  instagram: { Primary: instagramPrimary, White: instagramWhite, Black: instagramBlack },
  kick: { Primary: kickPrimary, White: kickWhite, Black: kickBlack },
  link: { Primary: linkPrimary, White: linkWhite, Black: linkBlack },
  soundcloud: { Primary: soundCloudPrimary, White: soundCloudWhite, Black: soundCloudBlack },
  spotify: { Primary: spotifyPrimary, White: spotifyWhite, Black: spotifyBlack },
  streamelements: { Primary: streamElementsPrimary, White: streamElementsWhite, Black: streamElementsBlack },
  streamlabs: { Primary: streamlabsPrimary, White: streamlabsWhite, Black: streamlabsBlack },
  tiktok: { Primary: tiktokPrimary, Primary2: tiktokPrimary2, White: tiktokWhite, Black: tiktokBlack },
  twitch: { Primary: twitchPrimary, White: twitchWhite, Black: twitchBlack },
  website: { Primary: websitePrimary, White: websiteWhite, Black: websiteBlack },
  whatsapp: { Primary: whatsAppPrimary, White: whatsAppWhite, Black: whatsAppBlack },
  x: { White: xWhite, Black: xBlack },
  youtube: { Primary: youTubePrimary, White: youTubeWhite, Black: youTubeBlack },
};

const ALIAS: Record<string, PlatformBrand> = {
  other: "link",
  custom: "link",
  "youtube-play": "youtube",
};

const MONO: ReadonlySet<PlatformBrand> = new Set(["x", "link", "website"]);

export function resolvePlatformBrand(name: PlatformAssetName | string): PlatformBrand | null {
  const key = name.trim().toLowerCase();
  if (key in ALIAS) return ALIAS[key] ?? null;
  if (key in PLATFORM_ASSET_URLS) return key as PlatformBrand;
  return null;
}

export function resolveIconVariant(
  brand: PlatformBrand,
  {
    variant,
    onLight = false,
  }: {
    variant?: IconVariant | undefined;
    onLight?: boolean;
  } = {},
): IconVariant {
  const files = PLATFORM_ASSET_URLS[brand];
  if (variant && files[variant]) return variant;
  if (onLight && files.Black) return "Black";
  if (MONO.has(brand)) return "White";
  // Colorful note with white core — readable on dark overlays.
  if (brand === "tiktok" && files.Primary2) return "Primary2";
  if (files.Primary) return "Primary";
  return "White";
}

export function platformAssetUrl(
  name: PlatformAssetName | string,
  options: { variant?: IconVariant | undefined; onLight?: boolean } = {},
): string | null {
  const brand = resolvePlatformBrand(name);
  if (!brand) return null;
  const picked = resolveIconVariant(brand, options);
  return PLATFORM_ASSET_URLS[brand][picked] ?? PLATFORM_ASSET_URLS[brand].White;
}

export function PlatformAsset({
  name,
  size,
  fit = "contain",
  onLight = false,
  variant,
  className,
  style,
  label,
}: {
  name: PlatformAssetName | string;
  size: number;
  fit?: "contain" | "auto";
  onLight?: boolean;
  variant?: IconVariant | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  label?: string | undefined;
}) {
  const brand = resolvePlatformBrand(name);
  if (!brand) return null;
  const picked = resolveIconVariant(brand, { variant, onLight });
  const src = PLATFORM_ASSET_URLS[brand][picked] ?? PLATFORM_ASSET_URLS[brand].White;
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
    key: `${brand}-${picked}`,
    className,
    src,
    alt: label ?? "",
    draggable: false,
    style: box,
  });
}
