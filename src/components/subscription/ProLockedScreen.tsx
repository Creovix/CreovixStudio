import { Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { RedeemCodeModal } from "@/components/subscription/RedeemCodeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/lib/i18n";

/** Full-page lock shown when a Free account opens a Pro-only feature. */
export function ProLockedScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [redeem, setRedeem] = useState(false);

  return (
    <div className="ambient-field min-h-screen bg-background px-4 py-24 text-foreground" dir="rtl" lang="ar">
      <div className="glass-3d mx-auto max-w-md rounded-2xl p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
          <Lock className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">{t("home.proGate.title")}</h1>
        <p className="mt-2 text-[0.82rem] text-muted-foreground">{t("home.proGate.body")}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="rounded-lg border border-[oklch(1_0_0/0.1)] px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("home.proGate.home")}
          </button>
          <button
            type="button"
            onClick={() => setRedeem(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {t("home.proGate.activate")}
          </button>
        </div>
      </div>
      {redeem ? <RedeemCodeModal onClose={() => setRedeem(false)} /> : null}
    </div>
  );
}

/**
 * Blocks children until the user has an active Pro subscription.
 * While subscription status is loading, children still render.
 */
export function ProFeatureGate({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const subscription = useSubscription(userId);
  const locked = subscription.isSuccess && !subscription.data.isActive;
  if (locked) return <ProLockedScreen />;
  return children;
}
