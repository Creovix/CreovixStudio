import { type CSSProperties } from "react";
import { CheckCircle2, Expand, Minimize2, RotateCcw, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/widgets/PlatformIcon";

export type DrawPhase = "idle" | "shuffling" | "revealing" | "settled";
export type ClaimState = "pending" | "confirmed" | "expired";

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
  return (
    <section
      className={`giveaway-cloud relative isolate w-full overflow-hidden ${
        transparent
          ? "h-full bg-transparent"
          : "border border-[oklch(1_0_0/0.1)] bg-[oklch(0.19_0.02_265/0.55)] backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.45)] rounded-2xl"
      } ${expanded && !transparent ? "h-full" : transparent ? "" : "min-h-[380px]"}`}
    >
      {!transparent ? (
        <div className="absolute start-4 top-4 z-30 flex items-center gap-2 rounded-full border border-[oklch(1_0_0/0.08)] bg-background/55 px-3 py-1.5 text-[0.68rem] uppercase text-muted-foreground backdrop-blur-md">
          <span
            className={`size-1.5 rounded-full ${phase === "shuffling" || phase === "revealing" ? "bg-kick animate-pulse" : "bg-primary"}`}
          />
          {phase === "shuffling"
            ? "Shuffling"
            : phase === "revealing"
              ? "Revealing"
              : winner
                ? "Winner selected"
                : "Live entries"}
        </div>
      ) : null}

      {!transparent && onToggleExpand ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggleExpand}
          className="absolute end-4 top-4 z-40 border-[oklch(1_0_0/0.12)] bg-background/60 backdrop-blur-md hover:bg-muted"
          aria-label={expanded ? "Close expanded giveaway display" : "Expand giveaway display"}
          title={expanded ? "Close expanded view" : "Pop-up / Expand"}
        >
          {expanded ? <Minimize2 aria-hidden /> : <Expand aria-hidden />}
        </Button>
      ) : null}

      {participants.length === 0 ? (
        transparent ? null : (
          <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm text-muted-foreground">
            Viewers join by typing <span className="mx-1 text-foreground">{keyword || "+1"}</span> in
            chat.
          </div>
        )
      ) : (
        <div
          className={`absolute inset-0 overflow-hidden ${phase === "shuffling" ? "is-shuffling" : ""} ${phase === "revealing" || phase === "settled" ? "is-revealing" : ""}`}
          aria-label="Live giveaway participants"
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
                <span>{participant.username}</span>
              </div>
            );
          })}
        </div>
      )}

      {winner && (phase === "revealing" || phase === "settled") ? (
        <div className="giveaway-winner-reveal absolute inset-0 z-20 grid place-items-center px-6 text-center">
          <div className="flex max-w-full flex-col items-center">
            <div className="mb-3 grid size-12 place-items-center rounded-full border border-kick/35 bg-kick/10 shadow-[0_0_28px_color-mix(in_oklab,var(--kick)_35%,transparent)]">
              <PlatformIcon platform={winner.platform} size={24} />
            </div>
            <p className="max-w-full truncate text-4xl font-bold text-kick [text-shadow:0_0_24px_color-mix(in_oklab,var(--kick)_55%,transparent)] sm:text-5xl">
              {winner.username}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              القادمة من: {platformLabel(winner.platform)}
            </p>

            {phase === "settled" && claimState === "pending" ? (
              <div className="mt-5">
                <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                  {Math.floor(claimLeft / 60)}:{String(claimLeft % 60).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  يعيد كتابة ({keyword || "+1"}) في الشات لتأكيد الجائزة
                </p>
              </div>
            ) : phase === "settled" && claimState === "confirmed" ? (
              <p className="mt-5 flex items-center gap-2 text-sm text-kick">
                <CheckCircle2 className="size-4" aria-hidden />
                تم التأكيد — الفائز رد في الشات
              </p>
            ) : phase === "settled" && claimState === "expired" && onReroll && !transparent ? (
              <Button
                type="button"
                variant="outline"
                onClick={onReroll}
                className="mt-5 border-kick/30 bg-kick/10 text-kick hover:bg-kick/15"
              >
                <RotateCcw aria-hidden />
                إعادة السحب / Re-roll
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {lastWinner && !winner && !transparent ? (
        <p className="absolute bottom-4 start-4 z-30 flex items-center gap-2 text-xs text-muted-foreground">
          <Trophy className="size-3.5" aria-hidden />
          Last winner: {lastWinner.username} ({lastWinner.platform})
        </p>
      ) : null}
    </section>
  );
}
