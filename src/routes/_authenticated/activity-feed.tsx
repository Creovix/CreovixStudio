import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  Check,
  ChevronDown,
  DollarSign,
  Filter,
  Gem,
  Globe,
  Layers,
  Pause,
  Star,
  Users,
} from "lucide-react";


import { AppShell } from "@/components/layout/AppShell";
import {
  MetricAnalyticsModal,
  type MetricKey,
} from "@/components/activity/MetricAnalyticsModal";
import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/_authenticated/activity-feed")({
  head: () => ({
    meta: [
      { title: "Activity Feed — Creovix Studio" },
      {
        name: "description",
        content:
          "Historical activity log of follows, subscriptions, gift subs, bits, raids and tips across your connected streaming platforms.",
      },
      { property: "og:title", content: "Activity Feed — Creovix Studio" },
      {
        property: "og:description",
        content: "Browse and filter your full stream event history in one clean feed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityFeedPage,
});

type FeedEvent = {
  id: string;
  platform: string;
  event_type: string;
  actor_name: string | null;
  amount: number | null;
  currency: string | null;
  quantity: number;
  seconds_added: number;
  message: string | null;
  created_at: string;
};


/** Smoothly eases a number toward its new value whenever the stat updates. */
function useCounter(value: number) {
  const [shown, setShown] = useState(value);
  const ref = useRef(value);

  useEffect(() => {
    const from = ref.current;
    if (from === value) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      ref.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
      else ref.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}

function StatCard({
  icon,
  label,
  value,
  accent,
  money = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  money?: boolean;
  onClick?: () => void;
}) {
  const shown = useCounter(value);
  const text = money
    ? `$${shown.toFixed(2)}`
    : Math.round(shown).toLocaleString("en-US");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border p-4 text-start backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.035)",
        borderColor: "rgba(255,255,255,0.09)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `color-mix(in oklab, ${accent} 55%, transparent)`;
        e.currentTarget.style.boxShadow = `0 18px 44px rgba(0,0,0,0.45), 0 0 26px color-mix(in oklab, ${accent} 30%, transparent)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.boxShadow = "0 14px 34px rgba(0,0,0,0.35)";
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex size-8 items-center justify-center rounded-xl"
          style={{
            color: accent,
            background: `color-mix(in oklab, ${accent} 16%, transparent)`,
            boxShadow: `0 0 18px color-mix(in oklab, ${accent} 28%, transparent)`,
          }}
        >
          {icon}
        </span>
        <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{text}</p>
    </button>
  );
}

const METRIC_META: Record<
  MetricKey,
  { title: string; accent: string; money?: boolean }
> = {
  followers: { title: "New Followers", accent: "#9F77F7" },
  subs: { title: "Total Subs", accent: "#53FC18" },
  tips: { title: "Tips / Revenue", accent: "#80F5D2", money: true },
  bits: { title: "Bits / Gifts", accent: "#4FC3F7" },
};

const PLATFORM_COLOR: Record<string, string> = {
  TWITCH: "#9F77F7",
  KICK: "#53FC18",
  TIKTOK: "#2DCCD3",
  YOUTUBE: "#FF4444",
  X: "#E7E9EA",
  STREAMLABS: "#80F5D2",
  STREAMELEMENTS: "#4FC3F7",
  MANUAL: "#A1A1AA",
};

const EVENT_LABEL: Record<string, string> = {
  FOLLOW: "New Follow",
  SUBSCRIPTION: "New Subscription",
  GIFT_SUB: "Gifted Sub",
  BITS: "Bits / Cheer",
  DONATION: "New Donation",
  RAID: "Raid / Host",
};

/**
 * Strict source routing — mirrors the server-side ingest allowlist so older
 * relayed rows (a Streamlabs copy of a Twitch follow) never reach the feed.
 */
const ALLOWED_BY_PLATFORM: Record<string, string[]> = {
  TWITCH: ["FOLLOW", "SUBSCRIPTION", "GIFT_SUB", "BITS", "RAID"],
  KICK: ["FOLLOW", "SUBSCRIPTION", "GIFT_SUB", "RAID"],
  TIKTOK: ["FOLLOW", "DONATION"],
  YOUTUBE: ["FOLLOW", "SUBSCRIPTION", "DONATION"],
  X: ["FOLLOW"],
  STREAMELEMENTS: ["DONATION"],
  STREAMLABS: ["DONATION"],
  MANUAL: ["FOLLOW", "SUBSCRIPTION", "GIFT_SUB", "BITS", "DONATION", "RAID"],
};


type FilterGroup = {
  id: string;
  label: string;
  dot: string;
  icon: React.ReactNode;
  match: (event: FeedEvent) => boolean;
};

function StreamlabsMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
      <path
        fill="#31C3A2"
        d="M12 2.2 20.8 7v10L12 21.8 3.2 17V7L12 2.2Zm0 3.1L6.4 8.4v7.2L12 18.7l5.6-3.1V8.4L12 5.3Z"
      />
    </svg>
  );
}

function StreamElementsMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#236BE9" />
      <path fill="#fff" d="M8 7.5h8v2.2H10.4V11H15v2.1H10.4v1.2H16.2V17.5H8z" />
    </svg>
  );
}

const KNOWN_PLATFORMS = [
  "TWITCH",
  "KICK",
  "TIKTOK",
  "YOUTUBE",
  "X",
  "STREAMLABS",
  "STREAMELEMENTS",
];

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "twitch",
    label: "Twitch Events",
    dot: "#9F77F7",
    icon: <PlatformIcon platform="TWITCH" size={20} />,
    match: (e) => e.platform === "TWITCH",
  },
  {
    id: "kick",
    label: "Kick Events",
    dot: "#53FC18",
    icon: <PlatformIcon platform="KICK" size={20} />,
    match: (e) => e.platform === "KICK",
  },
  {
    id: "tiktok",
    label: "TikTok Events",
    dot: "#2DCCD3",
    icon: <PlatformIcon platform="TIKTOK" size={20} />,
    match: (e) => e.platform === "TIKTOK",
  },
  {
    id: "youtube",
    label: "YouTube Events",
    dot: "#FF4444",
    icon: <PlatformIcon platform="YOUTUBE" size={20} />,
    match: (e) => e.platform === "YOUTUBE",
  },
  {
    id: "x",
    label: "X (Twitter) Events",
    dot: "#E7E9EA",
    icon: <PlatformIcon platform="X" size={20} />,
    match: (e) => e.platform === "X",
  },
  {
    id: "streamlabs",
    label: "Streamlabs Events",
    dot: "#31C3A2",
    icon: <StreamlabsMark />,
    match: (e) => e.platform === "STREAMLABS",
  },
  {
    id: "streamelements",
    label: "StreamElements Events",
    dot: "#236BE9",
    icon: <StreamElementsMark />,
    match: (e) => e.platform === "STREAMELEMENTS",
  },
  {
    // Anything from a source outside the named groups (manual adds, future
    // integrations) still belongs in the all-platform totals.
    id: "other",
    label: "Other Sources",
    dot: "#A1A1AA",
    icon: <Layers className="size-5 shrink-0" aria-hidden />,
    match: (e) => !KNOWN_PLATFORMS.includes(e.platform),
  },
];


function relativeTime(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 10) return "Just now";
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 31536000) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 31536000)}y`;
}

function readMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  for (const key of ["message", "text", "comment", "user_message", "body"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 400);
  }
  return null;
}

type EventRow = {
  id: string;
  platform: string;
  event_type: string;
  actor_name: string | null;
  amount: number | null;
  currency: string | null;
  quantity: number | null;
  seconds_added: number | null;
  raw_payload: unknown;
  created_at: string;
};

/** Normalizes a persisted `events` row into the shape the feed renders. */
function toFeedEvent(row: EventRow): FeedEvent {
  return {
    id: row.id,
    platform: row.platform,
    event_type: row.event_type,
    actor_name: row.actor_name,
    amount: row.amount,
    currency: row.currency,
    quantity: row.quantity ?? 1,
    seconds_added: row.seconds_added ?? 0,
    message: readMessage(row.raw_payload),
    created_at: row.created_at,
  };
}

function ActivityFeedPage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);

  const [live, setLive] = useState<FeedEvent[]>([]);
  const [metric, setMetric] = useState<MetricKey | null>(null);
  const [active, setActive] = useState<string[]>(() => FILTER_GROUPS.map((g) => g.id));
  const [filterOpen, setFilterOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 150);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const query = useQuery({
    queryKey: ["activity-feed"],
    refetchInterval: scrolled ? false : 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, platform, event_type, actor_name, amount, currency, quantity, seconds_added, raw_payload, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((row) => toFeedEvent(row as EventRow));
    },
  });

  // Live pipeline: every event written by the Twitch / Kick / TikTok / YouTube /
  // Streamlabs / StreamElements ingest paths lands in `events` and is streamed
  // here instantly, so the feed never waits for the next poll.
  useEffect(() => {
    const channel = supabase
      .channel("activity-feed-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          const row = payload.new as EventRow | null;
          if (!row?.id) return;
          setLive((prev) =>
            prev.some((item) => item.id === row.id)
              ? prev
              : [toFeedEvent(row), ...prev].slice(0, 200),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const events = useMemo(() => {
    const map = new Map<string, FeedEvent>();
    for (const item of [...live, ...(query.data ?? [])]) map.set(item.id, item);
    const sorted = [...map.values()]
      // Strict source routing: only keep events the platform actually owns.
      .filter((event) =>
        (ALLOWED_BY_PLATFORM[event.platform] ?? []).includes(event.event_type),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // The same follow/sub can still arrive twice from one platform (socket +
    // webhook). Same user, same action, same moment => keep one row only.
    const NATIVE = ["TWITCH", "KICK", "TIKTOK", "YOUTUBE"];
    const kept: FeedEvent[] = [];
    for (const event of sorted) {
      const key = `${(event.actor_name ?? "").trim().toLowerCase()}|${event.event_type}`;
      const time = new Date(event.created_at).getTime();
      const twinIndex = kept.findIndex(
        (other) =>
          `${(other.actor_name ?? "").trim().toLowerCase()}|${other.event_type}` === key &&
          Math.abs(new Date(other.created_at).getTime() - time) <= 10_000,
      );
      if (twinIndex === -1) {
        kept.push(event);
        continue;
      }
      const twin = kept[twinIndex]!;
      // Prefer the platform-native record over the third-party relay.
      if (NATIVE.includes(event.platform) && !NATIVE.includes(twin.platform)) {
        kept[twinIndex] = event;
      }
    }
    return kept;
  }, [query.data, live]);



  const visible = useMemo(
    () => events.filter((event) => FILTER_GROUPS.some((g) => active.includes(g.id) && g.match(event))),
    [events, active],
  );

  const toggle = (id: string) =>
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allActive = active.length === FILTER_GROUPS.length;
  const toggleAll = () =>
    setActive(allActive ? [] : FILTER_GROUPS.map((group) => group.id));

  // Totals aggregate every connected source at once (Twitch, Kick, TikTok,
  // YouTube, Streamlabs, StreamElements, manual) and shrink to the selected
  // platforms whenever a filter is applied.
  const stats = useMemo(() => {
    let followers = 0;
    let subs = 0;
    let tips = 0;
    let bits = 0;
    for (const e of visible) {
      const type = e.event_type;
      const qty = e.quantity > 0 ? e.quantity : 1;
      const amount = Number(e.amount ?? 0);
      if (type === "FOLLOW") followers += qty;
      else if (type === "SUBSCRIPTION" || type === "GIFT_SUB") subs += qty;
      else if (type === "DONATION") tips += Number.isFinite(amount) ? amount : 0;
      else if (type === "BITS") bits += Number.isFinite(amount) && amount > 0 ? amount : qty;
    }
    return { followers, subs, tips, bits };
  }, [visible]);


  return (
    <AppShell
      user={user}
      profile={workspace?.profile}
      title="Activity Feed"
      subtitle="Your complete historical log of follows, subs, gifts, bits, raids and tips."
    >
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Users className="size-4" aria-hidden />}
          label="New Followers"
          value={stats.followers}
          accent="#9F77F7"
          onClick={() => setMetric("followers")}
        />
        <StatCard
          icon={<Star className="size-4" aria-hidden />}
          label="Total Subs"
          value={stats.subs}
          accent="#53FC18"
          onClick={() => setMetric("subs")}
        />
        <StatCard
          icon={<DollarSign className="size-4" aria-hidden />}
          label="Tips / Revenue"
          value={stats.tips}
          accent="#80F5D2"
          money
          onClick={() => setMetric("tips")}
        />
        <StatCard
          icon={<Gem className="size-4" aria-hidden />}
          label="Bits / Gifts"
          value={stats.bits}
          accent="#4FC3F7"
          onClick={() => setMetric("bits")}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">

        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            className="flex items-center gap-2 rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] px-4 py-2.5 text-sm font-medium backdrop-blur transition-colors hover:bg-[oklch(1_0_0/0.08)]"
          >
            <Filter className="size-4 text-muted-foreground" aria-hidden />
            Filter
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform ${filterOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {filterOpen ? (
            <div
              role="menu"
              className="absolute start-0 top-full z-40 mt-2 min-w-64 rounded-xl border p-1.5"
              style={{
                background: "rgba(15, 17, 23, 0.95)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.1)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
              }}
            >
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={allActive}
                onClick={toggleAll}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-[0.82rem] font-semibold transition-all hover:bg-neutral-800/80 ${
                  allActive
                    ? "bg-neutral-800/80 text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Globe className="size-5 shrink-0" aria-hidden />
                <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="flex-1">All Platforms</span>
                <Check
                  className={`size-4 shrink-0 text-primary transition-opacity ${allActive ? "opacity-100" : "opacity-0"}`}
                  aria-hidden
                />
              </button>

              {FILTER_GROUPS.map((group) => {

                const on = active.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => toggle(group.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-[0.82rem] transition-all hover:bg-neutral-800/80 ${
                      on
                        ? "bg-neutral-800/80 text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center">{group.icon}</span>
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: group.dot }}
                    />
                    <span className="flex-1">{group.label}</span>
                    <Check
                      className={`size-4 shrink-0 text-primary transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <span className="text-xs text-muted-foreground">
          {visible.length} {visible.length === 1 ? "event" : "events"}
        </span>
      </div>

      <section
        className="rounded-2xl border p-2 sm:p-3"
        style={{
          background: "rgba(15, 17, 23, 0.6)",
          backdropFilter: "blur(14px)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {visible.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            {query.isLoading
              ? "Loading your activity history…"
              : "No activity yet — events from your connected platforms will show up here."}
          </p>
        ) : (
          <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
            {visible.map((event) => {
              const color = PLATFORM_COLOR[event.platform] ?? "#A1A1AA";
              const label = EVENT_LABEL[event.event_type] ?? event.event_type.replace("_", " ");
              const amount =
                event.event_type === "DONATION" && event.amount
                  ? `${event.currency === "USD" || !event.currency ? "$" : ""}${event.amount}${
                      event.currency && event.currency !== "USD" ? ` ${event.currency}` : ""
                    }`
                  : event.event_type === "BITS" && event.amount
                    ? `${event.amount} bits`
                    : event.quantity > 1
                      ? `×${event.quantity}`
                      : null;

              return (
                <li key={event.id} className="flex items-start gap-3 px-2 py-3.5 sm:px-3">
                  <span
                    className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold"
                    style={{
                      background: `color-mix(in oklab, ${color} 18%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
                      color,
                    }}
                  >
                    <PlatformIcon platform={event.platform} size={13} />
                    <span>{label}</span>
                    {amount ? <span className="opacity-80">{amount}</span> : null}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color }}>
                      {event.actor_name ?? "Anonymous"}
                    </p>
                    {event.message ? (
                      <p className="mt-0.5 break-words text-[0.8rem] text-muted-foreground">
                        “{event.message}”
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                    {relativeTime(event.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {scrolled ? (
        <>
          <div
            className="fixed bottom-6 start-1/2 z-40 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-medium"
            style={{
              background: "rgba(15,17,23,0.9)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <span className="flex items-center gap-2">
              <Pause className="size-3.5 text-primary" aria-hidden />
              Feed paused due to scroll
            </span>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 end-6 z-40 flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-[oklch(1_0_0/0.1)]"
            style={{
              background: "rgba(15,17,23,0.9)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.12)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            }}
          >
            <ArrowUp className="size-4 text-primary" aria-hidden />
            Scroll to top
          </button>
        </>
      ) : null}

      {metric ? (
        <MetricAnalyticsModal
          metric={metric}
          title={METRIC_META[metric].title}
          accent={METRIC_META[metric].accent}
          money={METRIC_META[metric].money ?? false}
          events={visible}
          onClose={() => setMetric(null)}
        />
      ) : null}
    </AppShell>
  );
}
