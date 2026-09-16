import { cn } from "@/lib/utils";

export type StudioPageTab<T extends string> = {
  id: T;
  label: string;
};

export function StudioPageTabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: readonly StudioPageTab<T>[];
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap gap-1", className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[0.82rem] font-medium transition-colors",
            value === item.id ? "bg-zinc-800 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
