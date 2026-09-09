import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactElement } from "react";
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
import { useLanguage } from "@/lib/i18n";
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

type Tool = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  preview: () => ReactElement;
  type?: WidgetType;
  keywords?: string;
  platforms: PlatformSectionId[];
};

type PlatformSectionId = "KICK" | "TWITCH" | "YOUTUBE" | "TIKTOK" | "GENERAL";

const PLATFORM_SECTIONS: {
  id: PlatformSectionId;
  title: { en: string; ar: string };
  accent: string;
  titleClass: string;
  badgeClass: string;
  icon: PlatformSectionId;
}[] = [
  {
    id: "KICK",
    title: { en: "Kick Stream Tools", ar: "أدوات بث كيك" },
    accent: "#53FC18",
    titleClass: "text-[#53FC18] [text-shadow:0_0_18px_rgba(83,252,24,0.55)]",
    badgeClass: "border-[#53FC18]/40 bg-[#53FC18]/10 shadow-[0_0_22px_-6px_#53FC18]",
    icon: "KICK",
  },
  {
    id: "TWITCH",
    title: { en: "Twitch Stream Tools", ar: "أدوات بث تويتش" },
    accent: "#9146FF",
    titleClass:
      "bg-[linear-gradient(90deg,#C7A8FF,#9146FF)] bg-clip-text text-transparent [filter:drop-shadow(0_0_14px_rgba(145,70,255,0.5))]",
    badgeClass: "border-[#9146FF]/40 bg-[#9146FF]/12 shadow-[0_0_22px_-6px_#9146FF]",
    icon: "TWITCH",
  },
  {
    id: "TIKTOK",
    title: { en: "TikTok Stream Tools", ar: "أدوات بث تيك توك" },
    accent: "#FE2C55",
    titleClass:
      "bg-[linear-gradient(90deg,#00F2FE,#FE2C55)] bg-clip-text text-transparent [filter:drop-shadow(0_0_14px_rgba(254,44,85,0.45))]",
    badgeClass: "border-[#FE2C55]/40 bg-[linear-gradient(135deg,rgba(0,242,254,0.16),rgba(254,44,85,0.16))] shadow-[0_0_22px_-6px_#FE2C55]",
    icon: "TIKTOK",
  },
  {
    id: "YOUTUBE",
    title: { en: "YouTube Stream Tools", ar: "أدوات بث يوتيوب" },
    accent: "#FF0000",
    titleClass: "text-[#FF0000]",
    badgeClass: "border-[#FF0000]/40 bg-[#FF0000]/10 shadow-[0_0_22px_-6px_#FF0000]",
    icon: "YOUTUBE",
  },
  {
    id: "GENERAL",
    title: { en: "General & Cross-Platform Utilities", ar: "أدوات عامة لكل المنصات" },
    accent: "#7DD3FC",
    titleClass:
      "bg-[linear-gradient(90deg,#E2E8F0,#7DD3FC)] bg-clip-text text-transparent [filter:drop-shadow(0_0_14px_rgba(125,211,252,0.4))]",
    badgeClass: "border-[#7DD3FC]/40 bg-[#7DD3FC]/10 shadow-[0_0_22px_-6px_#7DD3FC]",
    icon: "GENERAL",
  },
];

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
    platforms: ["KICK", "TWITCH", "YOUTUBE", "TIKTOK"],
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
    platforms: ["GENERAL"],
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
    platforms: ["GENERAL"],
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
  },
  {
    id: "kick-media-requests",
    name: "Media Requests",
    description:
      "Channel-point YouTube song requests with auto queue, approval rules and a dedicated OBS player.",
    category: "Kick",
    icon: PlaySquare,
    preview: MediaRequestPreview,
    keywords: "media request song request youtube kick channel points queue player",
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
            className="ms-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {lang === "ar" ? "تفعيل الكود" : "Activate code"}
          </button>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PLATFORM_SECTIONS.map((section) => {
          const tools = TOOLS.filter((tool) => tool.platforms.includes(section.id));
          if (tools.length === 0) return null;
          const isGeneral = section.id === "GENERAL";
          return (
            <section key={section.id} className={isGeneral ? "col-span-1 lg:col-span-2" : undefined}>
              <header className="flex items-center gap-4 py-2">
                <span
                  aria-hidden
                  className="h-px flex-1 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${section.accent})`,
                  }}
                />
                <h2 className={`shrink-0 text-center text-lg font-semibold tracking-tight ${section.titleClass}`}>
                  {lang === "ar" ? section.title.ar : section.title.en}
                </h2>
                <span
                  aria-hidden
                  className="h-px flex-1 rounded-full"
                  style={{
                    background: `linear-gradient(270deg, transparent, ${section.accent})`,
                  }}
                />
              </header>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {tools.map((tool) => {
                  const existing = existingFor(tool);
                  const Preview = tool.preview;
                  return (
                    <ToolCard
                      key={`${section.id}-${tool.id}`}
                      name={tool.name}
                      description={tool.description}
                      category={tool.category}
                      icon={tool.icon}
                      accent={section.accent}
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
            </section>
          );
        })}
      </div>


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
                    className="flex items-center gap-2 rounded-lg border border-[oklch(1_0_0/0.08)] px-3 py-2 text-[0.78rem]"
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
                      className="rounded-lg bg-[oklch(1_0_0/0.05)] p-1.5 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-red-500/20 hover:text-red-400"
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
              <div className="rounded-lg border border-[oklch(1_0_0/0.06)] p-2.5">
                <dt className="text-muted-foreground">Target</dt>
                <dd className="mt-0.5 font-medium">
                  {goalPreset.target.toLocaleString()} {goalPreset.unit}
                </dd>
              </div>
              <div className="rounded-lg border border-[oklch(1_0_0/0.06)] p-2.5">
                <dt className="text-muted-foreground">Triggers</dt>
                <dd className="mt-0.5 font-medium">{goalPreset.triggers.join(", ")}</dd>
              </div>
            </dl>

            <p className="mt-3 truncate rounded-lg border border-[oklch(1_0_0/0.06)] px-2.5 py-2 font-mono text-[0.68rem] text-muted-foreground">
              /overlay/&lt;token&gt;{goalOverlayParams(goalType)}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGoalModal(false)}
                className="rounded-lg border border-[oklch(1_0_0/0.1)] px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === "custom-goal"}
                onClick={() => void createGoalWidget()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
