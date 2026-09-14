import { CalendarDays, ImagePlus, Timer } from "lucide-react";

import { ModuleCard } from "@/components/link-in-bio/wizard/wizardUi";
import { useWizard } from "@/components/link-in-bio/wizard/WizardProvider";
import { wizardUi } from "@/components/link-in-bio/wizard/wizardTokens";
import { LinkInBioPlatformLogo } from "@/components/link-in-bio/LinkInBioPlatformLogo";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LINK_PLATFORMS,
  platformAccent,
  sanitizeHandle,
  sanitizeWhatsappCommunityUrl,
  urlFromHandle,
  usesFullUrl,
  type LinkInBioTheme,
  type LinkPlatform,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

const WIZARD_PLATFORMS = LINK_PLATFORMS.filter((platform) => platform.id !== "custom");

function localDateValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function platformHint(id: LinkPlatform, value: string, filled: boolean) {
  if (id === "whatsapp") {
    if (!value) return "Community or group invite link — not a phone number";
    return sanitizeWhatsappCommunityUrl(value)
      ? value
      : "Use chat.whatsapp.com/… or whatsapp.com/channel/…";
  }
  if (filled && !usesFullUrl(id)) return urlFromHandle(id, value);
  return LINK_PLATFORMS.find((item) => item.id === id)?.hint ?? "";
}

export function PlatformsStep() {
  const { draft, handles, applyHandles, onFile } = useWizard();
  const { theme, setTheme, state } = draft;
  const scheduleReady = Boolean(state?.scheduleShareToken);
  const onTheme = (partial: Partial<LinkInBioTheme>) => setTheme((prev) => ({ ...prev, ...partial }));

  return (
    <Tabs defaultValue="platforms" className="flex h-full min-h-0 flex-col">
      <TabsList className={wizardUi.tabListPair}>
        <TabsTrigger value="platforms" className={wizardUi.tabTrigger}>
          Platforms
        </TabsTrigger>
        <TabsTrigger value="extras" className={wizardUi.tabTrigger}>
          Extras
        </TabsTrigger>
      </TabsList>

      <TabsContent value="platforms" className={wizardUi.tabBody}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {WIZARD_PLATFORMS.map((platform) => {
            const accent = platformAccent(platform.id);
            const value = handles[platform.id];
            const filled = Boolean(value);
            const fullUrl = usesFullUrl(platform.id);
            const whatsappInvalid =
              platform.id === "whatsapp" && Boolean(value) && !sanitizeWhatsappCommunityUrl(value);
            return (
              <label
                key={platform.id}
                className={cn(
                  "flex h-full min-h-[11rem] flex-col rounded-[1.35rem] border p-5 backdrop-blur-xl",
                  filled && !whatsappInvalid
                    ? "border-white/12 bg-white/[0.06]"
                    : "border-[rgba(255,255,255,0.08)] bg-white/[0.035] hover:border-white/12",
                  whatsappInvalid && "border-rose-400/35",
                )}
                style={
                  filled && !whatsappInvalid
                    ? {
                        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent.css} 38%, transparent), 0 18px 36px -28px ${accent.css}`,
                      }
                    : undefined
                }
              >
                <span className="flex items-center gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                    style={{ background: accent.css }}
                  >
                    <LinkInBioPlatformLogo
                      platform={platform.id}
                      size={22}
                      onBrand
                      surface={accent.css}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{platform.label}</span>
                    <span className="block truncate text-[0.68rem] text-white/40" dir="auto">
                      {platformHint(platform.id, value, filled)}
                    </span>
                  </span>
                </span>
                <Input
                  className="mt-auto h-10 rounded-2xl border-[rgba(255,255,255,0.08)] bg-black/35 text-sm placeholder:text-white/25 focus-visible:border-white/40 focus-visible:ring-2"
                  style={{ ["--tw-ring-color" as string]: `color-mix(in oklab, ${accent.css} 55%, white)` }}
                  dir="auto"
                  placeholder={
                    platform.id === "whatsapp"
                      ? "https://chat.whatsapp.com/… or whatsapp.com/channel/…"
                      : fullUrl
                        ? platform.hint
                        : "handle"
                  }
                  value={value}
                  onChange={(event) =>
                    applyHandles({
                      ...handles,
                      [platform.id]: fullUrl ? event.target.value : sanitizeHandle(event.target.value),
                    })
                  }
                />
              </label>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="extras" className={wizardUi.tabBody}>
        <div className="grid gap-3">
          <ModuleCard>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className={wizardUi.iconWell}>
                  <CalendarDays className="size-4 text-white/70" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Stream schedule</p>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-white/40">Pin your public calendar on the page.</p>
                </div>
              </div>
              <Switch
                checked={theme.scheduleEnabled}
                disabled={!scheduleReady}
                onCheckedChange={(scheduleEnabled) => onTheme({ scheduleEnabled })}
              />
            </div>
            {!scheduleReady ? <p className={cn(wizardUi.hint, "mt-3")}>Create a schedule first to enable it here.</p> : null}
          </ModuleCard>

          <ModuleCard>
            <div className="flex items-start gap-3">
              <span className={wizardUi.iconWell}>
                <ImagePlus className="size-4 text-white/70" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Image banner</p>
                <p className="mt-1 text-[0.68rem] leading-relaxed text-white/40">A wide promo image between your bio and tiles.</p>
                <Input
                  className="mt-4 h-10 rounded-2xl border-[rgba(255,255,255,0.08)] bg-black/35 text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-xs file:text-white/80"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => void onFile(event.target.files?.[0], "banner")}
                />
                {theme.widgetBannerUrl ? (
                  <p className={cn(wizardUi.hint, "mt-2")}>Banner added — it shows in the preview.</p>
                ) : null}
              </div>
            </div>
          </ModuleCard>

          <ModuleCard>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className={wizardUi.iconWell}>
                  <Timer className="size-4 text-white/70" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Countdown</p>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-white/40">A timer to a drop, launch, or next stream.</p>
                </div>
              </div>
              <Switch checked={theme.countdownEnabled} onCheckedChange={(countdownEnabled) => onTheme({ countdownEnabled })} />
            </div>
            {theme.countdownEnabled ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={wizardUi.label} htmlFor="bio-countdown-label">
                    Label
                  </label>
                  <Input
                    id="bio-countdown-label"
                    dir="auto"
                    className={wizardUi.field}
                    value={theme.countdownLabel}
                    onChange={(event) => onTheme({ countdownLabel: event.target.value })}
                  />
                </div>
                <div>
                  <label className={wizardUi.label} htmlFor="bio-countdown-ends">
                    Ends
                  </label>
                  <Input
                    id="bio-countdown-ends"
                    type="datetime-local"
                    className={wizardUi.field}
                    value={localDateValue(theme.countdownEndsAt)}
                    onChange={(event) =>
                      onTheme({ countdownEndsAt: event.target.value ? new Date(event.target.value).toISOString() : null })
                    }
                  />
                </div>
              </div>
            ) : null}
          </ModuleCard>
        </div>
      </TabsContent>
    </Tabs>
  );
}
