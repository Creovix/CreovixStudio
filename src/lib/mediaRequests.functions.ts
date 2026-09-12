import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/lib/supabase/auth-middleware";

type RequestMode = "AUTO" | "MANUAL" | "PAUSED";
type SettingsInput = { kickRewardId?: string; requestMode: RequestMode; keywordBlacklist: string; userBlacklist: string; displayMode: "VIDEO" | "AUDIO_ONLY"; playerLayout?: string; volume: number };

export const getMediaRequestDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [settings, requests, playback, kick] = await Promise.all([
    context.supabase.from("media_request_settings").select("*").eq("user_id", context.userId).maybeSingle(),
    context.supabase.from("media_requests").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100),
    context.supabase.from("media_playback_state").select("*").eq("user_id", context.userId).maybeSingle(),
    context.supabase.from("platform_connections").select("scopes,is_active").eq("user_id", context.userId).eq("platform", "KICK").eq("is_active", true).maybeSingle(),
  ]);
  if (settings.error || requests.error || playback.error) throw new Error(settings.error?.message ?? requests.error?.message ?? playback.error?.message);
  const { checkYouTubeApiHealth } = await import("@/lib/mediaRequests.server");
  const youtubeMode = await checkYouTubeApiHealth();
  return { settings: settings.data, requests: requests.data ?? [], playback: playback.data, youtubeConfigured: Boolean(process.env["YOUTUBE_API_KEY"]), youtubeMode, kickScopes: kick.data?.scopes ?? [] };
});

export const saveMediaRequestSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: SettingsInput) => ({
    kickRewardId: input.kickRewardId?.trim().slice(0, 100) || null,
    requestMode: (["AUTO", "MANUAL", "PAUSED"] as const).includes(input.requestMode) ? input.requestMode : "MANUAL",
    keywordBlacklist: input.keywordBlacklist.split(",").map(v=>v.trim()).filter(Boolean).slice(0,100),
    userBlacklist: input.userBlacklist.split(",").map(v=>v.trim()).filter(Boolean).slice(0,100),
    displayMode: input.displayMode === "AUDIO_ONLY" ? "AUDIO_ONLY" as const : "VIDEO" as const,
    playerLayout: (["VERTICAL_CARD","COMPACT_SLIM","MINIMAL_ROW"] as const).includes(input.playerLayout as "VERTICAL_CARD") ? input.playerLayout as "VERTICAL_CARD"|"COMPACT_SLIM"|"MINIMAL_ROW" : "VERTICAL_CARD" as const,
    volume: Math.max(0, Math.min(100, Math.round(input.volume))),
  })).handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("media_request_settings").upsert({ user_id: context.userId, kick_reward_id: data.kickRewardId, request_mode: data.requestMode, require_approval: data.requestMode !== "AUTO", max_duration_seconds: 2147483647, min_view_count: 0, keyword_blacklist: data.keywordBlacklist, user_blacklist: data.userBlacklist, display_mode: data.displayMode, player_layout: data.playerLayout, volume: data.volume }, { onConflict: "user_id" }).select().single();
    if (error) throw error; return row;
  });

export const listKickRewardsFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { listKickRewards } = await import("@/lib/mediaRequests.server");
  return listKickRewards(context.userId);
});

export const createKickMediaRewardFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { title?: string; cost?: number }) => ({
    title: (input.title ?? "Media Request").trim().slice(0, 60) || "Media Request",
    cost: Math.max(1, Math.min(1_000_000, Math.round(Number(input.cost ?? 5000)))),
  }))
  .handler(async ({ data, context }) => {
    const { createKickMediaReward } = await import("@/lib/mediaRequests.server");
    const result = await createKickMediaReward(context.userId, data);
    if ("reward" in result) {
      await context.supabase.from("media_request_settings").upsert({ user_id: context.userId, kick_reward_id: result.reward.id }, { onConflict: "user_id" });
    }
    return result;
  });

export const mediaRequestAction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { action: "APPROVE"|"REJECT"|"PLAY"|"PAUSE"|"RESUME"|"SKIP"|"DELETE"|"VOLUME"|"BLACKLIST"|"ENDED"; requestId?: string; volume?: number }) => input)
  .handler(async ({ data, context }) => {
    const admin = (await import("@/lib/supabase/client.server")).supabaseAdmin;
    const { acceptKickRedemption, rejectKickRedemption, advanceQueue, startIfIdle } = await import("@/lib/mediaRequests.server");
    if (data.action === "ENDED") { await advanceQueue(context.userId, data.requestId ?? null); return { ok: true }; }
    const { data: request } = data.requestId ? await context.supabase.from("media_requests").select("*").eq("id", data.requestId).eq("user_id", context.userId).single() : { data: null };
    if (["APPROVE","REJECT","PLAY","SKIP","DELETE","BLACKLIST"].includes(data.action) && !request) throw new Error("request_not_found");
    if (data.action === "APPROVE" && request) {
      await admin.from("media_requests").update({ status:"QUEUED", approved_at:new Date().toISOString() }).eq("id",request.id);
      if (request.reward_redemption_id) await acceptKickRedemption(context.userId, request.reward_redemption_id);
      await startIfIdle(context.userId, request.id);
    } else if (data.action === "REJECT" && request) {
      const refunded = request.reward_redemption_id ? await rejectKickRedemption(context.userId, request.reward_redemption_id) : false;
      await admin.from("media_requests").update({ status:"REJECTED", rejection_reason:"Rejected by moderator", refunded_at: refunded ? new Date().toISOString() : null }).eq("id",request.id);
    } else if (data.action === "PLAY" && request) {
      await admin.from("media_requests").update({ status:"PLAYING" }).eq("id",request.id);
      await admin.from("media_requests").update({ status:"SKIPPED" }).eq("user_id",context.userId).eq("status","PLAYING").neq("id",request.id);
      await admin.from("media_playback_state").upsert({ user_id:context.userId,current_request_id:request.id,playback_status:"PLAYING",position_seconds:0,started_at:new Date().toISOString(),revision:Date.now() },{onConflict:"user_id"});
    } else if (data.action === "PAUSE" || data.action === "RESUME") {
      await admin.from("media_playback_state").upsert({ user_id:context.userId,playback_status:data.action === "PAUSE" ? "PAUSED" : "PLAYING",revision:Date.now() },{onConflict:"user_id"});
    } else if (data.action === "SKIP" && request) {
      await admin.from("media_requests").update({ status:"SKIPPED",played_at:new Date().toISOString() }).eq("id",request.id);
      await advanceQueue(context.userId, null);

    } else if (data.action === "DELETE" && request) await admin.from("media_requests").delete().eq("id",request.id);
    else if (data.action === "VOLUME") await admin.from("media_playback_state").upsert({user_id:context.userId,volume:Math.max(0,Math.min(100,Number(data.volume ?? 80))),revision:Date.now()},{onConflict:"user_id"});
    else if (data.action === "BLACKLIST" && request) {
      // Auto-blacklist disabled: reject and refund only, never add the requester to the user blacklist.
      const refunded = request.reward_redemption_id ? await rejectKickRedemption(context.userId,request.reward_redemption_id) : false;
      await admin.from("media_requests").update({status:"REJECTED",rejection_reason:"Rejected by moderator",refunded_at:refunded?new Date().toISOString():null}).eq("id",request.id);
    }
    return { ok:true };
  });

export const addManualMediaRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => ({ url: String(input.url ?? "").trim().slice(0, 500) }))
  .handler(async ({ data, context }) => {
    const { parseMediaUrl, fetchMediaMetadata } = await import("@/lib/mediaRequests.server");
    const parsed = parseMediaUrl(data.url);
    if (!parsed) return { ok: false as const, error: "invalid_media_url" };
    let meta;
    try { meta = await fetchMediaMetadata(parsed); }
    catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "media_validation_failed" }; }
    const { data: tail } = await context.supabase.from("media_requests").select("position").eq("user_id", context.userId)
      .in("status", ["PENDING", "QUEUED"]).order("position", { ascending: false }).limit(1).maybeSingle();
    const { data: row, error } = await context.supabase.from("media_requests").insert({
      user_id: context.userId, provider_event_id: `manual-${parsed.platform}-${parsed.sourceId}-${Date.now()}`,
      requester_username: "Manual Test", platform: meta.platform, artist: meta.artist,
      youtube_video_id: meta.sourceId, youtube_url: meta.url, title: meta.title,
      thumbnail_url: meta.thumbnailUrl, duration_seconds: meta.durationSeconds, view_count: meta.viewCount,
      status: "QUEUED", position: Number(tail?.position ?? 0) + 1, approved_at: new Date().toISOString(),
    }).select("id").single();
    if (error) return { ok: false as const, error: error.code === "23505" ? "duplicate_video" : error.message };
    const { startIfIdle } = await import("@/lib/mediaRequests.server");
    if (row) await startIfIdle(context.userId, row.id);
    return { ok: true as const, title: meta.title };
  });

/** Public chat coordinates so the dashboard can watch Kick chat for redemptions. */
export const getMediaChatSources = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/lib/supabase/client.server");
    const { resolveChatSources } = await import("@/lib/chatSources.server");
    const { data: kick } = await supabaseAdmin.from("platform_connections")
      .select("access_token,platform_user_id").eq("user_id", context.userId)
      .eq("platform", "KICK").eq("is_active", true).maybeSingle();
    if (kick?.access_token && kick.platform_user_id) {
      const { ensureKickMediaSubscriptions } = await import("@/lib/kickEvents.server");
      const subscriptions = await ensureKickMediaSubscriptions(kick.access_token, kick.platform_user_id);
      if (!subscriptions.ok) console.error("[kick-events] subscription refresh failed", subscriptions.errors);
    }
    return resolveChatSources(supabaseAdmin, context.userId);
  });

/** Ingests a Kick chat message that carries a channel-point media redemption. */
export const ingestChatMediaRequestFn = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { messageId: string; username: string; text: string }) => ({
    messageId: String(input.messageId ?? "").slice(0, 120),
    username: String(input.username ?? "").slice(0, 80),
    text: String(input.text ?? "").slice(0, 1000),
  }))
  .handler(async ({ data, context }) => {
    const { ingestChatMediaRequest } = await import("@/lib/mediaRequests.server");
    return ingestChatMediaRequest({ userId: context.userId, ...data });
  });


/** Runs the real Kick redemption parser/matcher/metadata/insert pipeline with a creator-supplied test URL. */
export const testKickMediaRedemption = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => ({ url: String(input.url ?? "").trim().slice(0, 500) }))
  .handler(async ({ data, context }) => {
    const admin = (await import("@/lib/supabase/client.server")).supabaseAdmin;
    const [{ data: settings }, { data: connection }] = await Promise.all([
      admin.from("media_request_settings").select("kick_reward_id").eq("user_id", context.userId).maybeSingle(),
      admin.from("platform_connections").select("platform_user_id,username").eq("user_id", context.userId)
        .eq("platform", "KICK").eq("is_active", true).maybeSingle(),
    ]);
    if (!connection?.platform_user_id) return { ok: false as const, error: "kick_not_connected" };
    const testId = `diagnostic-${crypto.randomUUID()}`;
    const { ingestKickMediaRedemption } = await import("@/lib/mediaRequests.server");
    const result = await ingestKickMediaRedemption({
      messageId: testId,
      body: {
        id: testId,
        status: "pending",
        broadcaster: { user_id: connection.platform_user_id },
        // Mock identity: use the selected reward when present, otherwise a
        // synthetic id/title so diagnostics never fail on missing identity.
        reward: { id: settings?.kick_reward_id || "test_reward_id", title: "Media Request" },
        redeemer: { user_id: `test-${context.userId}`, username: connection.username ?? "Kick Diagnostic" },
        data: { user_input: data.url },
      },
    });
    if (result.status === "pending" || result.status === "queued") return { ok: true as const, status: result.status };
    return { ok: false as const, error: "reason" in result ? result.reason : result.status };
  });
