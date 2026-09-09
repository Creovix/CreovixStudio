import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/overlay/$publicId/meta")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // Token-gated public metadata lookup. The token is an unguessable
        // UUID and only safe columns leave the server.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: widget } = await supabaseAdmin
          .from("widgets")
          .select("id, name, type, config, is_enabled")
          .eq("public_token", params.publicId)
          .maybeSingle();

        if (widget?.is_enabled) {
          return Response.json(
            {
              widget: {
                id: widget.id,
                name: widget.name,
                type: widget.type,
                config: widget.config,
              },
              // Back-compat for clients that only read `overlay.theme`.
              overlay: { name: widget.name, theme: widget.config },
            },
            { headers: { "cache-control": "no-store" } },
          );
        }

        const { data: overlay } = await supabaseAdmin
          .from("overlays")
          .select("id, name, theme")
          .eq("public_token", params.publicId)
          .maybeSingle();

        if (!overlay) {
          return Response.json({ error: "overlay_not_found" }, { status: 404 });
        }

        return Response.json(
          {
            widget: {
              id: overlay.id,
              name: overlay.name,
              type: "SUBATHON_TIMER" as const,
              config: overlay.theme,
            },
            overlay,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
