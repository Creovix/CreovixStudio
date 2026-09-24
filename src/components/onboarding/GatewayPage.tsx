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
];

type Bullet = {
  key: TranslationKey;
  included: boolean;
};

const FREE_INCLUDED: Bullet[] = [
  { key: "gateway.free.bullet.platforms", included: true },
  { key: "gateway.free.bullet.commands", included: true },
  { key: "gateway.free.bullet.timers", included: true },
  { key: "gateway.free.bullet.widgets", included: true },
];

const FREE_MISSING: Bullet[] = [
  { key: "gateway.free.bullet.linkInBio", included: false },
  { key: "gateway.free.bullet.analytics", included: false },
];

const PRO_INCLUDED: Bullet[] = [
  { key: "gateway.pro.bullet.unlimited", included: true },
  { key: "gateway.pro.bullet.advanced", included: true },
  { key: "gateway.pro.bullet.emoteRain", included: true },
  { key: "gateway.pro.bullet.linkInBio", included: true },
  { key: "gateway.pro.bullet.analytics", included: true },
];

function FeatureList({ items }: { items: Bullet[] }) {
  const { t } = useLanguage();
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2 text-[0.75rem] leading-tight">
          <span
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded",
              item.included
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-white/5 text-muted-foreground/55",
            )}
          >
            {item.included ? (
              <Check className="size-2.5" aria-hidden />
            ) : (
              <X className="size-2.5" aria-hidden />
            )}
          </span>
          <span className={item.included ? "text-foreground/90" : "text-muted-foreground"}>
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
  included: Bullet[];
  missing?: Bullet[];
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
  included,
  missing,
  cta,
  onCta,
  featured,
}: PlanCardProps) {
  const { t } = useLanguage();

  return (
    <article
      className={cn(
        "relative flex min-h-0 flex-col rounded-xl border p-2.5 sm:p-4",
        featured
          ? "border-primary/45 bg-gradient-to-b from-primary/12 via-zinc-950/90 to-zinc-950"
          : "border-white/[0.07] bg-zinc-950/80",
      )}
    >
      {badge ? (
        <span className="absolute -top-2 end-2 inline-flex items-center gap-1 rounded-full border border-primary/35 bg-zinc-950 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-primary sm:-top-2.5 sm:end-3 sm:px-2 sm:text-[0.6rem]">
          <Sparkles className="size-2.5" aria-hidden />
          {badge}
        </span>
      ) : null}

      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[0.65rem] sm:tracking-[0.18em]">
            {title}
          </p>
          <div className="mt-0.5 flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-xl font-semibold tracking-tight sm:text-[1.65rem]">{price}</span>
            <span className="text-[0.65rem] text-muted-foreground sm:text-[0.72rem]">{period}</span>
          </div>
        </div>
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg border sm:size-8",
            featured
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-white/10 bg-white/[0.04] text-muted-foreground",
          )}
        >
          <Icon className="size-3 sm:size-3.5" aria-hidden />
        </span>
      </div>

      <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-hidden sm:mt-3 sm:space-y-2.5">
        <FeatureList items={included} />
        {missing && missing.length > 0 ? (
          <div className="border-t border-white/[0.06] pt-1.5 sm:pt-2">
            <p className="mb-1 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75 sm:mb-1.5 sm:text-[0.6rem]">
              {t("gateway.free.notIncluded")}
            </p>
            <FeatureList items={missing} />
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        size="sm"
        variant={featured ? "default" : "outline"}
        onClick={onCta}
        className={cn(
          "mt-2.5 h-8 w-full px-2 text-[0.72rem] font-semibold sm:mt-3 sm:text-[0.78rem]",
          !featured && "border-white/12 bg-white/[0.03] hover:bg-white/[0.06]",
        )}
        data-tier={tier}
      >
        <span className="truncate">{cta}</span>
        <ChevronRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
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
    <main className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-charcoal text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -start-16 top-10 size-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex h-full w-full max-w-4xl min-h-0 flex-col justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:py-6">
        {/* Compact welcome header */}
        <header className="shrink-0 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-primary">
              Creovix Studio
            </p>
            <span className="hidden text-white/15 sm:inline" aria-hidden>
              ·
            </span>
            <ul
              className="flex flex-wrap items-center justify-center gap-1"
              aria-label={t("gateway.welcome.platformsLabel")}
            >
              {PLATFORMS.map((platform) => (
                <li
                  key={platform.id}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[0.68rem] text-foreground/85"
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
              <li className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-primary">
                {t("gateway.welcome.multiPlatform")}
              </li>
            </ul>
          </div>
          <h1 className="mt-2 text-balance text-xl font-semibold tracking-tight sm:text-2xl">
            {t("gateway.welcome.title")}
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-[0.78rem] leading-snug text-muted-foreground sm:text-[0.82rem]">
            {t("gateway.welcome.subtitle")}
          </p>
        </header>

        {/* Compact plan cards */}
        <section
          className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 sm:gap-4"
          aria-label={t("gateway.plansLabel")}
        >
          <PlanCard
            tier="free"
            icon={Sparkles}
            title={t("gateway.free.name")}
            price={PLAN_PRICES.free.label}
            period={t("gateway.price.period")}
            included={FREE_INCLUDED}
            missing={FREE_MISSING}
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
            included={PRO_INCLUDED}
            cta={t("gateway.pro.cta")}
            onCta={focusRedeem}
          />
        </section>

        <div className="flex shrink-0 justify-center">
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="group inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Table2 className="size-3.5 text-primary/80" aria-hidden />
            <span className="underline-offset-4 group-hover:underline">{t("gateway.compare.open")}</span>
          </button>
        </div>

        <RedeemCodeSection className="shrink-0" onActivated={goDashboard} />
      </div>

      <PlanCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </main>
  );
}
