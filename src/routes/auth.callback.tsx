import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type CallbackSearch = { token_hash?: string | undefined };

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
    token_hash: typeof search["token_hash"] === "string" ? search["token_hash"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Finishing sign-in — Subathon Timer" },
      { name: "description", content: "Completing your Twitch or Kick sign-in." },
      { property: "og:title", content: "Finishing sign-in — Subathon Timer" },
      { property: "og:description", content: "Completing your streaming platform sign-in." },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const { token_hash: tokenHash } = useSearch({ from: "/auth/callback" });
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenHash) {
        navigate({ to: "/login", search: { error: "oauth_failed" }, replace: true });
        return;
      }
      const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
      if (!active) return;
      if (error) {
        setFailed(true);
        navigate({ to: "/login", search: { error: "oauth_failed" }, replace: true });
        return;
      }
      navigate({ to: "/dashboard", replace: true });
    })();
    return () => {
      active = false;
    };
  }, [tokenHash, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <p className="text-muted-foreground">
        {failed ? "Sign-in failed, redirecting…" : "Finishing sign-in…"}
      </p>
    </main>
  );
}
