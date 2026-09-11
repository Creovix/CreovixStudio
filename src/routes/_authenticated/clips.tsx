import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Check, Copy, Download, Play, Search, Share2, Trash2, Video, X } from "lucide-react";

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

const SORTS = [
  { id: "recent", label: "Most Recent" },
  { id: "views", label: "Most Viewed" },
  { id: "today", label: "Top Today" },
  { id: "all_time", label: "Top All Time" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const card = "glass-3d rounded-2xl border border-[oklch(1_0_0/0.08)]";

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["channel-clips"] }),
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
    <AppShell
      user={user}
      profile={workspace?.profile}
      title="Channel Clips"
      subtitle="Browse and watch clips created by the community"
    >
      <div className="w-full">

        <div className={`${card} mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-white/35" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by clip title or username"
              aria-label="Search clips"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 ps-9 pe-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            aria-label="Sort clips"
            className="rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
          >
            {SORTS.map((option) => (
              <option key={option.id} value={option.id} className="bg-[#0B0D12]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-white/50">Loading clips…</p>
        ) : visible.length === 0 ? (
          <div className={`${card} flex flex-col items-center gap-3 p-14 text-center`}>
            <Video className="size-8 text-white/25" aria-hidden />
            <p className="text-sm text-white/55">
              No clips yet — clips created on your channel will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((clip) => (
              <article key={clip.id} className={`${card} group overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => setActive(clip)}
                  className="relative block aspect-video w-full overflow-hidden bg-black/60"
                  aria-label={`Play ${clip.title}`}
                >
                  {clip.thumbnail ? (
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      loading="lazy"
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <Video className="size-7 text-white/25" aria-hidden />
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Play className="size-9 rounded-full bg-emerald-400/90 p-2 text-black" aria-hidden />
                  </span>
                  <span className="absolute bottom-2 end-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[0.7rem] font-medium text-white">
                    {formatDuration(clip.duration)}
                  </span>
                </button>

                <div className="space-y-2 p-3">
                  <h2 className="line-clamp-2 text-sm font-semibold text-white">{clip.title}</h2>
                  <span className="inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.68rem] uppercase tracking-wide text-white/60">
                    {clip.platform}
                  </span>
                  <p className="text-[0.75rem] text-white/50">
                    Clipped by @{clip.clippedBy} · {clip.views} views · {timeAgo(clip.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <ActionButton onClick={() => copy(clip)}>
                      {copied === clip.id ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                      {copied === clip.id ? "Copied" : "Copy Link"}
                    </ActionButton>
                    <ActionButton onClick={() => share(clip)}>
                      <Share2 className="size-3.5" aria-hidden />
                      Share
                    </ActionButton>
                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.72rem] text-white/70 transition hover:bg-white/10"
                    >
                      <Download className="size-3.5" aria-hidden />
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => del.mutate(clip.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[0.72rem] text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setActive(null)}
        >
          <div
            className={`${card} w-full max-w-3xl overflow-hidden`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <h2 className="text-base font-semibold text-white">{active.title}</h2>
                <p className="text-[0.75rem] text-white/50">
                  Clipped by @{active.clippedBy} · {timeAgo(active.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close player"
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <ClipPlayer src={active.url} poster={active.thumbnail ?? undefined} />
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4">
              <ActionButton onClick={() => copy(active)}>
                {copied === active.id ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                Copy Clip URL
              </ActionButton>
              <a
                href={active.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.75rem] text-white/70 transition hover:bg-white/10"
              >
                <Play className="size-3.5" aria-hidden />
                Open original
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.72rem] text-white/70 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}
