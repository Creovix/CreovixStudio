import type { CSSProperties } from "react";

import type { PlatformId } from "@/components/hub/platforms";

const SOLID: Record<Exclude<PlatformId, "TIKTOK">, string> = {
  KICK: "#53FC18",
  TWITCH: "#9146FF",
  YOUTUBE: "#FF0000",
};

const BOX: CSSProperties = {
  display: "block",
  width: 6,
  height: 6,
  minWidth: 6,
  minHeight: 6,
  borderRadius: "50%",
  flexShrink: 0,
  overflow: "visible",
};

export function HubPlatformDot({ id, title }: { id: PlatformId; title?: string | undefined }) {
  const style: CSSProperties =
    id === "TIKTOK"
      ? {
          ...BOX,
          backgroundColor: "#111",
          backgroundImage: "linear-gradient(90deg, #111 0%, #111 50%, #25F4EE 50%, #25F4EE 100%)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          backgroundPosition: "0 0",
        }
      : { ...BOX, backgroundColor: SOLID[id] };

  return <span className="block size-1.5 shrink-0 rounded-full" title={title} aria-hidden style={style} />;
}
