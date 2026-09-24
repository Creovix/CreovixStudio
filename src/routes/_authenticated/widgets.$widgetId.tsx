import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";

import { RedeemCodeModal } from "@/components/subscription/RedeemCodeModal";
import { useSubscription } from "@/hooks/useSubscription";
export const Route = createFileRoute("/_authenticated/widgets/$widgetId")({
  component: WidgetGate,
});

function WidgetGate() {
  const { user } = Route.useRouteContext();
  const subscription = useSubscription(user.id);
  const navigate = useNavigate();
  const [redeem, setRedeem] = useState(false);

  if (subscription.isSuccess && !subscription.data.isActive) {
    return (
      <div className="ambient-field min-h-screen bg-background px-4 py-24 text-foreground">
        <div className="glass-3d mx-auto max-w-md rounded-2xl p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-500/15 text-red-400">
            <Lock className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            {"Subscription required"}
          </h1>
          <p className="mt-2 text-[0.82rem] text-muted-foreground">
            {"Enter your 16-character license code to unlock customization panels and OBS links."}
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
