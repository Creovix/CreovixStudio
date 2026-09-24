import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isGatewayCompleted } from "@/lib/plans";
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
          "Multi-platform streaming studio: Twitch, Kick, YouTube and TikTok widgets, commands and overlays.",
      },
      { property: "og:title", content: "CreovixStudio" },
      {
        property: "og:description",
        content: "Sign in to pick Free or Pro and run your multi-platform stream tools.",
      },
    ],
  }),
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isTestMode()) {
      navigate({ to: isGatewayCompleted() ? "/dashboard" : "/welcome", replace: true });
      return;
    }
    if (!isSupabaseConfigured()) {
      navigate({ to: "/login", replace: true });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login", replace: true });
        return;
      }
      navigate({ to: isGatewayCompleted() ? "/dashboard" : "/welcome", replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <p className="text-muted-foreground">Checking your session…</p>
    </main>
  );
}
