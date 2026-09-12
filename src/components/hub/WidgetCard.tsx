import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { WidgetRenderer } from "@/components/widgets/WidgetRenderer";
import { useWidgetStream } from "@/hooks/useWidgetStream";
import type { GoalRow, WidgetRow } from "@/hooks/useWidgets";
import { WIDGET_LABEL } from "@/lib/widgets";

export function WidgetCard({
  widget,
  goal,
  onToggle,
}: {
  widget: WidgetRow;
  goal: GoalRow | undefined;
  onToggle: (widget: WidgetRow) => void;
}) {
  const stream = useWidgetStream(widget.is_enabled ? widget.public_token : null);
  const [copied, setCopied] = useState(false);

  const overlayUrl =
    typeof window === "undefined"
      ? `/overlay/${widget.public_token}`
      : `${window.location.origin}/overlay/${widget.public_token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{widget.name}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {WIDGET_LABEL[widget.type]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(widget)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            widget.is_enabled
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {widget.is_enabled ? "Live" : "Paused"}
        </button>
      </div>

      <div className="grid min-h-[180px] place-items-center bg-[repeating-conic-gradient(#16171d_0%_25%,#101116_0%_50%)] bg-[length:24px_24px] p-4">
        <div className="w-full scale-90">
          <WidgetRenderer
            type={widget.type}
            config={widget.config}
            frame={stream.frame}
            remaining={stream.remaining}
            goal={
              stream.goal ??
              (goal
                ? {
                    title: goal.title,
                    unit: goal.unit,
                    target: goal.target_value,
                    current: goal.current_value,
                  }
                : null)
            }
            events={stream.events}
            spin={stream.spin}
            demo={!widget.is_enabled}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 text-sm">
        <span className="me-auto text-xs text-muted-foreground">
          {widget.is_enabled ? stream.status : "disabled"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
        >
          {copied ? "Copied!" : "Copy OBS URL"}
        </button>
        {widget.type === "GOAL_BAR" ? (
          <Link
            to="/widgets/$widgetId/goal"
            params={{ widgetId: widget.id }}
            className="rounded-xl border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
          >
            Goal
          </Link>
        ) : null}
        <Link
          to="/widgets/$widgetId"
          params={{ widgetId: widget.id }}
          className="rounded-xl bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:opacity-90"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
