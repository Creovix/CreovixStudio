import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactElement } from "react";
import {
  Gauge,
  Lock,
  MessageSquare,
  Pin,
  PlaySquare,
  Sparkles,
  Timer,
  Trophy,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { DeleteWidgetDialog } from "@/components/widgets/DeleteWidgetDialog";
import { RedeemCodeModal } from "@/components/subscription/RedeemCodeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase/client";
import { ToolCard } from "@/components/hub/ToolCard";
import {
  ALL_PLATFORMS,
  FILTER_ORDER,
  PLATFORM_META,
  type PlatformFilter,
  type PlatformId,
} from "@/components/hub/platforms";

import {
  ChatPreview,
  CustomGoalPreview,
  EmotePreview,
  SpotlightPreview,
  TappersPreview,
  TapGoalPreview,
  GoalTypePreview,
  MediaRequestPreview,
  TimerPreview,
} from "@/components/hub/previews";
import {
  GOAL_TYPES,
  DEFAULT_GOAL_TYPE,
  goalOverlayParams,
  goalTypePreset,
  type GoalTypeId,
} from "@/lib/goalTypes";
import { useQuery } from "@tanstack/react-query";
import { getMediaRequestDashboard } from "@/lib/mediaRequests.functions";
import { useWidgets } from "@/hooks/useWidgets";
import { useWorkspace } from "@/hooks/useWorkspace";
import { createWidget } from "@/lib/createWidget";
import type { WidgetType } from "@/lib/widgets";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { isTestMode } from "@/lib/testMode";
import { DarkSelect } from "@/components/ui/dark-select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Widget Hub — Creovix Studio" },
      {
        name: "description",
        content:
          "Discover, open and customize every streaming widget: timers, goals, alerts, chat, wheels, emote rain and more.",
      },
      { property: "og:title", content: "Widget Hub — Creovix Studio" },
      {
        property: "og:description",
        content: "Everything you need to build, customize, and control your stream.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const HUB_INITIAL_VISIBLE = 12;
const HUB_LOAD_MORE = 8;

type Tool = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  preview: () => ReactElement;
  type?: WidgetType;
  keywords?: string;
  platforms: PlatformId[];
  comingSoon?: boolean;
};

const FILTER_KEYS: Record<PlatformFilter, TranslationKey> = {
  ALL: "home.filterAll",
  KICK: "home.filterKick",
  TWITCH: "home.filterTwitch",
  YOUTUBE: "home.filterYouTube",
  TIKTOK: "home.filterTikTok",
};

const TOOLS: Tool[] = [
  {
    id: "chat-box",
    name: "Chat box",
    description: "Live platform chat with Dynamic Island, speech bubble or transparent layouts.",
    category: "Chat",
    icon: MessageSquare,
    preview: ChatPreview,
    type: "CHAT_BOX",
    keywords: "chat messages live island bubbles transparent",
    platforms: [...ALL_PLATFORMS],
  },
  {
    id: "subathon-timer",
    name: "Subathon timer",
    description: "Visual timer editor with a dedicated Rules & Logic sub-tab.",
    category: "Subathon",
    icon: Timer,
    preview: TimerPreview,
    type: "SUBATHON_TIMER",
    keywords: "countdown subathon clock timer rules logic",
    platforms: [...ALL_PLATFORMS],
  },
  {
    id: "custom-goal",
    name: "Goal bar",
    description: "Progress goals for followers, subscribers, donations or custom targets.",
    category: "Goals",
    icon: Gauge,
    preview: CustomGoalPreview,
    type: "GOAL_BAR",
    keywords: "goal donation follower subscriber custom progress bar target",
    platforms: [...ALL_PLATFORMS],
  },
  {
    id: "chat-spotlight",
    name: "Chat spotlight",
    description: "Pin one chat message to a premium glass card on your OBS overlay.",
    category: "Chat",
    icon: Pin,
    preview: SpotlightPreview,
    type: "CHAT_SPOTLIGHT",
    keywords: "spotlight pin highlight featured message chat",
    platforms: ["KICK", "TWITCH"],
  },
  {
    id: "tiktok-tappers",
    name: "Top Tappers Overlay",
    description: "Live TikTok tap leaderboard with animated ranks and instant reordering.",
    category: "TikTok",
    icon: Trophy,
    preview: TappersPreview,
    type: "TIKTOK_TAPPERS",
    keywords: "tiktok taps likes leaderboard top tappers ranking",
    platforms: ["TIKTOK"],
    comingSoon: true,
  },
  {
    id: "tiktok-tap-goal",
    name: "TikTok Tap Goal Overlay",
    description: "Progress bar toward a total tap target with live percentage and confetti.",
    category: "TikTok",
    icon: Gauge,
    preview: TapGoalPreview,
    type: "TIKTOK_TAP_GOAL",
    keywords: "tiktok taps likes goal target progress bar confetti",
    platforms: ["TIKTOK"],
    comingSoon: true,
  },
  {
    id: "kick-media-requests",
    name: "Media Requests",
    description:
      "Channel-point song requests from YouTube, Spotify, Anghami and SoundCloud with a moderated queue and OBS player.",
    category: "Kick",
    icon: PlaySquare,
    preview: MediaRequestPreview,
    keywords: "media request song request youtube spotify anghami soundcloud kick channel points queue player",
    platforms: ["KICK"],
  },
  {
    id: "emote-rain",
    name: "Emote rain",
    description: "Falling emotes triggered by chat spam, gifts and hype events.",
    category: "Utilities",
    icon: Sparkles,
    preview: EmotePreview,
    type: "EMOTE_RAIN",
    keywords: "emote rain particles hype gifts",
    platforms: ["KICK", "TWITCH"],
  },
];

function HomePage() {
  const { user } = Route.useRouteContext();
  const { data: workspace } = useWorkspace(user.id);
  const widgets = useWidgets();
  const mediaRequests = useQuery({
    queryKey: ["media-requests"],
    queryFn: () => getMediaRequestDashboard(),
    staleTime: 60_000,
    enabled: !isTestMode(),
  });
  const mediaOverlayUrl =
    typeof window !== "undefined" && mediaRequests.data?.settings?.overlay_token
      ? `${window.location.origin}/overlay/media-request?token=${mediaRequests.data.settings.overlay_token}`
      : undefined;
  const subscription = useSubscription(user.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useLanguage();
  const locked = subscription.isSuccess && !subscription.data.isActive;
  const lockLabel = lang === "ar" ? "يتطلب اشتراك" : "Subscription required";

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goalModal, setGoalModal] = useState(false);
  const [redeemModal, setRedeemModal] = useState(false);
  const [goalType, setGoalType] = useState<GoalTypeId>(DEFAULT_GOAL_TYPE);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("ALL");
  const [visibleCount, setVisibleCount] = useState(HUB_INITIAL_VISIBLE);

  const visibleTools = TOOLS.filter(
    (tool) => platformFilter === "ALL" || tool.platforms.includes(platformFilter),
  ).sort((a, b) => Number(Boolean(a.comingSoon)) - Number(Boolean(b.comingSoon)));
  const shownTools = visibleTools.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(HUB_INITIAL_VISIBLE);
  }, [platformFilter]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    setError(null);
    try {
      const { error: writeError } = await supabase.from("widgets").delete().eq("id", target.id);
      if (writeError) throw writeError;
      setPendingDelete(null);
      setRemovingId(target.id);
      // Let the card fade/scale out before the query cache drops it.
      await new Promise((resolve) => setTimeout(resolve, 260));
      await queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setRemovingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this widget.");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const goalWidgets = widgets.data?.widgets.filter((widget) => widget.type === "GOAL_BAR") ?? [];

  const existingFor = (tool: Tool) =>
    tool.id === "custom-goal"
      ? (goalWidgets[0] ?? null)
      : tool.type
      ? (widgets.data?.widgets.find(
          (widget) => widget.type === tool.type && widget.name === tool.name,
        ) ?? null)
      : null;

  const goalPreset = goalTypePreset(goalType);

  const createGoalWidget = async () => {
    setError(null);
    setBusy("custom-goal");
    try {
      const widget = await createWidget({
        userId: user.id,
        subathonId: workspace?.subathons[0]?.id ?? null,
        type: "GOAL_BAR",
        name: `${goalPreset.title}`,
        goalType,
      });
      await queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setGoalModal(false);
      navigate({ to: "/widgets/$widgetId", params: { widgetId: widget.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this goal.");
    } finally {
      setBusy(null);
    }
  };

  const open = async (tool: Tool) => {
    if (tool.comingSoon) return;
    if (locked) {
      setRedeemModal(true);
      return;
    }
    if (tool.id === "custom-goal") {
      setGoalModal(true);
      return;
    }
    if (tool.id === "kick-media-requests") {
      navigate({ to: "/media-requests" });
      return;
    }

    if (!tool.type) return;
    setError(null);
    const existing = existingFor(tool);
    if (existing) {
      navigate({ to: "/widgets/$widgetId", params: { widgetId: existing.id } });
      return;
    }
    setBusy(tool.id);
    try {
      const widget = await createWidget({
        userId: user.id,
        subathonId: workspace?.subathons[0]?.id ?? null,
        type: tool.type,
        name: tool.name,
      });
      await queryClient.invalidateQueries({ queryKey: ["widgets"] });
      navigate({ to: "/widgets/$widgetId", params: { widgetId: widget.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open this tool.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell
      user={user}
      profile={workspace?.profile}
      title={t("home.title")}
      subtitle={t("home.subtitle")}
    >
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {locked ? (
        <div className="glass-3d mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-red-500/25 p-4">
          <span className="grid size-9 place-items-center rounded-xl bg-red-500/15 text-red-400">
            <Lock className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.85rem] font-medium">
              {lang === "ar" ? "الاشتراك غير مفعّل" : "Subscription required"}
            </p>
            <p className="text-[0.76rem] text-muted-foreground">
              {lang === "ar"
                ? "أدخل كود الترخيص المكوّن من 16 حرفاً لفتح جميع الأدوات وروابط OBS."
                : "Enter your 16-character license code to unlock all widgets and OBS links."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRedeemModal(true)}
            className="ms-auto rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {lang === "ar" ? "تفعيل الكود" : "Activate code"}
          </button>
        </div>
      ) : null}

      <div
        role="toolbar"
        aria-label={t("home.platformFilter")}
        className="mb-5 flex flex-wrap items-center gap-1"
      >
        {FILTER_ORDER.map((id) => {
          const active = platformFilter === id;
          const color = id === "ALL" ? "var(--foreground)" : PLATFORM_META[id].color;
          const label = t(FILTER_KEYS[id]);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setPlatformFilter((prev) => (prev === id && id !== "ALL" ? "ALL" : id))}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={active && id !== "ALL" ? { color } : undefined}
            >
              {id === "ALL" ? (
                <span className="flex items-center gap-2" aria-hidden>
                  {ALL_PLATFORMS.map((dot) => (
                    <span
                      key={dot}
                      className="size-1.5 rounded-full"
                      style={{ background: PLATFORM_META[dot].color }}
                    />
                  ))}
                </span>
              ) : (
                <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {visibleTools.length === 0 ? (
        <p className="py-12 text-sm text-muted-foreground">{t("home.empty")}</p>
      ) : (
        <>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
            {shownTools.map((tool) => {
              const existing = existingFor(tool);
              const Preview = tool.preview;
              return (
                <ToolCard
                  key={tool.id}
                  name={tool.name}
                  description={tool.description}
                  category={tool.category}
                  icon={tool.icon}
                  platforms={tool.platforms}
                  comingSoon={Boolean(tool.comingSoon)}
                  preview={<Preview />}
                  status={
                    tool.id === "kick-media-requests"
                      ? "Live"
                      : existing?.is_enabled
                        ? "Live"
                        : existing
                          ? "Paused"
                          : "Ready"
                  }
                  live={Boolean(existing?.is_enabled)}
                  publicToken={existing?.public_token}
                  overlayUrl={tool.id === "kick-media-requests" ? mediaOverlayUrl : undefined}
                  disabled={busy === tool.id}
                  actionLabel={
                    tool.id === "kick-media-requests"
                      ? "Open queue"
                      : busy === tool.id
                        ? "Opening…"
                        : existing
                          ? "Customize"
                          : "Open"
                  }
                  onOpen={() => void open(tool)}
                  removing={Boolean(existing && removingId === existing.id)}
                  deleteLabel={t("home.delete")}
                  locked={locked}
                  lockLabel={lockLabel}
                  onDelete={
                    existing && !locked
                      ? () => setPendingDelete({ id: existing.id, name: existing.name })
                      : undefined
                  }
                />
              );
            })}
          </div>
          {visibleTools.length > visibleCount ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + HUB_LOAD_MORE)}
                className="rounded-full px-3 py-1.5 text-[0.78rem] text-muted-foreground hover:text-foreground"
              >
                {t("home.loadMore")}
              </button>
            </div>
          ) : null}
        </>
      )}


      {goalModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Customize custom goal"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setGoalModal(false)}
        >
          <div
            className="glass-3d w-full max-w-lg rounded-2xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-medium tracking-tight">Custom goal</h2>
            <p className="mt-1 text-[0.78rem] text-muted-foreground">
              Pick a goal type — targets, labels, triggers, colors and the OBS URL update instantly.
            </p>

            {goalWidgets.length > 0 ? (
              <div className="mt-4 space-y-1.5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Your goals
                </p>
                {goalWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-2 rounded-xl border border-[oklch(1_0_0/0.08)] px-3 py-2 text-[0.78rem]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setGoalModal(false);
                        navigate({ to: "/widgets/$widgetId", params: { widgetId: widget.id } });
                      }}
                      className="flex min-w-0 flex-1 items-center justify-between hover:text-primary"
                    >
                      <span className="truncate">{widget.name}</span>
                      <span className="text-[0.68rem] text-muted-foreground">Edit</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${t("home.delete")}: ${widget.name}`}
                      onClick={() => {
                        setGoalModal(false);
                        setPendingDelete({ id: widget.id, name: widget.name });
                      }}
                      className="rounded-xl bg-[oklch(1_0_0/0.05)] p-1.5 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ))}

              </div>
            ) : null}

            <label className="mt-4 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Goal type / نوع الهدف
            </label>
            <DarkSelect
              value={goalType}
              onValueChange={(next) => setGoalType(next as GoalTypeId)}
              className="mt-2 w-full"
              options={GOAL_TYPES.map((preset) => ({
                value: preset.id,
                label: `${preset.emoji} ${preset.labelEn} / ${preset.labelAr}`,
              }))}
            />

            <div className="mt-4 h-[120px] overflow-hidden rounded-xl border border-[oklch(1_0_0/0.06)] bg-[oklch(1_0_0/0.02)]">
              <GoalTypePreview
                label={goalPreset.overlayLabel}
                current={goalPreset.previewCurrent}
                target={goalPreset.target}
                unit={goalPreset.unit}
                accent={goalPreset.accentColor}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-[0.72rem]">
              <div className="rounded-xl border border-[oklch(1_0_0/0.06)] p-2.5">
                <dt className="text-muted-foreground">Target</dt>
                <dd className="mt-0.5 font-medium">
                  {goalPreset.target.toLocaleString()} {goalPreset.unit}
                </dd>
              </div>
              <div className="rounded-xl border border-[oklch(1_0_0/0.06)] p-2.5">
                <dt className="text-muted-foreground">Triggers</dt>
                <dd className="mt-0.5 font-medium">{goalPreset.triggers.join(", ")}</dd>
              </div>
            </dl>

            <p className="mt-3 truncate rounded-xl border border-[oklch(1_0_0/0.06)] px-2.5 py-2 font-mono text-[0.68rem] text-muted-foreground">
              /overlay/&lt;token&gt;{goalOverlayParams(goalType)}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGoalModal(false)}
                className="rounded-xl border border-[oklch(1_0_0/0.1)] px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === "custom-goal"}
                onClick={() => void createGoalWidget()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy === "custom-goal" ? "Creating…" : "Create goal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <DeleteWidgetDialog
          widgetName={pendingDelete.name}
          pending={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}

      {redeemModal ? <RedeemCodeModal onClose={() => setRedeemModal(false)} /> : null}
    </AppShell>
  );
}
