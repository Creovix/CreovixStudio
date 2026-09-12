/**
 * Miniature, purely presentational 3D-glass previews used inside the Home
 * widget hub cards. Each preview hints at what the real widget renders.
 */

function Bar({ percent, label, value }: { percent: number; label: string; value: string }) {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-3.5">
      <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{percent}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[oklch(1_0_0/0.06)] shadow-[inset_0_1px_2px_oklch(0_0_0/0.5)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_12px_-2px_var(--primary)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[0.66rem] text-muted-foreground">{value}</p>
    </div>
  );
}

export function TimerPreview() {
  return (
    <div className="relative grid h-full place-items-center">
      <div
        className="absolute size-[104px] rounded-full border border-primary/30 shadow-[0_18px_30px_-18px_var(--primary)] [transform:rotateX(58deg)]"
        aria-hidden
      />
      <div
        className="absolute size-[70px] rounded-full border border-accent/30 [transform:rotateX(58deg)_rotateZ(20deg)]"
        aria-hidden
      />
      <p className="relative rounded-xl border border-[oklch(1_0_0/0.08)] bg-[oklch(1_0_0/0.04)] px-3 py-1.5 text-lg font-semibold tabular-nums tracking-tight">
        00:25:36
      </p>
    </div>
  );
}

export function DonationGoalPreview() {
  return <Bar percent={72} label="Donation goal" value="$720 / $1,000" />;
}

export function FollowerGoalPreview() {
  return <Bar percent={85} label="Followers" value="850 / 1,000 followers" />;
}

export function SubscriberGoalPreview() {
  return <Bar percent={84} label="Subscribers" value="42 / 50 subs" />;
}

export function CustomGoalPreview() {
  return <Bar percent={46} label="Custom goal" value="46 / 100 points" />;
}

/** Preview driven by the selected goal-type preset (used in the customize modal). */
export function GoalTypePreview({
  label,
  current,
  target,
  unit,
  accent,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  accent?: string;
}) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div
      className="h-full"
      style={accent ? ({ "--primary": accent } as Record<string, string>) : undefined}
    >
      <Bar
        percent={percent}
        label={label}
        value={`${current.toLocaleString()} / ${target.toLocaleString()} ${unit}`}
      />
    </div>
  );
}

export function GoalPreview() {
  return <Bar percent={72} label="Sub goal" value="720 / 1000 subs" />;
}

export function AlertPreview() {
  return (
    <div className="grid h-full place-items-center [perspective:600px]">
      <div className="relative w-full max-w-[195px]">
        <div
          className="absolute inset-x-3 -bottom-2 h-8 rounded-xl border border-[oklch(1_0_0/0.06)] bg-[oklch(1_0_0/0.03)]"
          aria-hidden
        />
        <div className="relative rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.05)] px-3 py-2.5 shadow-[0_18px_30px_oklch(0_0_0/0.6)] [transform:rotateX(10deg)]">
          <p className="text-[0.6rem] uppercase tracking-[0.24em] text-primary">New sub · Tier 1</p>
          <p className="mt-1 text-[0.8rem] font-medium">nova_stream just subscribed</p>
        </div>
      </div>
    </div>
  );
}

export function ChatPreview() {
  const lines = [
    ["kira", "let's goooo"],
    ["mox", "that clutch though"],
    ["ari", "gg 🎉"],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-3">
      {lines.map(([who, msg], index) => (
        <div
          key={who}
          className="rounded-xl border border-[oklch(1_0_0/0.07)] bg-[oklch(1_0_0/0.035)] px-2.5 py-1.5 text-[0.68rem] shadow-[0_8px_18px_-12px_oklch(0_0_0/0.9)]"
          style={{ marginInlineStart: `${index * 10}px` }}
        >
          <span className="font-semibold text-primary">{who}</span>{" "}
          <span className="text-muted-foreground">{msg}</span>
        </div>
      ))}
    </div>
  );
}

export function SpotlightPreview() {
  return (
    <div className="grid h-full place-items-center px-3">
      <div className="w-full rounded-xl border border-primary/30 bg-[oklch(1_0_0/0.05)] px-3 py-2.5 shadow-[0_14px_30px_-16px_oklch(0_0_0/0.95)]">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <span className="text-[0.68rem] font-bold text-primary">kira</span>
          <span className="ms-auto text-[0.5rem] font-bold uppercase tracking-[0.24em] text-primary/70">
            Spotlight
          </span>
        </div>
        <p className="mt-1 text-[0.72rem] font-medium text-muted-foreground">
          Pinned message on stream ✨
        </p>
      </div>
    </div>
  );
}

export function WheelPreview() {
  return (
    <div className="grid h-full place-items-center">
      <div
        className="size-[86px] rounded-full border border-[oklch(1_0_0/0.12)] shadow-[0_22px_34px_-20px_var(--primary)] [transform:rotateX(52deg)]"
        style={{
          background:
            "conic-gradient(var(--primary) 0 25%, var(--cyan) 0 50%, var(--primary-glow) 0 75%, var(--secondary) 0 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

const HUB_EMOTES = [
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0", alt: "Kappa" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/425618/default/dark/1.0", alt: "LUL" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/1.0", alt: "PogChamp" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/354/default/dark/1.0", alt: "4Head" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/58127/default/dark/1.0", alt: "CoolCat" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/81997/default/dark/1.0", alt: "KappaPride" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/114836/default/dark/1.0", alt: "Jebaited" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/41/default/dark/1.0", alt: "Kreygasm" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/58765/default/dark/1.0", alt: "NotLikeThis" },
  { src: "https://static-cdn.jtvnw.net/emoticons/v2/555555584/default/dark/1.0", alt: "<3" },
] as const;

const HUB_EMOTE_FALLS = [
  { left: "6%", delay: "-0.4s", duration: "4.4s", size: 18, spin: "150deg" },
  { left: "18%", delay: "-1.9s", duration: "5.2s", size: 16, spin: "-190deg" },
  { left: "31%", delay: "-3.3s", duration: "4.8s", size: 20, spin: "210deg" },
  { left: "44%", delay: "-0.8s", duration: "5.6s", size: 17, spin: "-140deg" },
  { left: "57%", delay: "-2.6s", duration: "4.2s", size: 15, spin: "175deg" },
  { left: "69%", delay: "-4.1s", duration: "5.4s", size: 19, spin: "-205deg" },
  { left: "81%", delay: "-1.4s", duration: "4.9s", size: 16, spin: "185deg" },
  { left: "91%", delay: "-3.0s", duration: "5.1s", size: 18, spin: "-165deg" },
] as const;

export function EmotePreview() {
  return (
    <div className="hub-emote-rain relative isolate h-full w-full overflow-hidden" aria-hidden>
      {HUB_EMOTE_FALLS.map((fall, index) => {
        const emote = HUB_EMOTES[index % HUB_EMOTES.length]!;
        return (
          <img
            key={`${emote.alt}-${index}`}
            src={emote.src}
            alt=""
            width={fall.size}
            height={fall.size}
            className="hub-emote-drop pointer-events-none absolute start-0 top-0 select-none"
            style={{
              insetInlineStart: fall.left,
              width: fall.size,
              height: fall.size,
              animationDelay: fall.delay,
              animationDuration: fall.duration,
              ["--emote-spin" as string]: fall.spin,
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}

export function ActivityPreview() {
  const rows = [
    ["Follow", "kira"],
    ["Tip", "$5.00"],
    ["Sub", "Tier 1"],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-3 text-[0.68rem]">
      {rows.map(([kind, value]) => (
        <div
          key={kind}
          className="flex items-center justify-between rounded-xl border border-[oklch(1_0_0/0.06)] bg-[oklch(1_0_0/0.025)] px-2.5 py-1.5"
        >
          <span className="text-muted-foreground">{kind}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function CountdownPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-2 [perspective:700px]">
      {["02", "14", "09"].map((unit) => (
        <div
          key={unit}
          className="rounded-xl border border-[oklch(1_0_0/0.09)] bg-[oklch(1_0_0/0.04)] px-3 py-2.5 text-lg font-semibold tabular-nums shadow-[0_14px_24px_-16px_oklch(0_0_0/0.9)] [transform:rotateX(8deg)]"
        >
          {unit}
        </div>
      ))}
    </div>
  );
}

export function SocialPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-2">
      {["tw", "yt", "ig", "x"].map((tag) => (
        <span
          key={tag}
          className="grid size-9 place-items-center rounded-xl border border-[oklch(1_0_0/0.09)] bg-[oklch(1_0_0/0.04)] text-[0.6rem] uppercase text-muted-foreground shadow-[0_12px_22px_-16px_oklch(0_0_0/0.9)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function TtsPreview() {
  return (
    <div className="flex h-full items-end justify-center gap-1 pb-8">
      {[12, 26, 38, 20, 32, 14, 28].map((height, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-t from-primary/40 to-accent"
          style={{ height }}
        />
      ))}
    </div>
  );
}

export function TextPreview() {
  return (
    <div className="grid h-full place-items-center">
      <p className="text-sm font-semibold tracking-tight">
        Now playing <span className="text-primary">· lo-fi</span>
      </p>
    </div>
  );
}

export function MediaPreview() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex w-full max-w-[170px] gap-1.5">
        <div className="h-16 flex-1 rounded-xl bg-[oklch(1_0_0/0.06)]" />
        <div className="h-16 w-10 rounded-xl bg-primary/25" />
        <div className="h-16 w-6 rounded-xl bg-accent/25" />
      </div>
    </div>
  );
}

export function PollPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-3.5">
      {[64, 26, 10].map((value) => (
        <div
          key={value}
          className="h-2 w-full overflow-hidden rounded-full bg-[oklch(1_0_0/0.06)]"
        >
          <div className="h-full rounded-full bg-primary/70" style={{ width: `${value}%` }} />
        </div>
      ))}
    </div>
  );
}

export function QueuePreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-3 text-[0.68rem]">
      {["1. kira", "2. mox", "3. ari"].map((row) => (
        <p
          key={row}
          className="rounded-xl border border-[oklch(1_0_0/0.05)] bg-[oklch(1_0_0/0.03)] px-2.5 py-1.5"
        >
          {row}
        </p>
      ))}
    </div>
  );
}

export function TappersPreview() {
  const rows = [
    { rank: 1, name: "hala_live", taps: "12.8K", color: "#FFD34D" },
    { rank: 2, name: "mvp_gamer", taps: "9.3K", color: "#CBD5E1" },
    { rank: 3, name: "noorx", taps: "4.1K", color: "#E29A5A" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-3.5">
      {rows.map((row) => (
        <div
          key={row.rank}
          className="flex items-center gap-2 rounded-xl border border-[#FE2C55]/25 bg-[oklch(1_0_0/0.04)] px-2 py-1"
        >
          <span className="text-[0.68rem] font-bold" style={{ color: row.color }}>
            #{row.rank}
          </span>
          <span className="size-4 rounded-full bg-gradient-to-br from-[#00F2FE]/50 to-[#FE2C55]/60" />
          <span className="min-w-0 flex-1 truncate text-[0.66rem]">{row.name}</span>
          <span className="text-[0.66rem] font-semibold tabular-nums text-[#FE2C55]">
            {row.taps}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TapGoalPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.66rem] font-bold uppercase tracking-wide">Goal: 50K taps</span>
        <span className="text-[0.66rem] font-black text-[#FE2C55]">75%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[oklch(1_0_0/0.12)]">
        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#00F2FE] to-[#FE2C55]" />
      </div>
      <span className="text-[0.6rem] tabular-nums text-muted-foreground">37,500 / 50,000 taps</span>
    </div>
  );
}

export function MediaRequestPreview() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 p-3">
      <div className="flex items-center gap-2 rounded-xl border border-[#53FC18]/35 bg-[#53FC18]/10 px-2 py-1.5">
        <span className="grid size-5 place-items-center rounded-xl bg-[#53FC18]/20 text-[0.55rem] font-bold text-[#53FC18]">
          ▶
        </span>
        <span className="truncate text-[0.62rem] font-medium">Now playing · YouTube · Spotify</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 px-2 py-1">
        <span className="text-[0.55rem] text-muted-foreground">2.</span>
        <span className="h-1.5 flex-1 rounded-full bg-white/15" />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 px-2 py-1">
        <span className="text-[0.55rem] text-muted-foreground">3.</span>
        <span className="h-1.5 w-2/3 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
