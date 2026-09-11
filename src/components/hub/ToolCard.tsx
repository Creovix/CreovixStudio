import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Copy, Lock, Trash2 } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

export type ToolCardProps = {
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  preview: ReactNode;
  status?: string | undefined;
  live?: boolean;
  actionLabel: string;
  disabled?: boolean;
  publicToken?: string | undefined;
  /** Overrides the default `/overlay/<token>` browser-source URL. */
  overlayUrl?: string | undefined;
  onOpen: () => void;
  onDelete?: (() => void) | undefined;
  deleteLabel?: string;
  removing?: boolean;
  locked?: boolean;
  lockLabel?: string;
  /** Platform brand colour used for the hover border/glow accent. */
  accent?: string | undefined;
};

export function ToolCard({
  name,
  description,
  icon: Icon,
  preview,
  status,
  live = false,
  actionLabel,
  disabled = false,
  publicToken,
  overlayUrl,
  onOpen,
  onDelete,
  deleteLabel = "Delete widget",
  removing = false,
  locked = false,
  lockLabel = "Subscription required",
  accent,
}: ToolCardProps) {

  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (locked) return;
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const url = overlayUrl ?? (publicToken ? `${origin}/overlay/${publicToken}` : null);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };


  return (
    <div
      className={`glass-3d glass-lift group relative flex h-full flex-col overflow-hidden rounded-2xl p-3 text-start transition-all duration-300 ${
        removing ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"
      }`}
      style={accent ? ({ "--tool-accent": accent } as CSSProperties) : undefined}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent opacity-0 transition-all duration-300 group-hover:border-[color:var(--tool-accent)] group-hover:opacity-70 group-hover:shadow-[0_0_28px_-8px_var(--tool-accent)]"
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(60%_100%_at_50%_100%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative h-[120px] overflow-hidden rounded-xl border border-[oklch(1_0_0/0.06)] bg-[oklch(1_0_0/0.02)] [perspective:900px]">
        <div
          className={`h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:translateY(-3px)_rotateX(6deg)_scale(1.04)] ${
            locked ? "blur-[3px] saturate-50" : ""
          }`}
        >
          {preview}
        </div>
        {locked ? (
          <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[1px]">
            <span
              className="flex items-center gap-1.5 rounded-full border border-[oklch(1_0_0/0.14)] px-3 py-1.5 text-[0.66rem] font-semibold text-foreground shadow-[0_10px_26px_-10px_rgba(0,0,0,0.9),inset_0_1px_0_oklch(1_0_0/0.14)]"
              style={{ background: "rgba(15, 17, 23, 0.85)" }}
            >
              <Lock className="size-3.5 text-primary" aria-hidden />
              {lockLabel}
            </span>
          </div>
        ) : null}
      </div>


      <div className="relative mt-3.5 flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-[oklch(1_0_0/0.08)] bg-[oklch(1_0_0/0.04)] shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]">
          <Icon className="size-4 text-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.9rem] font-medium tracking-tight">{name}</p>
          <p className="mt-1 line-clamp-2 text-[0.74rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {status ? (
            <span
              className={`size-1.5 rounded-full ${live ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-muted-foreground/50"}`}
              aria-hidden
            />
          ) : null}
          {status ?? ""}
        </span>

        <div className="flex items-center gap-1.5">
          {(publicToken || overlayUrl) && !locked ? (
            <button
              type="button"
              onClick={copy}
              aria-label={`Copy OBS browser source URL for ${name}`}
              className="rounded-lg border border-[oklch(1_0_0/0.08)] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5 text-primary" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
            </button>
          ) : null}
          {onDelete && !locked ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`${deleteLabel}: ${name}`}
              title={deleteLabel}
              className="rounded-lg border border-transparent bg-[oklch(1_0_0/0.05)] p-1.5 text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-red-500/30 hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpen}
            disabled={disabled}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[0.74rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
              locked ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            {locked ? <Lock className="size-3" aria-hidden /> : null}
            {locked ? lockLabel : actionLabel}
            {locked ? null : (
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
