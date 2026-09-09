import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { DarkSelect } from "@/components/ui/dark-select";
import { TestSimulatePanel } from "@/components/widgets/TestSimulatePanel";
import { SubathonElementControlPanel } from "@/components/widgets/SubathonElementControlPanel";
import { OVERLAY_LAYOUTS, OVERLAY_TIME_FORMATS, parseOverlayTheme } from "@/lib/overlayTheme";
import type { TimerFrame } from "@/lib/timer";

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelClass =
  "text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

type TabId = "general" | "controls" | "test";

export function SubathonTimerSidebar({
  widgetId,
  subathonId,
  publicToken,
  name,
  onNameChange,
  config,
  onConfigChange,
  frame,
  remaining,
  onSaveConfig,
  onCopyUrl,
  copied,
  lang,
}: {
  widgetId: string;
  subathonId: string | null;
  publicToken: string;
  name: string;
  onNameChange: (next: string) => void;
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
  frame: TimerFrame | null;
  remaining: number;
  onSaveConfig: () => Promise<unknown> | void;
  onCopyUrl: () => void;
  copied: boolean;
  lang: "ar" | "en";
}) {
  const ar = lang === "ar";
  const [tab, setTab] = useState<TabId>("general");
  const theme = parseOverlayTheme(config);

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: ar ? "عام والتخطيط" : "General & Layout" },
    { id: "controls", label: ar ? "التحكم" : "Controls & Actions" },
    { id: "test", label: ar ? "اختبار وربط" : "Test & Integration" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-white/8 bg-black/20 p-1">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[0.7rem] font-semibold transition ${
              tab === entry.id
                ? "border border-primary/60 bg-primary/15 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>{ar ? "الاسم" : "Name"}</span>
            <input
              className={`${fieldClass} mt-2`}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>

          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4">
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {ar ? "إظهار العنوان" : "Show Title"}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {ar
                  ? "يخفي نص SUBATHON بجانب المؤقت في معاينة OBS"
                  : "Hides the SUBATHON text label next to the timer in the OBS preview"}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={theme.showLabel}
              onClick={() => onConfigChange("showLabel", !theme.showLabel)}
              className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${
                theme.showLabel ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                  theme.showLabel ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <label className="block">
            <span className={labelClass}>{ar ? "نمط التخطيط" : "Layout Style"}</span>
            <DarkSelect
              className="mt-2 text-foreground"
              contentClassName="bg-popover text-popover-foreground"
              value={theme.layout}
              onValueChange={(next) => onConfigChange("layout", next)}
              options={OVERLAY_LAYOUTS.map((entry) => ({
                value: entry.value,
                label: ar ? entry.labelAr : entry.label,
              }))}
            />
          </label>

          <label className="block">
            <span className={labelClass}>{ar ? "صيغة الوقت" : "Time format"}</span>
            <DarkSelect
              className="mt-2 text-foreground"
              contentClassName="bg-popover text-popover-foreground"
              value={theme.timeFormat}
              onValueChange={(next) => onConfigChange("timeFormat", next)}
              options={OVERLAY_TIME_FORMATS.map((entry) => ({
                value: entry.value,
                label: ar ? entry.labelAr : entry.label,
              }))}
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "accentColor", value: theme.accentColor, label: ar ? "اللون المميز" : "Accent" },
              { key: "textColor", value: theme.textColor, label: ar ? "لون النص" : "Text" },
              {
                key: "backgroundColor",
                value: theme.backgroundColor,
                label: ar ? "الخلفية" : "Background",
              },
            ].map((entry) => (
              <label key={entry.key} className="block">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {entry.label}
                </span>
                <input
                  type="color"
                  className="mt-2 h-9 w-full cursor-pointer rounded-lg border border-border bg-background"
                  value={entry.value}
                  onChange={(event) => onConfigChange(entry.key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className={labelClass}>
              {ar ? "شفافية الخلفية" : "Background opacity"} ({theme.backgroundOpacity}%)
            </span>
            <input
              type="range"
              min={0}
              max={100}
              className="mt-3 w-full accent-primary"
              value={theme.backgroundOpacity}
              disabled={theme.hideBackground}
              onChange={(event) =>
                onConfigChange("backgroundOpacity", Number(event.target.value))
              }
            />
          </label>

          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4">
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {ar ? "إخفاء حاوية الخلفية" : "Hide background container"}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {ar
                  ? "يعرض الأرقام والأيقونات فقط بخلفية شفافة تمامًا لـ OBS"
                  : "Shows only the timer text and icons on a fully transparent background"}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={theme.hideBackground}
              onClick={() => onConfigChange("hideBackground", !theme.hideBackground)}
              className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${
                theme.hideBackground ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                  theme.hideBackground ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <label className="block">
            <span className={labelClass}>
              {ar ? "حجم الخط" : "Font size"} ({theme.fontSize}px)
            </span>
            <input
              type="range"
              min={12}
              max={160}
              className="mt-3 w-full accent-primary"
              value={theme.fontSize}
              onChange={(event) => onConfigChange("fontSize", Number(event.target.value))}
            />
          </label>
        </div>
      ) : null}

      {tab === "controls" ? (
        <SubathonElementControlPanel
          widgetId={widgetId}
          subathonId={subathonId}
          frame={frame}
          remaining={remaining}
          config={config}
          onConfigChange={onConfigChange}
          onSaveConfig={onSaveConfig}
          lang={lang}
        />
      ) : null}

      {tab === "test" ? (
        <div className="space-y-4">
          <TestSimulatePanel widgetId={widgetId} type="SUBATHON_TIMER" lang={lang} />

          <div className="rounded-xl border border-border bg-background p-4">
            <p className={labelClass}>OBS browser source</p>
            <button
              type="button"
              onClick={onCopyUrl}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary"
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {ar ? "نسخ رابط OBS" : "Copy OBS URL"}
            </button>
            <code className="mt-3 block break-all text-xs text-muted-foreground">
              {`/overlay/subathon-timer?token=${publicToken}&layout=${theme.layout}`}
            </code>
          </div>
        </div>
      ) : null}
    </div>
  );
}
