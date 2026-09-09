import { createFileRoute } from "@tanstack/react-router";

/**
 * Compatibility redirect: TikTok apps are registered with
 * `/api/auth/callback/tiktok`, while the real handler lives on the public
 * OAuth path. Query parameters (code, state, error) are forwarded intact.
 */
export const Route = createFileRoute("/api/auth/callback/tiktok")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const incoming = new URL(request.url);
        const target = new URL("/api/public/auth/tiktok/callback", incoming.origin);
        target.search = incoming.search;
        return new Response(null, { status: 302, headers: { Location: target.toString() } });
      },
    },
  },
});
