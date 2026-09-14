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
}: {
  platform: LinkPlatform;
  size?: number;
  onBrand?: boolean;
  ink?: string;
  onLight?: boolean;
  surface?: string | undefined;
}) {
  return (
    <PlatformAsset name={ASSET[platform]} size={size} fit="contain" style={{ overflow: "visible" }} />
  );
}

export const LinkInBioPlatformLogo = memo(PlatformLogoMark);
