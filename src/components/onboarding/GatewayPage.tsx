import { useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  Crown,
  Gift,
  Sparkles,
  Table2,
  UserRoundCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PlanCompareDialog } from "@/components/onboarding/PlanCompareDialog";
import { RedeemCodeSection } from "@/components/onboarding/RedeemCodeSection";
import { PlatformAsset } from "@/components/icons/platformAssets";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import {
  DEFAULT_PRO_BILLING,
  markGatewayCompleted,
  PLAN_PRICES,
  prepareProCheckout,
  PRO_BILLING_OPTIONS,
  PRO_BILLING_ORDER,
  type ProBillingInterval,
  type ProPurchaseType,
} from "@/lib/plans";
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
              item.included
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/10 text-rose-400/80",
            )}
            aria-hidden
          >
            {item.included ? (
              <Check className="size-2.5 stroke-[2.75]" />
            ) : (
              <X className="size-2.5 stroke-[2.75]" />
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

function FreePlanCard({
  title,
  price,
  period,
  description,
  features,
  cta,
  onCta,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: Bullet[];
  cta: string;
  onCta: () => void;
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

function PurchaseTypeSelector({
  value,
  onChange,
}: {
  value: ProPurchaseType;
  onChange: (next: ProPurchaseType) => void;
}) {
  const { t } = useLanguage();
  const options: Array<{
    id: ProPurchaseType;
    label: TranslationKey;
    hint: TranslationKey;
    icon: LucideIcon;
  }> = [
    {
      id: "direct",
      label: "gateway.purchaseType.direct",
      hint: "gateway.purchaseType.directHint",
      icon: UserRoundCheck,
    },
    {
      id: "gift",
      label: "gateway.purchaseType.gift",
      hint: "gateway.purchaseType.giftHint",
      icon: Gift,
    },
  ];

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {t("gateway.purchaseType.label")}
      </p>
      <div
        role="tablist"
        aria-label={t("gateway.purchaseType.label")}
        className="grid grid-cols-2 gap-1.5"
      >
        {options.map((option) => {
          const active = value === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-start transition-colors",
                active
                  ? "border-primary/50 bg-primary/15 text-zinc-50"
                  : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
              )}
            >
              <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold leading-tight">
                <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
                {t(option.label)}
              </span>
              <span className="text-[0.62rem] leading-snug opacity-80">{t(option.hint)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GiftFields({
  recipientEmail,
  giftMessage,
  onRecipientChange,
  onMessageChange,
}: {
  recipientEmail: string;
  giftMessage: string;
  onRecipientChange: (value: string) => void;
  onMessageChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="mt-2.5 space-y-2 overflow-hidden rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-2.5"
      data-gift-fields
    >
      <div className="space-y-1">
        <label
          htmlFor="pro-gift-recipient"
          className="block text-[0.68rem] font-medium text-zinc-400"
        >
          {t("gateway.gift.recipientLabel")}
        </label>
        <input
          id="pro-gift-recipient"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={recipientEmail}
          onChange={(e) => onRecipientChange(e.target.value)}
          placeholder={t("gateway.gift.recipientPlaceholder")}
          className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-[0.78rem] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        />
        <p className="text-[0.62rem] leading-snug text-zinc-500">{t("gateway.gift.recipientHint")}</p>
      </div>
      <div className="space-y-1">
        <label
          htmlFor="pro-gift-message"
          className="block text-[0.68rem] font-medium text-zinc-400"
        >
          {t("gateway.gift.messageLabel")}
        </label>
        <textarea
          id="pro-gift-message"
          rows={2}
          maxLength={500}
          value={giftMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={t("gateway.gift.messagePlaceholder")}
          className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[0.78rem] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        />
      </div>
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
  purchaseType,
  onPurchaseTypeChange,
  giftRecipientEmail,
  giftMessage,
  onGiftRecipientChange,
  onGiftMessageChange,
  onUnlock,
}: {
  badge: string;
  title: string;
  description: string;
  features: Bullet[];
  cta: string;
  billing: ProBillingInterval;
  onBillingChange: (next: ProBillingInterval) => void;
  purchaseType: ProPurchaseType;
  onPurchaseTypeChange: (next: ProPurchaseType) => void;
  giftRecipientEmail: string;
  giftMessage: string;
  onGiftRecipientChange: (value: string) => void;
  onGiftMessageChange: (value: string) => void;
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
      <PurchaseTypeSelector value={purchaseType} onChange={onPurchaseTypeChange} />
      {purchaseType === "gift" ? (
        <GiftFields
          recipientEmail={giftRecipientEmail}
          giftMessage={giftMessage}
          onRecipientChange={onGiftRecipientChange}
          onMessageChange={onGiftMessageChange}
        />
      ) : null}

      <p className="mt-2 line-clamp-2 text-[0.78rem] leading-relaxed text-zinc-400">{description}</p>

      <div className="mt-3 min-h-0 flex-1 border-t border-zinc-800/90 pt-3">
        <FeatureList items={features} />
      </div>

      <Button
        type="button"
        variant="default"
        onClick={onUnlock}
        className="mt-4 h-9 w-full text-[0.82rem] font-semibold shadow-[0_14px_36px_-16px_oklch(0.541_0.247_293_/_0.8)]"
        data-tier="pro"
        data-billing-interval={option.id}
        data-amount={option.amount}
        data-currency={option.currency}
        data-months={option.months}
        data-purchase-type={purchaseType}
      >
        {cta}
        <ChevronRight className="size-3.5 opacity-70" aria-hidden />
      </Button>
    </article>
  );
}

function isOptionalEmailValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function GatewayPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: "/_authenticated" });
  const [compareOpen, setCompareOpen] = useState(false);
  const [proBilling, setProBilling] = useState<ProBillingInterval>(DEFAULT_PRO_BILLING);
  const [purchaseType, setPurchaseType] = useState<ProPurchaseType>("direct");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const goDashboard = () => {
    markGatewayCompleted();
    void navigate({ to: "/dashboard" });
  };

  const unlockPro = () => {
    if (purchaseType === "gift" && !isOptionalEmailValid(giftRecipientEmail)) {
      toast.error(t("gateway.gift.invalidEmail"));
      return;
    }

    const payload = prepareProCheckout(proBilling, {
      purchaseType,
      userId: user.id,
      buyerEmail: user.email ?? null,
      giftRecipientEmail: purchaseType === "gift" ? giftRecipientEmail : null,
      giftMessage: purchaseType === "gift" ? giftMessage : null,
    });

    if (purchaseType === "direct") {
      toast.message(
        t("gateway.billing.checkoutDirectReady").replace("{amount}", payload.label),
      );
      return;
    }

    const recipient = payload.giftRecipientEmail
      ? ` to ${payload.giftRecipientEmail}`
      : " to you";
    toast.message(
      t("gateway.billing.checkoutGiftReady")
        .replace("{amount}", payload.label)
        .replace("{recipient}", recipient),
    );
    window.setTimeout(() => {
      document.getElementById("gateway-redeem")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };

  const unlockCta =
    purchaseType === "direct" ? t("gateway.pro.ctaDirect") : t("gateway.pro.ctaGift");

  return (
    <main className="relative h-dvh overflow-hidden bg-charcoal text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute start-1/2 top-[-18%] size-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex h-full w-full max-w-[56rem] flex-col justify-center px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="mx-auto w-full max-w-2xl shrink-0 text-center">
          <div className="mb-3 flex justify-center">
            <BrandLogo markOnly size="lg" className="sm:hidden" />
            <BrandLogo markOnly size="xl" className="hidden sm:inline-flex" />
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl lg:text-[2.15rem] lg:leading-[1.15]">
            {t("gateway.welcome.title")}
          </h1>
          <p className="mx-auto mt-1.5 max-w-xl text-pretty text-[0.82rem] leading-relaxed text-zinc-400 sm:text-[0.9rem]">
            {t("gateway.welcome.subtitle")}
          </p>

          <div className="mt-3 flex justify-center">
            <ul
              className="inline-flex flex-wrap items-center justify-center gap-1.5"
              aria-label={t("gateway.welcome.platformsLabel")}
            >
              {PLATFORMS.map((platform) => (
                <li
                  key={platform.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/90 px-2.5 py-1 text-[0.72rem] text-zinc-200"
                >
                  <PlatformAsset
                    name={platform.id}
                    size={12}
                    variant={platform.id === "kick" ? "Black" : "White"}
                    className="size-3"
                  />
                  {platform.label}
                </li>
              ))}
              <li className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary">
                {t("gateway.welcome.multiPlatform")}
              </li>
            </ul>
          </div>
        </header>

        <section
          className="mt-4 grid min-h-0 shrink items-stretch gap-3 overflow-y-auto sm:mt-5 sm:grid-cols-2 sm:gap-4"
          aria-label={t("gateway.plansLabel")}
        >
          <FreePlanCard
            title={t("gateway.free.name")}
            price={PLAN_PRICES.free.label}
            period={t("gateway.price.period")}
            description={t("gateway.free.description")}
            features={FREE_FEATURES}
            cta={t("gateway.free.cta")}
            onCta={goDashboard}
          />
          <ProPlanCard
            badge={t("gateway.pro.badge")}
            title={t("gateway.pro.name")}
            description={t("gateway.pro.description")}
            features={PRO_FEATURES}
            cta={unlockCta}
            billing={proBilling}
            onBillingChange={setProBilling}
            purchaseType={purchaseType}
            onPurchaseTypeChange={setPurchaseType}
            giftRecipientEmail={giftRecipientEmail}
            giftMessage={giftMessage}
            onGiftRecipientChange={setGiftRecipientEmail}
            onGiftMessageChange={setGiftMessage}
            onUnlock={unlockPro}
          />
        </section>

        <div className="my-3 flex shrink-0 items-center gap-3 sm:my-4" role="presentation">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[0.75rem] font-medium text-zinc-400 transition-colors hover:border-primary/40 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <Table2 className="size-3 text-primary transition-transform group-hover:scale-105" aria-hidden />
            {t("gateway.compare.open")}
          </button>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>

        <RedeemCodeSection
          id="gateway-redeem"
          className="mx-auto w-full max-w-lg shrink-0"
          compact
          onActivated={goDashboard}
        />
      </div>

      <PlanCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </main>
  );
}
