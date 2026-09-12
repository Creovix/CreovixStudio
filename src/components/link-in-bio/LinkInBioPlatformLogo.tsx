import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import type { LinkPlatform } from "@/lib/linkInBio";

export function LinkInBioPlatformLogo({
  platform,
  size = 40,
}: {
  platform: LinkPlatform;
  size?: number;
}) {
  const common = {
    height: size,
    width: size,
    display: "block",
    flex: "0 0 auto",
  } as const;

  if (platform === "kick" || platform === "twitch" || platform === "youtube" || platform === "tiktok" || platform === "x") {
    return <PlatformIcon platform={platform.toUpperCase()} size={size} />;
  }

  if (platform === "discord") {
    return (
      <svg viewBox="0 0 24 24" style={common} aria-label="Discord" role="img">
        <path
          fill="#5865F2"
          d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.08.08 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.1.1 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.027 14 14 0 0 0 1.226-1.994.07.07 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.08.08 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.07.07 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .078.01c.12.098.246.198.373.292a.08.08 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.08.08 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" style={common} aria-label="Instagram" role="img">
        <defs>
          <linearGradient id="bioIgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#bioIgGrad)" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" style={common} aria-label="Link" role="img">
      <path
        fill="currentColor"
        d="M10.6 13.4a4 4 0 0 1 0-5.66l2.12-2.12a4 4 0 1 1 5.66 5.66l-1.3 1.3a1 1 0 0 1-1.42-1.42l1.3-1.3a2 2 0 1 0-2.83-2.83L11.99 9.2a2 2 0 0 0 0 2.83 1 1 0 1 1-1.4 1.4Zm2.8-2.8a4 4 0 0 1 0 5.66l-2.12 2.12a4 4 0 1 1-5.66-5.66l1.3-1.3a1 1 0 0 1 1.42 1.42l-1.3 1.3a2 2 0 1 0 2.83 2.83l2.12-2.12a2 2 0 0 0 0-2.83 1 1 0 1 1 1.4-1.4Z"
      />
    </svg>
  );
}
