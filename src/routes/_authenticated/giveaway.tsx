import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { DarkSelect } from "@/components/ui/dark-select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GiveawayDisplay, type DrawPhase } from "@/components/widgets/GiveawayDisplay";
import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useLanguage } from "@/lib/i18n";
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

const COPY = {
  en: {
    title: "Giveaway",
    subtitle: "Collect chat entries with a keyword, then pick a winner live on stream.",
    how: "Viewers join by typing the keyword in Kick or Twitch chat. Open entries, wait for names, then draw.",
    entryTitle: "How viewers enter",
    entryHint: "Entries are captured automatically from every connected chat.",
    keyword: "Keyword",
    entriesOpen: "Entries open",
    entriesClosed: "Entries closed",
    subsOnly: "Paid subs only",
    multiplier: "Subscriber multiplier",
    multiplierOff: "Off",
    multiplierN: (n: number) => `×${n} entries`,
    drawTitle: "Draw",
    drawHint: "Set the spin and claim window, then launch when the list is ready.",
    spin: "Spin duration",
    seconds: (n: number) => `${n} seconds`,
    claim: "Claim window",
    minutes: (n: number) => (n === 1 ? "1 minute" : `${n} minutes`),
    pick: "Pick winner",
    clear: "Clear list",
    stageTitle: "Live stage",
    overlayTitle: "OBS browser source",
    overlayHint:
      "Add this link as a Browser Source in OBS (1920×1080, transparent) to show the name cloud, winner reveal and claim countdown on stream.",
    overlayPlaceholder: "Generating link…",
    copy: "Copy",
    copied: "Overlay URL copied",
    saved: "Giveaway settings saved",
    cleared: "Participant list cleared",
    noParticipants: "No participants yet",
    peopleTitle: "Live participants",
    peopleEmpty: (keyword: string) =>
      `Nobody has entered yet. Viewers join by typing ${keyword} in chat.`,
    entriesCount: (people: number, entries: number) => `${people} · ${entries} entries`,
  },
  ar: {
    title: "السحب",
    subtitle: "اجمع المشاركات بكلمة من الشات ثم اسحب فائزاً مباشرة على البث.",
    how: "ينضم المشاهدون بكتابة الكلمة في شات Kick أو Twitch. افتح المشاركات، انتظر الأسماء، ثم اسحب.",
    entryTitle: "طريقة الدخول",
    entryHint: "تُلتقط المشاركات تلقائياً من كل شات متصل.",
    keyword: "الكلمة",
    entriesOpen: "المشاركات مفتوحة",
    entriesClosed: "المشاركات مغلقة",
    subsOnly: "المشتركون المدفوعون فقط",
    multiplier: "مضاعف المشتركين",
    multiplierOff: "إيقاف",
    multiplierN: (n: number) => `×${n} مشاركات`,
    drawTitle: "السحب",
    drawHint: "اضبط مدة الدوران ونافذة التأكيد، ثم ابدأ عندما تكون القائمة جاهزة.",
    spin: "مدة الدوران",
    seconds: (n: number) => `${n} ثوانٍ`,
    claim: "نافذة التأكيد",
    minutes: (n: number) => (n === 1 ? "دقيقة واحدة" : `${n} دقائق`),
    pick: "اختيار فائز",
    clear: "مسح القائمة",
    stageTitle: "المسرح المباشر",
    overlayTitle: "مصدر متصفح OBS",
    overlayHint:
      "أضف هذا الرابط كمصدر متصفح في OBS (1920×1080، شفاف) لعرض سحابة الأسماء وإعلان الفائز وعدّاد التأكيد على البث.",
    overlayPlaceholder: "جاري إنشاء الرابط…",
    copy: "نسخ",
    copied: "تم نسخ رابط الأوفرلاي",
    saved: "تم حفظ إعدادات السحب",
    cleared: "تم مسح قائمة المشاركين",
    noParticipants: "لا مشاركين بعد",
    peopleTitle: "المشاركون الآن",
    peopleEmpty: (keyword: string) => `لا أحد دخل بعد. ينضم المشاهدون بكتابة ${keyword} في الشات.`,
    entriesCount: (people: number, entries: number) => `${people} · ${entries} مشاركة`,
  },
} as const;

const field =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-foreground outline-none focus:border-zinc-600";
const label = "mb-1.5 block text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground";
const primary =
  "inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40";
const selectClass = "h-10 rounded-xl border-zinc-800 bg-zinc-900";

const SPIN_DURATIONS = [3, 5, 8, 10, 15];
const CLAIM_WINDOWS = [60, 120, 300, 600];
const MULTIPLIERS = [1, 2, 3, 5, 10];

function GiveawayPage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);
  const { lang } = useLanguage();
  const c = COPY[lang];
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
      const isSubscriber = message.badges.some((badge) => /sub|founder|og|vip/i.test(badge));
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
        toast.success(c.saved);
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
      toast.success(c.cleared);
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
      toast.error(c.noParticipants);
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

  const display = (
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
  );

  return (
    <AppShell user={user} profile={workspace?.profile} title={c.title} subtitle={c.subtitle}>
      <div className="flex flex-col gap-12 lg:gap-16">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-5">
          <label className="min-w-[8.5rem] flex-1 basis-40 sm:max-w-[13rem]">
            <span className={label}>{c.keyword}</span>
            <input
              className={field}
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              onBlur={() => update({ keyword: form.keyword })}
              placeholder="+1"
              dir="auto"
            />
          </label>
          <label className="min-w-[8.5rem] flex-1 basis-36 sm:max-w-[12rem]">
            <span className={label}>{c.multiplier}</span>
            <DarkSelect
              className={selectClass}
              contentClassName="rounded-xl border-zinc-800 bg-zinc-900"
              value={String(form.subMultiplier)}
              onValueChange={(value) => update({ subMultiplier: Number(value) })}
              options={MULTIPLIERS.map((n) => ({
                value: String(n),
                label: n === 1 ? c.multiplierOff : c.multiplierN(n),
              }))}
            />
          </label>
          <label className="min-w-[8.5rem] flex-1 basis-36 sm:max-w-[11rem]">
            <span className={label}>{c.spin}</span>
            <DarkSelect
              className={selectClass}
              contentClassName="rounded-xl border-zinc-800 bg-zinc-900"
              value={String(form.spinDuration)}
              onValueChange={(value) => update({ spinDuration: Number(value) })}
              options={SPIN_DURATIONS.map((seconds) => ({
                value: String(seconds),
                label: c.seconds(seconds),
              }))}
            />
          </label>
          <label className="min-w-[8.5rem] flex-1 basis-36 sm:max-w-[11rem]">
            <span className={label}>{c.claim}</span>
            <DarkSelect
              className={selectClass}
              contentClassName="rounded-xl border-zinc-800 bg-zinc-900"
              value={String(form.claimSeconds)}
              onValueChange={(value) => update({ claimSeconds: Number(value) })}
              options={CLAIM_WINDOWS.map((seconds) => ({
                value: String(seconds),
                label: seconds >= 60 ? c.minutes(seconds / 60) : c.seconds(seconds),
              }))}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-emerald-500"
              checked={form.subsOnly}
              onChange={(e) => update({ subsOnly: e.target.checked })}
            />
            {c.subsOnly}
          </label>
          <button
            type="button"
            onClick={() => update({ isOpen: !form.isOpen })}
            className={`bg-transparent p-0 pb-2 text-sm font-medium ${
              form.isOpen ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {form.isOpen ? c.entriesOpen : c.entriesClosed}
          </button>
          <div className="flex flex-wrap items-center gap-4 pb-0.5">
            <button
              type="button"
              onClick={() => void runDraw()}
              disabled={spinning || participants.length === 0}
              className={primary}
            >
              {spinning ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              {c.pick}
            </button>
            <button
              type="button"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
            >
              {c.clear}
            </button>
          </div>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:gap-14">
          <div className="min-w-0">
            <p className={label}>{c.stageTitle}</p>
            {display}
          </div>
          <div className="min-w-0">
            <p className={label}>
              {c.peopleTitle} · {c.entriesCount(participants.length, totalEntries)}
            </p>
            {participants.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {c.peopleEmpty(form.keyword || "+1")}
              </p>
            ) : (
              <ul className="max-h-[min(52vh,420px)] overflow-y-auto">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex items-center gap-2.5 border-b border-zinc-800 py-2.5 last:border-b-0"
                  >
                    <PlatformIcon platform={participant.platform} size={16} />
                    <span className="min-w-0 flex-1 truncate text-sm">{participant.username}</span>
                    <span className="font-mono text-[0.72rem] text-muted-foreground">
                      ×{participant.entries}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="max-w-2xl">
          <span className={label}>{c.overlayTitle}</span>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <input
              readOnly
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 font-mono text-[0.78rem] text-foreground outline-none"
              value={overlayUrl}
              placeholder={c.overlayPlaceholder}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => {
                if (!overlayUrl) return;
                void navigator.clipboard.writeText(overlayUrl);
                toast.success(c.copied);
              }}
              className="shrink-0 border-s border-zinc-800 px-3.5 text-sm text-muted-foreground transition-colors hover:bg-zinc-800/80 hover:text-foreground"
            >
              {c.copy}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="h-[min(88vh,900px)] w-[min(94vw,1600px)] max-w-none overflow-hidden border-0 bg-background p-0 shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">{c.stageTitle}</DialogTitle>
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
