import { createFileRoute } from "@tanstack/react-router";

import type { EventType, NormalizedEvent } from "@/lib/webhooks/ingest.server";

type SlMessage = {
  id?: string;
  _id?: string;
  name?: string;
  from?: string;
  amount?: string | number;
  currency?: string;
  months?: number;
  message?: string;
  subscriber_id?: string;
};

type SlPayload = {
  type?: string;
  event_id?: string;
  message?: SlMessage[] | SlMessage;
};

export const Route = createFileRoute("/api/public/webhooks/streamlabs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { jsonResponse, ingestEvent, resolveSubathonByToken } = await import(
          "@/lib/webhooks/ingest.server"
        );
        const { safeEqual } = await import("@/lib/webhooks/verify.server");

        const url = new URL(request.url);
        const authHeader = request.headers.get("authorization") ?? "";
        const token =
          url.searchParams.get("token") ??
          request.headers.get("x-streamlabs-token") ??
          (authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "");
        if (!token) return new Response("Missing token", { status: 401 });

        const rawBody = await request.text();
        let body: SlPayload;
        try {
          body = JSON.parse(rawBody) as SlPayload;
        } catch {
          return jsonResponse({ error: "invalid_json" }, 400);
        }

        const { supabaseAdmin } = await import("@/lib/supabase/client.server");
        const target = await resolveSubathonByToken(supabaseAdmin, "STREAMLABS", token);
        if (!target || !safeEqual(target.secret, token)) {
          return new Response("Invalid token", { status: 401 });
        }

        const type = (body.type ?? "").toLowerCase();
        const eventType: EventType | null =
          type === "donation"
            ? "DONATION"
            : type === "subscription" || type === "resub" || type === "member"
              ? "SUBSCRIPTION"
              : null;
        if (!eventType) return jsonResponse({ status: "ignored", reason: "unsupported_type" });

        const messages = Array.isArray(body.message)
          ? body.message
          : body.message
            ? [body.message]
            : [];
        if (!messages.length) return jsonResponse({ status: "ignored", reason: "empty_payload" });

        const results = [];
        for (const [index, msg] of messages.entries()) {
          const providerId = msg.id ?? msg._id ?? (body.event_id ? `${body.event_id}:${index}` : null);
          const normalized: NormalizedEvent = {
            platform: "STREAMLABS",
            eventType,
            providerEventId: providerId,
            actorName: msg.from ?? msg.name ?? "Anonymous",
            actorPlatformId: msg.subscriber_id ?? null,
            amount: eventType === "DONATION" ? Number(msg.amount ?? 0) || 0 : null,
            currency: msg.currency ?? null,
            quantity: Math.max(Number(msg.months ?? 1) || 1, 1),
            rawPayload: msg,
          };
          results.push(await ingestEvent(supabaseAdmin, target, normalized));
        }

        return jsonResponse({ processed: results.length, results });
      },
    },
  },
});
