import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type LoginSearch = { error?: string | undefined; detail?: string | undefined };

const ERRORS: Record<string, string> = {
  twitch_not_configured: "Twitch login isn't configured yet. Add the Twitch app credentials.",
  kick_not_configured: "Kick login isn't configured yet. Add the Kick app credentials.",
  state_mismatch: "The sign-in attempt expired. Please try again.",
  missing_code: "The provider did not return an authorization code.",
  oauth_failed: "Sign-in failed. Please try again.",
  access_denied: "You cancelled the sign-in request.",
};

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    error: typeof search["error"] === "string" ? search["error"] : undefined,
    detail: typeof search["detail"] === "string" ? search["detail"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "CreovixStudio — Control Room" },
      {
        name: "description",
        content: "Sign in with Twitch or Kick to run your subathon timer, rules and overlays.",
      },
      { property: "og:title", content: "CreovixStudio — Control Room" },
      {
        property: "og:description",
        content: "Connect Twitch or Kick to control your subathon timer.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { error, detail } = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const signIn = (provider: "twitch" | "kick" | "tiktok") => {
    setPending(provider);
    window.location.href = `/api/auth/${provider}/start`;
  };


  return (
    <main className="relative flex min-h-screen items-center justify-center bg-charcoal px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Subathon Timer
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in to your control room</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Connect a streaming account. Your tokens are stored securely and used to track follows,
          subs, gifts, bits and donations.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
          >
            {ERRORS[error] ?? "Something went wrong during sign-in."}
            {detail ? (
              <span className="mt-2 block break-words font-mono text-xs opacity-80">{detail}</span>
            ) : null}
          </div>
        ) : null}

        {!isSupabaseConfigured() ? (
          <div
            role="status"
            className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          >
            Copy <code className="text-foreground">.env.example</code> to{" "}
            <code className="text-foreground">.env</code> and set{" "}
            <code className="text-foreground">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-foreground">VITE_SUPABASE_PUBLISHABLE_KEY</code> (plus the matching{" "}
            <code className="text-foreground">SUPABASE_*</code> server keys), then restart{" "}
            <code className="text-foreground">npm run dev</code>.
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => signIn("twitch")}
            disabled={pending !== null || !isSupabaseConfigured()}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-twitch px-5 py-3.5 text-base font-semibold text-twitch-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M4.3 0 1.7 5.2v15.6h5.2V24h3l3-3.2h4.3L23 15V0H4.3Zm16.1 13.9-3 3.2h-5.2l-2.6 2.6v-2.6H5.2V2.6h15.2v11.3ZM17 6.5v6.1h-2.6V6.5H17Zm-6.1 0v6.1H8.3V6.5h2.6Z" />
            </svg>
            {pending === "twitch" ? "Redirecting…" : "Continue with Twitch"}
          </button>

          <button
            type="button"
            onClick={() => signIn("kick")}
            disabled={pending !== null || !isSupabaseConfigured()}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-kick px-5 py-3.5 text-base font-semibold text-kick-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M3 2h5.4v6.2h1.8V5.4H12V2h5.4v6.2h-1.8V11h-1.8v2h1.8v2.8h1.8V22H12v-3.4h-1.8v-2.8H8.4V22H3V2Z" />
            </svg>
            {pending === "kick" ? "Redirecting…" : "Continue with Kick"}
          </button>

          <button
            type="button"
            onClick={() => signIn("tiktok")}
            disabled={pending !== null || !isSupabaseConfigured()}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black px-5 py-3.5 text-base font-semibold text-white transition-all hover:border-[#25F4EE]/60 hover:shadow-[0_0_0_1px_rgba(254,44,85,0.35),0_10px_30px_-12px_rgba(37,244,238,0.6)] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M16.5 2h-3v13.1a2.6 2.6 0 1 1-2.2-2.6v-3a5.6 5.6 0 1 0 5.2 5.6V9.3a7 7 0 0 0 4 1.3v-3a4 4 0 0 1-4-4Z" />
            </svg>
            {pending === "tiktok" ? "Redirecting…" : "Continue with TikTok"}
          </button>
        </div>


        <p className="mt-8 text-xs text-muted-foreground">
          By continuing you allow this app to read your channel events so the timer can award time
          according to your rules.
        </p>
      </div>
    </main>
  );
}
