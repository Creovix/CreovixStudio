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
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2.5 text-[0.84rem] leading-snug">
          <span
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md",
              item.included
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-white/5 text-muted-foreground/55",
            )}
          >
            {item.included ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <X className="size-3" aria-hidden />
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
  description: string;
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
  description,
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
        "relative flex flex-col rounded-2xl border p-6 transition-[border-color,box-shadow,transform] duration-300 sm:p-7",
        featured
          ? "border-primary/45 bg-gradient-to-b from-primary/12 via-zinc-950/90 to-zinc-950 shadow-[0_24px_60px_-36px_oklch(0.541_0.247_293_/_0.55)]"
          : "border-white/[0.07] bg-zinc-950/75 hover:border-white/12",
      )}
    >
      {badge ? (
        <span className="absolute -top-3 start-6 inline-flex items-center gap-1 rounded-full border border-primary/35 bg-zinc-950 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="size-3" aria-hidden />
          {badge}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight">{price}</span>
            <span className="text-sm text-muted-foreground">{period}</span>
          </div>
        </div>
        <span
          className={cn(
            "grid size-11 place-items-center rounded-xl border",
            featured
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-white/10 bg-white/[0.04] text-muted-foreground",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      <p className="mt-3 text-[0.84rem] leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-6 flex-1 space-y-5">
        <FeatureList items={included} />
        {missing && missing.length > 0 ? (
          <div className="border-t border-white/[0.06] pt-4">
            <p className="mb-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              {t("gateway.free.notIncluded")}
            </p>
            <FeatureList items={missing} />
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        variant={featured ? "default" : "outline"}
        onClick={onCta}
        className={cn(
          "mt-7 h-11 w-full font-semibold",
          !featured && "border-white/12 bg-white/[0.03] hover:bg-white/[0.06]",
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

  const scrollToRedeem = () => {
    document.getElementById("redeem")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-charcoal text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-glow)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -start-24 top-24 size-[28rem] rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-20 bottom-40 size-[22rem] rounded-full bg-cyan/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        {/* Welcome */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-primary">
            Creovix Studio
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {t("gateway.welcome.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
            {t("gateway.welcome.subtitle")}
          </p>

          <ul
            className="mt-7 flex flex-wrap items-center justify-center gap-2"
            aria-label={t("gateway.welcome.platformsLabel")}
          >
            {PLATFORMS.map((platform) => (
              <li
                key={platform.id}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.78rem] text-foreground/85"
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
            <li className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {t("gateway.welcome.multiPlatform")}
            </li>
          </ul>
        </header>

        {/* Plan cards */}
        <section className="mt-12 grid gap-5 md:grid-cols-2 md:gap-6" aria-label={t("gateway.plansLabel")}>
          <PlanCard
            tier="free"
            icon={Sparkles}
            title={t("gateway.free.name")}
            price={PLAN_PRICES.free.label}
            period={t("gateway.price.period")}
            description={t("gateway.free.description")}
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
            description={t("gateway.pro.description")}
            included={PRO_INCLUDED}
            cta={t("gateway.pro.cta")}
            onCta={scrollToRedeem}
          />
        </section>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="group inline-flex items-center gap-2 text-[0.88rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Table2 className="size-4 text-primary/80 transition-transform group-hover:scale-105" aria-hidden />
            <span className="underline-offset-4 group-hover:underline">{t("gateway.compare.open")}</span>
          </button>
        </div>

        <RedeemCodeSection className="mt-14" onActivated={goDashboard} />

        <p className="mt-10 text-center text-[0.75rem] text-muted-foreground">
          {t("gateway.footer")}
        </p>
      </div>

      <PlanCompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </main>
  );
}
