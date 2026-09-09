import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Radio, Search, Star, Swords, Trash2, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  lookupChannel,
  type ChannelSnapshot,
  type CounterPlatform,
} from "@/lib/liveCounter.functions";

export const Route = createFileRoute("/_authenticated/live-counter")({
  head: () => ({
    meta: [
      { title: "Live Counter — Creovix Studio" },
      {
        name: "description",
        content:
          "Track live follower counts for any Kick or Twitch channel, save your favourite creators and compare two channels head to head.",
      },
      { property: "og:title", content: "Live Counter — Creovix Studio" },
      {
        property: "og:description",
        content: "Real-time follower counters with saved channels and VS comparison mode.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveCounterPage,
});

type Target = { platform: CounterPlatform; username: string };
type Saved = { platform: string; username: string; displayName: string; avatarUrl: string | null };

const PLATFORMS: { id: CounterPlatform; label: string }[] = [
  { id: "ALL", label: "All Platforms" },
  { id: "KICK", label: "Kick" },
  { id: "TWITCH", label: "Twitch" },
  { id: "X", label: "X (Twitter)" },
  { id: "TIKTOK", label: "TikTok" },
  { id: "YOUTUBE", label: "YouTube" },
];

const POLL_MS = 5_000;
const FAVORITES_KEY = "creovix.live-counter.favorites";
const DAILY_KEY = "creovix.live-counter.daily";
const SNAPSHOT_KEY = "creovix.live-counter.snapshots";

const glass =
  "rounded-2xl border border-[oklch(1_0_0/0.08)] bg-[oklch(0.18_0.02_275/0.55)] backdrop-blur-xl";
const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Counts up from the previous value (0 on first load) to the new total. */
function useCountUp(value: number | null): number | null {
  const [display, setDisplay] = useState<number | null>(value);
  const from = useRef(0);

  useEffect(() => {
    if (value === null) {
      setDisplay(null);
      return;
    }
    const start = from.current;
    if (start === value) {
      setDisplay(value);
      return;
    }
    const began = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return display;
}

/** Rolling digits: each character animates independently when it changes. */
function RollingCounter({ value, size = "text-7xl" }: { value: number | null; size?: string }) {
  const animated = useCountUp(value);
  const text = animated === null ? "—" : animated.toLocaleString("en-US");
  const previous = useRef(text);
  const changed = previous.current !== text;
  useEffect(() => {
    previous.current = text;
  }, [text]);

  return (
    <div className={`flex font-mono font-bold tabular-nums ${size}`} aria-live="polite">
      {text.split("").map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={`inline-block ${changed ? "animate-fade-in" : ""}`}
          style={{ minWidth: char === "," ? "0.35em" : "0.62em", textAlign: "center" }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}


/**
 * One tracked channel. The last good reading is remembered in state and in
 * localStorage, so a failed or empty background poll never blanks the counter.
 */
function useChannel(target: Target | null) {
  const run = useServerFn(lookupChannel);
  const query = useQuery({
    queryKey: ["live-counter", target?.platform, target?.username?.toLowerCase()],
    enabled: Boolean(target?.username),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    retry: 1,
    placeholderData: (previous: ChannelSnapshot | undefined) => previous,
    queryFn: async () =>
      (await run({ data: { platform: target!.platform, username: target!.username } })) as
        | ChannelSnapshot
        | undefined,
  });

  const key = target ? `${target.platform}:${target.username.trim().toLowerCase()}` : null;
  const [sticky, setSticky] = useState<ChannelSnapshot | undefined>(undefined);

  // Restore the previous reading for this channel the moment it is selected.
  useEffect(() => {
    if (!key) {
      setSticky(undefined);
      return;
    }
    const store = readJson<Record<string, ChannelSnapshot>>(SNAPSHOT_KEY, {});
    setSticky(store[key]);
  }, [key]);

  // Remember every successful reading (a poll that returns no total is ignored).
  useEffect(() => {
    const fresh = query.data;
    if (!key || !fresh || fresh.followers === null) return;
    setSticky(fresh);
    const store = readJson<Record<string, ChannelSnapshot>>(SNAPSHOT_KEY, {});
    store[key] = fresh;
    try {
      window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(store));
    } catch {
      /* storage full or unavailable — the in-memory value still holds */
    }
  }, [query.data, key]);

  const data =
    query.data && query.data.followers !== null ? query.data : (sticky ?? query.data);

  return {
    data,
    isFetching: query.isFetching,
    // Only surface an error when there is nothing at all to show.
    error: data ? null : query.error,
  };
}


/** Keeps the first count seen today so growth can be reported honestly. */
function useDailyGrowth(snapshot: ChannelSnapshot | undefined): number | null {
  const [growth, setGrowth] = useState<number | null>(null);

  useEffect(() => {
    if (!snapshot || snapshot.followers === null) return;
    const key = `${snapshot.platform}:${snapshot.username.toLowerCase()}`;
    const today = new Date().toISOString().slice(0, 10);
    const store = readJson<Record<string, { day: string; start: number }>>(DAILY_KEY, {});
    const entry = store[key];
    if (!entry || entry.day !== today) {
      store[key] = { day: today, start: snapshot.followers };
      window.localStorage.setItem(DAILY_KEY, JSON.stringify(store));
      setGrowth(0);
      return;
    }
    setGrowth(snapshot.followers - entry.start);
  }, [snapshot]);

  return growth;
}

function SearchBar({
  value,
  platform,
  onValue,
  onPlatform,
  onSubmit,
  label,
}: {
  value: string;
  platform: CounterPlatform;
  onValue: (next: string) => void;
  onPlatform: (next: CounterPlatform) => void;
  onSubmit: () => void;
  label: string;
}) {
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="relative min-w-[180px] flex-1">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
          aria-hidden
        />
        <input
          value={value}
          onChange={(event) => onValue(event.target.value)}
          placeholder={label}
          className={`${field} ps-9`}
          aria-label={label}
        />
      </div>
      <select
        value={platform}
        onChange={(event) => onPlatform(event.target.value as CounterPlatform)}
        className={`${field} w-auto`}
        aria-label="Platform"
      >
        {PLATFORMS.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Track Live
      </button>
    </form>
  );
}

function ChannelCard({
  snapshot,
  loading,
  error,
  compact = false,
  action,
}: {
  snapshot: ChannelSnapshot | undefined;
  loading: boolean;
  error: string | null;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  const growth = useDailyGrowth(snapshot);

  if (error) {
    const notFound = error.toLowerCase().includes("not found");
    return (
      <div className={`${glass} flex flex-col items-center gap-3 p-8 text-center`}>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            notFound
              ? "bg-destructive/20 text-destructive"
              : "bg-amber-400/15 text-amber-300"
          }`}
        >
          {notFound ? "Channel Not Found" : "Lookup failed"}
        </span>
        <p className="max-w-md text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className={`${glass} p-10 text-center text-sm text-muted-foreground`}>
        {loading ? "Loading channel…" : "Search a channel to start tracking."}
      </div>
    );
  }

  return (
    <div className={`${glass} flex flex-col items-center gap-4 p-8 text-center`}>
      <div className="flex items-center gap-4">
        {snapshot.avatarUrl ? (
          <img
            src={snapshot.avatarUrl}
            alt={`${snapshot.displayName} avatar`}
            className="size-16 rounded-full border border-[oklch(1_0_0/0.12)] object-cover"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-muted text-lg font-bold">
            {snapshot.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="text-start">
          <p className={`font-bold ${compact ? "text-lg" : "text-2xl"}`}>{snapshot.displayName}</p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[oklch(1_0_0/0.1)] px-2.5 py-1 text-xs">
            <PlatformIcon platform={snapshot.platform} size={14} />
            {snapshot.platform}
          </span>
        </div>
        {action}
      </div>

      <RollingCounter value={snapshot.followers} size={compact ? "text-5xl" : "text-7xl"} />
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <Users className="size-3.5" aria-hidden /> Followers
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] px-3 py-1 font-semibold text-primary">
          <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
          LIVE POLLING ACTIVE
        </span>
        {snapshot.isLive ? (
          <span className="rounded-full bg-destructive/20 px-3 py-1 font-semibold text-destructive">
            ● ON AIR{snapshot.viewers !== null ? ` · ${snapshot.viewers.toLocaleString()} viewers` : ""}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">Offline</span>
        )}
        {growth !== null ? (
          <span className="rounded-full border border-[oklch(1_0_0/0.1)] px-3 py-1">
            {growth >= 0 ? "+" : ""}
            {growth.toLocaleString()} Followers Today
          </span>
        ) : null}
      </div>

      {snapshot.note ? (
        <p className="max-w-md text-xs text-muted-foreground">{snapshot.note}</p>
      ) : null}
    </div>
  );
}

function errorText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Could not load this channel";
}

function LiveCounterPage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);

  const [vsMode, setVsMode] = useState(false);
  const [saved, setSaved] = useState<Saved[]>([]);

  useEffect(() => {
    setSaved(readJson<Saved[]>(FAVORITES_KEY, []));
  }, []);

  const persist = (next: Saved[]) => {
    setSaved(next);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  // Single view
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState<CounterPlatform>("ALL");
  const [target, setTarget] = useState<Target | null>(null);
  const main = useChannel(target);

  // VS mode
  const [inputA, setInputA] = useState("");
  const [platformA, setPlatformA] = useState<CounterPlatform>("ALL");
  const [targetA, setTargetA] = useState<Target | null>(null);
  const [inputB, setInputB] = useState("");
  const [platformB, setPlatformB] = useState<CounterPlatform>("ALL");
  const [targetB, setTargetB] = useState<Target | null>(null);
  const sideA = useChannel(vsMode ? targetA : null);
  const sideB = useChannel(vsMode ? targetB : null);

  const isFavorite = useMemo(
    () =>
      Boolean(
        main.data &&
          saved.some(
            (entry) =>
              entry.platform === main.data!.platform &&
              entry.username.toLowerCase() === main.data!.username.toLowerCase(),
          ),
      ),
    [saved, main.data],
  );

  const toggleFavorite = () => {
    const snapshot = main.data;
    if (!snapshot) return;
    const key = `${snapshot.platform}:${snapshot.username.toLowerCase()}`;
    const without = saved.filter(
      (entry) => `${entry.platform}:${entry.username.toLowerCase()}` !== key,
    );
    persist(
      isFavorite
        ? without
        : [
            ...without,
            {
              platform: snapshot.platform,
              username: snapshot.username,
              displayName: snapshot.displayName,
              avatarUrl: snapshot.avatarUrl,
            },
          ],
    );
  };

  const gap =
    sideA.data?.followers != null && sideB.data?.followers != null
      ? sideA.data.followers - sideB.data.followers
      : null;

  const toggleClass = (active: boolean) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <AppShell
      user={user}
      profile={workspace?.profile}
      title="Live Counter"
      subtitle="Track live follower counts, save your favourite creators and run head-to-head comparisons."
    >
      <div className="space-y-6">
        <div className={`${glass} flex flex-wrap items-center gap-2 p-2`}>
          <button type="button" className={toggleClass(!vsMode)} onClick={() => setVsMode(false)}>
            <Radio className="size-4" aria-hidden /> Single View
          </button>
          <button type="button" className={toggleClass(vsMode)} onClick={() => setVsMode(true)}>
            <Swords className="size-4" aria-hidden /> VS Comparison Mode
          </button>
        </div>

        {!vsMode ? (
          <>
            <div className={`${glass} space-y-4 p-4`}>
              <SearchBar
                value={input}
                platform={platform}
                onValue={setInput}
                onPlatform={setPlatform}
                onSubmit={() => setTarget({ platform, username: input })}
                label="Channel username"
              />

              {saved.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {saved.map((entry) => (
                    <div
                      key={`${entry.platform}-${entry.username}`}
                      className="group flex shrink-0 items-center gap-2 rounded-xl border border-[oklch(1_0_0/0.08)] bg-background/60 px-3 py-2"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-2 text-start"
                        onClick={() => {
                          setInput(entry.username);
                          setPlatform(entry.platform as CounterPlatform);
                          setTarget({
                            platform: entry.platform as CounterPlatform,
                            username: entry.username,
                          });
                        }}
                      >
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-bold">
                            {entry.displayName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className="text-sm font-medium">{entry.displayName}</span>
                        <PlatformIcon platform={entry.platform} size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${entry.displayName}`}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() =>
                          persist(
                            saved.filter(
                              (item) =>
                                `${item.platform}:${item.username.toLowerCase()}` !==
                                `${entry.platform}:${entry.username.toLowerCase()}`,
                            ),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <ChannelCard
              snapshot={main.data}
              loading={main.isFetching}
              error={errorText(main.error)}
              action={
                main.data ? (
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`ms-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isFavorite
                        ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star
                      className="size-3.5"
                      fill={isFavorite ? "currentColor" : "none"}
                      aria-hidden
                    />
                    {isFavorite ? "Favorited" : "Favorite"}
                  </button>
                ) : null
              }
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={`${glass} space-y-4 p-4`}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Creator A
                </p>
                <SearchBar
                  value={inputA}
                  platform={platformA}
                  onValue={setInputA}
                  onPlatform={setPlatformA}
                  onSubmit={() => setTargetA({ platform: platformA, username: inputA })}
                  label="Creator A username"
                />
                <ChannelCard
                  snapshot={sideA.data}
                  loading={sideA.isFetching}
                  error={errorText(sideA.error)}
                  compact
                />
              </div>
              <div className={`${glass} space-y-4 p-4`}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Creator B
                </p>
                <SearchBar
                  value={inputB}
                  platform={platformB}
                  onValue={setInputB}
                  onPlatform={setPlatformB}
                  onSubmit={() => setTargetB({ platform: platformB, username: inputB })}
                  label="Creator B username"
                />
                <ChannelCard
                  snapshot={sideB.data}
                  loading={sideB.isFetching}
                  error={errorText(sideB.error)}
                  compact
                />
              </div>
            </div>

            <div className={`${glass} p-6 text-center`}>
              {gap === null ? (
                <p className="text-sm text-muted-foreground">
                  Track two channels with public follower counts to see the live gap.
                </p>
              ) : gap === 0 ? (
                <p className="text-lg font-semibold">Dead heat — both channels are level.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Live difference</p>
                  <div className="flex justify-center">
                    <RollingCounter value={Math.abs(gap)} size="text-5xl" />
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {(gap > 0 ? sideA.data?.displayName : sideB.data?.displayName) ?? "Channel"}{" "}
                    leads by {Math.abs(gap).toLocaleString()} Followers
                  </p>
                  {(() => {
                    const a = sideA.data?.followers ?? 0;
                    const b = sideB.data?.followers ?? 0;
                    const total = a + b;
                    const share = total > 0 ? (a / total) * 100 : 50;
                    return (
                      <div className="mx-auto mt-4 max-w-2xl">
                        <div className="flex h-3 overflow-hidden rounded-full bg-[oklch(1_0_0/0.08)]">
                          <div
                            className="h-full bg-primary transition-[width] duration-700"
                            style={{ width: `${share}%` }}
                          />
                          <div className="h-full flex-1 bg-amber-400/70" />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>
                            {sideA.data?.displayName} · {a.toLocaleString()}
                          </span>
                          <span>
                            {sideB.data?.displayName} · {b.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
