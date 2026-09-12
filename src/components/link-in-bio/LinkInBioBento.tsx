import { useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { LinkInBioGallery } from "@/components/link-in-bio/LinkInBioGallery";
import { LinkInBioPlatformLogo } from "@/components/link-in-bio/LinkInBioPlatformLogo";
import {
  BENTO_COLS,
  packBento,
  platformAccent,
  type PublicBioLink,
  type LinkInBioTheme,
  type LivePlatformFlags,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

const PLATFORM_NAME: Record<PublicBioLink["platform"], string> = {
  kick: "Kick",
  twitch: "Twitch",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  discord: "Discord",
  custom: "Link",
};

const GAP = 20;
const ROW = 188;

function cellFromPoint(root: DOMRect, clientX: number, clientY: number, colSpan: number) {
  const cellW = (root.width - GAP * (BENTO_COLS - 1)) / BENTO_COLS;
  const x = Math.min(
    BENTO_COLS - colSpan,
    Math.max(0, Math.floor((clientX - root.left) / (cellW + GAP))),
  );
  const y = Math.max(0, Math.floor((clientY - root.top) / (ROW + GAP)));
  return { x, y };
}

export function LinkInBioBento({
  links,
  theme,
  livePlatforms,
  editable = false,
  selectedId,
  onSelect,
  onMove,
}: {
  links: PublicBioLink[];
  theme: LinkInBioTheme;
  livePlatforms?: LivePlatformFlags;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMove?: (id: string, gridX: number, gridY: number) => void;
}) {
  const packed = useMemo(() => packBento(links), [links]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const maxRow = packed.reduce((max, item) => Math.max(max, item.gridY + item.rowSpan), 2);
  const fill = !editable;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative grid w-full",
        fill && "grid-cols-2 md:grid-cols-4 lg:grid-cols-6 [grid-auto-flow:dense]",
      )}
      style={{
        gridTemplateColumns: fill ? undefined : `repeat(${BENTO_COLS}, minmax(0, 1fr))`,
        gridAutoRows: `${ROW}px`,
        gap: GAP,
        minHeight: editable ? maxRow * (ROW + GAP) : undefined,
        backgroundImage: fill
          ? "linear-gradient(color-mix(in oklab, var(--bio-fg) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--bio-fg) 7%, transparent) 1px, transparent 1px)"
          : undefined,
        backgroundSize: fill ? "72px 72px" : undefined,
        padding: fill ? 8 : undefined,
      }}
      onDragOver={(event) => {
        if (!editable || !dragId) return;
        event.preventDefault();
        const rect = rootRef.current?.getBoundingClientRect();
        const item = packed.find((link) => link.id === dragId);
        if (!rect || !item) return;
        setHover(cellFromPoint(rect, event.clientX, event.clientY, item.colSpan));
      }}
      onDrop={(event) => {
        if (!editable || !dragId) return;
        event.preventDefault();
        const rect = rootRef.current?.getBoundingClientRect();
        const item = packed.find((link) => link.id === dragId);
        if (rect && item) {
          const cell = cellFromPoint(rect, event.clientX, event.clientY, item.colSpan);
          onMove?.(dragId, cell.x, cell.y);
        }
        setDragId(null);
        setHover(null);
      }}
    >
      {editable && hover ? (
        <div
          className="pointer-events-none rounded-[28px] border border-dashed border-white/40 bg-white/5"
          style={{
            gridColumn: `${hover.x + 1} / span ${packed.find((item) => item.id === dragId)?.colSpan ?? 1}`,
            gridRow: `${hover.y + 1} / span ${packed.find((item) => item.id === dragId)?.rowSpan ?? 1}`,
          }}
        />
      ) : null}
      {packed.map((link) => (
        <BentoTile
          key={link.id}
          link={link}
          live={Boolean(livePlatforms?.[link.platform as keyof LivePlatformFlags])}
          editable={editable}
          fill={fill}
          selected={selectedId === link.id}
          glow={theme.glowStrength}
          onSelect={onSelect}
          onDragStart={() => setDragId(link.id)}
          onDragEnd={() => {
            setDragId(null);
            setHover(null);
          }}
        />
      ))}
    </div>
  );
}

function BentoTile({
  link,
  live,
  editable,
  fill,
  selected,
  glow,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  link: PublicBioLink;
  live: boolean;
  editable: boolean;
  fill: boolean;
  selected: boolean;
  glow: number;
  onSelect?: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const accent = platformAccent(link.platform);
  const name = PLATFORM_NAME[link.platform];
  const large = link.colSpan >= 2 && link.rowSpan >= 2;
  const logoSize = large ? 48 : 40;

  const inner =
    link.kind === "gallery" ? (
      <div className="flex h-full flex-col p-4">
        <LinkInBioGallery images={link.galleryImages} title={link.title} className="min-h-0 flex-1" />
      </div>
    ) : (
      <>
        <span className="sr-only">{name}</span>
        <span className="absolute left-6 top-6">
          <LinkInBioPlatformLogo platform={link.platform} size={logoSize} onBrand />
        </span>
        {live ? <span className="absolute right-6 top-6 size-2 rounded-full bg-white" aria-hidden /> : null}
        <span
          className="pointer-events-none absolute bottom-5 right-5 grid size-8 place-items-center rounded-full border border-white/70 text-white"
          aria-hidden
        >
          <ArrowUpRight className="size-3.5" strokeWidth={2.4} />
        </span>
      </>
    );

  const sharedClass = cn(
    "relative overflow-hidden rounded-[28px] outline-none transition-transform",
    !editable && "hover:-translate-y-0.5",
    selected && "ring-2 ring-white/80",
  );
  const sharedStyle = {
    gridColumn: fill ? `span ${link.colSpan}` : `${link.gridX + 1} / span ${link.colSpan}`,
    gridRow: fill ? `span ${link.rowSpan}` : `${link.gridY + 1} / span ${link.rowSpan}`,
    background:
      link.kind === "gallery"
        ? "color-mix(in oklab, #ffffff 16%, var(--bio-bg))"
        : accent.css,
    border: link.kind === "gallery" ? "1px solid color-mix(in oklab, var(--bio-fg) 12%, transparent)" : undefined,
    backdropFilter: link.kind === "gallery" ? "blur(16px)" : undefined,
    boxShadow:
      link.kind === "gallery"
        ? "0 14px 32px color-mix(in oklab, #000 22%, transparent)"
        : glow
          ? `0 16px 28px color-mix(in oklab, ${accent.color} ${Math.round(glow / 4)}%, transparent)`
          : undefined,
  } as const;

  if (editable) {
    return (
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => onSelect?.(link.id)}
        className={cn(sharedClass, "cursor-grab active:cursor-grabbing")}
        style={sharedStyle}
        aria-label={name}
      >
        {inner}
      </button>
    );
  }

  if (link.kind === "gallery") {
    return (
      <div className={sharedClass} style={sharedStyle}>
        {inner}
      </div>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={sharedClass}
      style={sharedStyle}
      aria-label={name}
    >
      {inner}
    </a>
  );
}
