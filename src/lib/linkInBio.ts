export const LINK_IN_BIO_TEST_KEY = "creovix:link-in-bio";
export const LINK_IN_BIO_SLUG_LIST_KEY = "creovix:link-in-bio-slugs";
export const LINK_IN_BIO_WIZARD_STEP_KEY = "creovix:link-in-bio-wizard-step";
export const LINK_IN_BIO_PUBLIC_PREFIX = "/u";
export const WIZARD_STEPS = 6;

export type LinkPlatform =
  | "kick"
  | "twitch"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "x"
  | "discord"
  | "custom";

export type CardSize = "s" | "m" | "l";
export type CardSizeOption = "inherit" | CardSize;
export type BioLayout = "bento" | "list" | "grid" | "spotlight" | "banner";
export type BentoSize = "1x1" | "2x1" | "1x2" | "2x2";
export type LinkKind = "link" | "gallery";
export type SurfaceStyle = "flat" | "glass";
export type GradientStyle = "none" | "soft" | "aurora" | "horizon";
export type AmbientPreset = "none" | "glow" | "orbits" | "haze" | "ripple";
export type StreamPlatform = "twitch" | "youtube" | "kick";
export type GalleryImage = { id: string; url: string };

export type StreamStatus =
  | {
      kind: "live";
      platform: StreamPlatform;
      title: string | null;
      viewers: number | null;
      watchUrl: string;
    }
  | {
      kind: "offline";
      platform: StreamPlatform | "profile";
      latest: { title: string; url: string; thumbnailUrl: string | null } | null;
      channelUrl: string | null;
    };

export type LivePlatformFlags = { kick: boolean; twitch: boolean; youtube: boolean };

export type LinkInBioLink = {
  id: string;
  title: string;
  url: string;
  platform: LinkPlatform;
  cardSize: CardSizeOption;
  sortOrder: number;
  featured: boolean;
  enabled: boolean;
  kind: LinkKind;
  gridX: number;
  gridY: number;
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
  galleryImages: GalleryImage[];
  createdAt: string;
  updatedAt: string;
};

export type LinkInBioLinkInput = {
  id?: string;
  title: string;
  url: string;
  platform: LinkPlatform;
  cardSize: CardSizeOption;
  featured: boolean;
  enabled: boolean;
  kind?: LinkKind;
  gridX?: number;
  gridY?: number;
  colSpan?: number;
  rowSpan?: number;
  galleryImages?: GalleryImage[];
};

export type PublicBioLink = Pick<
  LinkInBioLink,
  "id" | "title" | "url" | "platform" | "cardSize" | "featured" | "kind" | "gridX" | "gridY" | "colSpan" | "rowSpan" | "galleryImages"
>;

export type LinkInBioProfile = {
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  headerUrl: string;
  published: boolean;
  publishedAt: string | null;
  setupCompleted: boolean;
};

export type LinkInBioTheme = {
  glassIntensity: number;
  hairlineBorders: boolean;
  glowStrength: number;
  gradientStyle: GradientStyle;
  fontFamily: string;
  paletteBg: string;
  paletteFg: string;
  paletteAccent: string;
  paletteMuted: string;
  surfaceStyle: SurfaceStyle;
  layout: BioLayout;
  defaultCardSize: CardSize;
  ambientEnabled: boolean;
  ambientPreset: AmbientPreset;
  scheduleEnabled: boolean;
  widgetBannerUrl: string;
  countdownEnabled: boolean;
  countdownLabel: string;
  countdownEndsAt: string | null;
};

export type LinkInBioState = {
  profile: LinkInBioProfile;
  theme: LinkInBioTheme;
  links: LinkInBioLink[];
  kickUsername: string | null;
  twitchUsername: string | null;
  scheduleShareToken: string | null;
  scheduleTitle: string | null;
};

export type PublicLinkInBio = {
  profile: Pick<LinkInBioProfile, "slug" | "displayName" | "bio" | "avatarUrl" | "headerUrl">;
  theme: LinkInBioTheme;
  links: PublicBioLink[];
  kickLive: boolean;
  stream: StreamStatus | null;
  livePlatforms: LivePlatformFlags;
  schedule: { title: string; url: string } | null;
};

export const LINK_PLATFORMS: ReadonlyArray<{
  id: LinkPlatform;
  label: string;
  hint: string;
  comingSoon?: boolean;
}> = [
  { id: "kick", label: "Kick", hint: "https://kick.com/you" },
  { id: "twitch", label: "Twitch", hint: "https://twitch.tv/you" },
  { id: "youtube", label: "YouTube", hint: "https://youtube.com/@you" },
  { id: "tiktok", label: "TikTok", hint: "https://tiktok.com/@you", comingSoon: true },
  { id: "instagram", label: "Instagram", hint: "https://instagram.com/you" },
  { id: "x", label: "X", hint: "https://x.com/you" },
  { id: "discord", label: "Discord", hint: "https://discord.gg/invite" },
  { id: "custom", label: "Other", hint: "https://…" },
];

export const PLATFORM_HANDLE_PREFIX: Record<Exclude<LinkPlatform, "custom">, string> = {
  kick: "https://kick.com/",
  twitch: "https://www.twitch.tv/",
  youtube: "https://www.youtube.com/@",
  tiktok: "https://www.tiktok.com/@",
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
  discord: "https://discord.gg/",
};

export const FONT_CHOICES: ReadonlyArray<{ id: string; label: string; stack: string; href: string }> = [
  {
    id: "manrope",
    label: "Manrope",
    stack: '"Manrope", system-ui, sans-serif',
    href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap",
  },
  {
    id: "inter",
    label: "Inter",
    stack: '"Inter", system-ui, sans-serif',
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    stack: '"DM Sans", system-ui, sans-serif',
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap",
  },
  {
    id: "outfit",
    label: "Outfit",
    stack: '"Outfit", system-ui, sans-serif',
    href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    stack: '"Space Grotesk", system-ui, sans-serif',
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    stack: '"IBM Plex Sans", system-ui, sans-serif',
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap",
  },
  {
    id: "source-serif",
    label: "Source Serif",
    stack: '"Source Serif 4", Georgia, serif',
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap",
  },
  {
    id: "fraunces",
    label: "Fraunces",
    stack: '"Fraunces", Georgia, serif',
    href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&display=swap",
  },
];

export const BENTO_COLS = 4;
export const BENTO_ROW_PX = 160;
export const BENTO_GAP_PX = 12;
export const GALLERY_MAX_IMAGES = 8;

export const BENTO_SIZES: ReadonlyArray<{
  id: BentoSize;
  label: string;
  hint: string;
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
}> = [
  { id: "1x1", label: "1×1", hint: "Square tile", colSpan: 1, rowSpan: 1 },
  { id: "2x1", label: "Wide", hint: "Two columns", colSpan: 2, rowSpan: 1 },
  { id: "1x2", label: "Tall", hint: "Two rows", colSpan: 1, rowSpan: 2 },
  { id: "2x2", label: "2×2", hint: "Featured block", colSpan: 2, rowSpan: 2 },
];

export const LAYOUT_CHOICES: ReadonlyArray<{ id: BioLayout; label: string; hint: string }> = [
  { id: "bento", label: "Bento", hint: "Modular tiles you can size and place" },
  { id: "list", label: "Compact list", hint: "Classic stacked links" },
  { id: "grid", label: "Even grid", hint: "Equal two-column tiles" },
  { id: "spotlight", label: "Spotlight", hint: "One featured card on top" },
  { id: "banner", label: "Banner", hint: "Immersive header first" },
];

export const GRADIENT_CHOICES: ReadonlyArray<{ id: GradientStyle; label: string }> = [
  { id: "none", label: "None" },
  { id: "soft", label: "Soft wash" },
  { id: "aurora", label: "Aurora" },
  { id: "horizon", label: "Horizon" },
];

export const AMBIENT_CHOICES: ReadonlyArray<{ id: AmbientPreset; label: string; hint: string }> = [
  { id: "glow", label: "Ambient glow", hint: "Soft orbs that follow the pointer" },
  { id: "orbits", label: "Orbits", hint: "Slow circling glass lights" },
  { id: "haze", label: "Glass haze", hint: "Layered panels that tilt" },
  { id: "ripple", label: "Ripple", hint: "Rings from the pointer" },
  { id: "none", label: "Static only", hint: "No motion layers" },
];

const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "bio",
  "clip",
  "clips",
  "dashboard",
  "login",
  "logout",
  "marks",
  "mod-queue",
  "overlay",
  "privacy",
  "settings",
  "terms",
  "u",
  "widgets",
]);

const HEX = /^#[0-9A-Fa-f]{6}$/;
const AVATAR_MAX = 80_000;

export const DEFAULT_THEME: LinkInBioTheme = {
  glassIntensity: 45,
  hairlineBorders: true,
  glowStrength: 35,
  gradientStyle: "soft",
  fontFamily: "manrope",
  paletteBg: "#0f1117",
  paletteFg: "#f4f4f5",
  paletteAccent: "#7c8cff",
  paletteMuted: "#a1a1aa",
  surfaceStyle: "glass",
  layout: "bento",
  defaultCardSize: "m",
  ambientEnabled: true,
  ambientPreset: "glow",
  scheduleEnabled: false,
  widgetBannerUrl: "",
  countdownEnabled: false,
  countdownLabel: "Going live",
  countdownEndsAt: null,
};

export const DEFAULT_PROFILE: LinkInBioProfile = {
  slug: "",
  displayName: "",
  bio: "",
  avatarUrl: "",
  headerUrl: "",
  published: false,
  publishedAt: null,
  setupCompleted: false,
};

export function publicBioPath(slug: string): string {
  return `${LINK_IN_BIO_PUBLIC_PREFIX}/${encodeURIComponent(slug)}`;
}

export function clampWizardStep(raw: unknown): number {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > WIZARD_STEPS) return 1;
  return value;
}

export function parseLinkInBioSearch(search: Record<string, unknown>): { setup?: boolean; step?: number } {
  const rawStep = search["step"];
  const hasStep = rawStep !== undefined && rawStep !== "" && rawStep !== null;
  const setupRaw = search["setup"];
  const setup =
    setupRaw === true || setupRaw === 1 || setupRaw === "1" || setupRaw === "true" || hasStep;
  return {
    setup: setup || undefined,
    step: hasStep ? clampWizardStep(rawStep) : undefined,
  };
}

export function linkToInput(link: LinkInBioLink): LinkInBioLinkInput {
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    platform: link.platform,
    cardSize: link.cardSize,
    featured: link.featured,
    enabled: link.enabled,
    kind: link.kind,
    gridX: link.gridX,
    gridY: link.gridY,
    colSpan: link.colSpan,
    rowSpan: link.rowSpan,
    galleryImages: link.galleryImages,
  };
}

export function fontById(id: string) {
  return FONT_CHOICES.find((font) => font.id === id) ?? FONT_CHOICES[0]!;
}

export function sanitizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function slugError(slug: string): string | null {
  if (!slug) return "slug_required";
  if (RESERVED_SLUGS.has(slug)) return "slug_reserved";
  if (!/^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$/.test(slug)) return "slug_invalid";
  return null;
}

export function sanitizeHex(raw: string, fallback: string): string {
  const value = raw.trim();
  return HEX.test(value) ? value.toLowerCase() : fallback;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function sanitizeDisplayName(raw: string): string {
  return raw.trim().slice(0, 80);
}

export function sanitizeBio(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\n+|\n+$/g, "").slice(0, 400);
}

export function isAvatarDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value.trim());
}

export function sanitizeAvatarUrl(raw: string, allowDataUrl = true): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https:\/\//i.test(value) && value.length <= 2048) return value;
  if (allowDataUrl && isAvatarDataUrl(value) && value.length <= AVATAR_MAX) return value;
  return "";
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeLinkUrl(raw: string): string {
  const value = raw.trim();
  if (!isValidHttpUrl(value) || value.length > 2048) return "";
  return value;
}

export function sanitizePlatform(raw: string): LinkPlatform {
  return LINK_PLATFORMS.some((item) => item.id === raw) ? (raw as LinkPlatform) : "custom";
}

export function sanitizeCardSize(raw: string): CardSize {
  return raw === "s" || raw === "l" ? raw : "m";
}

export function sanitizeCardSizeOption(raw: string): CardSizeOption {
  return raw === "inherit" || raw === "s" || raw === "m" || raw === "l" ? raw : "inherit";
}

export function sanitizeLayout(raw: string): BioLayout {
  return raw === "list" || raw === "grid" || raw === "spotlight" || raw === "banner" ? raw : "bento";
}

export function sanitizeKind(raw: string): LinkKind {
  return raw === "gallery" ? "gallery" : "link";
}

export function sanitizeSpan(raw: number | undefined): 1 | 2 {
  return Number(raw) >= 2 ? 2 : 1;
}

export function sanitizeGridX(raw: number | undefined): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.min(BENTO_COLS - 1, Math.max(0, Math.round(Number(raw))));
}

export function sanitizeGridY(raw: number | undefined): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.min(40, Math.max(0, Math.round(Number(raw))));
}

export function bentoSizeOf(colSpan: number, rowSpan: number): BentoSize {
  if (colSpan >= 2 && rowSpan >= 2) return "2x2";
  if (colSpan >= 2) return "2x1";
  if (rowSpan >= 2) return "1x2";
  return "1x1";
}

export function spanFromBentoSize(size: BentoSize): { colSpan: 1 | 2; rowSpan: 1 | 2 } {
  const found = BENTO_SIZES.find((item) => item.id === size) ?? BENTO_SIZES[0]!;
  return { colSpan: found.colSpan, rowSpan: found.rowSpan };
}

export function sanitizeGalleryImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { id?: unknown; url?: unknown };
      const url = sanitizeAvatarUrl(String(record.url ?? ""), true);
      if (!url) return null;
      return {
        id: typeof record.id === "string" && record.id ? record.id : `img-${index}`,
        url,
      };
    })
    .filter((item): item is GalleryImage => Boolean(item))
    .slice(0, GALLERY_MAX_IMAGES);
}

export function platformAccent(platform: LinkPlatform): { color: string; css: string } {
  if (platform === "kick") return { color: "#53FC18", css: "#53FC18" };
  if (platform === "twitch") return { color: "#6B21A8", css: "#6B21A8" };
  if (platform === "youtube") return { color: "#FF0000", css: "#4C0A0A" };
  if (platform === "instagram") return { color: "#C2185B", css: "#C2185B" };
  if (platform === "tiktok") return { color: "#25F4EE", css: "#141414" };
  if (platform === "x") return { color: "#E7E9EA", css: "#000000" };
  if (platform === "discord") return { color: "#5865F2", css: "#5865F2" };
  return { color: "#229ED9", css: "#229ED9" };
}

export function normalizeLink(partial: Partial<LinkInBioLink> & { id: string }, index = 0): LinkInBioLink {
  const kind = sanitizeKind(partial.kind ?? (partial.galleryImages?.length ? "gallery" : "link"));
  const title = sanitizeDisplayName(partial.title ?? "") || (kind === "gallery" ? "Gallery" : "");
  const url = kind === "gallery" ? sanitizeLinkUrl(partial.url ?? "") : sanitizeLinkUrl(partial.url ?? "");
  return {
    id: String(partial.id),
    title,
    url,
    platform: sanitizePlatform(partial.platform ?? "custom"),
    cardSize: sanitizeCardSizeOption(partial.cardSize ?? "inherit"),
    sortOrder: Number.isFinite(partial.sortOrder) ? Number(partial.sortOrder) : index,
    featured: Boolean(partial.featured),
    enabled: partial.enabled !== false,
    kind,
    gridX: sanitizeGridX(partial.gridX),
    gridY: sanitizeGridY(partial.gridY),
    colSpan: sanitizeSpan(partial.colSpan),
    rowSpan: sanitizeSpan(partial.rowSpan),
    galleryImages: kind === "gallery" ? sanitizeGalleryImages(partial.galleryImages) : [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  };
}

export function packBento<T extends Pick<LinkInBioLink, "id" | "gridX" | "gridY" | "colSpan" | "rowSpan">>(
  items: T[],
  cols = BENTO_COLS,
): Array<T & { gridX: number; gridY: number; colSpan: 1 | 2; rowSpan: 1 | 2 }> {
  const occupied = new Set<string>();
  const key = (x: number, y: number) => `${x}:${y}`;
  const fits = (x: number, y: number, colSpan: number, rowSpan: number) => {
    if (x < 0 || y < 0 || x + colSpan > cols) return false;
    for (let row = y; row < y + rowSpan; row += 1) {
      for (let col = x; col < x + colSpan; col += 1) {
        if (occupied.has(key(col, row))) return false;
      }
    }
    return true;
  };
  const mark = (x: number, y: number, colSpan: number, rowSpan: number) => {
    for (let row = y; row < y + rowSpan; row += 1) {
      for (let col = x; col < x + colSpan; col += 1) {
        occupied.add(key(col, row));
      }
    }
  };
  const findSlot = (colSpan: 1 | 2, rowSpan: 1 | 2, preferredX: number, preferredY: number) => {
    const preferX = Math.min(cols - colSpan, Math.max(0, preferredX));
    const preferY = Math.max(0, preferredY);
    if (fits(preferX, preferY, colSpan, rowSpan)) return { gridX: preferX, gridY: preferY };
    for (let y = 0; y <= 40; y += 1) {
      for (let x = 0; x <= cols - colSpan; x += 1) {
        if (fits(x, y, colSpan, rowSpan)) return { gridX: x, gridY: y };
      }
    }
    return { gridX: 0, gridY: 0 };
  };
  return items.map((item) => {
    const colSpan = sanitizeSpan(item.colSpan);
    const rowSpan = sanitizeSpan(item.rowSpan);
    const slot = findSlot(colSpan, rowSpan, item.gridX, item.gridY);
    mark(slot.gridX, slot.gridY, colSpan, rowSpan);
    return { ...item, ...slot, colSpan, rowSpan };
  });
}

export function sanitizeSurface(raw: string): SurfaceStyle {
  return raw === "flat" ? "flat" : "glass";
}

export function sanitizeGradient(raw: string): GradientStyle {
  return raw === "none" || raw === "aurora" || raw === "horizon" ? raw : "soft";
}

export function sanitizeFont(raw: string): string {
  return FONT_CHOICES.some((font) => font.id === raw) ? raw : "manrope";
}

export function sanitizeAmbientPreset(raw: string): AmbientPreset {
  return raw === "none" || raw === "orbits" || raw === "haze" || raw === "ripple" ? raw : "glow";
}

export function sanitizeTheme(partial: Partial<LinkInBioTheme> | null | undefined): LinkInBioTheme {
  const src = partial ?? {};
  return {
    glassIntensity: clampPercent(src.glassIntensity ?? DEFAULT_THEME.glassIntensity),
    hairlineBorders: Boolean(src.hairlineBorders ?? DEFAULT_THEME.hairlineBorders),
    glowStrength: clampPercent(src.glowStrength ?? DEFAULT_THEME.glowStrength),
    gradientStyle: sanitizeGradient(src.gradientStyle ?? DEFAULT_THEME.gradientStyle),
    fontFamily: sanitizeFont(src.fontFamily ?? DEFAULT_THEME.fontFamily),
    paletteBg: sanitizeHex(src.paletteBg ?? DEFAULT_THEME.paletteBg, DEFAULT_THEME.paletteBg),
    paletteFg: sanitizeHex(src.paletteFg ?? DEFAULT_THEME.paletteFg, DEFAULT_THEME.paletteFg),
    paletteAccent: sanitizeHex(src.paletteAccent ?? DEFAULT_THEME.paletteAccent, DEFAULT_THEME.paletteAccent),
    paletteMuted: sanitizeHex(src.paletteMuted ?? DEFAULT_THEME.paletteMuted, DEFAULT_THEME.paletteMuted),
    surfaceStyle: sanitizeSurface(src.surfaceStyle ?? DEFAULT_THEME.surfaceStyle),
    layout: sanitizeLayout(src.layout ?? DEFAULT_THEME.layout),
    defaultCardSize: sanitizeCardSize(src.defaultCardSize ?? DEFAULT_THEME.defaultCardSize),
    ambientEnabled: src.ambientEnabled !== false,
    ambientPreset: sanitizeAmbientPreset(src.ambientPreset ?? DEFAULT_THEME.ambientPreset),
    scheduleEnabled: Boolean(src.scheduleEnabled),
    widgetBannerUrl: sanitizeAvatarUrl(src.widgetBannerUrl ?? ""),
    countdownEnabled: Boolean(src.countdownEnabled),
    countdownLabel: sanitizeDisplayName(src.countdownLabel ?? DEFAULT_THEME.countdownLabel) || DEFAULT_THEME.countdownLabel,
    countdownEndsAt: sanitizeCountdownEndsAt(src.countdownEndsAt),
  };
}

export function sanitizeCountdownEndsAt(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function sanitizeProfile(partial: Partial<LinkInBioProfile> | null | undefined): LinkInBioProfile {
  const src = partial ?? {};
  return {
    slug: sanitizeSlug(src.slug ?? ""),
    displayName: sanitizeDisplayName(src.displayName ?? ""),
    bio: sanitizeBio(src.bio ?? ""),
    avatarUrl: sanitizeAvatarUrl(src.avatarUrl ?? ""),
    headerUrl: sanitizeAvatarUrl(src.headerUrl ?? ""),
    published: Boolean(src.published),
    publishedAt: src.publishedAt ?? null,
    setupCompleted: Boolean(src.setupCompleted),
  };
}

export function sanitizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").replace(/\s+/g, "").slice(0, 64);
}

export function urlFromHandle(platform: LinkPlatform, handleOrUrl: string): string {
  if (platform === "custom") return sanitizeLinkUrl(handleOrUrl);
  const handle = sanitizeHandle(handleOrUrl);
  if (!handle) return "";
  return `${PLATFORM_HANDLE_PREFIX[platform]}${encodeURIComponent(handle)}`;
}

export function handleFromUrl(platform: LinkPlatform, url: string): string {
  if (platform === "custom") return url;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (platform === "youtube" || platform === "tiktok") {
      const last = parts[parts.length - 1] ?? "";
      return decodeURIComponent(last).replace(/^@/, "");
    }
    if (platform === "discord") {
      return decodeURIComponent(parts[parts.length - 1] ?? "");
    }
    return decodeURIComponent(parts[0] ?? "");
  } catch {
    return "";
  }
}

export function publicSchedulePath(token: string): string {
  return `/overlay/schedule?token=${encodeURIComponent(token)}`;
}

export function kickUsernameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)kick\.com$/i.test(parsed.hostname)) return null;
    const part = parsed.pathname.split("/").filter(Boolean)[0];
    return part ? decodeURIComponent(part).toLowerCase() : null;
  } catch {
    return null;
  }
}

export function twitchUsernameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)twitch\.tv$/i.test(parsed.hostname)) return null;
    const part = parsed.pathname.split("/").filter(Boolean)[0];
    if (!part || ["videos", "directory", "p", "settings"].includes(part.toLowerCase())) return null;
    return decodeURIComponent(part).toLowerCase();
  } catch {
    return null;
  }
}

export type YoutubeTarget = { handle: string | null; channelId: string | null };

export function youtubeTargetFromUrl(url: string): YoutubeTarget | null {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(parsed.hostname)) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const first = parts[0] ?? "";
    if (first.startsWith("@")) return { handle: first.slice(1), channelId: null };
    if (first === "channel" && parts[1]?.startsWith("UC")) return { handle: null, channelId: parts[1] };
    if (first === "c" && parts[1]) return { handle: parts[1], channelId: null };
    if (first === "user" && parts[1]) return { handle: parts[1], channelId: null };
    if (first === "watch" || first === "embed" || first === "shorts" || parsed.hostname.includes("youtu.be")) {
      return null;
    }
    return first ? { handle: first.replace(/^@/, ""), channelId: null } : null;
  } catch {
    return null;
  }
}

export function collectStreamTargets(state: LinkInBioState): {
  kickUsername: string | null;
  twitchUsername: string | null;
  youtube: YoutubeTarget | null;
  kickUrl: string | null;
  twitchUrl: string | null;
  youtubeUrl: string | null;
} {
  const kickFromLink = state.links.find((link) => link.enabled && (link.platform === "kick" || kickUsernameFromUrl(link.url)));
  const twitchFromLink = state.links.find(
    (link) => link.enabled && (link.platform === "twitch" || twitchUsernameFromUrl(link.url)),
  );
  const youtubeFromLink = state.links.find((link) => link.enabled && (link.platform === "youtube" || youtubeTargetFromUrl(link.url)));
  const kickUsername = state.kickUsername ?? (kickFromLink ? kickUsernameFromUrl(kickFromLink.url) : null);
  const twitchUsername = state.twitchUsername ?? (twitchFromLink ? twitchUsernameFromUrl(twitchFromLink.url) : null);
  const youtube = youtubeFromLink ? youtubeTargetFromUrl(youtubeFromLink.url) : null;
  return {
    kickUsername: kickUsername?.toLowerCase() ?? null,
    twitchUsername: twitchUsername?.toLowerCase() ?? null,
    youtube,
    kickUrl: kickUsername ? `https://kick.com/${encodeURIComponent(kickUsername)}` : (kickFromLink?.url ?? null),
    twitchUrl: twitchUsername ? `https://www.twitch.tv/${encodeURIComponent(twitchUsername)}` : (twitchFromLink?.url ?? null),
    youtubeUrl: youtubeFromLink?.url ?? null,
  };
}

export function resolveCardSize(link: Pick<LinkInBioLink, "cardSize">, theme: LinkInBioTheme): CardSize {
  return link.cardSize === "inherit" ? theme.defaultCardSize : link.cardSize;
}

const EMPTY_LIVE: LivePlatformFlags = { kick: false, twitch: false, youtube: false };

export function publicLinkInBioPayload(
  state: LinkInBioState,
  extras?: { stream?: StreamStatus | null; livePlatforms?: LivePlatformFlags },
): PublicLinkInBio {
  const livePlatforms = extras?.livePlatforms ?? EMPTY_LIVE;
  return {
    profile: {
      slug: state.profile.slug,
      displayName: state.profile.displayName,
      bio: state.profile.bio,
      avatarUrl: state.profile.avatarUrl,
      headerUrl: state.profile.headerUrl,
    },
    theme: sanitizeTheme(state.theme),
    links: state.links
      .filter((link) => link.enabled)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        platform: link.platform,
        cardSize: link.cardSize,
        featured: link.featured,
        kind: link.kind,
        gridX: link.gridX,
        gridY: link.gridY,
        colSpan: link.colSpan,
        rowSpan: link.rowSpan,
        galleryImages: link.galleryImages,
      })),
    kickLive: livePlatforms.kick,
    stream: extras?.stream ?? null,
    livePlatforms,
    schedule:
      state.theme.scheduleEnabled && state.scheduleShareToken
        ? {
            title: state.scheduleTitle || "Stream schedule",
            url: publicSchedulePath(state.scheduleShareToken),
          }
        : null,
  };
}

function emptyState(): LinkInBioState {
  return {
    profile: { ...DEFAULT_PROFILE },
    theme: { ...DEFAULT_THEME },
    links: [],
    kickUsername: null,
    twitchUsername: null,
    scheduleShareToken: null,
    scheduleTitle: null,
  };
}

export function loadTestLinkInBio(): LinkInBioState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(LINK_IN_BIO_TEST_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<LinkInBioState>;
    const links = Array.isArray(parsed.links) ? parsed.links : [];
    return {
      profile: sanitizeProfile({
        ...parsed.profile,
        setupCompleted:
          Boolean(parsed.profile?.setupCompleted) ||
          Boolean(parsed.profile?.published) ||
          Boolean(parsed.profile?.slug && (parsed.profile.displayName || links.length)),
      }),
      theme: sanitizeTheme(parsed.theme),
      kickUsername: typeof parsed.kickUsername === "string" ? parsed.kickUsername : null,
      twitchUsername: typeof parsed.twitchUsername === "string" ? parsed.twitchUsername : null,
      scheduleShareToken: typeof parsed.scheduleShareToken === "string" ? parsed.scheduleShareToken : null,
      scheduleTitle: typeof parsed.scheduleTitle === "string" ? parsed.scheduleTitle : null,
      links: links
        .filter((link): link is LinkInBioLink => Boolean(link && typeof link === "object" && "id" in link))
        .map((link, index) => normalizeLink(link, index))
        .filter((link) => (link.kind === "gallery" ? link.galleryImages.length > 0 || Boolean(link.title) : Boolean(link.title && link.url))),
    };
  } catch {
    return emptyState();
  }
}

export function saveTestLinkInBio(state: LinkInBioState): void {
  window.localStorage.setItem(LINK_IN_BIO_TEST_KEY, JSON.stringify(state));
  if (state.profile.slug) rememberTestSlug(state.profile.slug);
}

export function loadTestTakenSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LINK_IN_BIO_SLUG_LIST_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function rememberTestSlug(slug: string): void {
  const next = Array.from(new Set([...loadTestTakenSlugs(), sanitizeSlug(slug)].filter(Boolean)));
  window.localStorage.setItem(LINK_IN_BIO_SLUG_LIST_KEY, JSON.stringify(next));
}

export function checkTestSlugAvailable(slug: string, ownSlug: string): { available: boolean; error: string | null } {
  const normalized = sanitizeSlug(slug);
  const error = slugError(normalized);
  if (error) return { available: false, error };
  if (normalized === sanitizeSlug(ownSlug)) return { available: true, error: null };
  if (loadTestTakenSlugs().includes(normalized)) return { available: false, error: "slug_taken" };
  return { available: true, error: null };
}

export function replaceTestLinks(inputs: LinkInBioLinkInput[]): LinkInBioState {
  const state = loadTestLinkInBio();
  const now = new Date().toISOString();
  const links: LinkInBioLink[] = inputs
    .map((input, index) => {
      const kind = sanitizeKind(input.kind ?? "link");
      const title = sanitizeDisplayName(input.title) || (kind === "gallery" ? "Gallery" : "");
      const url = kind === "gallery" ? sanitizeLinkUrl(input.url) : sanitizeLinkUrl(input.url);
      if (!title) return null;
      if (kind === "link" && !url) return null;
      return normalizeLink(
        {
          id: input.id && state.links.some((link) => link.id === input.id) ? input.id : crypto.randomUUID(),
          title,
          url,
          platform: input.platform,
          cardSize: input.cardSize ?? "inherit",
          featured: input.featured,
          enabled: input.enabled,
          kind,
          gridX: input.gridX,
          gridY: input.gridY,
          colSpan: input.colSpan,
          rowSpan: input.rowSpan,
          galleryImages: input.galleryImages,
          createdAt: now,
          updatedAt: now,
        },
        index,
      );
    })
    .filter((link): link is LinkInBioLink => Boolean(link));
  const saved = { ...state, links };
  saveTestLinkInBio(saved);
  return saved;
}

export function upsertTestLink(input: LinkInBioLinkInput): LinkInBioState | { error: string } {
  const kind = sanitizeKind(input.kind ?? "link");
  const title = sanitizeDisplayName(input.title) || (kind === "gallery" ? "Gallery" : "");
  const url = sanitizeLinkUrl(input.url);
  if (!title) return { error: "title_required" };
  if (kind === "link" && !url) return { error: "url_invalid" };
  const state = loadTestLinkInBio();
  const now = new Date().toISOString();
  if (input.id) {
    const next = state.links.map((link) =>
      link.id === input.id
        ? normalizeLink(
            {
              ...link,
              title,
              url,
              platform: input.platform,
              cardSize: input.cardSize,
              featured: input.featured,
              enabled: input.enabled,
              kind,
              gridX: input.gridX ?? link.gridX,
              gridY: input.gridY ?? link.gridY,
              colSpan: input.colSpan ?? link.colSpan,
              rowSpan: input.rowSpan ?? link.rowSpan,
              galleryImages: input.galleryImages ?? link.galleryImages,
              updatedAt: now,
            },
            link.sortOrder,
          )
        : link,
    );
    const saved = { ...state, links: next };
    saveTestLinkInBio(saved);
    return saved;
  }
  const created = normalizeLink(
    {
      id: crypto.randomUUID(),
      title,
      url,
      platform: input.platform,
      cardSize: input.cardSize,
      featured: input.featured,
      enabled: input.enabled,
      kind,
      gridX: input.gridX,
      gridY: input.gridY,
      colSpan: input.colSpan,
      rowSpan: input.rowSpan,
      galleryImages: input.galleryImages,
      createdAt: now,
      updatedAt: now,
    },
    state.links.length,
  );
  const saved = { ...state, links: [...state.links, created] };
  saveTestLinkInBio(saved);
  return saved;
}

export function deleteTestLink(id: string): LinkInBioState {
  const state = loadTestLinkInBio();
  const saved = {
    ...state,
    links: state.links.filter((link) => link.id !== id).map((link, index) => ({ ...link, sortOrder: index })),
  };
  saveTestLinkInBio(saved);
  return saved;
}

export function reorderTestLinks(ids: string[]): LinkInBioState {
  const state = loadTestLinkInBio();
  const byId = new Map(state.links.map((link) => [link.id, link]));
  const ordered = ids.map((id) => byId.get(id)).filter((link): link is LinkInBioLink => Boolean(link));
  const rest = state.links.filter((link) => !ids.includes(link.id));
  const saved = {
    ...state,
    links: [...ordered, ...rest].map((link, index) => ({ ...link, sortOrder: index })),
  };
  saveTestLinkInBio(saved);
  return saved;
}

export async function compressBannerFile(file: File): Promise<string> {
  return compressImageFile(file, 960, 360);
}

export async function compressAvatarFile(file: File): Promise<string> {
  return compressImageFile(file, 320, 320);
}

export async function compressGalleryFile(file: File): Promise<string> {
  return compressImageFile(file, 720, 720);
}

async function compressImageFile(file: File, width: number, height: number): Promise<string> {
  if (!file.type.startsWith("image/")) return "";
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const srcRatio = bitmap.width / bitmap.height;
    const destRatio = width / height;
    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;
    if (srcRatio > destRatio) {
      sw = bitmap.height * destRatio;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = bitmap.width / destRatio;
      sy = (bitmap.height - sh) / 2;
    }
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
    bitmap.close();
    let quality = 0.82;
    let url = canvas.toDataURL("image/jpeg", quality);
    while (url.length > AVATAR_MAX && quality > 0.4) {
      quality -= 0.1;
      url = canvas.toDataURL("image/jpeg", quality);
    }
    return url.length > AVATAR_MAX ? "" : url;
  } catch {
    return "";
  }
}
