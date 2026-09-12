import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Copy, Link2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useLanguage } from "@/lib/i18n";
import {
  addTestAllowlistName,
  applyTestMarkCommand,
  createStudioTestMark,
  deleteTestMark,
  formatUptime,
  loadTestAllowlist,
  loadTestMarks,
  loadTestShareSettings,
  MARK_STATUSES,
  kickChannelUrl,
  markSharePath,
  markSpanSeconds,
  markStatusDotClass,
  markStatusLabel,
  markTitle,
  matchMarkCommand,
  removeTestAllowlistName,
  rotateTestShareToken,
  setTestMarkStatus,
  updateTestMark,
  type MarkStatus,
  type StreamMark,
} from "@/lib/markPoints";
import {
  addMarkAllowlistName,
  closeStudioMark,
  deleteStreamMark,
  getMarkShareSettings,
  listMarkAllowlist,
  listStreamMarks,
  removeMarkAllowlistName,
  rotateMarkShareToken,
  setStreamMarkStatus,
  startStudioMark,
  updateStreamMark,
} from "@/lib/markPoints.functions";
import { cn } from "@/lib/utils";
import { isTestMode } from "@/lib/testMode";

export const Route = createFileRoute("/_authenticated/mark-points")({
  head: () => ({
    meta: [
      { title: "Mark Points — Creovix Studio" },
      {
        name: "description",
        content:
          "Private stream marks from Kick chat. !mark and !emark record stream uptime. Owner, mods and an allowlist only.",
      },
      { property: "og:title", content: "Mark Points — Creovix Studio" },
      {
        property: "og:description",
        content: "Silent Kick marks stored as stream uptime for the channel owner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarkPointsPage,
});

const COPY = {
  en: {
    title: "Mark Points",
    subtitle: "Private stream highlights. !mark starts, !emark closes — times are stream uptime.",
    search: "Search marks…",
    add: "New mark",
    start: "Start mark",
    end: "End mark",
    empty: "No marks yet. Type !mark in Kick chat while live, or start one here.",
    noneMatch: "No marks match that search.",
    open: "open",
    offline: "offline",
    startLabel: "Start",
    endLabel: "End",
    duration: "Duration",
    note: "Note",
    notePlaceholder: "Clutch play, raid, funny moment…",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save mark",
    modalCreate: "New mark",
    modalEdit: "Edit mark",
    modalHint: "Title or note. Start and end are Kick stream uptime, not your PC clock.",
    deleteTitle: "Delete this mark?",
    deleteBody: "The saved point will be removed from your list.",
    testerTitle: "Try a chat line",
    testerHint: "Test mode writes locally on a test stream clock. Live Kick stays silent.",
    testerPlaceholder: "!mark clutch play",
    testerHit: "Would run",
    testerMiss: "Not a mark command",
    testerApply: "Apply locally",
    howTitle: "How it works",
    how: [
      "Owner, Kick mods, or allowlisted names type !mark or /mark to open a start at current stream uptime.",
      "!emark or /emark closes the newest open start. Chat stays silent — no URLs or IDs.",
      "Offline Kick chat is ignored. Studio can still record an offline mark so it is never faked as live time.",
    ],
    whoTitle: "Who can trigger",
    who: "Kick accepts !mark / !emark from the channel owner, moderators, editors (Kick staff badges), and Kick usernames you add below. The private review link is gated the same way — never posted in chat.",
    twitchNote: "Twitch can be stored as a source later. Live ingest is Kick-first.",
    allowTitle: "Extra names",
    allowHint: "Kick usernames allowed besides the owner, mods and editors.",
    shareTitle: "Private review link",
    shareHint: "Unlisted. Token plus Kick username (or your Studio login). Never send this in public chat.",
    shareCopy: "Copy link",
    shareCopied: "Copied",
    shareRotate: "New link",
    shareMark: "Copy mark link",
    shareMarkCopied: "Mark link copied",
    status: "Status",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    allowPlaceholder: "kick_username",
    allowAdd: "Add",
    allowEmpty: "No extra names yet.",
    saved: "Saved",
    started: "Mark started",
    closed: "Mark saved",
    startedOffline: "Saved as offline — Kick is not live.",
    noOpen: "No open mark to close.",
    errSave: "Could not save the mark.",
    errName: "Enter a Kick username.",
    loadMore: "Load More",
  },
  ar: {
    title: "نقاط البث",
    subtitle: "لحظات خاصة من البث. !mark يقيد البداية و!emark يغلقها — الوقت هو مدة البث.",
    search: "ابحث في النقاط…",
    add: "نقطة جديدة",
    start: "بدء نقطة",
    end: "إنهاء نقطة",
    empty: "لا نقاط بعد. اكتب !mark في شات كيك أثناء البث، أو ابدأ واحدة هنا.",
    noneMatch: "لا نقاط تطابق هذا البحث.",
    open: "مفتوح",
    offline: "غير مباشر",
    startLabel: "البداية",
    endLabel: "النهاية",
    duration: "المدة",
    note: "ملاحظة",
    notePlaceholder: "لحظة حاسمة، ريد، موقف طريف…",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    save: "حفظ النقطة",
    modalCreate: "نقطة جديدة",
    modalEdit: "تعديل النقطة",
    modalHint: "عنوان أو ملاحظة. البداية والنهاية من مدة بث كيك وليست ساعة جهازك.",
    deleteTitle: "حذف هذه النقطة؟",
    deleteBody: "ستُحذف النقطة المحفوظة من قائمتك.",
    testerTitle: "جرّب سطر شات",
    testerHint: "وضع التجربة يكتب محلياً على ساعة بث تجريبية. كيك الحي يبقى صامتاً.",
    testerPlaceholder: "!mark لحظة حاسمة",
    testerHit: "سيُنفَّذ",
    testerMiss: "ليس أمر نقطة",
    testerApply: "تطبيق محلي",
    howTitle: "طريقة العمل",
    how: [
      "المالك أو المشرفون أو الأسماء المسموحة يكتبون !mark أو /mark لفتح بداية عند مدة البث الحالية.",
      "!emark أو /emark يغلق أحدث بداية مفتوحة. الشات صامت — بلا روابط أو معرفات.",
      "شات كيك وهو غير مباشر يُتجاهل. الاستوديو قد يسجّل نقطة غير مباشرة دون تزييف وقت البث.",
    ],
    whoTitle: "من يمكنه التفعيل",
    who: "كيك يقبل !mark / !emark من مالك القناة والمشرفين والمحررين (شارات كيك) وأسماء كيك التي تضيفها أدناه. رابط المراجعة الخاص بنفس القيد — ولا يُرسل في الشات العام.",
    twitchNote: "يمكن حفظ تويتش كمصدر لاحقاً. الإدخال الحي يبدأ من كيك.",
    allowTitle: "أسماء إضافية",
    allowHint: "أسماء كيك المسموحة إضافةً إلى المالك والمشرفين والمحررين.",
    shareTitle: "رابط مراجعة خاص",
    shareHint: "غير معلن. الرمز مع اسم كيك (أو دخول الاستوديو). لا ترسله في الشات العام.",
    shareCopy: "نسخ الرابط",
    shareCopied: "تم النسخ",
    shareRotate: "رابط جديد",
    shareMark: "نسخ رابط النقطة",
    shareMarkCopied: "تم نسخ رابط النقطة",
    status: "الحالة",
    pending: "تحت المراجعة",
    approved: "مقبول",
    rejected: "مرفوض",
    allowPlaceholder: "اسم_كيك",
    allowAdd: "إضافة",
    allowEmpty: "لا أسماء إضافية بعد.",
    saved: "تم الحفظ",
    started: "بدأت النقطة",
    closed: "حُفظت النقطة",
    startedOffline: "حُفظت كغير مباشر — كيك ليس على الهواء.",
    noOpen: "لا توجد نقطة مفتوحة لإغلاقها.",
    errSave: "تعذر حفظ النقطة.",
    errName: "أدخل اسم مستخدم كيك.",
    loadMore: "عرض المزيد",
  },
} as const;

type MarksCopy = (typeof COPY)[keyof typeof COPY];

const MARKS_INITIAL = 12;
const MARKS_STEP = 8;

const field =
  "w-full rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(0.14_0.02_265/0.9)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-zinc-600";

function MarkPointsPage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);
  const { lang } = useLanguage();
  const c = COPY[lang];
  const test = isTestMode();
  const queryClient = useQueryClient();
  const fetchMarks = useServerFn(listStreamMarks);
  const persistUpdate = useServerFn(updateStreamMark);
  const persistDelete = useServerFn(deleteStreamMark);
  const persistStart = useServerFn(startStudioMark);
  const persistClose = useServerFn(closeStudioMark);
  const fetchAllowlist = useServerFn(listMarkAllowlist);
  const persistAllowAdd = useServerFn(addMarkAllowlistName);
  const persistAllowRemove = useServerFn(removeMarkAllowlistName);
  const persistStatus = useServerFn(setStreamMarkStatus);
  const fetchShare = useServerFn(getMarkShareSettings);
  const persistRotate = useServerFn(rotateMarkShareToken);

  const [query, setQuery] = useState("");
  const [sample, setSample] = useState("");
  const [allowName, setAllowName] = useState("");
  const [editor, setEditor] = useState<{ id?: string; note: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMarkId, setCopiedMarkId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [shown, setShown] = useState(MARKS_INITIAL);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["mark-points", user.id] });
  const invalidateAllow = () =>
    queryClient.invalidateQueries({ queryKey: ["mark-point-allowlist", user.id] });

  const marksQuery = useQuery({
    queryKey: ["mark-points", user.id],
    queryFn: async (): Promise<StreamMark[]> => {
      if (test) return loadTestMarks();
      return fetchMarks();
    },
    refetchInterval: test ? false : 15000,
  });

  const allowQuery = useQuery({
    queryKey: ["mark-point-allowlist", user.id],
    queryFn: async (): Promise<string[]> => {
      if (test) return loadTestAllowlist();
      return fetchAllowlist();
    },
  });

  const shareQuery = useQuery({
    queryKey: ["mark-point-share", user.id],
    queryFn: async () => {
      if (test) return loadTestShareSettings();
      return fetchShare();
    },
  });

  const marks = marksQuery.data ?? [];
  const allowlist = allowQuery.data ?? [];
  const share = shareQuery.data;
  const shareUrl = share?.shareToken && origin ? `${origin}${markSharePath(share.shareToken)}` : "";
  const channelUrl = kickChannelUrl(share?.kickUsername);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return marks;
    return marks.filter((mark) => {
      return (
        mark.note.toLowerCase().includes(needle) ||
        mark.author.toLowerCase().includes(needle) ||
        mark.source.toLowerCase().includes(needle)
      );
    });
  }, [marks, query]);

  useEffect(() => {
    setShown(MARKS_INITIAL);
  }, [query]);

  const paged = visible.slice(0, shown);
  const hasMore = shown < visible.length;

  const sampleHit = useMemo(() => matchMarkCommand(sample), [sample]);

  const startMutation = useMutation({
    mutationFn: async (note: string) => {
      if (test) return { ok: true as const, offline: false, marks: createStudioTestMark({ note }) };
      const result = await persistStart({ data: { note } });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success("offline" in result && result.offline ? c.startedOffline : c.started);
      setEditor(null);
      void invalidate();
    },
    onError: () => toast.error(c.errSave),
  });

  const closeMutation = useMutation({
    mutationFn: async (note?: string) => {
      if (test) {
        const result = applyTestMarkCommand(`!emark${note ? ` ${note}` : ""}`, {
          username: "Studio",
          viewerIsMod: true,
          source: "STUDIO",
        });
        if (result.status === "ignored") throw new Error(result.reason ?? "no_open_start");
        return result;
      }
      const result = await persistClose({ data: note ? { note } : {} });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(c.closed);
      void invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message === "no_open_start" ? c.noOpen : c.errSave);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (draft: { id?: string; note: string }) => {
      if (!draft.id) {
        if (test) return createStudioTestMark({ note: draft.note });
        const result = await persistStart({ data: { note: draft.note } });
        if (!result.ok) throw new Error(result.error);
        return result;
      }
      if (test) return updateTestMark({ id: draft.id, note: draft.note });
      const result = await persistUpdate({ data: { id: draft.id, note: draft.note } });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(c.saved);
      setEditor(null);
      void invalidate();
    },
    onError: () => toast.error(c.errSave),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (test) return deleteTestMark(id);
      return persistDelete({ data: { id } });
    },
    onSuccess: () => {
      setDeleteId(null);
      void invalidate();
    },
  });

  const addAllowMutation = useMutation({
    mutationFn: async (username: string) => {
      if (test) return { ok: true as const, names: addTestAllowlistName(username) };
      const result = await persistAllowAdd({ data: { username } });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      setAllowName("");
      void invalidateAllow();
    },
    onError: (error: Error) => {
      toast.error(error.message === "name_required" ? c.errName : c.errSave);
    },
  });

  const removeAllowMutation = useMutation({
    mutationFn: async (username: string) => {
      if (test) return removeTestAllowlistName(username);
      return persistAllowRemove({ data: { username } });
    },
    onSuccess: () => void invalidateAllow(),
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: MarkStatus }) => {
      if (test) return setTestMarkStatus(payload.id, payload.status);
      return persistStatus({ data: payload });
    },
    onSuccess: () => void invalidate(),
  });

  const rotateMutation = useMutation({
    mutationFn: async () => {
      if (test) return rotateTestShareToken();
      return persistRotate();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["mark-point-share"] }),
  });

  const copyShare = async (markId?: string) => {
    const url =
      share?.shareToken && origin
        ? `${origin}${markSharePath(share.shareToken, markId)}`
        : "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      if (markId) {
        setCopiedMarkId(markId);
        window.setTimeout(() => setCopiedMarkId(null), 1600);
      } else {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      toast.error(c.shareCopy);
    }
  };

  const applySample = () => {
    if (!sampleHit) return;
    if (test) {
      const result = applyTestMarkCommand(sample, { username: "Mod", viewerIsMod: true });
      if (result.status === "started") toast.success(c.started);
      else if (result.status === "closed") toast.success(c.closed);
      else toast.error(result.reason === "no_open_start" ? c.noOpen : c.testerMiss);
      void invalidate();
      return;
    }
    if (sampleHit.kind === "mark") startMutation.mutate(sampleHit.note);
    else closeMutation.mutate(sampleHit.note);
  };

  return (
    <AppShell
      user={user}
      profile={workspace?.profile}
      title={c.title}
      subtitle={
        channelUrl ? (
          <a
            href={channelUrl}
            className="inline-block text-start text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            dir="ltr"
          >
            {channelUrl}
          </a>
        ) : (
          c.subtitle
        )
      }
    >
      <div className="space-y-10 text-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative w-44 shrink-0">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={c.search}
                aria-label={c.search}
                className="h-8 w-full rounded-lg border border-zinc-800/60 bg-transparent pe-2.5 ps-8 text-[0.78rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-zinc-600"
                dir="auto"
              />
            </label>
            <button
              type="button"
              onClick={() => closeMutation.mutate(undefined)}
              className="inline-flex h-8 items-center rounded-full border border-zinc-800 px-3 text-[0.78rem] text-muted-foreground hover:text-foreground"
            >
              {c.end}
            </button>
            <button
              type="button"
              onClick={() => startMutation.mutate("")}
              className="inline-flex h-8 items-center rounded-full border border-zinc-800 px-3 text-[0.78rem] text-muted-foreground hover:text-foreground"
            >
              {c.start}
            </button>
            <button
              type="button"
              onClick={() => setEditor({ note: "" })}
              className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-100 px-3 text-[0.78rem] font-semibold text-zinc-900 transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden />
              {c.add}
            </button>
          </div>

          {marks.length === 0 ? (
            <div className="mt-5 space-y-2 py-8 text-start">
              <Bookmark className="size-7 text-muted-foreground" aria-hidden />
              <p className="max-w-md text-[0.82rem] text-muted-foreground">{c.empty}</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-4 text-start text-[0.78rem] text-muted-foreground">{c.noneMatch}</p>
          ) : (
            <div>
              <div className="mt-5 grid w-full grid-cols-[repeat(auto-fill,minmax(190px,1fr))] justify-items-start gap-4">
                {paged.map((mark) => (
                  <MarkCard
                    key={mark.id}
                    mark={mark}
                    copy={c}
                    lang={lang}
                    canShare={Boolean(share?.shareToken && origin)}
                    copiedLink={copiedMarkId === mark.id}
                    onCopyLink={() => void copyShare(mark.id)}
                    onStatus={(status) => statusMutation.mutate({ id: mark.id, status })}
                    onEdit={() => setEditor({ id: mark.id, note: mark.note })}
                    onDelete={() => setDeleteId(mark.id)}
                  />
                ))}
              </div>
              {hasMore ? (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShown((count) => count + MARKS_STEP)}
                    className="inline-flex h-8 items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 text-[0.78rem] font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    {c.loadMore}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-10">
          <div className="space-y-8">
            <section>
              <h2 className="text-[0.95rem] font-semibold">{c.testerTitle}</h2>
              <p className="mt-1 text-[0.78rem] text-muted-foreground">{c.testerHint}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={sample}
                  onChange={(event) => setSample(event.target.value)}
                  placeholder={c.testerPlaceholder}
                  className={`${field} font-mono lg:max-w-md`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={applySample}
                  disabled={!sampleHit}
                  className="rounded-full bg-zinc-100 px-4 py-2 text-[0.82rem] font-semibold text-zinc-900 disabled:opacity-40"
                >
                  {c.testerApply}
                </button>
              </div>
              <div className="mt-3 rounded-[20px] border border-white/[0.06] bg-zinc-900 p-3 font-mono text-[0.78rem]">
                {sampleHit ? (
                  <p className="text-zinc-200">
                    {c.testerHit}{" "}
                    <span dir="ltr">
                      {sampleHit.kind === "emark" ? "!emark" : "!mark"}
                      {sampleHit.note ? ` ${sampleHit.note}` : ""}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">{c.testerMiss}</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-[0.95rem] font-semibold">{c.howTitle}</h2>
              <ol className="mt-3 list-decimal space-y-2 ps-5 text-[0.82rem] text-muted-foreground">
                {c.how.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>

          <section className="max-w-xl rounded-[20px] border border-white/[0.06] bg-zinc-900 p-5 text-start">
            <h2 className="text-[0.95rem] font-semibold">{c.whoTitle}</h2>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-muted-foreground">{c.who}</p>
            <p className="mt-3 text-[0.72rem] text-muted-foreground">{c.twitchNote}</p>
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-[0.72rem]">
              <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-200">!mark</code>
              <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-200">/mark</code>
              <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-200">!emark</code>
              <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-200">/emark</code>
            </div>

            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <h3 className="text-[0.82rem] font-semibold">{c.shareTitle}</h3>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-muted-foreground">{c.shareHint}</p>
              <input
                readOnly
                value={shareUrl}
                className="mt-3 h-8 w-full rounded-lg border border-zinc-800/60 bg-zinc-950 px-2.5 font-mono text-[0.68rem] text-zinc-400 outline-none"
                dir="ltr"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyShare()}
                  disabled={!shareUrl}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-[0.72rem] font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Copy className="size-3.5" aria-hidden />
                  {copied ? c.shareCopied : c.shareCopy}
                </button>
                <button
                  type="button"
                  onClick={() => rotateMutation.mutate()}
                  className="h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-[0.72rem] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  {c.shareRotate}
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <h3 className="text-[0.82rem] font-semibold">{c.allowTitle}</h3>
              <p className="mt-1 text-[0.72rem] text-muted-foreground">{c.allowHint}</p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!allowName.trim()) {
                    toast.error(c.errName);
                    return;
                  }
                  addAllowMutation.mutate(allowName);
                }}
              >
                <input
                  value={allowName}
                  onChange={(event) => setAllowName(event.target.value)}
                  placeholder={c.allowPlaceholder}
                  className={`${field} h-8 py-0 text-[0.78rem]`}
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-zinc-100 px-3 text-[0.72rem] font-semibold text-zinc-900"
                >
                  {c.allowAdd}
                </button>
              </form>
              {allowlist.length === 0 ? (
                <p className="mt-3 text-[0.72rem] text-muted-foreground">{c.allowEmpty}</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {allowlist.map((name) => (
                    <li
                      key={name}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 font-mono text-[0.72rem] text-zinc-200"
                    >
                      <span dir="ltr">{name}</span>
                      <button
                        type="button"
                        aria-label={`${c.delete} ${name}`}
                        onClick={() => removeAllowMutation.mutate(name)}
                        className="text-zinc-400 hover:text-zinc-100"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      <MarkEditor
        copy={c}
        draft={editor}
        saving={saveMutation.isPending}
        onClose={() => setEditor(null)}
        onChange={setEditor}
        onSave={() => editor && saveMutation.mutate(editor)}
      />

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle>{c.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{c.deleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {c.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function MarkCard({
  mark,
  copy,
  lang,
  canShare,
  copiedLink,
  onCopyLink,
  onStatus,
  onEdit,
  onDelete,
}: {
  mark: StreamMark;
  copy: MarksCopy;
  lang: "en" | "ar";
  canShare: boolean;
  copiedLink: boolean;
  onCopyLink: () => void;
  onStatus: (status: MarkStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const open = !mark.endedAt;
  const startLabel = mark.offline ? copy.offline : formatUptime(mark.uptimeStartSeconds);
  const endLabel = mark.offline
    ? copy.offline
    : open
      ? copy.open
      : formatUptime(mark.uptimeEndSeconds);
  const span = mark.offline ? null : markSpanSeconds(mark);
  const statusText = markStatusLabel(mark.status, lang);

  const actionBtn =
    "inline-flex size-7 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40";

  return (
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-[20px] bg-zinc-900">
      <div className="flex flex-1 flex-col justify-center gap-0.5 px-3 pb-2 pt-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={cn("size-2 shrink-0 rounded-full", markStatusDotClass(mark.status))}
            title={statusText}
            aria-label={statusText}
          />
          <h3
            className="max-w-full truncate font-mono text-sm font-semibold tracking-tight text-zinc-100"
            dir="auto"
          >
            {markTitle(mark, lang)}
          </h3>
        </div>
        <p className="font-mono text-[0.68rem] tabular-nums text-zinc-400" dir="ltr">
          {startLabel}
          {" → "}
          {endLabel}
        </p>
        <p className="text-[0.68rem] text-zinc-500">
          {copy.duration}{" "}
          <span className="font-mono tabular-nums" dir="ltr">
            {mark.offline ? copy.offline : formatUptime(span)}
          </span>
        </p>
        {open || mark.offline ? (
          <p className="text-[0.6rem] uppercase tracking-wide text-zinc-500">
            {mark.offline ? copy.offline : copy.open}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-2 py-1.5">
        <label className="min-w-0">
          <span className="sr-only">{copy.status}</span>
          <select
            value={mark.status}
            onChange={(event) => onStatus(event.target.value as MarkStatus)}
            className="h-7 max-w-full rounded-md border-0 bg-transparent pe-1 text-[0.65rem] text-zinc-200 outline-none"
          >
            {MARK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {copy[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={copiedLink ? copy.shareMarkCopied : copy.shareMark}
            title={copiedLink ? copy.shareMarkCopied : copy.shareMark}
            onClick={onCopyLink}
            disabled={!canShare}
            className={actionBtn}
          >
            <Link2 className="size-3.5" aria-hidden />
          </button>
          <button type="button" aria-label={copy.edit} title={copy.edit} onClick={onEdit} className={actionBtn}>
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={copy.delete}
            title={copy.delete}
            onClick={onDelete}
            className={actionBtn}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

function MarkEditor({
  copy,
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  copy: MarksCopy;
  draft: { id?: string; note: string } | null;
  saving: boolean;
  onClose: () => void;
  onChange: (next: { id?: string; note: string }) => void;
  onSave: () => void;
}) {
  if (!draft) return null;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? copy.modalEdit : copy.modalCreate}</DialogTitle>
          <DialogDescription>{copy.modalHint}</DialogDescription>
        </DialogHeader>
        <label className="block">
          <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
            {copy.note}
          </span>
          <input
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value.slice(0, 280) })}
            placeholder={copy.notePlaceholder}
            className={field}
            dir="auto"
          />
        </label>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-4 py-2 text-[0.82rem]"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-zinc-100 px-4 py-2 text-[0.82rem] font-semibold text-zinc-900 disabled:opacity-60"
          >
            {copy.save}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
