import { useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { LinkInBioGallery } from "@/components/link-in-bio/LinkInBioGallery";
import { LinkInBioPlatformLogo } from "@/components/link-in-bio/LinkInBioPlatformLogo";
import {
  BENTO_COLS,
  BENTO_GAP_PX,
  BENTO_ROW_PX,
  bentoSizeOf,
  packBento,
  platformAccent,
  type PublicBioLink,
  type LinkInBioTheme,
  type LivePlatformFlags,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

const PLATFORM_LABEL: Record<PublicBioLink["platform"], string> = {
  kick: "Kick",
  twitch: "Twitch",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  discord: "Discord",
  custom: "Link",
};

function cellFromPoint(root: DOMRect, clientX: number, clientY: number, colSpan: number) {
  const cellW = (root.width - BENTO_GAP_PX * (BENTO_COLS - 1)) / BENTO_COLS;
  const x = Math.min(
    BENTO_COLS - colSpan,
    Math.max(0, Math.floor((clientX - root.left) / (cellW + BENTO_GAP_PX))),
  );
  const y = Math.max(0, Math.floor((clientY - root.top) / (BENTO_ROW_PX + BENTO_GAP_PX)));
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
  const glass = theme.surfaceStyle === "glass";
  const alpha = Math.round((theme.glassIntensity / 100) * 42);
  const cardBg = glass
    ? `rgba(255,255,255,${(alpha / 255).toFixed(3)})`
    : "color-mix(in oklab, var(--bio-fg) 6%, var(--bio-bg))";
  const border = theme.hairlineBorders
    ? "1px solid color-mix(in oklab, var(--bio-fg) 16%, transparent)"
    : "1px solid transparent";
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
        gridAutoRows: `${BENTO_ROW_PX}px`,
        gap: BENTO_GAP_PX,
        minHeight: editable ? maxRow * (BENTO_ROW_PX + BENTO_GAP_PX) : undefined,
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
          className="pointer-events-none rounded-2xl border border-dashed border-white/40 bg-white/5"
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
          theme={theme}
          live={Boolean(livePlatforms?.[link.platform as keyof LivePlatformFlags])}
          cardBg={cardBg}
          border={border}
          editable={editable}
          fill={fill}
          selected={selectedId === link.id}
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
  theme,
  live,
  cardBg,
  border,
  editable,
  fill,
  selected,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  link: PublicBioLink;
  theme: LinkInBioTheme;
  live: boolean;
  cardBg: string;
  border: string;
  editable: boolean;
  fill: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const accent = platformAccent(link.platform);
  const size = bentoSizeOf(link.colSpan, link.rowSpan);
  const compact = size === "1x1";
  const logoSize = size === "2x2" ? 68 : size === "1x1" ? 42 : 52;
  const label = PLATFORM_LABEL[link.platform];
  const inner = (
    <>
      {link.kind === "gallery" ? (
        <LinkInBioGallery images={link.galleryImages} title={link.title} className="absolute inset-0" />
      ) : (
        <>
          <span className="sr-only">{label}</span>
          <span
            className={cn(
              "relative flex h-full",
              compact ? "items-center justify-center p-4" : "items-start justify-start p-4 md:p-5",
            )}
          >
            <LinkInBioPlatformLogo platform={link.platform} size={logoSize} onBrand />
          </span>
          {live ? (
            <span className="absolute right-3.5 top-3.5 size-2 rounded-full bg-white shadow" aria-hidden />
          ) : null}
          <span
            className={cn(
              "pointer-events-none absolute bottom-3 right-3 grid place-items-center rounded-full",
              compact ? "size-8" : "size-9",
              link.platform === "kick" ? "bg-black/15 text-black" : "bg-white/18 text-white",
            )}
            aria-hidden
          >
            <ArrowUpRight className={compact ? "size-3.5" : "size-4"} strokeWidth={2.25} />
          </span>
        </>
      )}
    </>
  );

  const sharedClass = cn(
    "relative overflow-hidden rounded-3xl outline-none transition-transform",
    !editable && "hover:-translate-y-0.5",
    selected && "ring-2 ring-white/80",
  );
  const sharedStyle = {
    gridColumn: fill ? `span ${link.colSpan}` : `${link.gridX + 1} / span ${link.colSpan}`,
    gridRow: fill ? `span ${link.rowSpan}` : `${link.gridY + 1} / span ${link.rowSpan}`,
    background: link.kind === "gallery" ? cardBg : accent.css,
    color: link.platform === "kick" ? "#111" : "#fff",
    border: link.kind === "gallery" ? border : "1px solid transparent",
    boxShadow: theme.glowStrength
      ? `0 12px ${16 + theme.glowStrength / 4}px color-mix(in oklab, ${accent.color} ${Math.round(theme.glowStrength / 3)}%, transparent)`
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
        className={cn(sharedClass, "cursor-grab text-start active:cursor-grabbing")}
        style={sharedStyle}
        aria-label={label}
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
      aria-label={label}
    >
      {inner}
    </a>
  );
}

