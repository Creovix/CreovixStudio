import { createFileRoute } from "@tanstack/react-router";

import {
  PROVIDERS,
  challengeFor,
  cookie,
  createState,
  createVerifier,
  isOAuthProvider,
  redirectUriFor,
  verifyLinkState,
} from "@/lib/oauth.server";

export const Route = createFileRoute("/api/public/auth/$provider/start")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const provider = params.provider;
        if (!isOAuthProvider(provider)) {
          return new Response("Unknown provider", { status: 404 });
        }

        const config = PROVIDERS[provider];
        const clientId = process.env[config.clientIdEnv];
        if (!clientId) {
          return Response.redirect(
            new URL(`/login?error=${provider}_not_configured`, request.url),
            302,
          );
        }

        // Flows started from Settings carry a signed link state so the callback
        // attaches the connection to the signed-in user instead of creating a session.
        const linkState = new URL(request.url).searchParams.get("link");
        const state = linkState && verifyLinkState(linkState) ? linkState : createState();
        const verifier = config.usesPkce ? createVerifier() : null;
        const redirectUri = redirectUriFor(request, provider);

        const authorizeUrl = new URL(config.authorizeUrl);
        // TikTok identifies apps with `client_key` instead of `client_id`.
        authorizeUrl.searchParams.set(provider === "tiktok" ? "client_key" : "client_id", clientId);
        authorizeUrl.searchParams.set("redirect_uri", redirectUri);
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("scope", config.scopes);
        authorizeUrl.searchParams.set("state", state);
        if (verifier) {
          authorizeUrl.searchParams.set("code_challenge", challengeFor(verifier));
          authorizeUrl.searchParams.set("code_challenge_method", "S256");
        }

        const headers = new Headers({ Location: authorizeUrl.toString() });
        headers.append("Set-Cookie", cookie(request, `oauth_state_${provider}`, state, 600));
        if (verifier) {
          headers.append("Set-Cookie", cookie(request, `oauth_verifier_${provider}`, verifier, 600));
        }
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
