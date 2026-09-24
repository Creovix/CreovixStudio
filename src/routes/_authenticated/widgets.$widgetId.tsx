import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useState } from "react";

import { RedeemCodeModal } from "@/components/subscription/RedeemCodeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase/client";
import { isTestMode } from "@/lib/testMode";
import type { WidgetType } from "@/lib/widgets";

/** Widget types that require an active Pro subscription. */
const PRO_ONLY_WIDGET_TYPES = new Set<WidgetType>(["EMOTE_RAIN"]);

export const Route = createFileRoute("/_authenticated/widgets/$widgetId")({
  component: WidgetGate,
});

function WidgetGate() {
  const { user } = Route.useRouteContext();
  const { widgetId } = useParams({ from: "/_authenticated/widgets/$widgetId" });
  const subscription = useSubscription(user.id);
  const navigate = useNavigate();
  const [redeem, setRedeem] = useState(false);

  const widget = useQuery({
    queryKey: ["widget-gate", widgetId],
    enabled: Boolean(widgetId) && !isTestMode(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("widgets")
        .select("id, type")
        .eq("id", widgetId)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; type: WidgetType } | null;
    },
    staleTime: 60_000,
  });

  const needsPro =
    subscription.isSuccess &&
    !subscription.data.isActive &&
    widget.isSuccess &&
    widget.data != null &&
    PRO_ONLY_WIDGET_TYPES.has(widget.data.type);

  if (needsPro) {
    return (
      <div className="ambient-field min-h-screen bg-background px-4 py-24 text-foreground">
        <div className="glass-3d mx-auto max-w-md rounded-2xl p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Lock className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">{"Unlock Pro"}</h1>
          <p className="mt-2 text-[0.82rem] text-muted-foreground">
            {"This widget is included with Pro. Enter your license code to customize it and copy the OBS link."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-lg border border-[oklch(1_0_0/0.1)] px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {"Home"}
            </button>
            <button
              type="button"
              onClick={() => setRedeem(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {"Activate code"}
            </button>
          </div>
        </div>
        {redeem ? <RedeemCodeModal onClose={() => setRedeem(false)} /> : null}
      </div>
    );
  }

  return <Outlet />;
}
