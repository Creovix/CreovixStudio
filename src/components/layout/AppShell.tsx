import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Bookmark,
  CalendarDays,
  Check,
  ChevronsLeft,
  Gift,
  Home,
  LogOut,
  MessageSquareCode,
  Radio,
  Scissors,
  Settings,
  Sparkles,
} from "lucide-react";

import { StreamlabsBridge } from "@/components/layout/StreamlabsBridge";
import { StreamElementsBridge } from "@/components/layout/StreamElementsBridge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { disableTestMode, isTestMode } from "@/lib/testMode";
import { useLanguage, type Lang, type TranslationKey } from "@/lib/i18n";
import type { Subathon } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  user: { email?: string | undefined; id: string };
  profile?: { name: string | null; image: string | null } | null | undefined;
  subathons?: Subathon[];
  activeSubathonId?: string | null;
};

const SIDEBAR_KEY = "creovix:sidebar-collapsed";
const EXPANDED_W = "16.5rem";
const COLLAPSED_W = "4.75rem";

const LANGUAGES: { id: Lang; flag: string; label: TranslationKey }[] = [
  { id: "ar", flag: "🇸🇦", label: "lang.arabic" },
  { id: "en", flag: "🇬🇧", label: "lang.english" },
];

const NAV = [
  { to: "/dashboard" as const, icon: Home, en: "Home", ar: "الرئيسية" },
  { to: "/analytics" as const, icon: BarChart3, en: "Analytics", ar: "الإحصائيات" },
  { to: "/activity-feed" as const, icon: Activity, en: "Activity", ar: "سجل النشاط" },
  { to: "/live-counter" as const, icon: Radio, en: "Live Counter", ar: "العداد المباشر" },
  { to: "/giveaway" as const, icon: Gift, en: "Giveaway", ar: "السحب" },
  { to: "/custom-commands" as const, icon: MessageSquareCode, en: "Chat Commands", ar: "أوامر الشات" },
  { to: "/clip-command" as const, icon: Scissors, en: "Clip Command", ar: "أمر القص" },
  { to: "/schedule" as const, icon: CalendarDays, en: "Schedule", ar: "الجدول" },
  { to: "/mark-points" as const, icon: Bookmark, en: "Mark Points", ar: "نقاط البث" },
];

const menuSurface = "absolute z-50 min-w-44 rounded-xl border p-1.5";
const menuSurfaceStyle = {
  background: "rgba(15, 17, 23, 0.95)",
  backdropFilter: "blur(12px)",
  borderColor: "rgba(255, 255, 255, 0.1)",
  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55)",
} as const;

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

function IconTip({
  label,
  collapsed,
  children,
  dir,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
  dir: "ltr" | "rtl";
}) {
  if (!collapsed) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={dir === "rtl" ? "left" : "right"} sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppShell({ children, title, subtitle, actions, user, profile }: AppShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang, dir, setLang } = useLanguage();

  const [collapsed, setCollapsed] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useClickOutside(() => setLangOpen(false));
  const profileRef = useClickOutside(() => setProfileOpen(false));

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    disableTestMode();
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  const initials = (profile?.name ?? user.email ?? "?").slice(0, 2).toUpperCase();
  const currentLang = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[1]!;
  const menuItem =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[0.8rem] transition-colors";
  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  const navBtn = (active: boolean) =>
    cn(
      "group relative flex w-full items-center rounded-xl border border-transparent text-[0.82rem] transition-colors",
      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
      active
        ? "border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] text-foreground"
        : "text-muted-foreground hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground",
    );

  return (
    <TooltipProvider delayDuration={80}>
      <div className="ambient-field min-h-screen bg-background text-foreground">
        {isTestMode() ? null : (
          <>
            <StreamlabsBridge userId={user.id} />
            <StreamElementsBridge userId={user.id} />
          </>
        )}

        <aside
          className="fixed inset-y-0 start-0 z-40 flex flex-col border-e border-[rgba(255,255,255,0.1)] transition-[width] duration-200 ease-out"
          style={{
            width: sidebarW,
            background: "rgba(15, 17, 23, 0.92)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div className={cn("flex items-center gap-2 border-b border-white/10 px-3 py-3", collapsed && "justify-center")}>
            <Link to="/dashboard" className={cn("flex min-w-0 items-center gap-2.5", collapsed && "justify-center")}>
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-border"
                style={{
                  background:
                    "linear-gradient(140deg, color-mix(in oklab, var(--primary) 65%, transparent), color-mix(in oklab, var(--cyan) 40%, transparent))",
                }}
              >
                <Sparkles className="size-4 text-primary-foreground" aria-hidden />
              </span>
              {collapsed ? null : (
                <span className="truncate text-sm font-semibold tracking-tight">Creovix Studio</span>
              )}
            </Link>
            {collapsed ? null : (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                className="ms-auto grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <ChevronsLeft className="size-4 rtl:rotate-180" />
              </button>
            )}
          </div>

          {collapsed ? (
            <div className="flex justify-center py-2">
              <IconTip label={lang === "ar" ? "توسيع القائمة" : "Expand sidebar"} collapsed dir={dir}>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Expand sidebar"
                  className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <ChevronsLeft className="size-4 rotate-180 rtl:rotate-0" />
                </button>
              </IconTip>
            </div>
          ) : null}

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
            {NAV.map((item) => {
              const label = lang === "ar" ? item.ar : item.en;
              const Icon = item.icon;
              return (
                <IconTip key={item.to} label={label} collapsed={collapsed} dir={dir}>
                  <Link
                    to={item.to}
                    className={navBtn(false)}
                    activeProps={{ className: navBtn(true) }}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {collapsed ? null : <span className="truncate">{label}</span>}
                  </Link>
                </IconTip>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/10 px-2 py-3">
            <div ref={langRef} className="relative">
              <IconTip label={t("nav.language")} collapsed={collapsed} dir={dir}>
                <button
                  type="button"
                  onClick={() => {
                    setLangOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  aria-label={t("nav.language")}
                  aria-expanded={langOpen}
                  className={cn(
                    "flex w-full items-center rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] text-sm transition-colors hover:text-foreground",
                    collapsed ? "justify-center px-0 py-2" : "gap-2 px-3 py-2",
                  )}
                >
                  <span aria-hidden className="leading-none">
                    {currentLang.flag}
                  </span>
                  {collapsed ? null : (
                    <span className="truncate text-xs text-muted-foreground">{t(currentLang.label)}</span>
                  )}
                </button>
              </IconTip>
              {langOpen ? (
                <div
                  className={cn(menuSurface, collapsed ? "start-full top-0 ms-2" : "start-0 bottom-full mb-2")}
                  style={menuSurfaceStyle}
                  role="menu"
                >
                  {LANGUAGES.map((option) => {
                    const active = option.id === lang;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => {
                          setLang(option.id);
                          setLangOpen(false);
                        }}
                        className={`${menuItem} ${
                          active
                            ? "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] text-foreground"
                            : "text-muted-foreground hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground"
                        }`}
                      >
                        <span aria-hidden>{option.flag}</span>
                        <span className="flex-1">{t(option.label)}</span>
                        {active ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div ref={profileRef} className="relative">
              <IconTip label={t("nav.profile")} collapsed={collapsed} dir={dir}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((open) => !open);
                    setLangOpen(false);
                  }}
                  aria-label={t("nav.profile")}
                  aria-expanded={profileOpen}
                  className={cn(
                    "flex w-full items-center rounded-xl transition-colors hover:bg-white/5",
                    collapsed ? "justify-center p-1" : "gap-2.5 px-2 py-1.5",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[oklch(1_0_0/0.12)]">
                    {profile?.image ? (
                      <img src={profile.image} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <span className="grid size-full place-items-center bg-secondary text-[0.65rem] font-semibold">
                        {initials}
                      </span>
                    )}
                  </span>
                  {collapsed ? null : (
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block truncate text-xs font-semibold">
                        {profile?.name ?? "Creovix"}
                      </span>
                      <span className="block truncate text-[0.65rem] text-muted-foreground">
                        {user.email ?? ""}
                      </span>
                    </span>
                  )}
                </button>
              </IconTip>

              {profileOpen ? (
                <div
                  className={cn(
                    menuSurface,
                    "min-w-60",
                    collapsed ? "start-full bottom-0 ms-2" : "start-0 bottom-full mb-2",
                  )}
                  style={menuSurfaceStyle}
                  role="menu"
                >
                  <div className="px-3 py-2.5">
                    <p className="text-[0.82rem] font-semibold">{profile?.name ?? "Creovix"}</p>
                    <p className="mt-0.5 truncate text-[0.72rem] text-muted-foreground">
                      {user.email ?? "creovix0@gmail.com"}
                    </p>
                  </div>
                  <div className="my-1 border-t border-[rgba(255,255,255,0.08)]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate({ to: "/settings" });
                    }}
                    className={`${menuItem} text-muted-foreground hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground`}
                  >
                    <Settings className="size-4" aria-hidden />
                    {t("nav.settings")}
                  </button>
                  <div className="my-1 border-t border-[rgba(255,255,255,0.08)]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void signOut()}
                    className={`${menuItem} text-red-500 hover:bg-[rgba(239,68,68,0.15)]`}
                  >
                    <LogOut className="size-4" aria-hidden />
                    {t("nav.signOut")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div
          className="min-h-screen min-w-0 transition-[padding] duration-200 ease-out"
          style={{ paddingInlineStart: sidebarW }}
        >
          <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-8">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 text-start">
                <h1 className="text-[1.6rem] font-semibold tracking-tight">{title}</h1>
                {subtitle ? <div className="mt-1 text-start text-sm text-muted-foreground">{subtitle}</div> : null}
              </div>
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
