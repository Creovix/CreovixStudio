import { createFileRoute } from "@tanstack/react-router";

import {
  PROVIDERS,
  cookie,
  exchangeCode,
  isOAuthProvider,
  fetchStreamlabsSocketToken,
  readCookie,
  redirectUriFor,
  verifyLinkState,
} from "@/lib/oauth.server";

export const Route = createFileRoute("/api/public/auth/$provider/callback")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const provider = params.provider;
        const url = new URL(request.url);
        const origin = redirectUriFor(request, "twitch").replace(
          "/api/public/auth/twitch/callback",
          "",
        );
        const fail = (reason: string, detail?: string) => {
          const location = new URL(`${origin}/login`);
          location.searchParams.set("error", reason);
          if (detail) location.searchParams.set("detail", detail.slice(0, 300));
          return new Response(null, { status: 302, headers: { Location: location.toString() } });
        };

        if (!isOAuthProvider(provider)) return new Response("Unknown provider", { status: 404 });
        if (url.searchParams.get("error")) return fail(url.searchParams.get("error")!);

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const expectedState = readCookie(request, `oauth_state_${provider}`);
        if (!code) return fail("missing_code");
        if (!state || !expectedState || state !== expectedState) return fail("state_mismatch");

        const config = PROVIDERS[provider];
        const clientId = process.env[config.clientIdEnv];
        const clientSecret = process.env[config.clientSecretEnv];
        if (!clientId || !clientSecret) return fail(`${provider}_not_configured`);

        try {
          const tokens = await exchangeCode({
            provider,
            code,
            redirectUri: redirectUriFor(request, provider),
            clientId,
            clientSecret,
            verifier: readCookie(request, `oauth_verifier_${provider}`),
          });

          const profile = await config.fetchProfile(tokens.access_token, clientId);

          const expiresAtIso = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null;
          const scopeList = Array.isArray(tokens.scope)
            ? tokens.scope
            : (tokens.scope ?? config.scopes).split(" ").filter(Boolean);

          // Settings-initiated linking: attach the connection to the signed-in
          // user (state is HMAC-signed) and never touch the auth session.
          const linkedUserId = verifyLinkState(state);
          if (linkedUserId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const socketToken =
              provider === "streamlabs"
                ? await fetchStreamlabsSocketToken(tokens.access_token)
                : null;

            await supabaseAdmin.from("platform_connections").upsert(
              {
                user_id: linkedUserId,
                platform: config.platform,
                platform_user_id: profile.id,
                username: profile.username,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token ?? null,
                scopes: scopeList,
                token_expires_at: expiresAtIso,
                is_active: true,
                metadata: {
                  avatar_url: profile.image,
                  source: "oauth",
                  ...(profile.extra ?? {}),
                  ...(socketToken ? { socket_token: socketToken } : {}),
                },
              },
              { onConflict: "user_id,platform,platform_user_id" },
            );

            if (provider === "kick") {
              const { ensureKickMediaSubscriptions } = await import("@/lib/kickEvents.server");
              const subscriptions = await ensureKickMediaSubscriptions(tokens.access_token, profile.id);
              if (!subscriptions.ok) console.error("[kick-events] subscription setup failed", subscriptions.errors);
            }

            const back = new URL(`${origin}/settings`);
            back.searchParams.set("connected", provider);
            const linkHeaders = new Headers({ Location: back.toString() });
            linkHeaders.append("Set-Cookie", cookie(request, `oauth_state_${provider}`, "", 0));
            linkHeaders.append("Set-Cookie", cookie(request, `oauth_verifier_${provider}`, "", 0));
            return new Response(null, { status: 302, headers: linkHeaders });
          }

          const email =
            profile.email ?? `${provider}_${profile.id}@users.${new URL(origin).hostname}`;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Create or reuse the auth identity, then mint a one-time link the
          // browser exchanges for a real session.
          const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
          });

          let authUserId = link?.user?.id ?? null;
          let hashedToken = link?.properties?.hashed_token ?? null;

          if (linkError || !authUserId || !hashedToken) {
            const { error: createError } = await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                provider,
                provider_user_id: profile.id,
                username: profile.username,
                avatar_url: profile.image,
              },
            });
            if (createError && !/already/i.test(createError.message)) throw createError;

            const retry = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
            if (retry.error) throw retry.error;
            authUserId = retry.data.user?.id ?? null;
            hashedToken = retry.data.properties?.hashed_token ?? null;
          }
          if (!authUserId || !hashedToken) throw new Error("Could not establish a session");

          const expiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null;
          const scopes = Array.isArray(tokens.scope)
            ? tokens.scope
            : (tokens.scope ?? config.scopes).split(" ").filter(Boolean);

          await supabaseAdmin.from("users").upsert(
            {
              id: authUserId,
              email,
              name: profile.username,
              image: profile.image,
            },
            { onConflict: "id" },
          );

          await supabaseAdmin.from("accounts").upsert(
            {
              user_id: authUserId,
              type: "oauth",
              provider,
              provider_account_id: profile.id,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              expires_at: tokens.expires_in
                ? Math.floor(Date.now() / 1000) + tokens.expires_in
                : null,
              token_type: tokens.token_type ?? "bearer",
              scope: scopes.join(" "),
            },
            { onConflict: "provider,provider_account_id" },
          );

          await supabaseAdmin.from("platform_connections").upsert(
            {
              user_id: authUserId,
              platform: config.platform,
              platform_user_id: profile.id,
              username: profile.username,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              scopes,
              token_expires_at: expiresAt,
              is_active: true,
              metadata: { avatar_url: profile.image, email },
            },
            { onConflict: "user_id,platform,platform_user_id" },
          );

          if (provider === "kick") {
            const { ensureKickMediaSubscriptions } = await import("@/lib/kickEvents.server");
            const subscriptions = await ensureKickMediaSubscriptions(tokens.access_token, profile.id);
            if (!subscriptions.ok) console.error("[kick-events] subscription setup failed", subscriptions.errors);
          }

          await supabaseAdmin.from("audit_logs").insert({
            user_id: authUserId,
            action: "auth.login",
            entity: "platform_connection",
            entity_id: profile.id,
            metadata: { provider, username: profile.username },
            ip_address:
              request.headers.get("cf-connecting-ip") ??
              request.headers.get("x-forwarded-for") ??
              null,
          });

          const target = new URL(`${origin}/auth/callback`);
          target.searchParams.set("token_hash", hashedToken);
          const headers = new Headers({ Location: target.toString() });
          headers.append("Set-Cookie", cookie(request, `oauth_state_${provider}`, "", 0));
          headers.append("Set-Cookie", cookie(request, `oauth_verifier_${provider}`, "", 0));
          return new Response(null, { status: 302, headers });
        } catch (error) {
          console.error(`[oauth:${provider}]`, error);
          return fail("oauth_failed", error instanceof Error ? error.message : String(error));
        }
      },
    },
  },
});
