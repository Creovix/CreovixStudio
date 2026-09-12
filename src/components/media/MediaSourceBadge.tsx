import type { ReactNode } from "react";
import { mediaPlatformLabel, normalizeMediaPlatform, type MediaPlatform } from "@/lib/mediaRequests";

function YouTubeMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8Z" />
      <path fill="#fff" d="M9.8 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

function SpotifyMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path fill="#000" d="M17.3 16.3c-.2.4-.7.5-1.1.3-2.9-1.8-6.6-2.2-11-.1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 4.8-2.2 8.9-1.8 12.1.2.4.2.5.7.4 1Zm1.5-3.3c-.3.4-.8.6-1.3.3-3.3-2-8.4-2.6-12.3-1.4-.5.1-1-.2-1.1-.7-.2-.5.1-1 .7-1.1 4.5-1.4 10.1-.7 13.9 1.6.4.3.6.9.1 1.3Zm.1-3.4c-4-2.3-10.5-2.6-14.3-1.4-.6.2-1.2-.2-1.4-.7-.2-.6.2-1.2.7-1.4 4.4-1.3 11.6-1.1 16.2 1.6.5.3.7 1 .4 1.5-.3.5-1 .7-1.6.4Z" />
    </svg>
  );
}

function SoundCloudMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#FF5500" />
      <path fill="#fff" d="M4.2 13.2h1.1v4.2H4.2zm2 1.1h1.1v3.1H6.2zm2-.8h1.1v3.9H8.2zm2-2.2h1.2v6.1H10.2zm2.3-1.6c1.6 0 2.8 1.2 2.8 2.8v3.3h-2.8V10.8c-.5.2-1 .6-1.3 1.1v4.5h-1.2v-4.8c.6-.6 1.5-1 2.5-1Z" />
    </svg>
  );
}

function AnghamiMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#7B2BFF" />
      <path fill="#fff" d="M12.2 5.2 6.4 18.2h2.2l1.2-2.8h4.5l1.2 2.8h2.2L12.2 5.2Zm.1 3.5 1.6 3.7h-3.2l1.6-3.7Z" />
    </svg>
  );
}

const MARK: Record<MediaPlatform, (props: { size: number }) => ReactNode> = {
  YOUTUBE: YouTubeMark,
  SPOTIFY: SpotifyMark,
  ANGHAMI: AnghamiMark,
  SOUNDCLOUD: SoundCloudMark,
};

/** Compact platform mark + name shown beside queued / now-playing titles. */
export function MediaSourceBadge({
  platform,
  size = 14,
  showLabel = true,
  className = "",
}: {
  platform?: string | null | undefined;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const key = normalizeMediaPlatform(platform);
  const Icon = MARK[key];
  return (
    <span className={`inline-flex items-center gap-1 align-middle ${className}`}>
      <Icon size={size} />
      {showLabel && <span className="text-[11px] font-semibold tracking-wide">{mediaPlatformLabel(key)}</span>}
    </span>
  );
}
