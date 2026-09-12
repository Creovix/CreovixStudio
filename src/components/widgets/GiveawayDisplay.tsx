import { type CSSProperties } from "react";
import { CheckCircle2, Expand, Minimize2, RotateCcw, Trophy } from "lucide-react";

import { PlatformIcon } from "@/components/widgets/PlatformIcon";

export type DrawPhase = "idle" | "shuffling" | "revealing" | "settled";
export type ClaimState = "pending" | "confirmed" | "expired";

const COPY = {
    shuffling: "Shuffling",
    revealing: "Revealing",
    winnerSelected: "Winner selected",
    liveEntries: "Live entries",
    expand: "Expand giveaway display",
    collapse: "Close expanded giveaway display",
    joinHint: (keyword: string) => `Viewers join by typing ${keyword} in chat.`,
    from: "From",
    claimHint: (keyword: string) => `Re-type (${keyword}) in chat to claim the prize`,
    confirmed: "Confirmed — the winner replied in chat",
    reroll: "Re-roll",
    lastWinner: "Last winner",
  } as const;

export const platformLabel = (platform: string) =>
  ({ KICK: "Kick", TWITCH: "Twitch", YOUTUBE: "YouTube", TIKTOK: "TikTok" })[
    platform.toUpperCase()
  ] ?? platform;

function namePosition(seed: string, index: number) {
  let hash = 2166136261;
  for (const char of `${seed}-${index}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const value = Math.abs(hash);
  return {
    left: 7 + (value % 82),
    top: 10 + (Math.floor(value / 97) % 76),
    driftX: 26 + (value % 72),
    driftY: 18 + (Math.floor(value / 53) % 58),
    duration: 7 + (value % 8),
    delay: -(value % 11),
  };
}

export function GiveawayDisplay({
  participants,
  winner,
  phase,
  claimState,
  claimLeft,
  keyword,
  lastWinner,
  expanded,
  transparent = false,
  onToggleExpand,
  onReroll,
}: {
  participants: Array<{ id: string; username: string; platform: string }>;
  winner: { username: string; platform: string } | null;
  phase: DrawPhase;
  claimState: ClaimState;
  claimLeft: number;
  keyword: string;
  lastWinner?: { username: string; platform: string } | null | undefined;
  expanded: boolean;
  /** OBS browser source: drop the frame/controls and render on transparency. */
  transparent?: boolean;
  onToggleExpand?: (() => void) | undefined;
  onReroll?: (() => void) | undefined;
}) {
  const c = COPY;
  const keywordLabel = keyword || "+1";

  const phaseLabel =
    phase === "shuffling"
      ? c.shuffling
      : phase === "revealing"
        ? c.revealing
        : winner
          ? c.winnerSelected
          : c.liveEntries;

  return (
    <section
      className={
        transparent
          ? "h-full w-full bg-transparent"
          : `flex h-full min-h-[280px] w-full flex-col ${expanded ? "bg-background" : ""}`
      }
    >
      {!transparent ? (
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`size-1.5 rounded-full ${
              phase === "shuffling" || phase === "revealing" ? "bg-kick animate-pulse" : "bg-primary"
            }`}
          />
          <p className="text-[0.68rem] uppercase tracking-wide text-muted-foreground">{phaseLabel}</p>
          {onToggleExpand ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="ms-auto text-muted-foreground hover:text-foreground"
              aria-label={expanded ? c.collapse : c.expand}
              title={expanded ? c.collapse : c.expand}
            >
              {expanded ? <Minimize2 className="size-4" aria-hidden /> : <Expand className="size-4" aria-hidden />}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={`giveaway-cloud relative isolate overflow-hidden ${
          transparent ? "h-full w-full" : "min-h-[280px] flex-1"
        }`}
      >
        {participants.length === 0 ? (
          transparent ? null : (
            <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm text-muted-foreground">
              {c.joinHint(keywordLabel)}
            </div>
          )
        ) : (
          <div
            className={`absolute inset-0 overflow-hidden ${phase === "shuffling" ? "is-shuffling" : ""} ${phase === "revealing" || phase === "settled" ? "is-revealing" : ""}`}
            aria-label={c.liveEntries}
          >
            {participants.map((participant, index) => {
              const position = namePosition(participant.id, index);
              const isWinner =
                Boolean(winner) &&
                participant.username.toLowerCase() === winner?.username.toLowerCase() &&
                participant.platform.toUpperCase() === winner?.platform.toUpperCase();
              const style = {
                left: `${position.left}%`,
                top: `${position.top}%`,
                "--cloud-x": `${index % 2 === 0 ? position.driftX : -position.driftX}px`,
                "--cloud-y": `${index % 3 === 0 ? -position.driftY : position.driftY}px`,
                "--cloud-x-back": `${index % 2 === 0 ? -position.driftX * 0.45 : position.driftX * 0.45}px`,
                "--cloud-y-back": `${index % 3 === 0 ? position.driftY * 0.55 : -position.driftY * 0.55}px`,
                "--cloud-duration": `${position.duration}s`,
                "--cloud-delay": `${position.delay}s`,
              } as CSSProperties;
              return (
                <div
                  key={participant.id}
                  className={`giveaway-cloud-name ${isWinner ? "is-winner" : "is-other"}`}
                  style={style}
                >
                  <PlatformIcon platform={participant.platform} size={14} />
                  <span dir="auto">{participant.username}</span>
                </div>
              );
            })}
          </div>
        )}

        {winner && (phase === "revealing" || phase === "settled") ? (
          <div className="giveaway-winner-reveal absolute inset-0 z-20 grid place-items-center px-6 text-center">
            <div className="flex max-w-full flex-col items-center">
              <PlatformIcon platform={winner.platform} size={28} />
              <p className="mt-3 max-w-full truncate text-4xl font-bold text-kick [text-shadow:0_0_24px_color-mix(in_oklab,var(--kick)_55%,transparent)] sm:text-5xl" dir="auto">
                {winner.username}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.from}: {platformLabel(winner.platform)}
              </p>

              {phase === "settled" && claimState === "pending" ? (
                <div className="mt-5">
                  <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                    {Math.floor(claimLeft / 60)}:{String(claimLeft % 60).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.claimHint(keywordLabel)}</p>
                </div>
              ) : phase === "settled" && claimState === "confirmed" ? (
                <p className="mt-5 flex items-center gap-2 text-sm text-kick">
                  <CheckCircle2 className="size-4" aria-hidden />
                  {c.confirmed}
                </p>
              ) : phase === "settled" && claimState === "expired" && onReroll && !transparent ? (
                <button
                  type="button"
                  onClick={onReroll}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[0.82rem] text-kick hover:bg-white/5"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {c.reroll}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {lastWinner && !winner && !transparent ? (
          <p className="absolute bottom-3 start-3 z-30 flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="size-3.5" aria-hidden />
            {c.lastWinner}: <span dir="auto">{lastWinner.username}</span> ({lastWinner.platform})
          </p>
        ) : null}
      </div>
    </section>
  );
}
