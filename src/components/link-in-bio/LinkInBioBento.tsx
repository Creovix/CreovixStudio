import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";

import { LinkInBioGallery } from "@/components/link-in-bio/LinkInBioGallery";
import { LinkInBioPlatformLogo } from "@/components/link-in-bio/LinkInBioPlatformLogo";
import {
  BENTO_COLS,
  BENTO_SIZES,
  bentoSizeOf,
  bentoTilePaint,
  packBento,
  type BentoSize,
  type BentoTilePaint,
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
  whatsapp: "WhatsApp",
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

function snapSpan(width: number, height: number, cellW: number): { colSpan: 1 | 2; rowSpan: 1 | 2 } {
  return {
    colSpan: width > cellW * 1.35 ? 2 : 1,
    rowSpan: height > ROW * 1.35 ? 2 : 1,
  };
}

export function LinkInBioBento({
  links,
  theme,
  livePlatforms,
  editable = false,
  arrangeMode = false,
  selectedId,
  onSelect,
  onMove,
  onResize,
}: {
  links: PublicBioLink[];
  theme: LinkInBioTheme;
  livePlatforms?: LivePlatformFlags;
  editable?: boolean;
  arrangeMode?: boolean;
  selectedId?: string | null;
  onSelect?: ((id: string) => void) | undefined;
  onMove?: ((id: string, gridX: number, gridY: number) => void) | undefined;
  onResize?: ((id: string, colSpan: 1 | 2, rowSpan: 1 | 2) => void) | undefined;
}) {
  const packed = useMemo(() => packBento(links), [links]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [resizePreview, setResizePreview] = useState<{ id: string; colSpan: 1 | 2; rowSpan: 1 | 2 } | null>(
    null,
  );
  const placed = editable || arrangeMode;
  const maxRow = packed.reduce((max, item) => Math.max(max, item.gridY + item.rowSpan), 2);
  const fill = !placed;

  const commitHoverMove = (id: string, clientX: number, clientY: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    const item = packed.find((link) => link.id === id);
    if (!rect || !item) return;
    const cell = cellFromPoint(rect, clientX, clientY, item.colSpan);
    onMove?.(id, cell.x, cell.y);
  };

  const updateHover = (id: string, clientX: number, clientY: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    const item = packed.find((link) => link.id === id);
    if (!rect || !item) return;
    setHover(cellFromPoint(rect, clientX, clientY, item.colSpan));
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative grid w-full",
        fill && "grid-cols-2 @min-[36rem]:grid-cols-4 @min-[60rem]:grid-cols-6 [grid-auto-flow:dense]",
      )}
      style={{
        gridTemplateColumns: fill ? undefined : `repeat(${BENTO_COLS}, minmax(0, 1fr))`,
        gridAutoRows: `${ROW}px`,
        gap: GAP,
        minHeight: placed ? maxRow * (ROW + GAP) : undefined,
        backgroundImage: fill
          ? "linear-gradient(color-mix(in oklab, var(--bio-fg) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--bio-fg) 7%, transparent) 1px, transparent 1px)"
          : undefined,
        backgroundSize: fill ? "72px 72px" : undefined,
        padding: fill ? 8 : undefined,
      }}
      onDragOver={(event) => {
        if (!editable || arrangeMode || !dragId) return;
        event.preventDefault();
        updateHover(dragId, event.clientX, event.clientY);
      }}
      onDrop={(event) => {
        if (!editable || arrangeMode || !dragId) return;
        event.preventDefault();
        commitHoverMove(dragId, event.clientX, event.clientY);
        setDragId(null);
        setHover(null);
      }}
    >
      {placed && hover && dragId ? (
        <div
          className="pointer-events-none rounded-[28px] border border-dashed border-white/40 bg-white/5"
          style={{
            gridColumn: `${hover.x + 1} / span ${packed.find((item) => item.id === dragId)?.colSpan ?? 1}`,
            gridRow: `${hover.y + 1} / span ${packed.find((item) => item.id === dragId)?.rowSpan ?? 1}`,
          }}
        />
      ) : null}
      {packed.map((link) => {
        const preview = resizePreview?.id === link.id ? resizePreview : null;
        return (
          <BentoTile
            key={link.id}
            link={preview ? { ...link, colSpan: preview.colSpan, rowSpan: preview.rowSpan } : link}
            live={Boolean(livePlatforms?.[link.platform as keyof LivePlatformFlags])}
            editable={editable && !arrangeMode}
            arrangeMode={arrangeMode}
            fill={fill}
            selected={selectedId === link.id}
            glow={theme.glowStrength}
            paint={bentoTilePaint(link.platform, theme)}
            onSelect={onSelect}
            onResize={onResize}
            onDragStart={() => setDragId(link.id)}
            onDragEnd={() => {
              setDragId(null);
              setHover(null);
            }}
            onArrangePointerDown={(event) => {
              if ((event.target as HTMLElement).closest("[data-bento-chrome]")) return;
              onSelect?.(link.id);
              setDragId(link.id);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onArrangePointerMove={(event) => {
              if (!dragId || resizePreview) return;
              updateHover(dragId, event.clientX, event.clientY);
            }}
            onArrangePointerUp={(event) => {
              if (!dragId || resizePreview) return;
              const rect = rootRef.current?.getBoundingClientRect();
              const item = packed.find((entry) => entry.id === dragId);
              if (rect && item) {
                const start = cellFromPoint(rect, event.clientX, event.clientY, item.colSpan);
                const current = packed.find((entry) => entry.id === dragId);
                if (!current || start.x !== current.gridX || start.y !== current.gridY) {
                  commitHoverMove(dragId, event.clientX, event.clientY);
                }
              }
              setDragId(null);
              setHover(null);
            }}
            onArrangeResize={(next) => setResizePreview(next ? { id: link.id, ...next } : null)}
          />
        );
      })}
    </div>
  );
}

function BentoTile({
  link,
  live,
  editable,
  arrangeMode,
  fill,
  selected,
  glow,
  paint,
  onSelect,
  onResize,
  onDragStart,
  onDragEnd,
  onArrangePointerDown,
  onArrangePointerMove,
  onArrangePointerUp,
  onArrangeResize,
}: {
  link: PublicBioLink;
  live: boolean;
  editable: boolean;
  arrangeMode: boolean;
  fill: boolean;
  selected: boolean;
  glow: number;
  paint: BentoTilePaint;
  onSelect?: ((id: string) => void) | undefined;
  onResize?: ((id: string, colSpan: 1 | 2, rowSpan: 1 | 2) => void) | undefined;
  onDragStart: () => void;
  onDragEnd: () => void;
  onArrangePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onArrangePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onArrangePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onArrangeResize: (next: { colSpan: 1 | 2; rowSpan: 1 | 2 } | null) => void;
}) {
  const name = PLATFORM_NAME[link.platform];
  const large = link.colSpan >= 2 && link.rowSpan >= 2;
  const logoSize = large ? 48 : 40;
  const size = bentoSizeOf(link.colSpan, link.rowSpan);
  const interactive = editable || arrangeMode;

  const applySize = (next: BentoSize) => {
    const found = BENTO_SIZES.find((item) => item.id === next) ?? BENTO_SIZES[0]!;
    onSelect?.(link.id);
    onResize?.(link.id, found.colSpan, found.rowSpan);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!arrangeMode) return;
    const map: Record<string, BentoSize> = { "1": "1x1", "2": "2x1", "3": "1x2", "4": "2x2" };
    if (map[event.key]) {
      event.preventDefault();
      applySize(map[event.key]!);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      applySize(link.rowSpan >= 2 ? "2x2" : "2x1");
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applySize(link.rowSpan >= 2 ? "1x2" : "1x1");
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      applySize(link.colSpan >= 2 ? "2x2" : "1x2");
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      applySize(link.colSpan >= 2 ? "2x1" : "1x1");
    }
  };

  const startResize = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(link.id);
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const tile = handle.closest("[data-tile]") as HTMLElement | null;
    const origin = tile?.getBoundingClientRect();
    const grid = tile?.parentElement?.getBoundingClientRect();
    if (!origin || !grid) return;
    const cellW = (grid.width - GAP * (BENTO_COLS - 1)) / BENTO_COLS;
    let last = { colSpan: link.colSpan, rowSpan: link.rowSpan };
    const onMove = (next: PointerEvent) => {
      last = snapSpan(next.clientX - origin.left, next.clientY - origin.top, cellW);
      onArrangeResize(last);
    };
    const onUp = () => {
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      onArrangeResize(null);
      onResize?.(link.id, last.colSpan, last.rowSpan);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  };

  const inner =
    link.kind === "gallery" ? (
      <div className="flex h-full flex-col p-5">
        <LinkInBioGallery images={link.galleryImages} title={link.title} className="min-h-0 flex-1" />
      </div>
    ) : (
      <>
        {paint.wash ? (
          <span className="pointer-events-none absolute inset-0" style={{ background: paint.wash }} aria-hidden />
        ) : null}
        <span className="sr-only">{name}</span>
        <span className="absolute left-6 top-6 z-[1]" style={{ width: logoSize, height: logoSize }}>
          <LinkInBioPlatformLogo
            key={`${link.id}-mark`}
            platform={link.platform}
            size={logoSize}
            ink={paint.ink}
            onLight={paint.onLight}
          />
        </span>
        {live ? (
          <span
            className="absolute right-6 top-6 z-[1] size-2 rounded-full"
            style={{ background: paint.ink }}
            aria-hidden
          />
        ) : null}
        {!arrangeMode ? (
          <span
            className="pointer-events-none absolute bottom-5 right-5 z-[1] grid size-8 place-items-center rounded-full border"
            style={{
              borderColor: "color-mix(in oklab, var(--bio-fg) 42%, transparent)",
              color: "color-mix(in oklab, var(--bio-fg) 72%, transparent)",
            }}
            aria-hidden
          >
            <ArrowUpRight className="size-3.5" strokeWidth={2.4} />
          </span>
        ) : null}
      </>
    );

  const chrome = arrangeMode && selected && onResize ? (
    <>
      <div
        data-bento-chrome
        className="absolute inset-x-3 bottom-3 z-10 flex -translate-y-0 justify-center gap-1 rounded-full bg-black/55 p-1 backdrop-blur-md"
      >
        {BENTO_SIZES.map((item) => (
          <button
            key={item.id}
            type="button"
            data-bento-chrome
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.62rem] font-medium",
              size === item.id ? "bg-white text-black" : "text-white/75 hover:bg-white/10",
            )}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              applySize(item.id);
            }}
          >
            {item.id.replace("x", "×")}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-bento-chrome
        data-resize
        aria-label={`Resize ${name}`}
        className="absolute bottom-2 right-2 z-10 size-4 cursor-se-resize rounded-sm border border-white/70 bg-white/30"
        onPointerDown={startResize}
      />
    </>
  ) : null;

  const sharedClass = cn(
    "relative overflow-hidden rounded-[28px] outline-none transition-transform",
    !interactive && "hover:-translate-y-0.5",
    selected && "ring-2 ring-violet-400/75 ring-offset-2 ring-offset-transparent",
    arrangeMode && "cursor-grab active:cursor-grabbing",
  );
  const sharedStyle = {
    gridColumn: fill ? `span ${link.colSpan}` : `${link.gridX + 1} / span ${link.colSpan}`,
    gridRow: fill ? `span ${link.rowSpan}` : `${link.gridY + 1} / span ${link.rowSpan}`,
    background:
      link.kind === "gallery"
        ? "color-mix(in oklab, #ffffff 22%, var(--bio-bg))"
        : paint.fill,
    border:
      link.kind === "gallery"
        ? "1px solid color-mix(in oklab, var(--bio-fg) 10%, transparent)"
        : paint.border,
    backdropFilter:
      link.kind === "gallery" ? "blur(18px)" : paint.backdropFilter,
    boxShadow:
      link.kind === "gallery"
        ? "0 10px 28px color-mix(in oklab, #000 16%, transparent)"
        : paint.boxShadow
          ? paint.boxShadow
          : glow
            ? `0 16px 28px color-mix(in oklab, ${paint.glowColor} ${Math.round(glow / 4)}%, transparent)`
            : undefined,
  } as const;

  if (arrangeMode) {
    return (
      <div
        data-tile
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${name}, ${size.replace("x", " by ")}. Drag to move. Keys 1 to 4 resize.`}
        onPointerDown={onArrangePointerDown}
        onPointerMove={onArrangePointerMove}
        onPointerUp={onArrangePointerUp}
        onClick={() => onSelect?.(link.id)}
        onKeyDown={onKeyDown}
        className={sharedClass}
        style={sharedStyle}
      >
        {inner}
        {chrome}
      </div>
    );
  }

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
