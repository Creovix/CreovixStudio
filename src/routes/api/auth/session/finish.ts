import { createFileRoute } from "@tanstack/react-router";

/**
 * Consumes the HttpOnly oauth_magic_hash cookie set by the OAuth callback,
 * verifies the Supabase magiclink, clears the cookie, and returns a one-time
 * session payload for the client to call setSession (never puts token_hash in
 * the URL query string).
 */
export const Route = createFileRoute("/api/auth/session/finish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cookie, readCookie } = await import("@/lib/oauth.server");
        const raw = readCookie(request, "oauth_magic_hash");
        const clear = cookie(request, "oauth_magic_hash", "", 0);
        const headers = new Headers({
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Set-Cookie": clear,
        });

        if (!raw) {
          return new Response(JSON.stringify({ ok: false, error: "missing_magic_hash" }), {
            status: 400,
            headers,
          });
        }

        let tokenHash = raw;
        try {
          tokenHash = decodeURIComponent(raw);
        } catch {
          /* use raw */
        }

        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
        const key =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["SUPABASE_ANON_KEY"] ||
          process.env["VITE_SUPABASE_ANON_KEY"];
        if (!url || !key) {
          return new Response(JSON.stringify({ ok: false, error: "supabase_not_configured" }), {
            status: 503,
            headers,
          });
        }

        const supabase = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await supabase.auth.verifyOtp({
          type: "magiclink",
          token_hash: tokenHash,
        });
        if (error || !data.session) {
          return new Response(
            JSON.stringify({ ok: false, error: error?.message ?? "verify_failed" }),
            { status: 401, headers },
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
          { status: 200, headers },
        );
      },
    },
  },
});
