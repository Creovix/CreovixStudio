import { useRef, useState } from "react";
import { Copy, ExternalLink, ImagePlus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { LinkInBioBento } from "@/components/link-in-bio/LinkInBioBento";
import { LinkInBioPage } from "@/components/link-in-bio/LinkInBioPage";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  handlesFromLinks,
  linksFromHandles,
  type HandleMap,
  type useLinkInBioDraft,
} from "@/hooks/useLinkInBioDraft";
import {
  AMBIENT_CHOICES,
  BENTO_SIZES,
  compressAvatarFile,
  compressBannerFile,
  compressGalleryFile,
  FONT_CHOICES,
  GALLERY_MAX_IMAGES,
  GRADIENT_CHOICES,
  LAYOUT_CHOICES,
  LINK_PLATFORMS,
  bentoSizeOf,
  normalizeLink,
  publicBioPath,
  sanitizeHandle,
  sanitizeSlug,
  spanFromBentoSize,
  urlFromHandle,
  type AmbientPreset,
  type BentoSize,
  type BioLayout,
  type GradientStyle,
  type LinkInBioLink,
  type LinkPlatform,
  type SurfaceStyle,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

type Draft = ReturnType<typeof useLinkInBioDraft>;

const label = "mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground";

export function LinkInBioDashboard({ draft, onReplay }: { draft: Draft; onReplay: () => void }) {
  const { profile, setProfile, theme, setTheme, links, setLinks, preview, persist, save, state, slugStatus } = draft;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [handles, setHandles] = useState<HandleMap>(() => handlesFromLinks(links));
  const saveTimer = useRef(0);
  const selected = links.find((link) => link.id === selectedId) ?? null;
  const publicUrl = profile.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${publicBioPath(profile.slug)}`
    : "";

  const queueSave = (nextProfile = profile, nextTheme = theme, nextLinks = links) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist(nextProfile, nextTheme, nextLinks).catch(() => toast.error("Could not save."));
    }, 360);
  };

  const patchProfile = (partial: Partial<typeof profile>) => {
    const next = { ...profile, ...partial };
    setProfile(next);
    queueSave(next, theme, links);
  };
  const patchTheme = (partial: Partial<typeof theme>) => {
    const next = { ...theme, ...partial };
    setTheme(next);
    queueSave(profile, next, links);
  };
  const patchLinks = (next: LinkInBioLink[]) => {
    setLinks(next);
    queueSave(profile, theme, next);
  };

  const onFile = async (file: File | undefined, kind: "avatar" | "header" | "banner") => {
    if (!file) return;
    const url = kind === "avatar" ? await compressAvatarFile(file) : await compressBannerFile(file);
    if (!url) {
      toast.error("Could not read that image.");
      return;
    }
    if (kind === "avatar") patchProfile({ avatarUrl: url });
    if (kind === "header") patchProfile({ headerUrl: url });
    if (kind === "banner") patchTheme({ widgetBannerUrl: url });
  };

  const applyPlatforms = (nextHandles: HandleMap) => {
    setHandles(nextHandles);
    patchLinks(linksFromHandles(nextHandles, links));
  };

  const addGallery = () => {
    const created = normalizeLink(
      {
        id: crypto.randomUUID(),
        title: "Gallery",
        url: "",
        platform: "custom",
        kind: "gallery",
        colSpan: 2,
        rowSpan: 2,
        galleryImages: [],
        enabled: true,
      },
      links.length,
    );
    const next = [...links, created];
    patchLinks(next);
    setSelectedId(created.id);
  };

  const publish = async (published: boolean) => {
    const next = { ...profile, published, setupCompleted: true, slug: sanitizeSlug(profile.slug) };
    setProfile(next);
    await persist(next, theme, links);
    toast.success(published ? "Published" : "Unpublished");
  };

  const liveFlags = preview.livePlatforms;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void publish(!profile.published)} disabled={!profile.slug || save.isPending}>
          {profile.published ? "Unpublish" : "Publish"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!publicUrl}
          onClick={() => {
            void navigator.clipboard.writeText(publicUrl);
            toast.success("Copied");
          }}
        >
          <Copy className="size-3.5" />
          Copy URL
        </Button>
        {publicUrl ? (
          <Button type="button" variant="outline" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Open page
            </a>
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onReplay}>
          <RotateCcw className="size-3.5" />
          Replay setup
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4 rounded-2xl border border-white/10 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Bento grid</h2>
              <p className="text-sm text-muted-foreground">Drag tiles onto cells. Pick a size in the inspector.</p>
            </div>
            <Button type="button" variant="outline" onClick={addGallery}>
              <ImagePlus className="size-3.5" />
              Add gallery
            </Button>
          </div>
          <div
            className="overflow-hidden rounded-2xl p-4"
            style={{ background: theme.paletteBg, color: theme.paletteFg }}
          >
            {links.filter((link) => link.enabled).length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Add platforms or a gallery to start the grid.</p>
            ) : (
              <LinkInBioBento
                links={preview.links}
                theme={theme}
                livePlatforms={liveFlags}
                editable
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={(id, gridX, gridY) =>
                  patchLinks(links.map((link) => (link.id === id ? { ...link, gridX, gridY } : link)))
                }
              />
            )}
          </div>
          {selected ? (
            <CardInspector
              link={selected}
              onChange={(next) => patchLinks(links.map((link) => (link.id === next.id ? next : link)))}
              onRemove={() => {
                patchLinks(links.filter((link) => link.id !== selected.id));
                setSelectedId(null);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select a tile to change size, position, or gallery photos.</p>
          )}
        </section>

        <aside className="space-y-4">
          <Panel title="Profile">
            <label className={label} htmlFor="dash-slug">
              Username
            </label>
            <Input
              id="dash-slug"
              value={profile.slug}
              onChange={(event) => patchProfile({ slug: sanitizeSlug(event.target.value) })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {slugStatus === "available" ? "Available." : slugStatus === "taken" ? "Taken." : slugStatus === "invalid" ? "Invalid username." : "Public path /u/…"}
            </p>
            <label className={cn(label, "mt-3")} htmlFor="dash-name">
              Display name
            </label>
            <Input id="dash-name" dir="auto" value={profile.displayName} onChange={(event) => patchProfile({ displayName: event.target.value })} />
            <label className={cn(label, "mt-3")} htmlFor="dash-bio">
              Bio
            </label>
            <Textarea
              id="dash-bio"
              dir="auto"
              className="min-h-28 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
              value={profile.bio}
              onChange={(event) => patchProfile({ bio: event.target.value })}
            />
            <div className="mt-3 grid gap-3">
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "avatar")} />
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "header")} />
            </div>
          </Panel>

          <Panel title="Theme & layout">
            <DarkSelect
              value={theme.layout}
              onValueChange={(value) => patchTheme({ layout: value as BioLayout })}
              options={LAYOUT_CHOICES.map((item) => ({ value: item.id, label: item.label }))}
            />
            <div className="mt-3 grid gap-3">
              <DarkSelect value={theme.fontFamily} onValueChange={(value) => patchTheme({ fontFamily: value })} options={FONT_CHOICES.map((item) => ({ value: item.id, label: item.label }))} />
              <DarkSelect
                value={theme.surfaceStyle}
                onValueChange={(value) => patchTheme({ surfaceStyle: value as SurfaceStyle })}
                options={[
                  { value: "glass", label: "Glass" },
                  { value: "flat", label: "Flat" },
                ]}
              />
              <DarkSelect value={theme.ambientPreset} onValueChange={(value) => patchTheme({ ambientPreset: value as AmbientPreset })} options={AMBIENT_CHOICES.map((item) => ({ value: item.id, label: item.label }))} />
              <DarkSelect value={theme.gradientStyle} onValueChange={(value) => patchTheme({ gradientStyle: value as GradientStyle })} options={GRADIENT_CHOICES.map((item) => ({ value: item.id, label: item.label }))} />
            </div>
            <div className="mt-3">
              <label className={label}>Glass {theme.glassIntensity}</label>
              <Slider value={[theme.glassIntensity]} max={100} onValueChange={([value]) => patchTheme({ glassIntensity: value ?? 0 })} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Switch checked={theme.ambientEnabled} onCheckedChange={(ambientEnabled) => patchTheme({ ambientEnabled })} />
              Interactive ambient
            </label>
          </Panel>

          <Panel title="Platforms">
            <div className="space-y-2">
              {LINK_PLATFORMS.map((platform) => (
                <label key={platform.id} className="block">
                  <span className={label}>{platform.label}</span>
                  <Input
                    dir="auto"
                    placeholder={platform.id === "custom" ? "https://your-site.com" : "handle"}
                    value={handles[platform.id] || handleFallback(links, platform.id)}
                    onChange={(event) =>
                      applyPlatforms({
                        ...handlesFromLinks(links),
                        ...handles,
                        [platform.id]: platform.id === "custom" ? event.target.value : sanitizeHandle(event.target.value),
                      })
                    }
                  />
                  {handles[platform.id] && platform.id !== "custom" ? (
                    <span className="mt-1 block text-[0.7rem] text-muted-foreground" dir="auto">
                      {urlFromHandle(platform.id, handles[platform.id])}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Widgets">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                Stream schedule
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {state?.scheduleShareToken ? "Links your public schedule." : "Create a schedule first."}
                </span>
              </span>
              <Switch
                checked={theme.scheduleEnabled}
                disabled={!state?.scheduleShareToken}
                onCheckedChange={(scheduleEnabled) => patchTheme({ scheduleEnabled })}
              />
            </label>
            <div className="mt-3">
              <label className={label}>Image banner</label>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "banner")} />
            </div>
            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span>Countdown</span>
              <Switch checked={theme.countdownEnabled} onCheckedChange={(countdownEnabled) => patchTheme({ countdownEnabled })} />
            </label>
            {theme.countdownEnabled ? (
              <div className="mt-3 space-y-2">
                <Input dir="auto" value={theme.countdownLabel} onChange={(event) => patchTheme({ countdownLabel: event.target.value })} />
                <Input
                  type="datetime-local"
                  value={localDateValue(theme.countdownEndsAt)}
                  onChange={(event) =>
                    patchTheme({ countdownEndsAt: event.target.value ? new Date(event.target.value).toISOString() : null })
                  }
                />
              </div>
            ) : null}
          </Panel>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <p className="border-b border-white/10 px-4 py-2 text-[0.72rem] uppercase tracking-wide text-muted-foreground">
              Live preview
            </p>
            <div className="max-h-[36rem] overflow-auto">
              <LinkInBioPage data={preview} preview />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function handleFallback(links: LinkInBioLink[], platform: LinkPlatform) {
  return handlesFromLinks(links)[platform] ?? "";
}

function CardInspector({
  link,
  onChange,
  onRemove,
}: {
  link: LinkInBioLink;
  onChange: (link: LinkInBioLink) => void;
  onRemove: () => void;
}) {
  const size = bentoSizeOf(link.colSpan, link.rowSpan);
  const addPhoto = async (file?: File) => {
    if (!file) return;
    if (link.galleryImages.length >= GALLERY_MAX_IMAGES) {
      toast.error(`Up to ${GALLERY_MAX_IMAGES} photos.`);
      return;
    }
    const url = await compressGalleryFile(file);
    if (!url) {
      toast.error("Could not read that image.");
      return;
    }
    onChange({
      ...link,
      galleryImages: [...link.galleryImages, { id: crypto.randomUUID(), url }],
    });
  };

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" dir="auto">
          {link.title || (link.kind === "gallery" ? "Gallery" : "Tile")}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <label className={cn(label, "mt-3")}>Title</label>
      <Input dir="auto" value={link.title} onChange={(event) => onChange({ ...link, title: event.target.value })} />
      <p className={cn(label, "mt-3")}>Size</p>
      <div className="flex flex-wrap gap-1">
        {BENTO_SIZES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs",
              size === item.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground",
            )}
            onClick={() => onChange({ ...link, ...spanFromBentoSize(item.id as BentoSize) })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Column</label>
          <Input
            type="number"
            min={0}
            max={3}
            value={link.gridX}
            onChange={(event) => onChange({ ...link, gridX: Number(event.target.value) })}
          />
        </div>
        <div>
          <label className={label}>Row</label>
          <Input
            type="number"
            min={0}
            max={40}
            value={link.gridY}
            onChange={(event) => onChange({ ...link, gridY: Number(event.target.value) })}
          />
        </div>
      </div>
      {link.kind === "gallery" ? (
        <div className="mt-3">
          <label className={label}>Photos</label>
          <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void addPhoto(event.target.files?.[0])} />
          <ul className="mt-2 grid grid-cols-4 gap-2">
            {link.galleryImages.map((image) => (
              <li key={image.id} className="relative overflow-hidden rounded-lg">
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-[0.65rem] text-white"
                  onClick={() => onChange({ ...link, galleryImages: link.galleryImages.filter((item) => item.id !== image.id) })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
