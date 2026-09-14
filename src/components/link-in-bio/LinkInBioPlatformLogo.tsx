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
  onBrand = false,
  surface,
}: {
  platform: LinkPlatform;
  size?: number;
  onBrand?: boolean;
  ink?: string;
  onLight?: boolean;
  surface?: string | undefined;
}) {
  const name = ASSET[platform];

  return (
    <PlatformAsset
      key={`${name}-${onBrand ? "brand" : onLight ? "light" : "dark"}`}
      name={name}
      size={size}
      fit="contain"
      onLight={onLight}
      onBrand={onBrand}
      surface={surface}
      style={{ overflow: "visible" }}
    />
  );
}

export const LinkInBioPlatformLogo = memo(PlatformLogoMark);
