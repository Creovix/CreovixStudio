import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Check, Search, Video } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ClipPlayer } from "@/components/clips/ClipPlayer";
import { useWorkspace } from "@/hooks/useWorkspace";
import { deleteClip, listChannelClips } from "@/lib/clipCommand.functions";

export const Route = createFileRoute("/_authenticated/clips")({
  head: () => ({
    meta: [
      { title: "Channel Clips — Creovix Studio" },
      {
        name: "description",
        content: "Browse, search, watch and share every clip your community created on your channel.",
      },
      { property: "og:title", content: "Channel Clips — Creovix Studio" },
      {
        property: "og:description",
        content: "A searchable gallery of community clips with playback, sharing and download actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClipsPage,
});

type Clip = {
  id: string;
  title: string;
  url: string;
  shareUrl: string | null;
  thumbnail: string | null;
  duration: number;
  views: number;
  clippedBy: string;
  createdAt: string;
  platform: string;
};

const COPY = {
  title: "Channel clips",
  subtitle: "Browse and watch clips created by the community.",
  search: "Search by title or username",
  pick: "Select a clip",
  loading: "Loading clips…",
  empty: "No clips yet. Clips created on your channel will appear here.",
  noneMatch: "No clips match that search.",
  clippedBy: "Clipped by",
  views: (n: number) => `${n} views`,
  copy: "Copy link",
  copied: "Copied",
  share: "Share",
  download: "Download",
  delete: "Delete",
  open: "Open original",
  play: "Play",
  sorts: {
    recent: "Most recent",
    views: "Most viewed",
    today: "Top today",
    all_time: "Top all time",
  },
} as const;

const SORT_IDS = ["recent", "views", "today", "all_time"] as const;
type SortId = (typeof SORT_IDS)[number];

const field =
  "w-full border border-zinc-800 bg-transparent py-2 ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-zinc-600";
const textAction = "text-sm text-muted-foreground hover:text-foreground";

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function ClipsPage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);
  const c = COPY;
  const queryClient = useQueryClient();
  const fetchClips = useServerFn(listChannelClips);
  const removeClip = useServerFn(deleteClip);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortId>("recent");
  const [active, setActive] = useState<Clip | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: clips = [], isLoading } = useQuery({
    queryKey: ["channel-clips"],
    queryFn: () => fetchClips() as Promise<Clip[]>,
  });

  const del = useMutation({
    mutationFn: (id: string) => removeClip({ data: { id } }),
    onSuccess: (_result, id) => {
      if (active?.id === id) setActive(null);
      void queryClient.invalidateQueries({ queryKey: ["channel-clips"] });
    },
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = clips.filter(
      (clip) =>
        !term ||
        clip.title.toLowerCase().includes(term) ||
        clip.clippedBy.toLowerCase().includes(term),
    );
    if (sort === "today") {
      const since = Date.now() - 24 * 60 * 60 * 1000;
      list = list.filter((clip) => new Date(clip.createdAt).getTime() >= since);
    }
    const sorted = [...list];
    if (sort === "recent") {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else {
      sorted.sort((a, b) => b.views - a.views);
    }
    return sorted;
  }, [clips, search, sort]);

  const copy = async (clip: Clip) => {
    await navigator.clipboard.writeText(clip.shareUrl ?? clip.url);
    setCopied(clip.id);
    setTimeout(() => setCopied((current) => (current === clip.id ? null : current)), 1600);
  };

  const share = async (clip: Clip) => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: clip.title, url: clip.shareUrl ?? clip.url });
        return;
      } catch {
        /* user dismissed */
      }
    }
    await copy(clip);
  };

  return (
    <AppShell user={user} profile={workspace?.profile} title={c.title} subtitle={c.subtitle}>
      <div className="flex flex-col gap-10">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={c.search}
              aria-label={c.search}
              className={field}
              dir="auto"
            />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SORT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSort(id)}
                className={`text-sm ${
                  sort === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.sorts[id]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-14">
          <div className="min-w-0">
            {active ? (
              <>
                <div className="aspect-video w-full bg-black">
                  <ClipPlayer src={active.url} poster={active.thumbnail ?? undefined} />
                </div>
                <h2 className="mt-5 text-[1.05rem] font-semibold" dir="auto">
                  {active.title}
                </h2>
                <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
                  {c.clippedBy} <span dir="auto">@{active.clippedBy}</span> · {c.views(active.views)} · {timeAgo(active.createdAt)} ·{" "}
                  {active.platform}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button type="button" onClick={() => void copy(active)} className={textAction}>
                    {copied === active.id ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="size-3.5" aria-hidden />
                        {c.copied}
                      </span>
                    ) : (
                      c.copy
                    )}
                  </button>
                  <button type="button" onClick={() => void share(active)} className={textAction}>
                    {c.share}
                  </button>
                  <a href={active.url} target="_blank" rel="noreferrer" className={textAction}>
                    {c.download}
                  </a>
                  <a href={active.url} target="_blank" rel="noreferrer" className={textAction}>
                    {c.open}
                  </a>
                  <button
                    type="button"
                    onClick={() => del.mutate(active.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    {c.delete}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{c.pick}</p>
            )}
          </div>

          <div className="min-w-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{c.loading}</p>
            ) : clips.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{c.empty}</p>
            ) : visible.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{c.noneMatch}</p>
            ) : (
              <ul className="max-h-[min(70vh,640px)] overflow-y-auto">
                {visible.map((clip) => {
                  const selected = active?.id === clip.id;
                  return (
                    <li key={clip.id} className="border-b border-zinc-800 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setActive(clip)}
                        className="flex w-full items-center gap-3 py-3 text-start"
                        aria-current={selected ? "true" : undefined}
                        aria-label={`${c.play} ${clip.title}`}
                      >
                        <span className="relative size-16 shrink-0 overflow-hidden bg-black/40">
                          {clip.thumbnail ? (
                            <img
                              src={clip.thumbnail}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center">
                              <Video className="size-4 text-muted-foreground/50" aria-hidden />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${selected ? "text-foreground" : "text-foreground/90"}`}
                            dir="auto"
                          >
                            {clip.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[0.72rem] text-muted-foreground">
                            @{clip.clippedBy} · {formatDuration(clip.duration)} · {c.views(clip.views)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
