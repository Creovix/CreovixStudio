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
<<<<<<< HEAD
import { toast } from "sonner";
=======
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8

import { PlanCompareDialog } from "@/components/onboarding/PlanCompareDialog";
import { RedeemCodeSection } from "@/components/onboarding/RedeemCodeSection";
import { PlatformAsset } from "@/components/icons/platformAssets";
import { Button } from "@/components/ui/button";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
<<<<<<< HEAD
import {
  DEFAULT_PRO_BILLING,
  markGatewayCompleted,
  PLAN_PRICES,
  prepareProCheckout,
  PRO_BILLING_OPTIONS,
  PRO_BILLING_ORDER,
  type ProBillingInterval,
} from "@/lib/plans";
=======
import { markGatewayCompleted, PLAN_PRICES } from "@/lib/plans";
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
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

<<<<<<< HEAD
const BILLING_LABEL_KEY: Record<ProBillingInterval, TranslationKey> = {
  monthly: "gateway.billing.monthly",
  six_months: "gateway.billing.sixMonths",
  yearly: "gateway.billing.yearly",
};

function FeatureList({ items }: { items: Bullet[] }) {
  const { t } = useLanguage();
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2 text-[0.78rem] leading-snug sm:text-[0.82rem]">
          <span
            className={cn(
              "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
=======
function FeatureList({ items }: { items: Bullet[] }) {
  const { t } = useLanguage();
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-3 text-[0.9rem] leading-snug">
          <span
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
              item.included
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/10 text-rose-400/80",
            )}
            aria-hidden
          >
            {item.included ? (
<<<<<<< HEAD
              <Check className="size-2.5 stroke-[2.75]" />
            ) : (
              <X className="size-2.5 stroke-[2.75]" />
=======
              <Check className="size-3 stroke-[2.75]" />
            ) : (
              <X className="size-3 stroke-[2.75]" />
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
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

<<<<<<< HEAD
function FreePlanCard({
  title,
  price,
  period,
  description,
  features,
  cta,
  onCta,
}: {
=======
type PlanCardProps = {
  tier: "free" | "pro";
  badge?: string;
  icon: LucideIcon;
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
  title: string;
  price: string;
  period: string;
  description: string;
  features: Bullet[];
  cta: string;
  onCta: () => void;
<<<<<<< HEAD
}) {
  return (
    <article className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/85 p-4 pt-5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-zinc-400">{title}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-[2rem]">{price}</span>
            <span className="text-xs text-zinc-500">{period}</span>
          </div>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-[0.78rem] leading-relaxed text-zinc-400">{description}</p>

      <div className="mt-3 min-h-0 flex-1 border-t border-zinc-800/90 pt-3">
        <FeatureList items={features} />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onCta}
        className="mt-4 h-9 w-full border-zinc-700 bg-zinc-900/70 text-[0.82rem] font-semibold text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800"
        data-tier="free"
      >
        {cta}
        <ChevronRight className="size-3.5 opacity-70" aria-hidden />
      </Button>
    </article>
  );
}

function ProBillingSelector({
  value,
  onChange,
}: {
  value: ProBillingInterval;
  onChange: (next: ProBillingInterval) => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="tablist"
      aria-label={t("gateway.billing.selectorLabel")}
      className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-zinc-950/80 p-1"
    >
      {PRO_BILLING_ORDER.map((interval) => {
        const active = value === interval;
        return (
          <button
            key={interval}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(interval)}
            className={cn(
              "rounded-md px-1.5 py-1.5 text-[0.68rem] font-semibold transition-colors sm:text-[0.72rem]",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
            )}
          >
            {t(BILLING_LABEL_KEY[interval])}
          </button>
        );
      })}
    </div>
  );
}

function ProPlanCard({
  badge,
  title,
  description,
  features,
  cta,
  billing,
  onBillingChange,
  onUnlock,
}: {
  badge: string;
  title: string;
  description: string;
  features: Bullet[];
  cta: string;
  billing: ProBillingInterval;
  onBillingChange: (next: ProBillingInterval) => void;
  onUnlock: () => void;
}) {
  const { t } = useLanguage();
  const option = PRO_BILLING_OPTIONS[billing];
  const Icon: LucideIcon = Crown;

  return (
    <article className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-primary/45 bg-gradient-to-b from-primary/[0.16] via-zinc-950 to-zinc-950 p-4 pt-5 shadow-[0_0_40px_-12px_oklch(0.541_0.247_293_/_0.45)] sm:p-5">
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <span className="inline-flex items-center gap-1 rounded-b-lg border border-t-0 border-primary/35 bg-primary/15 px-3 py-1 text-[0.62rem] font-semibold tracking-wide text-primary">
          <Sparkles className="size-2.5" aria-hidden />
          {badge}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-zinc-400">{title}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-[2rem]">
              {option.label}
            </span>
            <span className="text-xs text-zinc-500">{option.periodSuffix}</span>
            {option.savePercent != null ? (
              <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-300">
                {t("gateway.billing.save").replace("{percent}", String(option.savePercent))}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.72rem] text-zinc-400">{option.perMonthLabel}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      <ProBillingSelector value={billing} onChange={onBillingChange} />

      <p className="mt-2 line-clamp-2 text-[0.78rem] leading-relaxed text-zinc-400">{description}</p>

      <div className="mt-3 min-h-0 flex-1 border-t border-zinc-800/90 pt-3">
=======
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
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
        <FeatureList items={features} />
      </div>

      <Button
        type="button"
<<<<<<< HEAD
        variant="default"
        onClick={onUnlock}
        className="mt-4 h-9 w-full text-[0.82rem] font-semibold shadow-[0_14px_36px_-16px_oklch(0.541_0.247_293_/_0.8)]"
        data-tier="pro"
        data-billing-interval={option.id}
        data-amount={option.amount}
        data-currency={option.currency}
        data-months={option.months}
      >
        {cta}
        <ChevronRight className="size-3.5 opacity-70" aria-hidden />
=======
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
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      </Button>
    </article>
  );
}

export function GatewayPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [compareOpen, setCompareOpen] = useState(false);
<<<<<<< HEAD
  const [proBilling, setProBilling] = useState<ProBillingInterval>(DEFAULT_PRO_BILLING);
=======
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8

  const goDashboard = () => {
    markGatewayCompleted();
    void navigate({ to: "/dashboard" });
  };

<<<<<<< HEAD
  const unlockPro = () => {
    const payload = prepareProCheckout(proBilling);
    // Placeholder until Tuwaiq Pay is wired — payload is persisted for the checkout adapter.
    toast.message(
      t("gateway.billing.checkoutReady").replace("{amount}", payload.label),
    );
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-charcoal text-foreground">
=======
  const focusRedeem = () => {
    document.getElementById("gateway-redeem-code")?.focus();
  };

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-charcoal text-foreground">
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
        aria-hidden
      />
      <div
<<<<<<< HEAD
        className="pointer-events-none absolute start-1/2 top-[-18%] size-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex h-full w-full max-w-[56rem] flex-col justify-center px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="mx-auto w-full max-w-2xl shrink-0 text-center">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl lg:text-[2.15rem] lg:leading-[1.15]">
            {t("gateway.welcome.title")}
          </h1>
          <p className="mx-auto mt-1.5 max-w-xl text-pretty text-[0.82rem] leading-relaxed text-zinc-400 sm:text-[0.9rem]">
            {t("gateway.welcome.subtitle")}
          </p>

          <div className="mt-3 flex justify-center">
            <ul
              className="inline-flex flex-wrap items-center justify-center gap-1.5"
=======
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
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
              aria-label={t("gateway.welcome.platformsLabel")}
            >
              {PLATFORMS.map((platform) => (
                <li
                  key={platform.id}
<<<<<<< HEAD
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/90 px-2.5 py-1 text-[0.72rem] text-zinc-200"
                >
                  <PlatformAsset
                    name={platform.id}
                    size={12}
                    variant={platform.id === "kick" ? "Black" : "White"}
                    className="size-3"
=======
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-[0.8rem] text-zinc-200"
                >
                  <PlatformAsset
                    name={platform.id}
                    size={14}
                    variant={platform.id === "kick" ? "Black" : "White"}
                    className="size-3.5"
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
                  />
                  {platform.label}
                </li>
              ))}
<<<<<<< HEAD
              <li className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary">
=======
              <li className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
                {t("gateway.welcome.multiPlatform")}
              </li>
            </ul>
          </div>
        </header>

<<<<<<< HEAD
        <section
          className="mt-4 grid min-h-0 shrink items-stretch gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4"
          aria-label={t("gateway.plansLabel")}
        >
          <FreePlanCard
=======
        {/* Pricing cards */}
        <section
          className="mt-10 grid items-stretch gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6"
          aria-label={t("gateway.plansLabel")}
        >
          <PlanCard
            tier="free"
            icon={Sparkles}
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
            title={t("gateway.free.name")}
            price={PLAN_PRICES.free.label}
            period={t("gateway.price.period")}
            description={t("gateway.free.description")}
            features={FREE_FEATURES}
            cta={t("gateway.free.cta")}
            onCta={goDashboard}
          />
<<<<<<< HEAD
          <ProPlanCard
            badge={t("gateway.pro.badge")}
            title={t("gateway.pro.name")}
            description={t("gateway.pro.description")}
            features={PRO_FEATURES}
            cta={t("gateway.pro.cta")}
            billing={proBilling}
            onBillingChange={setProBilling}
            onUnlock={unlockPro}
          />
        </section>

        <div className="my-3 flex shrink-0 items-center gap-3 sm:my-4" role="presentation">
=======
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
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
<<<<<<< HEAD
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[0.75rem] font-medium text-zinc-400 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Table2 className="size-3 text-primary transition-transform group-hover:scale-105" aria-hidden />
=======
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-[0.82rem] font-medium text-zinc-400 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Table2 className="size-3.5 text-primary transition-transform group-hover:scale-105" aria-hidden />
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
            {t("gateway.compare.open")}
          </button>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>

<<<<<<< HEAD
        <RedeemCodeSection
          className="mx-auto w-full max-w-lg shrink-0"
          compact
          onActivated={goDashboard}
        />
=======
        <RedeemCodeSection className="mx-auto w-full max-w-lg" onActivated={goDashboard} />
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      </div>

      <PlanCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </main>
  );
}
