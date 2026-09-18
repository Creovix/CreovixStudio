import { useRef, useState } from "react";
import { Check, Copy, ExternalLink, ImagePlus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { LinkInBioBento } from "@/components/link-in-bio/LinkInBioBento";
import { LinkInBioPage } from "@/components/link-in-bio/LinkInBioPage";
import { PlatformHandleDock } from "@/components/link-in-bio/PlatformHandleDock";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  applyBentoPlacement,
  bentoSizeOf,
  isLightBioTheme,
  normalizeLink,
  publicBioPath,
  sanitizeSlug,
  spanFromBentoSize,
  usernameCooldownActive,
  usernameUnlockLabel,
  type AmbientPreset,
  type BentoSize,
  type BioLayout,
  type GradientStyle,
  type LinkInBioLink,
  type SurfaceStyle,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

type Draft = ReturnType<typeof useLinkInBioDraft>;

const label = "mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground";

export function LinkInBioDashboard({ draft, onReplay }: { draft: Draft; onReplay: () => void }) {
  const { profile, setProfile, theme, setTheme, links, setLinks, preview, persist, save, state, slugStatus } = draft;
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [handles, setHandles] = useState<HandleMap>(() => handlesFromLinks(links));
  const slugLocked = usernameCooldownActive(profile.usernameChangedAt);
  const unlockOn = usernameUnlockLabel(profile.usernameChangedAt);
  const saveTimer = useRef(0);
  const selected = links.find((link) => link.id === selectedId) ?? null;
  const lightPage = isLightBioTheme(theme.paletteBg);
  const publicUrl = profile.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${publicBioPath(profile.slug)}`
    : "";

  const queueSave = (nextProfile = profile, nextTheme = theme, nextLinks = links) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist(nextProfile, nextTheme, nextLinks).catch((error: Error) =>
        toast.error(error.message === "slug_cooldown" ? "Usernames can only be changed once every 30 days." : "Could not save."),
      );
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

  const copyPublicUrl = async () => {
    if (!publicUrl) {
      toast.error("Set a username before copying your page link.");
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const liveFlags = preview.livePlatforms;

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {editing ? (
        <>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setEditing(false)}>
            Done
          </Button>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => void publish(!profile.published)}
            disabled={!profile.slug || save.isPending}
          >
            {profile.published ? "Unpublish" : "Publish"}
          </Button>
        </>
      ) : (
        <Button type="button" className="min-h-11" onClick={() => setEditing(true)}>
          Edit page
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={!publicUrl}
        onClick={() => void copyPublicUrl()}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy Link"}
      </Button>
      {publicUrl ? (
        <Button type="button" variant="outline" className="min-h-11" asChild>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Open page
          </a>
        </Button>
      ) : null}
      <Button type="button" variant="ghost" className="min-h-11" onClick={onReplay}>
        <RotateCcw className="size-3.5" />
        Replay setup
      </Button>
    </div>
  );

  if (!editing) {
    return (
      <div className="space-y-6">
        {actions}
        <button
          type="button"
          className="block w-full overflow-hidden rounded-2xl border border-white/10 text-start outline-none transition-colors hover:border-white/20 focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={onReplay}
        >
          <p className="border-b border-white/10 px-4 py-2 text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            Your page · click to replay setup
          </p>
          <div className="pointer-events-none max-h-[52rem] overflow-auto">
            <LinkInBioPage data={preview} preview />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actions}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="space-y-4 rounded-2xl border border-white/10 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Bento grid</h2>
              <p className="text-sm text-muted-foreground">Drag tiles to move. Drag edges or corners to resize.</p>
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
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
                <p className="text-sm font-medium text-foreground/90">Grid is empty</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Add platforms in the Platforms tab or create a gallery to start arranging tiles.
                </p>
              </div>
            ) : (
              <LinkInBioBento
                links={preview.links}
                theme={theme}
                livePlatforms={liveFlags}
                tilePreviews={preview.tilePreviews}
                arrangeMode
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={(id, gridX, gridY) =>
                  patchLinks(applyBentoPlacement(links, id, { gridX, gridY }))
                }
                onResize={(id, colSpan, rowSpan, gridX, gridY) =>
                  patchLinks(applyBentoPlacement(links, id, { colSpan, rowSpan, gridX, gridY }))
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

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <Tabs defaultValue="profile">
              <div className="border-b border-white/10 p-2">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-white/[0.04] p-1">
                  <TabsTrigger value="profile" className="rounded-lg px-2 py-1.5 text-xs">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="theme" className="rounded-lg px-2 py-1.5 text-xs">
                    Theme
                  </TabsTrigger>
                  <TabsTrigger value="platforms" className="rounded-lg px-2 py-1.5 text-xs">
                    Platforms
                  </TabsTrigger>
                  <TabsTrigger value="widgets" className="rounded-lg px-2 py-1.5 text-xs">
                    Widgets
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="mt-0 max-h-[min(72vh,42rem)] space-y-5 overflow-y-auto p-5">
                <Field
                  htmlFor="dash-slug"
                  title="Username"
                  hint={slugLocked ? `Locked until ${unlockOn}.` : slugHint(slugStatus)}
                >
                  <Input
                    id="dash-slug"
                    value={profile.slug}
                    disabled={slugLocked}
                    onChange={(event) => patchProfile({ slug: sanitizeSlug(event.target.value) })}
                  />
                </Field>
                <Field htmlFor="dash-name" title="Display name">
                  <Input
                    id="dash-name"
                    dir="auto"
                    value={profile.displayName}
                    onChange={(event) => patchProfile({ displayName: event.target.value })}
                  />
                </Field>
                <Field htmlFor="dash-bio" title="Bio">
                  <Textarea
                    id="dash-bio"
                    dir="auto"
                    className="min-h-28 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                    value={profile.bio}
                    onChange={(event) => patchProfile({ bio: event.target.value })}
                  />
                </Field>
                <Separator className="bg-white/10" />
                <Field title="Avatar">
                  <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "avatar")} />
                </Field>
                <Field title="Header image">
                  <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "header")} />
                  {profile.headerUrl ? (
                    <button
                      type="button"
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => patchProfile({ headerUrl: "" })}
                    >
                      Remove banner
                    </button>
                  ) : null}
                </Field>
              </TabsContent>

              <TabsContent value="theme" className="mt-0 max-h-[min(72vh,42rem)] space-y-5 overflow-y-auto p-5">
                <Field title="Layout">
                  <DarkSelect
                    value={theme.layout}
                    onValueChange={(value) => patchTheme({ layout: value as BioLayout })}
                    options={LAYOUT_CHOICES.map((item) => ({ value: item.id, label: item.label }))}
                  />
                </Field>
                <Field title="Font">
                  <DarkSelect
                    value={theme.fontFamily}
                    onValueChange={(value) => patchTheme({ fontFamily: value })}
                    options={[
                      ...FONT_CHOICES.map((item) => ({ value: item.id, label: item.label })),
                      { value: "custom", label: "Custom" },
                    ]}
                  />
                </Field>
                {theme.fontFamily === "custom" ? (
                  <>
                    <Field title="Custom font name">
                      <Input
                        value={theme.fontCustomName}
                        placeholder="Satoshi"
                        onChange={(event) => patchTheme({ fontCustomName: event.target.value })}
                      />
                    </Field>
                    <Field title="Custom font URL">
                      <Input
                        value={theme.fontCustomHref}
                        placeholder="https://…/font.css or .woff2"
                        onChange={(event) => patchTheme({ fontCustomHref: event.target.value })}
                      />
                    </Field>
                  </>
                ) : null}
                <Separator className="bg-white/10" />
                <Field title="Surface">
                  <DarkSelect
                    value={theme.surfaceStyle}
                    onValueChange={(value) => patchTheme({ surfaceStyle: value as SurfaceStyle })}
                    options={[
                      { value: "glass", label: "Glass" },
                      { value: "flat", label: "Flat" },
                    ]}
                  />
                </Field>
                <Field title={`Glass ${theme.glassIntensity}`}>
                  <Slider value={[theme.glassIntensity]} max={100} onValueChange={([value]) => patchTheme({ glassIntensity: value ?? 0 })} />
                </Field>
                <Separator className="bg-white/10" />
                {lightPage ? (
                  <>
                    <Field title="Ambient">
                      <DarkSelect
                        value={theme.ambientPreset}
                        onValueChange={(value) => patchTheme({ ambientPreset: value as AmbientPreset })}
                        options={AMBIENT_CHOICES.map((item) => ({ value: item.id, label: item.label }))}
                      />
                    </Field>
                    <Field title="Glow">
                      <DarkSelect
                        value={theme.gradientStyle}
                        onValueChange={(value) => patchTheme({ gradientStyle: value as GradientStyle })}
                        options={GRADIENT_CHOICES.map((item) => ({ value: item.id, label: item.label }))}
                      />
                    </Field>
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span>Interactive ambient</span>
                      <Switch checked={theme.ambientEnabled} onCheckedChange={(ambientEnabled) => patchTheme({ ambientEnabled })} />
                    </label>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Dark Theme stays a quiet charcoal — no glow or pointer effects.</p>
                )}
              </TabsContent>

              <TabsContent value="platforms" className="mt-0 max-h-[min(72vh,42rem)] overflow-y-auto p-5">
                <p className="mb-4 text-xs text-muted-foreground">Tap an icon. URLs are built for you except Link.</p>
                <PlatformHandleDock
                  tone="inspector"
                  platforms={LINK_PLATFORMS}
                  handles={{ ...handlesFromLinks(links), ...handles }}
                  onChange={applyPlatforms}
                />
              </TabsContent>

              <TabsContent value="widgets" className="mt-0 max-h-[min(72vh,42rem)] space-y-5 overflow-y-auto p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Stream schedule</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {state?.scheduleShareToken ? "Links your public schedule." : "Create a schedule first."}
                    </p>
                  </div>
                  <Switch
                    checked={theme.scheduleEnabled}
                    disabled={!state?.scheduleShareToken}
                    onCheckedChange={(scheduleEnabled) => patchTheme({ scheduleEnabled })}
                  />
                </div>
                <Separator className="bg-white/10" />
                <Field title="Image banner">
                  <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onFile(event.target.files?.[0], "banner")} />
                </Field>
                <Separator className="bg-white/10" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Countdown</p>
                    <Switch checked={theme.countdownEnabled} onCheckedChange={(countdownEnabled) => patchTheme({ countdownEnabled })} />
                  </div>
                  {theme.countdownEnabled ? (
                    <div className="space-y-3">
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <p className="border-b border-white/10 px-4 py-2 text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Live preview
        </p>
        <div className="max-h-[52rem] overflow-auto">
          <LinkInBioPage data={preview} preview />
        </div>
      </div>
    </div>
  );
}

function Field({
  title,
  htmlFor,
  hint,
  children,
}: {
  title: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className={label} htmlFor={htmlFor}>
        {title}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function slugHint(status: Draft["slugStatus"]) {
  if (status === "available") return "Available.";
  if (status === "taken") return "Taken.";
  if (status === "invalid") return "Invalid username.";
  return "Public path /u/…";
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
          <label className={label}>Columns</label>
          <Input
            type="number"
            min={1}
            max={4}
            value={link.colSpan}
            onChange={(event) => onChange({ ...link, colSpan: Number(event.target.value) as LinkInBioLink["colSpan"] })}
          />
        </div>
        <div>
          <label className={label}>Rows</label>
          <Input
            type="number"
            min={1}
            max={3}
            value={link.rowSpan}
            onChange={(event) => onChange({ ...link, rowSpan: Number(event.target.value) as LinkInBioLink["rowSpan"] })}
          />
        </div>
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
