import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  Crown,
  Sparkles,
  Table2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { PlanCompareDialog } from "@/components/onboarding/PlanCompareDialog";
import { RedeemCodeSection } from "@/components/onboarding/RedeemCodeSection";
import { PlatformAsset } from "@/components/icons/platformAssets";
import { Button } from "@/components/ui/button";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { markGatewayCompleted, PLAN_PRICES } from "@/lib/plans";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "twitch" as const, label: "Twitch" },
  { id: "kick" as const, label: "Kick" },
  { id: "youtube" as const, label: "YouTube" },
  { id: "tiktok" as const, label: "TikTok" },
] as const;

type Bullet = { key: TranslationKey; included: boolean };

const FREE_FEATURES: Bullet[] = [
  { key: "gateway.free.bullet.platforms", included: true },
  { key: "gateway.free.bullet.commands", included: true },
  { key: "gateway.free.bullet.timers", included: true },
  { key: "gateway.free.bullet.widgets", included: true },
  { key: "gateway.free.bullet.linkInBio", included: false },
  { key: "gateway.free.bullet.analytics", included: false },
];

const PRO_FEATURES: Bullet[] = [
  { key: "gateway.pro.bullet.unlimited", included: true },
  { key: "gateway.pro.bullet.advanced", included: true },
  { key: "gateway.pro.bullet.emoteRain", included: true },
  { key: "gateway.pro.bullet.linkInBio", included: true },
  { key: "gateway.pro.bullet.analytics", included: true },
  { key: "gateway.pro.bullet.export", included: true },
];

function FeatureList({ items }: { items: Bullet[] }) {
  const { t } = useLanguage();
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-3 text-[0.9rem] leading-snug">
          <span
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
              item.included
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/10 text-rose-400/80",
            )}
            aria-hidden
          >
            {item.included ? (
              <Check className="size-3 stroke-[2.75]" />
            ) : (
              <X className="size-3 stroke-[2.75]" />
            )}
          </span>
          <span className={item.included ? "text-zinc-100" : "text-zinc-500"}>
            {t(item.key)}
          </span>
        </li>
      ))}
    </ul>
  );
}

type PlanCardProps = {
  tier: "free" | "pro";
  badge?: string;
  icon: LucideIcon;
  title: string;
  price: string;
  period: string;
  description: string;
  features: Bullet[];
  cta: string;
  onCta: () => void;
  featured?: boolean;
};

function PlanCard({
  tier,
  badge,
  icon: Icon,
  title,
  price,
  period,
  description,
  features,
  cta,
  onCta,
  featured,
}: PlanCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 pt-7 sm:p-8 sm:pt-8",
        featured
          ? "border-primary/45 bg-gradient-to-b from-primary/[0.16] via-zinc-950 to-zinc-950 shadow-[0_0_40px_-12px_oklch(0.541_0.247_293_/_0.45)]"
          : "border-zinc-800 bg-zinc-950/85",
      )}
    >
      {badge ? (
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-b-xl border border-t-0 border-primary/35 bg-primary/15 px-4 py-1.5 text-[0.7rem] font-semibold tracking-wide text-primary">
            <Sparkles className="size-3" aria-hidden />
            {badge}
          </span>
        </div>
      ) : null}

      <div className={cn("flex items-start justify-between gap-4", badge && "mt-4")}>
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight text-zinc-50">{price}</span>
            <span className="text-sm text-zinc-500">{period}</span>
          </div>
        </div>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl border",
            featured
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-zinc-800 bg-zinc-900 text-zinc-400",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      <p className="mt-3 text-[0.875rem] leading-relaxed text-zinc-400">{description}</p>

      <div className="mt-6 flex-1 border-t border-zinc-800/90 pt-6">
        <FeatureList items={features} />
      </div>

      <Button
        type="button"
        variant={featured ? "default" : "outline"}
        onClick={onCta}
        className={cn(
          "mt-8 h-11 w-full text-sm font-semibold",
          !featured &&
            "border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800",
          featured && "shadow-[0_14px_36px_-16px_oklch(0.541_0.247_293_/_0.8)]",
        )}
        data-tier={tier}
      >
        {cta}
        <ChevronRight className="size-4 opacity-70" aria-hidden />
      </Button>
    </article>
  );
}

export function GatewayPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);

  const goDashboard = () => {
    markGatewayCompleted();
    void navigate({ to: "/dashboard" });
  };

  const focusRedeem = () => {
    document.getElementById("gateway-redeem-code")?.focus();
  };

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-charcoal text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute start-1/2 top-[-10%] size-[42rem] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[56rem] flex-col justify-center px-5 py-10 sm:px-8 sm:py-12">
        {/* Header */}
        <header className="mx-auto w-full max-w-2xl text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
            {t("gateway.welcome.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-zinc-400 sm:text-base">
            {t("gateway.welcome.subtitle")}
          </p>

          <div className="mt-6 flex justify-center">
            <ul
              className="inline-flex flex-wrap items-center justify-center gap-2"
              aria-label={t("gateway.welcome.platformsLabel")}
            >
              {PLATFORMS.map((platform) => (
                <li
                  key={platform.id}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-[0.8rem] text-zinc-200"
                >
                  <PlatformAsset
                    name={platform.id}
                    size={14}
                    variant={platform.id === "kick" ? "Black" : "White"}
                    className="size-3.5"
                  />
                  {platform.label}
                </li>
              ))}
              <li className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
                {t("gateway.welcome.multiPlatform")}
              </li>
            </ul>
          </div>
        </header>

        {/* Pricing cards */}
        <section
          className="mt-10 grid items-stretch gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6"
          aria-label={t("gateway.plansLabel")}
        >
          <PlanCard
            tier="free"
            icon={Sparkles}
            title={t("gateway.free.name")}
            price={PLAN_PRICES.free.label}
            period={t("gateway.price.period")}
            description={t("gateway.free.description")}
            features={FREE_FEATURES}
            cta={t("gateway.free.cta")}
            onCta={goDashboard}
          />
          <PlanCard
            tier="pro"
            featured
            badge={t("gateway.pro.badge")}
            icon={Crown}
            title={t("gateway.pro.name")}
            price={PLAN_PRICES.pro.label}
            period={t("gateway.price.period")}
            description={t("gateway.pro.description")}
            features={PRO_FEATURES}
            cta={t("gateway.pro.cta")}
            onCta={focusRedeem}
          />
        </section>

        {/* Comparison separator */}
        <div className="my-9 flex items-center gap-4" role="presentation">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-[0.82rem] font-medium text-zinc-400 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Table2 className="size-3.5 text-primary transition-transform group-hover:scale-105" aria-hidden />
            {t("gateway.compare.open")}
          </button>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>

        <RedeemCodeSection className="mx-auto w-full max-w-lg" onActivated={goDashboard} />
      </div>

      <PlanCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </main>
  );
}
