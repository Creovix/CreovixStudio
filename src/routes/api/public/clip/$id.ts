import { createFileRoute } from "@tanstack/react-router";

/**
 * Public playback data for a captured clip. Only the clip's own random id is
 * needed — no creator data is exposed beyond the clip's public metadata.
 */
export const Route = createFileRoute("/api/public/clip/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("clips")
          .select("id, title, url, external_id, thumbnail_url, duration_seconds, clipped_by, created_at")
          .eq("id", params.id)
          .maybeSingle();

        if (!data) {
          return new Response(JSON.stringify({ error: "not_found" }), {
            status: 404,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }

        let playbackUrl = data.url;
        if (data.external_id) {
          const signed = await supabaseAdmin.storage
            .from("clips")
            .createSignedUrl(data.external_id, 60 * 60 * 6);
          if (signed.data?.signedUrl) playbackUrl = signed.data.signedUrl;
        }

        return new Response(
          JSON.stringify({
            id: data.id,
            title: data.title,
            url: playbackUrl,
            thumbnail: data.thumbnail_url,
            duration: data.duration_seconds,
            clippedBy: data.clipped_by,
            createdAt: data.created_at,
          }),
          { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } },
        );
      },
    },
  },
});
