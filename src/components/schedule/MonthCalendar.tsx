import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  formatClock,
  monthGrid,
  monthLabel,
  shiftMonth,
  slotOnDate,
  weekOrder,
  weekdayLabel,
  type ScheduleSlot,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

type CalendarSlot = Pick<
  ScheduleSlot,
  "id" | "weekday" | "occursOn" | "startMinutes" | "durationMinutes" | "game" | "title" | "coverUrl" | "enabled"
>;

export function MonthCalendar({
  year,
  month,
  slots,
  lang,
  todayIso,
  onMonthChange,
  onAdd,
  onEdit,
}: {
  year: number;
  month: number;
  slots: CalendarSlot[];
  lang: "en" | "ar";
  todayIso?: string;
  onMonthChange?: (year: number, month: number) => void;
  onAdd?: (iso: string) => void;
  onEdit?: (id: string) => void;
}) {
  const days = weekOrder(lang);
  const cells = monthGrid(year, month, days, todayIso);
  const visible = slots.filter((slot) => slot.enabled || onEdit);
  const prev = "Previous month";
  const next = "Next month";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            const cursor = shiftMonth(year, month, -1);
            onMonthChange?.(cursor.year, cursor.month);
          }}
          className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label={prev}
          disabled={!onMonthChange}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>
        <h2 className="text-[0.95rem] font-semibold tracking-tight">{monthLabel(year, month, lang)}</h2>
        <button
          type="button"
          onClick={() => {
            const cursor = shiftMonth(year, month, 1);
            onMonthChange?.(cursor.year, cursor.month);
          }}
          className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label={next}
          disabled={!onMonthChange}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-y border-zinc-800/50">
        {days.map((day) => (
          <div
            key={`h-${day}`}
            className="border-e border-white/5 px-1.5 py-2 text-center text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground [&:nth-child(7n)]:border-e-0"
          >
            {weekdayLabel(day, lang, true)}
          </div>
        ))}
        {cells.map((cell) => {
          const items = visible
            .filter((slot) => slotOnDate(slot, cell.iso))
            .sort((a, b) => a.startMinutes - b.startMinutes);
          return (
            <div
              key={cell.iso}
              className={cn(
                "min-h-[11.5rem] border-e border-b border-zinc-800/50 p-0 [&:nth-child(7n)]:border-e-0 sm:min-h-[14rem]",
                !cell.inMonth && "opacity-40",
                onAdd && "cursor-pointer hover:bg-white/[0.03]",
              )}
              onClick={() => onAdd?.(cell.iso)}
            >
              <span
                className={cn(
                  "block px-1.5 pt-1.5 text-[0.72rem] font-medium tabular-nums sm:px-2",
                  cell.isToday ? "text-emerald-400" : "text-muted-foreground",
                )}
              >
                {cell.date.getDate()}
              </span>
              <ul>
                {items.map((slot) => {
                  const category = slot.game.trim() || slot.title;
                  const body = (
                    <span className={cn("flex flex-col", !slot.enabled && "opacity-50")}>
                      <span
                        className={cn(
                          "mt-1.5 block break-words border-y border-white/5 bg-white/[0.06] px-1.5 py-1.5 text-[0.78rem] font-semibold leading-snug sm:px-2 sm:text-[0.82rem]",
                          lang === "en" && "tracking-wide",
                        )}
                      >
                        <span dir="auto">{category}</span>
                      </span>
                      <span className="px-1.5 pt-1.5 sm:px-2">
                        {slot.game.trim() && slot.title.trim() && slot.title.trim() !== slot.game.trim() ? (
                          <span className="block text-[0.75rem] leading-snug" dir="auto">{slot.title}</span>
                        ) : null}
                        <span className="mt-0.5 block font-mono text-[0.68rem] text-muted-foreground">
                          {formatClock(slot.startMinutes)}
                          {slot.durationMinutes ? ` · ${slot.durationMinutes}m` : ""}
                        </span>
                      </span>
                      {slot.coverUrl ? (
                        <span className="mt-2 block px-1.5 pb-2 sm:px-2">
                          <img
                            src={slot.coverUrl}
                            alt=""
                            className="aspect-[3/4] w-full rounded-lg object-cover"
                          />
                        </span>
                      ) : null}
                    </span>
                  );
                  return (
                    <li key={`${slot.id}-${cell.iso}`}>
                      {onEdit ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(slot.id);
                          }}
                          className="w-full text-start"
                        >
                          {body}
                        </button>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
