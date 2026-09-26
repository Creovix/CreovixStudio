import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import { WidgetRulesPanel } from "@/components/widgets/WidgetRulesPanel";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WIDGET_LABEL, type WidgetType } from "@/lib/widgets";

export const Route = createFileRoute("/_authenticated/widgets/$widgetId/rules")({
  head: () => ({
    meta: [
      { title: "CylixStudio — Widget Rules" },
      {
        name: "description",
        content:
          "Route Twitch, Kick, StreamElements and Streamlabs events into seconds added or goal progress for this widget.",
      },
      { property: "og:title", content: "CylixStudio — Widget Rules" },
      {
        property: "og:description",
        content: "Per-widget rules engine: platform + event → seconds and goal increments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WidgetRules,
});

function WidgetRules() {
  const { user } = Route.useRouteContext();
  const { widgetId } = Route.useParams();
  const { data: workspace } = useWorkspace(user.id);

  const widgetQuery = useQuery({
    queryKey: ["widget", widgetId],
    queryFn: async () => {
      const { data, error: readError } = await supabase
        .from("widgets")
        .select("id, name, type, subathon_id")
        .eq("id", widgetId)
        .single();
      if (readError) throw readError;
      return data as { id: string; name: string; type: WidgetType; subathon_id: string | null };
    },
  });

  return (
    <AppShell
      user={user}
      profile={workspace?.profile}
      subathons={workspace?.subathons ?? []}
      title={widgetQuery.data ? `${widgetQuery.data.name} · rules` : "Widget rules"}
      subtitle={
        widgetQuery.data
          ? `${WIDGET_LABEL[widgetQuery.data.type]} — events add seconds and/or goal progress.`
          : "Loading…"
      }
    >
      {widgetQuery.data ? (
        <WidgetRulesPanel
          widgetId={widgetId}
          subathonId={widgetQuery.data.subathon_id}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Loading rules…</p>
      )}
    </AppShell>
  );
}
