export const WIZARD_COPY = [
  { title: "Who should they meet?", hint: "Username, name, bio, and a face for the page." },
  { title: "Set the atmosphere", hint: "Page background and typography — the rest stays at the theme defaults." },
  { title: "Platforms and extras", hint: "Handles in one tab. Schedule, banner, and countdown in the other." },
  { title: "Arrange, review, publish", hint: "Work on the page itself. Publish when it feels like you." },
] as const;

export const wizardUi = {
  label: "mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.16em] text-white/40",
  hint: "mt-1.5 text-xs leading-relaxed text-white/40",
  help: "text-[0.72rem] leading-relaxed text-white/42",
  field:
    "h-10 rounded-2xl border-[rgba(255,255,255,0.08)] bg-black/30 text-sm focus-visible:border-violet-400/40 focus-visible:ring-1 focus-visible:ring-violet-400/30",
  section: "mb-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-white/38",
  card: "rounded-[1.25rem] border border-[rgba(255,255,255,0.08)] bg-white/[0.035] p-5 backdrop-blur-xl",
  iconWell: "grid size-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06]",
  tabList:
    "grid h-auto w-full shrink-0 grid-cols-2 gap-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-black/35 p-1 backdrop-blur-xl",
  tabListPair:
    "grid h-auto w-full shrink-0 grid-cols-2 gap-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-black/35 p-1 backdrop-blur-xl",
  tabTrigger:
    "rounded-xl px-1 py-2 text-[0.68rem] leading-tight text-white/50 data-[state=active]:bg-gradient-to-b data-[state=active]:from-violet-500 data-[state=active]:to-violet-700 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_20px_-12px_rgba(124,58,237,0.9)]",
  tabBody: "mt-4 min-h-0 flex-1 overflow-y-auto outline-none",
  ctaPrimary:
    "h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-700 px-6 text-white shadow-[0_14px_32px_-16px_rgba(124,58,237,0.85)] hover:from-violet-400 hover:to-violet-600",
  ctaQuiet:
    "h-11 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-transparent px-5 text-white/65 hover:bg-white/[0.04] hover:text-white",
} as const;

export const MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .wiz-orbit { animation: wiz-orbit 5.5s linear infinite; }
  .wiz-orbit-b { animation: wiz-orbit 7s linear infinite reverse; }
  .wiz-ripple { animation: wiz-ripple 2.4s ease-out infinite; }
  .wiz-ripple-b { animation: wiz-ripple 2.4s ease-out 0.7s infinite; }
  .wiz-haze { animation: wiz-haze 4s ease-in-out infinite; }
  .wiz-glow { animation: wiz-glow 3.2s ease-in-out infinite; }
  .wiz-glow-b { animation: wiz-glow 3.8s ease-in-out 0.6s infinite; }
}
@keyframes wiz-orbit { to { transform: rotate(360deg); } }
@keyframes wiz-ripple {
  0% { transform: translate(-50%,-50%) scale(0.35); opacity: 0.7; }
  100% { transform: translate(-50%,-50%) scale(1.15); opacity: 0; }
}
@keyframes wiz-haze {
  0%, 100% { transform: translateY(0) rotate(-1deg); opacity: 0.55; }
  50% { transform: translateY(-3px) rotate(1.5deg); opacity: 0.9; }
}
@keyframes wiz-glow {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.08); }
}
`;
