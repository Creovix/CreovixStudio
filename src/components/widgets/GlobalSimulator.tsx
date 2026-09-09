import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, MessageSquare, Radio, Zap } from "lucide-react";

import { DarkSelect } from "@/components/ui/dark-select";
import { sendTestChatMessage, simulateStreamEvent } from "@/lib/simulate.functions";
import { syncTwitchEventSub } from "@/lib/eventsub.functions";
import type { WidgetRow } from "@/hooks/useWidgets";
import { WIDGET_LABEL, type WidgetType } from "@/lib/widgets";

/**
 * Unified simulator: fires real payloads through the production ingest pipeline
 * for any active overlay, so creators can verify Twitch / Kick / TikTok events
 * without waiting on a live audience.
 */
export function GlobalSimulator({
  widgets,
  lang,
}: {
  widgets: WidgetRow[];
  lang: "ar" | "en";
}) {
  const simulate = useServerFn(simulateStreamEvent);
  const testChat = useServerFn(sendTestChatMessage);
  const syncEvents = useServerFn(syncTwitchEventSub);
  const ar = lang === "ar";

  const [target, setTarget] = useState<string>(widgets[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const widgetId = target || widgets[0]?.id || "";

  const run = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const result = (await action()) as { ok?: boolean; error?: string };
      if (result && result.ok === false) {
        setMessage(
          result.error === "no_subathon"
            ? ar
              ? "أنشئ سباثون أولاً حتى تعمل القواعد."
              : "Create a subathon first so rules can apply."
            : `⚠️ ${result.error}`,
        );
      } else {
        setMessage(success);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const buttonClass =
    "flex items-center justify-center gap-2 rounded-xl border border-[oklch(1_0_0/0.08)] bg-[oklch(1_0_0/0.03)] px-3 py-2.5 text-xs font-semibold transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50";

  if (widgets.length === 0) {
    return (
      <div className="glass-3d rounded-2xl p-6 text-sm text-muted-foreground">
        {ar
          ? "أنشئ ويدجت واحدة على الأقل من تبويب OBS Overlays حتى تستخدم المحاكي."
          : "Create at least one overlay in the OBS Overlays tab to use the simulator."}
      </div>
    );
  }

  return (
    <div className="glass-3d space-y-4 rounded-2xl p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="size-4 text-primary" aria-hidden />
          {ar ? "🧪 المحاكي الموحّد المباشر" : "🧪 Live Unified Simulator"}
        </p>
        <p className="mt-1 text-[0.78rem] text-muted-foreground">
          {ar
            ? "اختبر أحداث Twitch وKick وTikTok عبر جميع الأوفرلايات النشطة."
            : "Test Twitch, Kick and TikTok events across all active overlays."}
        </p>
      </div>

      <label className="block">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {ar ? "الأوفرلاي المستهدف" : "Target overlay"}
        </span>
        <DarkSelect
          className="mt-2 w-full"
          value={widgetId}
          onValueChange={setTarget}
          options={widgets.map((widget) => ({
            value: widget.id,
            label: `${widget.name} — ${WIDGET_LABEL[widget.type as WidgetType] ?? widget.type}`,
          }))}
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy !== null}
          className={buttonClass}
          onClick={() =>
            void run(
              "twitch",
              () => simulate({ data: { widgetId, platform: "TWITCH", eventType: "FOLLOW" } }),
              ar ? "تم إرسال متابعة Twitch ✅" : "Twitch follow sent ✅",
            )
          }
        >
          <Zap className="size-4" aria-hidden />
          {busy === "twitch" ? "…" : ar ? "محاكاة متابعة Twitch" : "Simulate Twitch Follow"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          className={buttonClass}
          onClick={() =>
            void run(
              "kick",
              () => simulate({ data: { widgetId, platform: "KICK", eventType: "SUBSCRIPTION" } }),
              ar ? "تم إرسال اشتراك Kick ✅" : "Kick sub sent ✅",
            )
          }
        >
          <Zap className="size-4" aria-hidden />
          {busy === "kick" ? "…" : ar ? "محاكاة اشتراك Kick" : "Simulate Kick Sub"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          className={buttonClass}
          onClick={() =>
            void run(
              "tiktok",
              () =>
                simulate({
                  data: { widgetId, platform: "TIKTOK", eventType: "GIFT_SUB", amount: 1 },
                }),
              ar ? "تم إرسال هدية TikTok ✅" : "TikTok gift sent ✅",
            )
          }
        >
          <Zap className="size-4" aria-hidden />
          {busy === "tiktok" ? "…" : ar ? "محاكاة هدية TikTok" : "Simulate TikTok Gift"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          className={buttonClass}
          onClick={() =>
            void run(
              "chat",
              () => testChat({ data: { widgetId } }),
              ar ? "تم إرسال رسالة تجريبية ✅" : "Test chat message sent ✅",
            )
          }
        >
          <MessageSquare className="size-4" aria-hidden />
          {busy === "chat" ? "…" : ar ? "رسالة دردشة تجريبية" : "Send Test Chat Message"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          className={`${buttonClass} sm:col-span-2`}
          onClick={() =>
            void run(
              "eventsub",
              () => syncEvents({}),
              ar ? "تم تفعيل أحداث Twitch المباشرة ✅" : "Twitch live events enabled ✅",
            )
          }
        >
          <Radio className="size-4" aria-hidden />
          {busy === "eventsub"
            ? "…"
            : ar
              ? "تفعيل أحداث Twitch المباشرة"
              : "Enable Twitch live events"}
        </button>
      </div>

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <p className="text-[11px] text-muted-foreground">
        {ar
          ? "كل زر يمر عبر نفس مسار الأحداث الحقيقي ويبث التحديث فوراً إلى OBS."
          : "Every button runs the real ingest pipeline and broadcasts instantly to OBS."}
      </p>
    </div>
  );
}
