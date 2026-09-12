import { useEffect, useState } from "react";

import { LinkInBioAmbient } from "@/components/link-in-bio/LinkInBioAmbient";
import { LinkInBioBento } from "@/components/link-in-bio/LinkInBioBento";
import { LinkInBioStreamCard } from "@/components/link-in-bio/LinkInBioStreamCard";
import { LinkInBioText } from "@/components/link-in-bio/LinkInBioText";
import { fontById, type PublicLinkInBio } from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

export function LinkInBioPage({
  data,
  preview = false,
}: {
  data: PublicLinkInBio;
  preview?: boolean;
}) {
  const { profile, theme, links, livePlatforms, stream, schedule } = data;
  const font = fontById(theme.fontFamily);
  const glass = theme.surfaceStyle === "glass";
  const alpha = Math.round((theme.glassIntensity / 100) * 42);
  const cardBg = glass
    ? `rgba(255,255,255,${(alpha / 255).toFixed(3)})`
    : "color-mix(in oklab, var(--bio-fg) 6%, var(--bio-bg))";
  const border = theme.hairlineBorders
    ? "1px solid color-mix(in oklab, var(--bio-fg) 16%, transparent)"
    : "1px solid transparent";
  return (
    <div
      className={cn("relative min-h-full overflow-hidden", preview ? "h-full min-h-[32rem]" : "min-h-screen")}
      style={{
        fontFamily: font.stack,
        background: theme.paletteBg,
        color: theme.paletteFg,
        ["--bio-bg" as string]: theme.paletteBg,
        ["--bio-fg" as string]: theme.paletteFg,
        ["--bio-accent" as string]: theme.paletteAccent,
        ["--bio-muted" as string]: theme.paletteMuted,
      }}
    >
      <link rel="stylesheet" href={font.href} />
      <LinkInBioAmbient theme={theme} />
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[min(92vw,80rem)] flex-col px-5 py-12 md:px-8 md:py-16 lg:px-10",
        )}
      >
        <Header profile={profile} compact={theme.layout === "grid"} bannerLayout={theme.layout === "banner"} border={border} glass={glass} accent={theme.paletteAccent} />
        <LinkInBioStreamCard stream={stream} glass={glass} border={border} />
        {theme.widgetBannerUrl ? (
          <img src={theme.widgetBannerUrl} alt="" className="mt-6 w-full rounded-2xl object-cover" style={{ border, maxHeight: 180 }} />
        ) : null}
        {theme.countdownEnabled ? <CountdownCard theme={theme} border={border} glass={glass} /> : null}
        {schedule ? (
          <a
            href={schedule.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              background: cardBg,
              border,
              color: "var(--bio-accent)",
            }}
          >
            <LinkInBioText as="span">{schedule.title}</LinkInBioText>
          </a>
        ) : null}

        {links.length === 0 ? (
          <p className="mt-8 text-center text-sm" style={{ color: theme.paletteMuted }}>
            No links yet.
          </p>
        ) : (
          <div className="mt-10">
            <LinkInBioBento links={links} theme={theme} livePlatforms={livePlatforms} />
          </div>
        )}
      </div>
    </div>
  );
}

function Header({
  profile,
  compact,
  bannerLayout,
  border,
  glass,
  accent,
}: {
  profile: PublicLinkInBio["profile"];
  compact?: boolean;
  bannerLayout: boolean;
  border: string;
  glass: boolean;
  accent: string;
}) {
  const initials = (profile.displayName || profile.slug || "?").slice(0, 2).toUpperCase();
  const showBanner = Boolean(profile.headerUrl || bannerLayout);
  return (
    <header className={cn("flex flex-col items-center overflow-visible text-center", compact && "mb-2")}>
      <div className={cn("relative w-full overflow-visible", showBanner ? "mb-14" : "mb-2")}>
        {showBanner ? (
          <div
            className={cn("w-full overflow-hidden rounded-3xl", bannerLayout ? "min-h-48 lg:min-h-56" : "min-h-36 lg:min-h-48")}
            style={{
              background: profile.headerUrl
                ? `center / cover no-repeat url(${profile.headerUrl})`
                : `linear-gradient(160deg, color-mix(in oklab, ${accent} 40%, var(--bio-bg)), var(--bio-bg))`,
              border,
              backdropFilter: glass ? "blur(10px)" : undefined,
            }}
          >
            <div className="h-36 w-full lg:h-48" />
          </div>
        ) : null}
        <span
          className={cn(
            "grid size-24 place-items-center overflow-hidden rounded-full",
            showBanner
              ? "absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2"
              : "relative mx-auto",
          )}
          style={{
            border: "3px solid color-mix(in oklab, var(--bio-bg) 82%, var(--bio-fg))",
            boxShadow: "0 0 0 1px color-mix(in oklab, var(--bio-fg) 16%, transparent)",
            background: "color-mix(in oklab, var(--bio-fg) 8%, var(--bio-bg))",
          }}
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="size-full object-cover object-center" />
          ) : (
            <span className="text-lg font-semibold">{initials}</span>
          )}
        </span>
      </div>
      <LinkInBioText as="h1" className="mx-auto mt-4 w-full min-w-0 max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
        {profile.displayName || profile.slug || "Your page"}
      </LinkInBioText>
      {profile.bio ? (
        <LinkInBioText className="mx-auto mt-2 w-full min-w-0 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "var(--bio-muted)" }}>
          {profile.bio}
        </LinkInBioText>
      ) : null}
    </header>
  );
}

function CountdownCard({
  theme,
  border,
  glass,
}: {
  theme: PublicLinkInBio["theme"];
  border: string;
  glass: boolean;
}) {
  const ends = theme.countdownEndsAt ? new Date(theme.countdownEndsAt).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!Number.isFinite(ends)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ends]);
  const remain = Number.isFinite(ends) ? Math.max(0, ends - now) : 0;
  const ended = Number.isFinite(ends) && remain <= 0;
  const total = Math.floor(remain / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return (
    <div
      className="mt-3 rounded-2xl px-4 py-3 text-center"
      style={{
        border,
        background: glass ? "rgba(255,255,255,0.06)" : "color-mix(in oklab, var(--bio-fg) 7%, var(--bio-bg))",
      }}
    >
      <LinkInBioText className="text-[0.7rem] uppercase tracking-wide" style={{ color: "var(--bio-muted)" }}>
        {theme.countdownLabel}
      </LinkInBioText>
      {!Number.isFinite(ends) ? (
        <p className="mt-1 text-sm">No end time set.</p>
      ) : ended ? (
        <p className="mt-1 text-sm font-semibold">The countdown has ended.</p>
      ) : (
        <p className="mt-1 font-semibold tabular-nums">
          {days > 0 ? `${days}d ` : ""}
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
