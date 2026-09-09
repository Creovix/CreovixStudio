import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Gift, Loader2, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GiveawayDisplay, type DrawPhase } from "@/components/widgets/GiveawayDisplay";
import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  DEFAULT_GIVEAWAY,
  announceGiveawayWinner,
  clearGiveawayParticipants,
  getGiveawayChatSources,
  getGiveawayOverlayToken,
  getGiveawayState,
  publishGiveawayDraw,
  joinGiveaway,
  pickGiveawayWinner,
  saveGiveawaySettings,
  type GiveawayDrawState,
  type GiveawaySettings,
} from "@/lib/giveaway.functions";

export const Route = createFileRoute("/_authenticated/giveaway")({
  head: () => ({
    meta: [
      { title: "Giveaway Wheel — Creovix Studio" },
      {
        name: "description",
        content:
          "Run keyword giveaways across Kick, Twitch, YouTube and TikTok chat, then spin the wheel to pick a winner live.",
      },
      { property: "og:title", content: "Giveaway Wheel — Creovix Studio" },
      {
        property: "og:description",
        content: "Collect chat entries with a custom keyword and draw a winner on stream.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiveawayPage,
});

const panel =
  "rounded-2xl border border-[oklch(1_0_0/0.08)] bg-[oklch(0.19_0.02_265/0.55)] p-5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.45)]";
const field =
  "w-full rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(0.14_0.02_265/0.9)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-[color-mix(in_oklab,var(--primary)_55%,transparent)]";
const label = "mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground";

const SPIN_DURATIONS = [3, 5, 8, 10, 15];
const CLAIM_WINDOWS = [60, 120, 300, 600];

function GiveawayPage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);
  const queryClient = useQueryClient();

  const fetchState = useServerFn(getGiveawayState);
  const fetchSources = useServerFn(getGiveawayChatSources);
  const save = useServerFn(saveGiveawaySettings);
  const clear = useServerFn(clearGiveawayParticipants);
  const pick = useServerFn(pickGiveawayWinner);
  const join = useServerFn(joinGiveaway);
  const announce = useServerFn(announceGiveawayWinner);
  const publishDraw = useServerFn(publishGiveawayDraw);
  const fetchOverlayToken = useServerFn(getGiveawayOverlayToken);

  const state = useQuery({
    queryKey: ["giveaway"],
    queryFn: () => fetchState(),
    refetchInterval: 4000,
  });
  const sources = useQuery({ queryKey: ["giveaway-chat-sources"], queryFn: () => fetchSources() });
  const overlay = useQuery({ queryKey: ["giveaway-overlay-token"], queryFn: () => fetchOverlayToken() });
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const overlayUrl = overlay.data?.token
    ? `${origin}/overlay/giveaway?token=${overlay.data.token}`
    : "";

  const [form, setForm] = useState<GiveawaySettings>(DEFAULT_GIVEAWAY);
  const loaded = useRef(false);
  useEffect(() => {
    if (state.data?.settings && !loaded.current) {
      setForm(state.data.settings);
      loaded.current = true;
    }
  }, [state.data]);

  const participants = state.data?.participants ?? [];
  const totalEntries = useMemo(
    () => participants.reduce((sum, p) => sum + p.entries, 0),
    [participants],
  );

  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ username: string; platform: string } | null>(null);
  const [drawPhase, setDrawPhase] = useState<DrawPhase>("idle");
  const [claimState, setClaimState] = useState<"pending" | "confirmed" | "expired">("pending");
  const [claimLeft, setClaimLeft] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const winnerRef = useRef<string | null>(null);

  // Mirror the live draw into the OBS browser source.
  const push = (next: Partial<GiveawayDrawState>) =>
    void publishDraw({
      data: {
        phase: "idle",
        winner: null,
        claimState: "pending",
        claimUntil: null,
        keyword: form.keyword || "+1",
        ...next,
      } as GiveawayDrawState,
    }).catch(() => undefined);

  // Claim countdown remains active in both the embedded and expanded display.
  useEffect(() => {
    if (!winner || drawPhase !== "settled" || claimState !== "pending") return;
    if (claimLeft <= 0) {
      setClaimState("expired");
      winnerRef.current = null;
      return;
    }
    const id = setTimeout(() => setClaimLeft((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [winner, drawPhase, claimState, claimLeft]);


  // ---- Live keyword capture from the connected chats (Twitch + Kick) ----
  const seen = useRef(new Set<string>());
  useLiveChat(
    sources.data
      ? {
          twitchChannel: sources.data.twitchChannel,
          kickChatroomId: sources.data.kickChatroomId,
          kickSlug: sources.data.kickSlug,
        }
      : null,
    30,
    (message) => {
      const keyword = (form.keyword || "+1").trim().toLowerCase();
      const author = message.author.toLowerCase();
      // Winner re-typing the keyword confirms the prize claim.
      if (
        winnerRef.current &&
        author === winnerRef.current &&
        message.text.toLowerCase().includes(keyword)
      ) {
        winnerRef.current = null;
        setClaimState("confirmed");
        push({ phase: "settled", winner, claimState: "confirmed", claimUntil: null });
        return;
      }
      if (!keyword || !form.isOpen) return;
      if (!message.text.toLowerCase().includes(keyword)) return;
      const key = `${message.platform}:${message.author.toLowerCase()}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      const isSubscriber = message.badges.some((badge) =>
        /sub|founder|og|vip/i.test(badge),
      );
      void join({
        data: {
          platform: message.platform === "TWITCH" ? "TWITCH" : "KICK",
          username: message.author,
          text: message.text,
          isSubscriber,
        },
      }).then(() => queryClient.invalidateQueries({ queryKey: ["giveaway"] }));
    },
  );

  const saveMutation = useMutation({
    mutationFn: (next: GiveawaySettings) => save({ data: next }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Giveaway settings saved");
        void queryClient.invalidateQueries({ queryKey: ["giveaway"] });
      } else toast.error(result.error);
    },
  });

  const update = (patch: Partial<GiveawaySettings>) => {
    const next = { ...form, ...patch };
    setForm(next);
    saveMutation.mutate(next);
  };

  const clearMutation = useMutation({
    mutationFn: () => clear(),
    onSuccess: () => {
      seen.current.clear();
      setWinner(null);
      setDrawPhase("idle");
      winnerRef.current = null;
      push({ phase: "idle" });
      toast.success("Participant list cleared");
      void queryClient.invalidateQueries({ queryKey: ["giveaway"] });
    },
  });

  const runDraw = async () => {
    if (!participants.length || spinning) return;
    setSpinning(true);
    setWinner(null);
    setDrawPhase("shuffling");
    push({ phase: "shuffling" });

    const result = await pick();
    if (!result.ok) {
      setSpinning(false);
      setDrawPhase("idle");
      toast.error("No participants yet");
      return;
    }

    setWinner({ username: result.winner.username, platform: result.winner.platform });
    const total = Math.max(form.spinDuration, 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, total * 0.65));
    setDrawPhase("revealing");
    push({ phase: "revealing", winner: result.winner });
    await new Promise((resolve) => setTimeout(resolve, total * 0.35));
    setDrawPhase("settled");
    setSpinning(false);
    winnerRef.current = result.winner.username.toLowerCase();
    setClaimState("pending");
    setClaimLeft(form.claimSeconds);
    push({
      phase: "settled",
      winner: result.winner,
      claimState: "pending",
      claimUntil: new Date(Date.now() + form.claimSeconds * 1000).toISOString(),
    });
    void announce({
      data: {
        username: result.winner.username,
        keyword: form.keyword || "+1",
        claimSeconds: form.claimSeconds,
      },
    }).catch(() => undefined);
  };

  return (
    <AppShell
      user={user}
      profile={workspace?.profile}
      title="Giveaway"
      subtitle="Collect chat entries with a keyword, then spin for a winner live on stream."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ------------------------------ Controls ------------------------------ */}
        <div className="space-y-5">
          <section className={panel}>
            <header className="mb-5 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl border border-[oklch(1_0_0/0.1)] bg-[color-mix(in_oklab,var(--primary)_20%,transparent)]">
                <Gift className="size-4 text-primary" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Giveaway setup</h2>
                <p className="text-xs text-muted-foreground">
                  Entries are captured automatically from every connected chat.
                </p>
              </div>
              <span
                className={`ms-auto rounded-full border px-3 py-1 text-[0.7rem] ${
                  form.isOpen
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-[oklch(1_0_0/0.12)] text-muted-foreground"
                }`}
              >
                {form.isOpen ? "Entries open" : "Entries closed"}
              </span>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className={label}>Keyword</span>
                <input
                  className={field}
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  onBlur={() => update({ keyword: form.keyword })}
                  placeholder="+1"
                />
              </div>

              <div>
                <span className={label}>Subscriber multiplier</span>
                <select
                  className={field}
                  value={form.subMultiplier}
                  onChange={(e) => update({ subMultiplier: Number(e.target.value) })}
                >
                  <option value={1}>Off</option>
                  <option value={2}>x2 entries</option>
                  <option value={3}>x3 entries</option>
                  <option value={5}>x5 entries</option>
                  <option value={10}>x10 entries</option>
                </select>
              </div>

              <div>
                <span className={label}>Spin duration</span>
                <select
                  className={field}
                  value={form.spinDuration}
                  onChange={(e) => update({ spinDuration: Number(e.target.value) })}
                >
                  {SPIN_DURATIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} seconds
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className={label}>Claim window</span>
                <select
                  className={field}
                  value={form.claimSeconds}
                  onChange={(e) => update({ claimSeconds: Number(e.target.value) })}
                >
                  {CLAIM_WINDOWS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds >= 60 ? `${seconds / 60} minutes` : `${seconds} seconds`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={form.subsOnly}
                    onChange={(e) => update({ subsOnly: e.target.checked })}
                  />
                  Paid subs only
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={form.isOpen}
                    onChange={(e) => update({ isOpen: e.target.checked })}
                  />
                  Accept entries
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void runDraw()}
                disabled={spinning || participants.length === 0}
                className="flex items-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_22%,transparent)] px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {spinning ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Pick winner
              </button>
              <button
                type="button"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
              >
                <Trash2 className="size-4" aria-hidden />
                Clear list
              </button>
            </div>
          </section>

          {/* --------------------------- OBS source --------------------------- */}
          <section className={panel}>
            <h2 className="text-sm font-semibold">OBS browser source</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Add this link as a Browser Source in OBS (1920×1080, transparent) to show the name
              cloud, winner reveal and claim countdown on stream.
            </p>
            <div className="mt-3 flex gap-2">
              <input readOnly className={field} value={overlayUrl} placeholder="Generating link…" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!overlayUrl) return;
                  void navigator.clipboard.writeText(overlayUrl);
                  toast.success("Overlay URL copied");
                }}
                className="shrink-0 border-[oklch(1_0_0/0.12)]"
              >
                <Copy aria-hidden />
                Copy
              </Button>
            </div>
          </section>

          {/* ------------------------ Floating name display ------------------------ */}
          <GiveawayDisplay
            participants={participants}
            winner={winner}
            phase={drawPhase}
            claimState={claimState}
            claimLeft={claimLeft}
            keyword={form.keyword}
            lastWinner={state.data?.lastWinner}
            expanded={false}
            onToggleExpand={() => setExpanded(true)}
            onReroll={() => void runDraw()}
          />
        </div>

        {/* --------------------------- Participants --------------------------- */}
        <aside className={`${panel} flex max-h-[720px] flex-col`}>
          <header className="mb-4 flex items-center gap-2.5">
            <Users className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Live participants</h2>
            <span className="ms-auto rounded-full border border-[oklch(1_0_0/0.12)] px-2.5 py-1 text-[0.7rem] text-muted-foreground">
              {participants.length} · {totalEntries} entries
            </span>
          </header>

          {participants.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[oklch(1_0_0/0.12)] p-6 text-center text-xs text-muted-foreground">
              Nobody has entered yet. Viewers join by typing{" "}
              <span className="text-foreground">{form.keyword || "+1"}</span> in chat.
            </p>
          ) : (
            <ul className="-me-2 space-y-1.5 overflow-y-auto pe-2">
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className="flex items-center gap-2.5 rounded-xl border border-[oklch(1_0_0/0.07)] bg-[oklch(0.14_0.02_265/0.6)] px-3 py-2"
                >
                  <PlatformIcon platform={participant.platform} size={16} />
                  <span className="truncate text-sm">{participant.username}</span>
                  <span className="ms-auto rounded-full bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] px-2 py-0.5 text-[0.68rem]">
                    ×{participant.entries}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="h-[min(88vh,900px)] w-[min(94vw,1600px)] max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">Expanded giveaway display</DialogTitle>
          <GiveawayDisplay
            participants={participants}
            winner={winner}
            phase={drawPhase}
            claimState={claimState}
            claimLeft={claimLeft}
            keyword={form.keyword}
            lastWinner={state.data?.lastWinner}
            expanded
            onToggleExpand={() => setExpanded(false)}
            onReroll={() => void runDraw()}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
