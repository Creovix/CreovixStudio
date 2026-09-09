import { AlertTriangle } from "lucide-react";

import { useLanguage } from "@/lib/i18n";

/**
 * 3D glass confirmation dialog shown before any widget is permanently removed.
 */
export function DeleteWidgetDialog({
  widgetName,
  pending = false,
  onCancel,
  onConfirm,
}: {
  widgetName?: string | undefined;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ar ? "حذف الودجت؟" : "Delete widget?"}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-3d w-full max-w-sm rounded-2xl p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-red-500/30 bg-red-500/15 text-red-400">
            <AlertTriangle className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-tight">
              {ar ? "حذف الودجت؟" : "Delete widget?"}
            </h2>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-muted-foreground">
              {ar
                ? "هل أنت متأكد من إزالة هذا الودجت؟ سيتم تعطيل رابط مصدر OBS الخاص به."
                : "Are you sure you want to remove this widget? This will disable its active OBS source link."}
            </p>
            {widgetName ? (
              <p className="mt-2 truncate text-[0.75rem] font-medium">{widgetName}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.03)] px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.9)] transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? (ar ? "جارٍ الحذف…" : "Deleting…") : ar ? "حذف" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
