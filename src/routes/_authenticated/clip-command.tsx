import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronDown, Copy, Download, Play, Plug, Video } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { HowItWorks } from "@/components/layout/HowItWorks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getClipCommandState, saveClipCommandSettings } from "@/lib/clipCommand.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clip-command")({
  head: () => ({
    meta: [
<<<<<<< HEAD
      { title: "CylixStudio — Clip Command" },
=======
      { title: "Clip Command — Creovix Studio" },
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      {
        name: "description",
        content:
          "Let viewers create instant clips by typing !clip in chat. Configure permissions, clip length and the bot response.",
      },
<<<<<<< HEAD
      { property: "og:title", content: "CylixStudio — Clip Command" },
=======
      { property: "og:title", content: "Clip Command — Creovix Studio" },
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      {
        property: "og:description",
        content: "Viewer-triggered clipping with permissions, length limits and a custom chat reply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClipCommandPage,
});

type Clip = {
  id: string;
  title: string;
  thumbnail: string | null;
  duration: number;
  views: number;
  clippedBy: string;
  url: string;
};

type Settings = {
  enabled: boolean;
  roles: string[];
  defaultLength: number;
  maxLength: number;
  response: string;
};

const ROLES = ["Everyone", "Subs", "VIPs", "Mods"] as const;

const DEFAULTS: Settings = {
  enabled: false,
  roles: ["Everyone"],
  defaultLength: 30,
  maxLength: 120,
  response: "@{user} {clip_url}",
};

const pill = "rounded-full border px-3 py-1.5 text-[0.78rem] font-medium transition-colors";

function ClipCommandPage() {
  const { user } = Route.useRouteContext();
  const { data } = useWorkspace(user.id);
  const queryClient = useQueryClient();

  const loadState = useServerFn(getClipCommandState);
  const persistSettings = useServerFn(saveClipCommandSettings);

  const state = useQuery({
    queryKey: ["clip-command", user.id],
    queryFn: () => loadState(),
    refetchInterval: 20000,
  });

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [botOnline, setBotOnline] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const clips: Clip[] = (state.data?.clips ?? []).map((clip) => ({
    id: clip.id,
    title: clip.title,
    thumbnail: clip.thumbnail,
    duration: clip.duration,
    views: clip.views,
    clippedBy: clip.clippedBy,
    url: clip.url,
  }));

  useEffect(() => {
    const remote = state.data?.settings;
    if (remote && !dirty) setSettings({ ...DEFAULTS, ...remote });
  }, [state.data?.settings, dirty]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setDirty(true);
  };

  const toggleRole = (role: string) => {
    const has = settings.roles.includes(role);
    const next = has ? settings.roles.filter((r) => r !== role) : [...settings.roles, role];
    update("roles", next.length ? next : ["Everyone"]);
  };

  const saveMutation = useMutation({
    mutationFn: () => persistSettings({ data: settings }),
    onSuccess: () => {
      setSaved(true);
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["clip-command", user.id] });
    },
  });

  const save = () => saveMutation.mutate();

  useEffect(() => {
    let alive = true;
    fetch("/api/public/webhooks/kick", { cache: "no-store" })
      .then((r) => alive && setBotOnline(r.ok))
      .catch(() => alive && setBotOnline(false));
    return () => {
      alive = false;
    };
  }, []);

  const testBot = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/public/webhooks/kick", { cache: "no-store" });
      const ok = response.ok;
      setBotOnline(ok);
      if (ok) toast.success("Bot Status: Connected & Listening");
      else toast.error(`Bot Status: Disconnected (${response.status})`);
    } catch {
      setBotOnline(false);
      toast.error("Bot Status: Disconnected");
    } finally {
      setTesting(false);
    }
  };

  return (
    <AppShell
      user={user}
      profile={data?.profile}
      title="Clip Command"
      subtitle="Let viewers instantly create clips by typing !clip in chat"
    >
      <div className="space-y-8">
        <HowItWorks
          steps={[
            "Enable the clip command",
            "Viewers type !clip in chat",
            "Optionally specify duration with !clip 45",
          ]}
          note="The clip command can take up to 5 minutes to initialise after enabling."
        />

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[0.95rem] font-semibold">!clip</h2>
              <p className="mt-0.5 text-[0.78rem] text-muted-foreground">Enable the chat command on your channel.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-[0.74rem] text-muted-foreground">
                <span
                  className={cn("size-2 rounded-full", botOnline ? "bg-emerald-500" : "bg-rose-500")}
                  aria-hidden
                />
                {botOnline ? "Bot connected" : "Bot disconnected"}
              </span>
              <button
                type="button"
                onClick={testBot}
                disabled={testing}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.74rem] text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground disabled:opacity-60"
              >
                <Plug className="size-3.5" aria-hidden />
                {testing ? "Testing…" : "Test"}
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enabled}
                aria-label="Enable clip command"
                onClick={() => update("enabled", !settings.enabled)}
                className={cn(
                  "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                  settings.enabled ? "bg-emerald-500" : "bg-zinc-700",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white transition-all",
                    settings.enabled ? "start-[1.15rem]" : "start-0.5",
                  )}
                />
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">Who can use</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const active = settings.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      pill,
                      active
                        ? "border-emerald-500/50 bg-emerald-500/15 text-foreground"
                        : "border-[oklch(1_0_0/0.1)] text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.06] px-3 py-2 text-start text-[0.82rem] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground">
              Advanced settings
              <ChevronDown
                className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-4 px-1">
                <label className="block">
                  <span className="flex justify-between text-[0.8rem]">
                    <span className="text-muted-foreground">Default length</span>
                    <span className="font-mono">{settings.defaultLength}s</span>
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={settings.defaultLength}
                    onChange={(e) => update("defaultLength", Number(e.target.value))}
                    className="mt-2 w-full accent-emerald-400"
                  />
                </label>
                <label className="block">
                  <span className="flex justify-between text-[0.8rem]">
                    <span className="text-muted-foreground">Maximum length</span>
                    <span className="font-mono">{settings.maxLength}s</span>
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={240}
                    step={5}
                    value={settings.maxLength}
                    onChange={(e) => update("maxLength", Number(e.target.value))}
                    className="mt-2 w-full accent-emerald-400"
                  />
                </label>
                <label className="block">
                  <span className="text-[0.8rem] text-muted-foreground">Custom response</span>
                  <input
                    value={settings.response}
                    onChange={(e) => update("response", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary"
                    dir="auto"
                  />
                  <span className="mt-1.5 block text-[0.72rem] text-muted-foreground">
                    Variables: {"{user}"}, {"{clip_url}"}
                  </span>
                </label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-emerald-500 px-5 py-2 text-[0.82rem] font-semibold text-black transition-opacity hover:opacity-90"
            >
              Save Changes
            </button>
            {saved ? <span className="text-[0.78rem] text-emerald-400">Saved</span> : null}
          </div>
        </section>

        <section className="border-t border-white/5 pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[0.95rem] font-semibold">Created Clips</h2>
            <span className="rounded-full border border-[oklch(1_0_0/0.12)] px-2 py-0.5 text-[0.7rem] text-muted-foreground">
              {clips.length}
            </span>
            <Link
              to="/clips"
              className="ms-auto text-[0.78rem] font-medium text-emerald-400 hover:underline"
            >
              View all clips
            </Link>
          </div>

          {clips.length === 0 ? (
            <div className="mt-6 grid place-items-center gap-3 py-10 text-center">
              <Video className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-[0.82rem] text-muted-foreground">
                No clips yet — clips created on your channel will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {clips.map((clip) => (
                <article key={clip.id} className="overflow-hidden rounded-xl border border-white/5">
                  <div className="relative aspect-video bg-[oklch(0_0_0/0.5)]">
                    {clip.thumbnail ? (
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : null}
                    <span className="absolute bottom-2 end-2 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[0.7rem]">
                      {clip.duration}s
                    </span>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-[0.82rem] font-medium">{clip.title}</p>
                    <p className="text-[0.72rem] text-muted-foreground">
                      {clip.views} views · clipped by {clip.clippedBy}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <a
                        href={clip.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Play clip"
                        className="rounded-lg border border-[oklch(1_0_0/0.1)] p-1.5 hover:text-emerald-400"
                      >
                        <Play className="size-3.5" aria-hidden />
                      </a>
                      <a
                        href={clip.url}
                        download
                        aria-label="Download clip"
                        className="rounded-lg border border-[oklch(1_0_0/0.1)] p-1.5 hover:text-emerald-400"
                      >
                        <Download className="size-3.5" aria-hidden />
                      </a>
                      <button
                        type="button"
                        aria-label="Copy clip URL"
                        onClick={() => void navigator.clipboard.writeText(clip.url)}
                        className="rounded-lg border border-[oklch(1_0_0/0.1)] p-1.5 hover:text-emerald-400"
                      >
                        <Copy className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
