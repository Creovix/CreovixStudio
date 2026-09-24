import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { resolvePostLoginPath, type PostLoginServerNext } from "@/lib/postLogin";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CylixStudio — Finishing Sign-in" },
      { name: "description", content: "Completing your Twitch or Kick sign-in." },
      { property: "og:title", content: "CylixStudio — Finishing Sign-in" },
      { property: "og:description", content: "Completing your streaming platform sign-in." },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const goNext = async (serverNext?: PostLoginServerNext | null) => {
      const dest = await resolvePostLoginPath({ serverNext });
      if (!active) return;
      if (dest.to === "/settings") {
        void navigate({
          to: "/settings",
          search: dest.search ?? { setup: "connections" },
          replace: true,
        });
        return;
      }
      void navigate({ to: dest.to, replace: true });
    };

    (async () => {
      // Prefer HttpOnly cookie handoff (no token_hash in the URL).
      // Fall back to legacy ?token_hash= / #token_hash= for in-flight redirects.
      let legacyHash: string | null = null;
      try {
        const params = new URLSearchParams(window.location.search);
        legacyHash = params.get("token_hash");
        if (!legacyHash && window.location.hash.startsWith("#")) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          legacyHash = hashParams.get("token_hash");
        }
      } catch {
        /* ignore */
      }

      if (legacyHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: "magiclink",
          token_hash: legacyHash,
        });
        window.history.replaceState({}, "", "/auth/callback");
        if (!active) return;
        if (error) {
          setFailed(true);
          navigate({ to: "/login", search: { error: "oauth_failed" }, replace: true });
          return;
        }
        await goNext(null);
        return;
      }

      const response = await fetch("/api/auth/session/finish", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        access_token?: string;
        refresh_token?: string;
        next?: PostLoginServerNext;
      } | null;
      if (!active) return;
      if (!response.ok || !payload?.ok || !payload.access_token || !payload.refresh_token) {
        console.error("[auth/callback] session/finish failed", {
          status: response.status,
          error: payload?.error ?? null,
        });
        setFailed(true);
        navigate({ to: "/login", search: { error: "oauth_failed" }, replace: true });
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (error) {
        console.error("[auth/callback] setSession failed", error.message);
        setFailed(true);
        navigate({ to: "/login", search: { error: "oauth_failed" }, replace: true });
        return;
      }
      await goNext(payload.next ?? null);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <p className="text-muted-foreground">
        {failed ? "Sign-in failed, redirecting…" : "Finishing sign-in…"}
      </p>
    </main>
  );
}
