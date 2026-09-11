import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const SECTION_PREVIEW_LIMIT = 4;

type ExpandableToolSectionProps<T> = {
  title: string;
  accent: string;
  titleClass: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  itemKey: (item: T) => string;
  wide?: boolean;
  limit?: number;
};

export function ExpandableToolSection<T>({
  title,
  accent,
  titleClass,
  items,
  renderItem,
  itemKey,
  wide = false,
  limit = SECTION_PREVIEW_LIMIT,
}: ExpandableToolSectionProps<T>) {
  const { t } = useLanguage();
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  const extra = items.slice(limit);
  const overflow = extra.length > 0;

  return (
    <section className={wide ? "col-span-1 lg:col-span-2" : undefined}>
      <header className="flex items-center gap-4 py-2">
        <span
          aria-hidden
          className="h-px flex-1 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accent})` }}
        />
        <h2 className={`shrink-0 text-center text-lg font-semibold tracking-tight ${titleClass}`}>
          {title}
        </h2>
        {overflow ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide transition-colors hover:bg-white/5"
            style={{
              borderColor: `${accent}55`,
              color: accent,
              boxShadow: expanded ? `0 0 18px -8px ${accent}` : undefined,
            }}
          >
            {expanded ? t("home.viewLess") : `+${extra.length}`}
          </button>
        ) : null}
        <span
          aria-hidden
          className="h-px flex-1 rounded-full"
          style={{ background: `linear-gradient(270deg, transparent, ${accent})` }}
        />
      </header>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {items.slice(0, limit).map((item) => (
          <div key={itemKey(item)}>{renderItem(item)}</div>
        ))}
      </div>

      {overflow ? (
        <>
          <div
            id={panelId}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                {extra.map((item, index) => (
                  <div
                    key={itemKey(item)}
                    className={expanded ? "animate-in fade-in slide-in-from-bottom-3 fill-mode-both" : undefined}
                    style={
                      expanded
                        ? { animationDuration: "420ms", animationDelay: `${index * 55}ms` }
                        : undefined
                    }
                  >
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-white/5"
            style={{
              borderColor: `${accent}40`,
              color: accent,
              boxShadow: expanded ? `0 10px 28px -18px ${accent}` : `0 0 0 0 transparent`,
            }}
          >
            <span>{expanded ? t("home.viewLess") : t("home.viewMore")}</span>
            {!expanded ? (
              <span className="rounded-full border px-2 py-0.5 text-[0.68rem] text-muted-foreground" style={{ borderColor: `${accent}33` }}>
                +{extra.length}
              </span>
            ) : null}
            <ChevronDown
              className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
        </>
      ) : null}
    </section>
  );
}
