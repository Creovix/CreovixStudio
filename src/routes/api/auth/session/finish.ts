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
        const { cookie, decodeCookiePayload, readCookie } = await import("@/lib/oauth.server");
        const raw = readCookie(request, "oauth_magic_hash");
        // Clear with the same host-only attributes used when setting the cookie.
        const clear = cookie(request, "oauth_magic_hash", "", 0, { hostOnly: true });
        const headers = new Headers({
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Set-Cookie": clear,
        });

        const cookieHeader = request.headers.get("cookie");
        console.info("[oauth:session/finish] begin", {
          hasMagicHashCookie: Boolean(raw),
          magicHashLength: raw?.length ?? 0,
          cookieHeaderPresent: Boolean(cookieHeader),
          cookieNames: cookieHeader
            ? cookieHeader
                .split(";")
                .map((part) => part.trim().split("=")[0])
                .filter(Boolean)
            : [],
          url: request.url,
        });

        if (!raw) {
          console.error("[oauth:session/finish] missing oauth_magic_hash cookie", {
            url: request.url,
            cookieHeaderPresent: Boolean(cookieHeader),
          });
          return new Response(JSON.stringify({ ok: false, error: "missing_magic_hash" }), {
            status: 400,
            headers,
          });
        }

        const tokenHash = decodeCookiePayload(raw);
        if (!tokenHash) {
          console.error("[oauth:session/finish] empty token_hash after decode");
          return new Response(JSON.stringify({ ok: false, error: "invalid_magic_hash" }), {
            status: 400,
            headers,
          });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const trim = (value: string | undefined) =>
          value?.trim().replace(/^["']|["']$/g, "") || undefined;
        const url = trim(process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"]);
        const key = trim(
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
            process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
            process.env["SUPABASE_ANON_KEY"] ||
            process.env["VITE_SUPABASE_ANON_KEY"],
        );
        if (!url || !key) {
          console.error("[oauth:session/finish] supabase not configured");
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
          console.error("[oauth:session/finish] verifyOtp failed", {
            message: error?.message ?? "no_session",
            status: error?.status ?? null,
            name: error?.name ?? null,
            tokenHashLength: tokenHash.length,
          });
          return new Response(
            JSON.stringify({ ok: false, error: error?.message ?? "verify_failed" }),
            { status: 401, headers },
          );
        }

        console.info("[oauth:session/finish] ok", {
          userId: data.session.user?.id ?? null,
        });
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
