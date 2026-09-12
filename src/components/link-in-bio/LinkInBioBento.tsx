import { useMemo, useRef, useState } from "react";

import { LinkInBioGallery } from "@/components/link-in-bio/LinkInBioGallery";
import {
  BENTO_COLS,
  BENTO_GAP_PX,
  BENTO_ROW_PX,
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

  return (
    <div
      ref={rootRef}
      className="relative grid w-full"
      style={{
        gridTemplateColumns: `repeat(${BENTO_COLS}, minmax(0, 1fr))`,
        gridAutoRows: `${BENTO_ROW_PX}px`,
        gap: BENTO_GAP_PX,
        minHeight: maxRow * (BENTO_ROW_PX + BENTO_GAP_PX),
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
          glass={glass}
          editable={editable}
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
  glass,
  editable,
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
  glass: boolean;
  editable: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const accent = platformAccent(link.platform);
  const inner = (
    <>
      {link.kind === "gallery" ? (
        <LinkInBioGallery images={link.galleryImages} title={link.title} className="absolute inset-0" />
      ) : (
        <>
          <span
            className="absolute inset-0 opacity-90"
            style={{ background: accent.css }}
            aria-hidden
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <span className="relative flex h-full flex-col justify-end p-3 md:p-4">
            <span className="text-[0.65rem] font-medium uppercase tracking-wide text-white/75">
              {PLATFORM_LABEL[link.platform]}
              {link.platform === "tiktok" ? " · Coming soon" : ""}
              {live ? " · Live" : ""}
            </span>
            <span className="mt-1 truncate text-base font-semibold text-white" dir="auto">
              {link.title}
            </span>
          </span>
        </>
      )}
    </>
  );

  const sharedClass = cn(
    "relative overflow-hidden rounded-2xl outline-none transition-transform",
    !editable && "hover:-translate-y-0.5",
    selected && "ring-2 ring-white/80",
  );
  const sharedStyle = {
    gridColumn: `${link.gridX + 1} / span ${link.colSpan}`,
    gridRow: `${link.gridY + 1} / span ${link.rowSpan}`,
    background: link.kind === "gallery" ? cardBg : undefined,
    border,
    backdropFilter: glass ? `blur(${6 + theme.glassIntensity / 10}px)` : undefined,
    boxShadow: theme.glowStrength
      ? `0 10px ${12 + theme.glowStrength / 4}px color-mix(in oklab, ${accent.color} ${Math.round(theme.glowStrength / 4)}%, transparent)`
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
    >
      {inner}
    </a>
  );
}

