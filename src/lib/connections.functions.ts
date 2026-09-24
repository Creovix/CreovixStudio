import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/lib/supabase/auth-middleware";

/** Builds a signed OAuth start URL that links the provider to the signed-in user. */
export const startPlatformLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: "twitch" | "kick" | "streamlabs" | "tiktok" }) => {
    if (!["twitch", "kick", "streamlabs", "tiktok"].includes(data?.provider)) {
      throw new Error("Unsupported provider");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { signLinkState } = await import("@/lib/oauth.server");
    const state = signLinkState(context.userId);
    return { url: `/api/auth/${data.provider}/start?link=${encodeURIComponent(state)}` };
  });

/** Verifies a StreamElements account JWT and stores it for the signed-in user. */
export const connectStreamElements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token: string }) => {
    const token = (data?.token ?? "").trim();
    if (!token) throw new Error("Token is required");
    return { token };
  })
  .handler(async ({ data, context }) => {
    const { verifyStreamElementsToken, saveStreamElementsConnection, normalizeJwt } = await import(
      "@/lib/connections.server"
    );
    const token = normalizeJwt(data.token);
    const channel = await verifyStreamElementsToken(token);
    if (!channel) return { ok: false as const };
    await saveStreamElementsConnection(context.supabase, context.userId, token, channel);
    return { ok: true as const, username: channel.username };
  });

/** Returns the signed-in user's stored StreamElements JWT (owner only). */
export const getStreamElementsToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("platform_connections")
      .select("access_token, is_active")
      .eq("user_id", context.userId)
      .eq("platform", "STREAMELEMENTS")
      .eq("is_active", true)
      .limit(1);
    return { token: (data?.[0]?.access_token as string | null) ?? null };
  });

/** Ingests one parsed StreamElements realtime event through the shared pipeline. */
export const ingestStreamElementsEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      eventType: "DONATION" | "SUBSCRIPTION" | "GIFT_SUB" | "BITS" | "FOLLOW" | "RAID";
      providerEventId: string | null;
      actorName: string;
      amount: number | null;
      currency: string | null;
      quantity: number;
      message: string | null;
    }) => {
      const allowed = ["DONATION", "SUBSCRIPTION", "GIFT_SUB", "BITS", "FOLLOW", "RAID"];
      if (!allowed.includes(data?.eventType)) throw new Error("Unsupported event type");
      return {
        eventType: data.eventType,
        providerEventId: (data.providerEventId ?? "").slice(0, 200) || null,
        actorName: (data.actorName ?? "Anonymous").slice(0, 80) || "Anonymous",
        amount:
          data.amount === null || data.amount === undefined || Number.isNaN(Number(data.amount))
            ? null
            : Number(data.amount),
        currency: (data.currency ?? "").slice(0, 10) || null,
        quantity: Math.min(Math.max(Math.floor(Number(data.quantity) || 1), 1), 100000),
        message: (data.message ?? "").slice(0, 400) || null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/lib/supabase/client.server");
    const { activeSubathonFor, ingestEvent } = await import("@/lib/webhooks/ingest.server");
    const target = await activeSubathonFor(supabaseAdmin, context.userId);
    if (!target) return { status: "ignored" as const, reason: "no_active_subathon" };
    const result = await ingestEvent(supabaseAdmin, target, {
      platform: "STREAMELEMENTS",
      eventType: data.eventType,
      providerEventId: data.providerEventId,
      actorName: data.actorName,
      actorPlatformId: null,
      amount: data.amount,
      currency: data.currency,
      quantity: data.quantity,
      rawPayload: { source: "streamelements_socket", message: data.message },
    });
    return { status: "ok" as const, result };
  });

/** Reports whether Streamlabs OAuth credentials are usable, for UI fallback. */
export const streamlabsOAuthStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const clientId = process.env["STREAMLABS_CLIENT_ID"] ?? "";
    const clientSecret = process.env["STREAMLABS_CLIENT_SECRET"] ?? "";
    return { configured: clientId.trim().length > 0 && clientSecret.trim().length > 0 };
  });

/** Stores a Streamlabs Socket API token for the signed-in user. */
export const connectStreamlabsSocket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token: string }) => {
    const token = (data?.token ?? "").trim();
    if (!token) throw new Error("Token is required");
    return { token };
  })
  .handler(async ({ data, context }) => {
    const { isLikelySocketToken, saveStreamlabsSocketConnection } = await import(
      "@/lib/streamlabs.server"
    );
    if (!isLikelySocketToken(data.token)) return { ok: false as const };
    await saveStreamlabsSocketConnection(context.supabase, context.userId, data.token);
    return { ok: true as const };
  });

/** Returns the signed-in user's stored Streamlabs socket token (owner only). */
export const getStreamlabsSocketToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("platform_connections")
      .select("access_token, is_active, metadata")
      .eq("user_id", context.userId)
      .eq("platform", "STREAMLABS")
      .eq("is_active", true)
      .limit(5);
    const row = (data ?? []).find(
      (entry) => (entry.metadata as { source?: string } | null)?.source === "socket_token",
    );
    return { token: (row?.access_token as string | null) ?? null };
  });

const SOCKET_EVENT_TYPES = [
  "DONATION",
  "SUBSCRIPTION",
  "GIFT_SUB",
  "BITS",
  "FOLLOW",
  "RAID",
] as const;

/** Ingests one parsed Streamlabs socket event through the shared pipeline. */
export const ingestStreamlabsSocketEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      eventType: (typeof SOCKET_EVENT_TYPES)[number];
      providerEventId: string | null;
      actorName: string;
      amount: number | null;
      currency: string | null;
      quantity: number;
      message: string | null;
    }) => {
      if (!SOCKET_EVENT_TYPES.includes(data?.eventType)) throw new Error("Unsupported event type");
      return {
        eventType: data.eventType,
        providerEventId: (data.providerEventId ?? "").slice(0, 200) || null,
        actorName: (data.actorName ?? "Anonymous").slice(0, 80) || "Anonymous",
        amount:
          data.amount === null || data.amount === undefined || Number.isNaN(Number(data.amount))
            ? null
            : Number(data.amount),
        currency: (data.currency ?? "").slice(0, 10) || null,
        quantity: Math.min(Math.max(Math.floor(Number(data.quantity) || 1), 1), 100000),
        message: (data.message ?? "").slice(0, 400) || null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/lib/supabase/client.server");
    const { activeSubathonFor, ingestEvent } = await import("@/lib/webhooks/ingest.server");
    const target = await activeSubathonFor(supabaseAdmin, context.userId);
    if (!target) return { status: "ignored" as const, reason: "no_active_subathon" };
    const result = await ingestEvent(supabaseAdmin, target, {
      platform: "STREAMLABS",
      eventType: data.eventType,
      providerEventId: data.providerEventId,
      actorName: data.actorName,
      actorPlatformId: null,
      amount: data.amount,
      currency: data.currency,
      quantity: data.quantity,
      rawPayload: { source: "streamlabs_socket", message: data.message },
    });
    return { status: "ok" as const, result };
  });
