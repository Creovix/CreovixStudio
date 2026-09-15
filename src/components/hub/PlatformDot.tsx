import { platformDotBackground, type PlatformId } from "@/components/hub/platforms";
import { cn } from "@/lib/utils";

/** Hub-only 8px platform color mark. TikTok is a two-tone circle on one span. */
export function PlatformDot({
  id,
  title,
  className,
}: {
  id: PlatformId;
  title?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn("hub-platform-dot", className)}
      title={title}
      aria-hidden
      style={{ background: platformDotBackground(id) }}
    />
  );
}
