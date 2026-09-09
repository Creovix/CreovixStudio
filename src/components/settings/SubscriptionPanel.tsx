import { useState } from "react";

import { RedeemCodeModal } from "@/components/subscription/RedeemCodeModal";
import { remainingLabel, useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/lib/i18n";

export function SubscriptionStatusPill({ userId }: { userId: string }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { data } = useSubscription(userId);
  if (!data) return null;

  if (data.isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" />
        {remainingLabel(data.daysLeft, data.lifetime, ar)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-semibold text-red-400">
      <span className="size-1.5 rounded-full bg-red-400" />
      {data.status === "expired" ? (ar ? "منتهي" : "Expired") : ar ? "غير مفعّل" : "Inactive"}
    </span>
  );
}

export function SubscriptionPanel({ userId }: { userId: string }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const subscription = useSubscription(userId);
  const [redeem, setRedeem] = useState(false);

  return (
    <div className="space-y-6">
      <section className="glass-3d max-w-xl rounded-2xl p-6">
        <p className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
          {ar ? "الاشتراك" : "Subscription"}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SubscriptionStatusPill userId={userId} />
          {subscription.data?.expiresAt && subscription.data.isActive && !subscription.data.lifetime ? (
            <span className="text-[0.78rem] text-muted-foreground">
              {ar ? "ينتهي في " : "Expires "}
              {new Date(subscription.data.expiresAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        {subscription.data?.isActive ? (
          <p className="mt-3 text-[0.9rem] font-medium">
            {remainingLabel(subscription.data.daysLeft, subscription.data.lifetime, ar)}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setRedeem(true)}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {ar ? "تجديد الاشتراك" : "Redeem new code"}
        </button>
      </section>

      {redeem ? <RedeemCodeModal onClose={() => setRedeem(false)} /> : null}
    </div>
  );
}
