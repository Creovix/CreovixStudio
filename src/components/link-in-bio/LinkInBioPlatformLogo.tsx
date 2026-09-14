import { memo } from "react";

import { PlatformAsset, type PlatformAssetName } from "@/components/icons/platformAssets";
import type { LinkPlatform } from "@/lib/linkInBio";

const ASSET: Record<LinkPlatform, PlatformAssetName> = {
  kick: "kick",
  twitch: "twitch",
  youtube: "youtube",
  tiktok: "tiktok",
  instagram: "instagram",
  x: "x",
  discord: "discord",
  whatsapp: "whatsapp",
  custom: "link",
};

function PlatformLogoMark({
  platform,
  size = 40,
  onLight = false,
}: {
  platform: LinkPlatform;
  size?: number;
  onBrand?: boolean;
  ink?: string;
  onLight?: boolean;
}) {
  const name = ASSET[platform];

  return (
    <PlatformAsset
      key={`${name}-${onLight ? "light" : "dark"}`}
      name={name}
      size={size}
      fit="contain"
      onLight={onLight}
      style={{ overflow: "visible" }}
    />
  );
}

export const LinkInBioPlatformLogo = memo(PlatformLogoMark);
