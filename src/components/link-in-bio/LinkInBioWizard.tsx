import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { LinkInBioPage } from "@/components/link-in-bio/LinkInBioPage";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_HANDLES,
  handlesFromLinks,
  linksFromHandles,
  type HandleMap,
  type useLinkInBioDraft,
} from "@/hooks/useLinkInBioDraft";
import {
  AMBIENT_CHOICES,
  clampWizardStep,
  compressAvatarFile,
  compressBannerFile,
  FONT_CHOICES,
  GRADIENT_CHOICES,
  LAYOUT_CHOICES,
  LINK_IN_BIO_WIZARD_STEP_KEY,
  LINK_PLATFORMS,
  sanitizeHandle,
  sanitizeSlug,
  urlFromHandle,
  WIZARD_STEPS,
  type AmbientPreset,
  type BioLayout,
  type GradientStyle,
  type SurfaceStyle,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Claim your public URL", hint: "This is the only address people need." },
  { title: "Who should they meet?", hint: "Name, a short bio, and a face for the page." },
  { title: "Set the atmosphere", hint: "Bento is the default. Other layouts stay available." },
  { title: "Add your platforms", hint: "Type a handle. We build the link." },
  { title: "Choose tile sizes", hint: "You can drag them onto the grid after setup." },
  { title: "Optional extras", hint: "Schedule, a banner, or a countdown — then enter the studio." },
] as const;

const field = "h-12 rounded-2xl border-white/10 bg-white/5 text-base";
const label = "mb-2 block text-[0.72rem] font-medium uppercase tracking-[0.16em] text-white/45";

type Draft = ReturnType<typeof useLinkInBioDraft>;

export function LinkInBioWizard({
  draft,
  step,
  canExit,
  onExit,
}: {
  draft: Draft;
  step?: number;
  canExit: boolean;
  onExit: () => void;
}) {
  const navigate = useNavigate();
  const { profile, setProfile, theme, setTheme, links, setLinks, preview, slugStatus, save, persist, state } = draft;
  const [handles, setHandles] = useState<HandleMap>(EMPTY_HANDLES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    setHandles(handlesFromLinks(links));
    setReady(true);
  }, [links, ready]);

  const current = clampWizardStep(step ?? 1);
  const go = (next: number) => {
    const value = clampWizardStep(next);
    try {
      window.localStorage.setItem(LINK_IN_BIO_WIZARD_STEP_KEY, String(value));
    } catch {
      /* ignore */
    }
    void navigate({ to: "/link-in-bio", search: { setup: true, step: value }, replace: true });
  };

  const selected = useMemo(() => links.filter((link) => link.kind === "link" && link.enabled), [links]);

  const onFile = async (file: File | undefined, kind: "avatar" | "header" | "banner") => {
    if (!file) return;
    const url = kind === "avatar" ? await compressAvatarFile(file) : await compressBannerFile(file);
    if (!url) {
      toast.error("Could not read that image.");
      return;
    }
    if (kind === "avatar") setProfile((prev) => ({ ...prev, avatarUrl: url }));
    if (kind === "header") setProfile((prev) => ({ ...prev, headerUrl: url }));
    if (kind === "banner") setTheme((prev) => ({ ...prev, widgetBannerUrl: url }));
  };

  const canNext = current !== 1 || (Boolean(sanitizeSlug(profile.slug)) && slugStatus === "available");

  const onNext = async () => {
    if (!canNext) return;
    const nextLinks = current === 4 ? linksFromHandles(handles, links) : links;
    if (current === 4) setLinks(nextLinks);
    await persist(profile, theme, nextLinks);
    if (current < WIZARD_STEPS) go(current + 1);
  };

  const finish = async (publish: boolean) => {
    const next = { ...profile, setupCompleted: true, published: publish || profile.published };
    setProfile(next);
    await persist(next, theme, links);
    toast.success(publish ? "Published — opening studio." : "Setup saved.");
    onExit();
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#090b10] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_-10%,rgba(124,140,255,0.22),transparent_60%)]" />
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 md:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.2em] text-white/40">Creovix · Link in Bio</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/45">
            {current} / {WIZARD_STEPS}
          </span>
          {canExit ? (
            <button type="button" className="text-sm text-white/70 hover:text-white" onClick={onExit}>
              Back to studio
            </button>
          ) : null}
        </div>
      </header>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[min(96vw,80rem)] items-center px-5 py-24 md:px-8">
        <div className={cn("w-full", current >= 2 ? "grid items-start gap-10 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]" : "max-w-xl")}>
          <section>
            <p className="text-sm tabular-nums text-white/35">0{current}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{STEPS[current - 1]?.title}</h1>
            <p className="mt-3 text-lg text-white/55">{STEPS[current - 1]?.hint}</p>
            <div className="mt-10 space-y-6">
              {current === 1 ? (
                <div>
                  <label className={label} htmlFor="bio-slug">
                    Username
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">/u/</span>
                    <Input
                      id="bio-slug"
                      className={field}
                      value={profile.slug}
                      onChange={(event) => setProfile((prev) => ({ ...prev, slug: sanitizeSlug(event.target.value) }))}
                      placeholder="your-name"
                      autoFocus
                    />
                  </div>
                  <p className="mt-3 text-sm text-white/50">
                    {slugStatus === "checking"
                      ? "Checking availability…"
                      : slugStatus === "available"
                        ? "This username is available."
                        : slugStatus === "taken"
                          ? "That username is taken."
                          : slugStatus === "invalid"
                            ? "Use lowercase letters, numbers, and dashes."
                            : "Realtime check against saved usernames."}
                  </p>
                </div>
              ) : null}

              {current === 2 ? (
                <>
                  <div>
                    <label className={label} htmlFor="bio-name">
                      Display name
                    </label>
                    <Input
                      id="bio-name"
                      dir="auto"
                      className={field}
                      value={profile.displayName}
                      onChange={(event) => setProfile((prev) => ({ ...prev, displayName: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="bio-text">
                      Bio
                    </label>
                    <Textarea
                      id="bio-text"
                      dir="auto"
                      className="min-h-28 whitespace-pre-wrap break-words rounded-2xl border-white/10 bg-white/5 [overflow-wrap:anywhere]"
                      value={profile.bio}
                      onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Avatar</label>
                      <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "avatar")} />
                    </div>
                    <div>
                      <label className={label}>Header image</label>
                      <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "header")} />
                    </div>
                  </div>
                </>
              ) : null}

              {current === 3 ? (
                <>
                  <div>
                    <label className={label}>Layout</label>
                    <DarkSelect
                      value={theme.layout}
                      onValueChange={(value) => setTheme((prev) => ({ ...prev, layout: value as BioLayout }))}
                      options={LAYOUT_CHOICES.map((item) => ({ value: item.id, label: item.label }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Font</label>
                      <DarkSelect value={theme.fontFamily} onValueChange={(value) => setTheme((prev) => ({ ...prev, fontFamily: value }))} options={FONT_CHOICES.map((item) => ({ value: item.id, label: item.label }))} />
                    </div>
                    <div>
                      <label className={label}>Surface</label>
                      <DarkSelect
                        value={theme.surfaceStyle}
                        onValueChange={(value) => setTheme((prev) => ({ ...prev, surfaceStyle: value as SurfaceStyle }))}
                        options={[
                          { value: "glass", label: "Glass" },
                          { value: "flat", label: "Flat" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className={label}>Ambient</label>
                      <DarkSelect value={theme.ambientPreset} onValueChange={(value) => setTheme((prev) => ({ ...prev, ambientPreset: value as AmbientPreset }))} options={AMBIENT_CHOICES.map((item) => ({ value: item.id, label: item.label }))} />
                    </div>
                    <div>
                      <label className={label}>Glow</label>
                      <DarkSelect value={theme.gradientStyle} onValueChange={(value) => setTheme((prev) => ({ ...prev, gradientStyle: value as GradientStyle }))} options={GRADIENT_CHOICES.map((item) => ({ value: item.id, label: item.label }))} />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Glass {theme.glassIntensity}</label>
                    <Slider value={[theme.glassIntensity]} max={100} onValueChange={([value]) => setTheme((prev) => ({ ...prev, glassIntensity: value ?? 0 }))} />
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <Switch checked={theme.ambientEnabled} onCheckedChange={(ambientEnabled) => setTheme((prev) => ({ ...prev, ambientEnabled }))} />
                    Interactive ambient
                  </label>
                </>
              ) : null}

              {current === 4 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {LINK_PLATFORMS.map((platform) => (
                    <label key={platform.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <span className="text-sm font-semibold">{platform.label}</span>
                      <Input
                        className="mt-2 border-white/10 bg-white/5"
                        dir="auto"
                        placeholder={platform.id === "custom" ? "https://your-site.com" : "handle"}
                        value={handles[platform.id]}
                        onChange={(event) =>
                          setHandles((prev) => ({
                            ...prev,
                            [platform.id]: platform.id === "custom" ? event.target.value : sanitizeHandle(event.target.value),
                          }))
                        }
                      />
                      {handles[platform.id] && platform.id !== "custom" ? (
                        <span className="mt-1 block truncate text-[0.7rem] text-white/40" dir="auto">
                          {urlFromHandle(platform.id, handles[platform.id])}
                        </span>
                      ) : null}
                    </label>
                  ))}
                </div>
              ) : null}

              {current === 5 ? (
                selected.length === 0 ? (
                  <p className="text-white/50">No platforms yet. Skip and arrange later in the studio.</p>
                ) : (
                  <ul className="space-y-3">
                    {selected.map((link) => (
                      <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium" dir="auto">
                            {link.title}
                          </span>
                          <span className="block truncate text-xs text-white/40" dir="auto">
                            {link.url}
                          </span>
                        </span>
                        <div className="flex gap-1">
                          {(["1x1", "2x1", "1x2", "2x2"] as const).map((size) => {
                            const colSpan = size === "2x1" || size === "2x2" ? 2 : 1;
                            const rowSpan = size === "1x2" || size === "2x2" ? 2 : 1;
                            const active = link.colSpan === colSpan && link.rowSpan === rowSpan;
                            return (
                              <button
                                key={size}
                                type="button"
                                className={cn(
                                  "rounded-lg px-2 py-1 text-xs",
                                  active ? "bg-white text-zinc-950" : "bg-white/10 text-white/70",
                                )}
                                onClick={() =>
                                  setLinks((prev) =>
                                    prev.map((item) => (item.id === link.id ? { ...item, colSpan, rowSpan } : item)),
                                  )
                                }
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}

              {current === 6 ? (
                <>
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      Stream schedule
                      <span className="mt-1 block text-xs text-white/45">
                        {state?.scheduleShareToken ? "Adds your public schedule page." : "Create a schedule first — none is linked yet."}
                      </span>
                    </span>
                    <Switch
                      checked={theme.scheduleEnabled}
                      disabled={!state?.scheduleShareToken}
                      onCheckedChange={(scheduleEnabled) => setTheme((prev) => ({ ...prev, scheduleEnabled }))}
                    />
                  </label>
                  <div>
                    <label className={label}>Custom image banner</label>
                    <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "banner")} />
                  </div>
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span>Countdown timer</span>
                    <Switch checked={theme.countdownEnabled} onCheckedChange={(countdownEnabled) => setTheme((prev) => ({ ...prev, countdownEnabled }))} />
                  </label>
                  {theme.countdownEnabled ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        dir="auto"
                        className={field}
                        value={theme.countdownLabel}
                        onChange={(event) => setTheme((prev) => ({ ...prev, countdownLabel: event.target.value }))}
                      />
                      <Input
                        type="datetime-local"
                        className={field}
                        value={localDateValue(theme.countdownEndsAt)}
                        onChange={(event) =>
                          setTheme((prev) => ({
                            ...prev,
                            countdownEndsAt: event.target.value ? new Date(event.target.value).toISOString() : null,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
          {current >= 2 ? (
            <aside className="overflow-x-hidden overflow-y-auto rounded-[2rem] border border-white/10">
              <LinkInBioPage data={preview} preview />
            </aside>
          ) : null}
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#090b10]/80 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[min(96vw,80rem)] items-center justify-between gap-4">
          <Button type="button" variant="ghost" disabled={current === 1} onClick={() => go(current - 1)}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <ol className="hidden flex-1 gap-1 sm:flex">
            {STEPS.map((item, index) => (
              <li
                key={item.title}
                className={cn("h-1 flex-1 rounded-full", index + 1 <= current ? "bg-white" : "bg-white/15")}
              />
            ))}
          </ol>
          <div className="flex gap-2">
            {current !== 1 && current !== 6 ? (
              <Button type="button" variant="outline" onClick={() => void onNext()}>
                Skip
              </Button>
            ) : null}
            {current < WIZARD_STEPS ? (
              <Button type="button" onClick={() => void onNext()} disabled={!canNext || save.isPending}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => void finish(false)} disabled={save.isPending}>
                  Enter studio
                </Button>
                <Button type="button" onClick={() => void finish(true)} disabled={!profile.slug || save.isPending}>
                  Publish + studio
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function localDateValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
