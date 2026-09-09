import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/lib/supabase/auth-middleware";

/**
 * Registers Twitch EventSub subscriptions (follow, subscribe, cheer, raid)
 * against this app's verified webhook endpoint. Serverless runtimes cannot
 * hold an EventSub WebSocket open, so the webhook transport is the
 * production-correct listener; deliveries land in the same ingest pipeline.
 */
export const syncTwitchEventSub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env["TWITCH_CLIENT_ID"];
    const clientSecret = process.env["TWITCH_CLIENT_SECRET"];
    const secret = process.env["TWITCH_EVENTSUB_SECRET"];
    if (!clientId || !clientSecret) return { ok: false as const, error: "twitch_not_configured" };
    if (!secret) return { ok: false as const, error: "eventsub_secret_missing" };

    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = new URL(getRequest().url).origin;
    const callback = `${origin}/api/public/webhooks/twitch`;

    const { supabaseAdmin } = await import("@/lib/supabase/client.server");
    const { data: connection } = await supabaseAdmin
      .from("platform_connections")
      .select("platform_user_id")
      .eq("user_id", context.userId)
      .eq("platform", "TWITCH")
      .eq("is_active", true)
      .maybeSingle();

    const broadcasterId = connection?.platform_user_id;
    if (!broadcasterId) return { ok: false as const, error: "twitch_not_connected" };

    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });
    if (!tokenResponse.ok) return { ok: false as const, error: "twitch_token_failed" };
    const { access_token: appToken } = (await tokenResponse.json()) as { access_token: string };

    const subscriptions = [
      {
        type: "channel.follow",
        version: "2",
        condition: { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId },
      },
      { type: "channel.subscribe", version: "1", condition: { broadcaster_user_id: broadcasterId } },
      { type: "channel.cheer", version: "1", condition: { broadcaster_user_id: broadcasterId } },
      { type: "channel.raid", version: "1", condition: { to_broadcaster_user_id: broadcasterId } },
    ];

    const results: { type: string; status: number }[] = [];
    for (const subscription of subscriptions) {
      const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
          "client-id": clientId,
          Authorization: `Bearer ${appToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...subscription,
          transport: { method: "webhook", callback, secret },
        }),
      });
      results.push({ type: subscription.type, status: response.status });
    }

    // 409 = already subscribed, which is a success for our purposes.
    const created = results.filter((r) => r.status === 202 || r.status === 409).length;
    return { ok: created > 0, created, results };
  });
