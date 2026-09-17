import { memo } from "react";

import { PlatformAsset, type PlatformAssetName } from "@/components/icons/platformAssets";
import type { LinkPlatform } from "@/lib/linkInBio";

const ASSET: Record<LinkPlatform, PlatformAssetName> = {
  kick: "kick",
  twitch: "twitch",
  youtube: "youtube",
  tiktok: "tiktok",
  instagram: "instagram",
  snapchat: "snapchat",
  x: "x",
  discord: "discord",
  whatsapp: "whatsapp",
  custom: "link",
};

function markKey({
  platform,
  onLight,
  whiteIcons,
  monoIcons,
}: {
  platform: LinkPlatform;
  onLight: boolean;
  whiteIcons: boolean;
  monoIcons: boolean;
}) {
  const tone = onLight ? "light" : "dark";
  if (whiteIcons) return `${ASSET[platform]}-glow-${tone}`;
  if (monoIcons) return `${ASSET[platform]}-mono-${tone}`;
  return `${ASSET[platform]}-brand`;
}

function PlatformLogoMark({
  platform,
  size = 40,
  onLight = false,
  whiteIcons = false,
  monoIcons = false,
}: {
  platform: LinkPlatform;
  size?: number;
  onBrand?: boolean;
  ink?: string;
  onLight?: boolean;
  whiteIcons?: boolean;
  monoIcons?: boolean;
  surface?: string | undefined;
}) {
  return (
    <PlatformAsset
      key={markKey({ platform, onLight, whiteIcons, monoIcons })}
      name={ASSET[platform]}
      size={size}
      fit="contain"
      onLight={onLight}
      whiteIcons={whiteIcons}
      monoIcons={monoIcons}
      style={{ overflow: "visible" }}
    />
  );
}

export const LinkInBioPlatformLogo = memo(PlatformLogoMark);
