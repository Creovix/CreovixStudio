import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Check, ChevronDown, Gift, LogOut, Radio, Scissors, Settings, Sparkles } from "lucide-react";

import { StreamlabsBridge } from "@/components/layout/StreamlabsBridge";
import { StreamElementsBridge } from "@/components/layout/StreamElementsBridge";
import { SubscriptionStatusPill } from "@/components/settings/SubscriptionPanel";
import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { disableTestMode, isTestMode } from "@/lib/testMode";
import { useLanguage, type Lang, type TranslationKey } from "@/lib/i18n";
import type { Subathon } from "@/hooks/useWorkspace";

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  user: { email?: string | undefined; id: string };
  profile?: { name: string | null; image: string | null } | null | undefined;
  subathons?: Subathon[];
  activeSubathonId?: string | null;
};


const LANGUAGES: { id: Lang; flag: string; label: TranslationKey }[] = [
  { id: "ar", flag: "🇸🇦", label: "lang.arabic" },
  { id: "en", flag: "🇬🇧", label: "lang.english" },
];

const menuSurface =
  "absolute end-0 top-full z-50 mt-2 min-w-44 rounded-xl border p-1.5";

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

export function AppShell({ children, title, subtitle, actions, user, profile }: AppShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang, dir, setLang } = useLanguage();

  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useClickOutside(() => setLangOpen(false));
  const profileRef = useClickOutside(() => setProfileOpen(false));

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
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-[0.8rem] transition-colors";

  return (
    <div dir={dir} className="ambient-field min-h-screen bg-background text-foreground">
      {isTestMode() ? null : (
        <>
          <StreamlabsBridge userId={user.id} />
          <StreamElementsBridge userId={user.id} />
        </>
      )}
      <header className="sticky top-0 z-30 px-4">
        <div
          className="mx-auto mt-4 flex w-[94%] max-w-7xl flex-wrap items-center gap-3 rounded-2xl px-6 py-3.5"
          style={{
            background: "rgba(15, 17, 23, 0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span
              className="grid size-9 place-items-center rounded-xl border border-border"
              style={{
                background:
                  "linear-gradient(140deg, color-mix(in oklab, var(--primary) 65%, transparent), color-mix(in oklab, var(--cyan) 40%, transparent))",
              }}
            >
              <Sparkles className="size-4 text-primary-foreground" aria-hidden />
            </span>
            <span className="text-sm font-semibold tracking-tight">Creovix Studio</span>
          </Link>

          <nav className="ms-4 flex items-center gap-1">
            <Link
              to="/activity-feed"
              className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-[0.82rem] text-muted-foreground transition-colors hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] px-3 py-2 text-[0.82rem] text-foreground",
              }}
            >
              <Activity className="size-4" aria-hidden />
              <span className="hidden sm:inline">Activity Feed</span>
            </Link>
            <Link
              to="/live-counter"
              className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-[0.82rem] text-muted-foreground transition-colors hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] px-3 py-2 text-[0.82rem] text-foreground",
              }}
            >
              <Radio className="size-4" aria-hidden />
              <span className="hidden sm:inline">Live Counter</span>
            </Link>
            <Link
              to="/giveaway"
              className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-[0.82rem] text-muted-foreground transition-colors hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] px-3 py-2 text-[0.82rem] text-foreground",
              }}
            >
              <Gift className="size-4" aria-hidden />
              <span className="hidden sm:inline">Giveaway</span>
            </Link>
            <Link
              to="/clip-command"
              className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-[0.82rem] text-muted-foreground transition-colors hover:bg-[oklch(1_0_0/0.06)] hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] px-3 py-2 text-[0.82rem] text-foreground",
              }}
            >
              <Scissors className="size-4" aria-hidden />
              <span className="hidden sm:inline">Clip Command</span>
            </Link>
          </nav>



          <div className="ms-auto flex items-center gap-2">
            {actions}

            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen((open) => !open);
                  setProfileOpen(false);
                }}
                aria-label={t("nav.language")}
                aria-expanded={langOpen}
                className="flex items-center gap-1.5 rounded-full border border-[oklch(1_0_0/0.1)] bg-[oklch(1_0_0/0.04)] px-3 py-2 text-sm transition-colors hover:text-foreground"
              >
                <span aria-hidden className="leading-none">{currentLang.flag}</span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {langOpen ? (
                <div className={menuSurface} style={menuSurfaceStyle} role="menu">
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
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setLangOpen(false);
                }}
                aria-label={t("nav.profile")}
                aria-expanded={profileOpen}
                className="grid size-9 place-items-center overflow-hidden rounded-full border border-[oklch(1_0_0/0.12)] transition-shadow hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
              >
                {profile?.image ? (
                  <img src={profile.image} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid size-full place-items-center bg-secondary text-[0.65rem] font-semibold">
                    {initials}
                  </span>
                )}
              </button>

              {profileOpen ? (
                <div className={`${menuSurface} min-w-60`} style={menuSurfaceStyle} role="menu">
                  <div className="px-3 py-2.5">
                    <p className="text-[0.82rem] font-semibold">
                      {profile?.name ?? "Creovix"}
                    </p>
                    <p className="mt-0.5 truncate text-[0.72rem] text-muted-foreground">
                      {user.email ?? "creovix0@gmail.com"}
                    </p>
                    <div className="mt-2">
                      <SubscriptionStatusPill userId={user.id} />
                    </div>
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
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1800px] px-4 md:px-8 pb-16 pt-8">
        <div className="mb-8">
          <h1 className="text-[1.6rem] font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
