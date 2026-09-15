import { PLATFORM_META, type PlatformId } from "@/components/hub/platforms";
import { cn } from "@/lib/utils";

const DOT = "relative box-border inline-block size-2 shrink-0 overflow-hidden rounded-full align-middle";

/** Hub-only color mark. TikTok stays a two-tone circle, not a logo. */
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
      <span className={cn(DOT, className)} title={title} aria-hidden>
        <span className="absolute inset-y-0 start-0 w-1/2 bg-[#010101]" />
        <span className="absolute inset-y-0 end-0 w-1/2 bg-[#25F4EE]" />
      </span>
    );
  }
  return (
    <span
      className={cn(DOT, className)}
      title={title}
      aria-hidden
      style={{ background: PLATFORM_META[id].color }}
    />
  );
}
