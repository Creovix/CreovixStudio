import { createFileRoute } from "@tanstack/react-router";

import type { EventType, NormalizedEvent } from "@/lib/webhooks/ingest.server";

type KickPayload = Record<string, unknown>;

function pickString(obj: unknown, ...path: string[]): string | null {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "string" ? cur : typeof cur === "number" ? String(cur) : null;
}

function normalize(type: string, messageId: string, body: KickPayload): NormalizedEvent | null {
  const base = {
    platform: "KICK" as const,
    providerEventId: messageId,
    rawPayload: body,
    amount: null as number | null,
    currency: null as string | null,
  };
  const actorName =
    pickString(body, "follower", "username") ??
    pickString(body, "subscriber", "username") ??
    pickString(body, "gifter", "username") ??
    pickString(body, "sender", "username");
  const actorPlatformId =
    pickString(body, "follower", "user_id") ??
    pickString(body, "subscriber", "user_id") ??
    pickString(body, "gifter", "user_id");

  switch (type) {
    case "channel.followed":
    case "follow":
      return { ...base, eventType: "FOLLOW" as EventType, actorName, actorPlatformId, quantity: 1 };
    case "channel.subscription.new":
    case "channel.subscription.renewal":
    case "subscription":
      return {
        ...base,
        eventType: "SUBSCRIPTION" as EventType,
        actorName,
        actorPlatformId,
        quantity: Math.max(Number(body["duration"] ?? 1) || 1, 1),
      };
    case "channel.subscription.gifts":
    case "gifted_subscriptions":
      return {
        ...base,
        eventType: "GIFT_SUB" as EventType,
        actorName: actorName ?? "Anonymous",
        actorPlatformId,
        quantity: Math.max(
          Array.isArray(body["giftees"]) ? (body["giftees"] as unknown[]).length : Number(body["quantity"] ?? 1) || 1,
          1,
        ),
      };
    default:
      return null;
  }
}

export const Route = createFileRoute("/api/public/webhooks/kick")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ ok: true, listener: "kick", status: "listening" }), {
          status: 200,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
      POST: async ({ request }) => {

        const { jsonResponse, ingestEvent, resolveSubathonByPlatformUser } = await import(
          "@/lib/webhooks/ingest.server"
        );
        const { verifyKickSignature } = await import("@/lib/webhooks/verify.server");

        const publicKeyPem = process.env["KICK_WEBHOOK_PUBLIC_KEY"];
        const hmacSecret = process.env["KICK_WEBHOOK_SECRET"];
        const rawBody = await request.text();
        const messageId = request.headers.get("kick-event-message-id");
        const ok = verifyKickSignature({
          publicKeyPem,
          hmacSecret,
          messageId,
          timestamp: request.headers.get("kick-event-message-timestamp"),
          signature: request.headers.get("kick-event-signature"),
          rawBody,
        });
        if (!ok) return new Response("Invalid signature", { status: 403 });

        let body: KickPayload;
        try {
          body = JSON.parse(rawBody) as KickPayload;
        } catch {
          return jsonResponse({ error: "invalid_json" }, 400);
        }

        const type =
          request.headers.get("kick-event-type") ??
          (typeof body["event"] === "string" ? (body["event"] as string) : "");
        const normalizedType = type.toLowerCase().replace(/_/g, ".");
        const looksLikeRewardRedemption =
          normalizedType.includes("reward") && normalizedType.includes("redemption");
        if (looksLikeRewardRedemption) {
          const { ingestKickMediaRedemption } = await import("@/lib/mediaRequests.server");
          const result = await ingestKickMediaRedemption({ messageId: messageId ?? "", body });
          console.log("[kick-webhook] media request pipeline result", JSON.stringify({ type, messageId, result }));
          return jsonResponse(result);
        }
        if (normalizedType === "chat.message.sent") {
          const broadcasterId = pickString(body, "broadcaster", "user_id");
          const text = pickString(body, "content") ?? "";
          const username = pickString(body, "sender", "username") ?? "Kick viewer";
          if (!broadcasterId) return jsonResponse({ status: "ignored", reason: "no_broadcaster" });
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: connection } = await supabaseAdmin.from("platform_connections")
            .select("user_id").eq("platform", "KICK").eq("platform_user_id", broadcasterId)
            .eq("is_active", true).maybeSingle();
          if (!connection) return jsonResponse({ status: "ignored", reason: "kick_connection_not_found" });

          const { deferRequestWork } = await import("@/lib/requestContext.server");
          const { handleClipCommand, warmKickClipBuffer } = await import("@/lib/clipCommand.server");

          if (/^!clip\b/i.test(text.trim())) {

            const identityBadges = Array.isArray(
              (body["sender"] as Record<string, unknown> | undefined)?.["identity"] &&
                ((body["sender"] as Record<string, unknown>)["identity"] as Record<string, unknown>)["badges"],
            )
              ? (
                  ((body["sender"] as Record<string, unknown>)["identity"] as Record<string, unknown>)[
                    "badges"
                  ] as Array<Record<string, unknown>>
                ).map((badge) => String(badge["type"] ?? badge["text"] ?? ""))
              : [];
            const command = handleClipCommand({
              userId: connection.user_id,
              broadcasterUserId: broadcasterId,
              text,
              sender: {
                username,
                platformId: pickString(body, "sender", "user_id"),
                identityBadges,
              },
            });
            deferRequestWork(
              request,
              command.then((result) => {
                console.log("[kick-webhook] clip command completed", {
                  messageId,
                  broadcasterId,
                  status: result.status,
                  reason: result.reason,
                });
              }),
            );
            // Kick expects a fast acknowledgement. HLS capture can take several
            // seconds, so it must not block the webhook response or Kick retries it.
            return jsonResponse({ status: "accepted", command: "clip" });
          }

          // Giveaway keyword entries are captured server-side so they land
          // even when nobody has the dashboard open.
          deferRequestWork(
            request,
            (async () => {
              const { captureGiveawayEntry } = await import("@/lib/giveaway.server");
              const identity = (body["sender"] as Record<string, unknown> | undefined)?.["identity"] as
                | Record<string, unknown>
                | undefined;
              const badges = Array.isArray(identity?.["badges"])
                ? (identity["badges"] as Array<Record<string, unknown>>).map((badge) =>
                    String(badge["type"] ?? ""),
                  )
                : [];
              await captureGiveawayEntry(supabaseAdmin, connection.user_id, {
                platform: "KICK",
                username,
                text,
                isSubscriber: badges.some((badge) => /sub|founder|og|vip/i.test(badge)),
              });
            })().catch((error) => console.error("[kick-webhook] giveaway entry failed", error)),
          );

          // Every chat message tops up the rolling clip buffer (throttled),
          // so `!clip` has real stream history to cut from.
          deferRequestWork(
            request,
            warmKickClipBuffer(connection.user_id).catch((error) =>
              console.error("[kick-webhook] clip buffer warm failed", error),
            ),
          );

          const { ingestChatMediaRequest } = await import("@/lib/mediaRequests.server");

          const result = await ingestChatMediaRequest({
            userId: connection.user_id,
            messageId: pickString(body, "message_id") ?? messageId ?? crypto.randomUUID(),
            username,
            text,
          });
          return jsonResponse(result);
        }

        const normalized = normalize(type, messageId ?? "", body);
        if (!normalized) return jsonResponse({ status: "ignored", reason: "unsupported_type" });

        const broadcasterId =
          pickString(body, "broadcaster", "user_id") ??
          pickString(body, "broadcaster", "channel_id") ??
          pickString(body, "channel_id");
        if (!broadcasterId) return jsonResponse({ status: "ignored", reason: "no_broadcaster" });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const target = await resolveSubathonByPlatformUser(supabaseAdmin, "KICK", broadcasterId);
        if (!target) return jsonResponse({ status: "ignored", reason: "no_active_subathon" });

        const result = await ingestEvent(supabaseAdmin, target, normalized);
        return jsonResponse(result);
      },
    },
  },
});
