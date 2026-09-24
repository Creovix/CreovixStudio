import type { ImgHTMLAttributes } from "react";

import logoUrl from "@/assets/Logo/cylix-studio.png";
import { cn } from "@/lib/utils";

const MARK_SIZE = {
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
  xl: "size-16",
} as const;

const WORDMARK_SIZE = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
} as const;

export type BrandLogoProps = {
  /** Mark size (square). */
  size?: keyof typeof MARK_SIZE;
  /** Show “CylixStudio” next to the mark. */
  showWordmark?: boolean;
  /** Compact mark-only (e.g. collapsed sidebar). */
  markOnly?: boolean;
  className?: string;
  imgClassName?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

/**
 * Official CylixStudio mark from `src/assets/Logo`.
 * Use `markOnly` in tight chrome; pair with wordmark on login / expanded nav.
 */
export function BrandLogo({
  size = "md",
  showWordmark = false,
  markOnly = false,
  className,
  imgClassName,
  ...imgProps
}: BrandLogoProps) {
  const mark = (
    <img
      src={logoUrl}
      alt={markOnly || !showWordmark ? "CylixStudio" : ""}
      width={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 36 : 28}
      height={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 36 : 28}
      decoding="async"
      className={cn(
        MARK_SIZE[size],
        "shrink-0 rounded-lg object-contain",
        imgClassName,
      )}
      {...imgProps}
    />
  );

  if (markOnly || !showWordmark) {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)}>{mark}</span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {mark}
      <span
        className={cn(
          "truncate font-semibold tracking-tight text-foreground",
          WORDMARK_SIZE[size],
        )}
      >
        CylixStudio
      </span>
    </span>
  );
}

export { logoUrl as brandLogoUrl };
