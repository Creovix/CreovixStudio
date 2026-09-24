import type { ReactNode } from "react";

import { wizardUi } from "@/components/link-in-bio/wizard/wizardTokens";
import { cn } from "@/lib/utils";

export function optionTileClass(active: boolean) {
  return cn(
    "rounded-2xl border p-4 text-start transition-colors",
    active
      ? "border-violet-400/45 bg-violet-500/[0.1] shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]"
      : "border-[rgba(255,255,255,0.08)] bg-white/[0.03] hover:border-white/12",
  );
}

export function OptionTile({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={cn(optionTileClass(active), className)} onClick={onClick}>
      {children}
    </button>
  );
}

export function ModuleCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(wizardUi.card, className)}>{children}</div>;
}
