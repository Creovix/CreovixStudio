import type { CSSProperties } from "react";

import type { PlatformId } from "@/components/hub/platforms";

const FILL: Record<PlatformId, string> = {
  KICK: "#53FC18",
  TWITCH: "#9146FF",
  YOUTUBE: "#FF0000",
  TIKTOK: "linear-gradient(90deg,#111 50%,#25F4EE 50%)",
};

const DOT_STYLE: CSSProperties = {
  display: "inline-block",
  width: 6,
  height: 6,
  minWidth: 6,
  minHeight: 6,
  borderRadius: "50%",
  flexShrink: 0,
};

export function HubPlatformDot({ id, title }: { id: PlatformId; title?: string | undefined }) {
  return (
    <span
      className="inline-block size-1.5 shrink-0 rounded-full"
      title={title}
      aria-hidden
      style={{ ...DOT_STYLE, background: FILL[id] }}
    />
  );
}
