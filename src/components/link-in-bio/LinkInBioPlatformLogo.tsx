import { memo, useState } from "react";

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
  custom: "website",
};

function PlatformLogoMark({
  platform,
  size = 40,
  faviconUrl,
  onLight = false,
}: {
  platform: LinkPlatform;
  size?: number;
  faviconUrl?: string | null;
  onBrand?: boolean;
  ink?: string;
  onLight?: boolean;
  surface?: string | undefined;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const showFavicon = platform === "custom" && Boolean(faviconUrl) && failed !== faviconUrl;
  if (showFavicon && faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt=""
        width={size}
        height={size}
        className="size-full object-contain"
        onError={() => setFailed(faviconUrl)}
      />
    );
  }
  return (
    <PlatformAsset
      name={ASSET[platform]}
      size={size}
      fit="contain"
      onLight={onLight}
      style={{ overflow: "visible" }}
    />
  );
}

export const LinkInBioPlatformLogo = memo(PlatformLogoMark);
