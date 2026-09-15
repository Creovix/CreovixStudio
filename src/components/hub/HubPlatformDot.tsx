import type { PlatformId } from "@/components/hub/platforms";

const SOLID: Record<Exclude<PlatformId, "TIKTOK">, string> = {
  KICK: "#53FC18",
  TWITCH: "#9146FF",
  YOUTUBE: "#FF0000",
};

const DOT = "inline-block w-2 h-2 min-w-2 min-h-2 shrink-0 rounded-full";

export function HubPlatformDot({ id, title }: { id: PlatformId; title?: string | undefined }) {
  if (id === "TIKTOK") {
    return <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shrink-0" title={title} aria-hidden />;
  }
  return (
    <span
      className={DOT}
      title={title}
      aria-hidden
      style={{ background: SOLID[id] }}
    />
  );
}
