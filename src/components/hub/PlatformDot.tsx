import { PLATFORM_META, type PlatformId } from "@/components/hub/platforms";
import { cn } from "@/lib/utils";

/** Hub-only 8px platform color mark. TikTok is a two-tone circle, not a logo. */
export function PlatformDot({
  id,
  title,
  className,
}: {
  id: PlatformId;
  title?: string | undefined;
  className?: string | undefined;
}) {
  if (id === "TIKTOK") {
    return (
      <span className={cn("hub-platform-dot hub-platform-dot--tiktok", className)} title={title} aria-hidden>
        <span />
        <span />
      </span>
    );
  }
  return (
    <span
      className={cn("hub-platform-dot", className)}
      title={title}
      aria-hidden
      style={{ background: PLATFORM_META[id].color }}
    />
  );
}
