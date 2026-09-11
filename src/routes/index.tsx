import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isTestMode } from "@/lib/testMode";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CreovixStudio" },
      {
        name: "tiktok-developers-site-verification",
        content: "k1s5lp842wjBLAa3X1QlqR1A2cNY2Kzi",
      },
      {
        name: "description",
        content:
          "Multi-platform subathon timer: Twitch and Kick events, rule-based time rewards, deduplicated payloads and public overlays.",
      },
      { property: "og:title", content: "CreovixStudio" },
      {
        property: "og:description",
        content: "Sign in with Twitch or Kick to run a rule-driven subathon timer.",
      },
    ],
  }),
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isTestMode()) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    if (!isSupabaseConfigured()) {
      navigate({ to: "/login", replace: true });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/dashboard" : "/login", replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <p className="text-muted-foreground">Checking your session…</p>
    </main>
  );
}
