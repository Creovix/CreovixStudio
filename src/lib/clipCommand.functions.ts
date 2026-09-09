import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ClipCommandSettingsInput = {
  enabled: boolean;
  roles: string[];
  defaultLength: number;
  maxLength: number;
  response: string;
};

export const getClipCommandState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: settings }, { data: clips }] = await Promise.all([
      supabase
        .from("clip_command_settings")
        .select("enabled, roles, default_length, max_length, response")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("clips")
        .select("id, title, url, thumbnail_url, duration_seconds, view_count, clipped_by, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      settings: settings
        ? {
            enabled: settings.enabled,
            roles: settings.roles?.length ? settings.roles : ["Everyone"],
            defaultLength: settings.default_length,
            maxLength: settings.max_length,
            response: settings.response,
          }
        : null,
      clips: (clips ?? []).map((clip) => ({
        id: clip.id,
        title: clip.title,
        url: clip.url,
        thumbnail: clip.thumbnail_url,
        duration: clip.duration_seconds,
        views: clip.view_count,
        clippedBy: clip.clipped_by,
        createdAt: clip.created_at,
      })),
    };
  });

export const saveClipCommandSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ClipCommandSettingsInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const maxLength = Math.min(Math.max(Math.round(data.maxLength) || 120, 5), 240);
    const defaultLength = Math.min(Math.max(Math.round(data.defaultLength) || 30, 5), maxLength);
    const { error } = await supabase.from("clip_command_settings").upsert(
      {
        user_id: userId,
        enabled: Boolean(data.enabled),
        roles: data.roles.length ? data.roles : ["Everyone"],
        default_length: defaultLength,
        max_length: maxLength,
        response: data.response.trim() || "@{user} {clip_url}",
      },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteClip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clips")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: !error };
  });

export const listChannelClips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("clips")
      .select("id, title, url, share_url, thumbnail_url, duration_seconds, view_count, clipped_by, created_at, platform")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((clip) => ({
      id: clip.id,
      title: clip.title,
      url: clip.url,
      shareUrl: clip.share_url,
      thumbnail: clip.thumbnail_url,
      duration: clip.duration_seconds,
      views: clip.view_count,
      clippedBy: clip.clipped_by,
      createdAt: clip.created_at,
      platform: clip.platform,
    }));
  });
