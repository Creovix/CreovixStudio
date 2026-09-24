/** Plan catalog for the onboarding gateway and comparison table. */

export type PlanId = "free" | "pro";

export type FeatureAvailability = boolean | string;

export type PlanFeatureRow = {
  id: string;
  labelKey: string;
  free: FeatureAvailability;
  pro: FeatureAvailability;
  /** Highlighted in the short Free / Pro cards. */
  card?: "free" | "pro" | "both" | "free-missing" | "pro-highlight";
};

export const PLAN_PRICES = {
  free: { amount: 0, label: "$0", period: "/month" },
  pro: { amount: 9.99, label: "$9.99", period: "/month" },
} as const;

/** Full feature matrix — source of truth for cards + detailed table. */
export const PLAN_FEATURES: PlanFeatureRow[] = [
  {
    id: "platforms",
    labelKey: "gateway.feature.platforms",
    free: true,
    pro: true,
    card: "both",
  },
  {
    id: "commands",
    labelKey: "gateway.feature.commands",
    free: "Up to 10",
    pro: "Unlimited",
    card: "both",
  },
  {
    id: "timers",
    labelKey: "gateway.feature.timers",
    free: "Up to 3",
    pro: "Unlimited",
    card: "both",
  },
  {
    id: "basicWidgets",
    labelKey: "gateway.feature.basicWidgets",
    free: true,
    pro: true,
    card: "both",
  },
  {
    id: "advancedWidgets",
    labelKey: "gateway.feature.advancedWidgets",
    free: false,
    pro: true,
    card: "pro-highlight",
  },
  {
    id: "emoteRain",
    labelKey: "gateway.feature.emoteRain",
    free: false,
    pro: true,
    card: "pro-highlight",
  },
  {
    id: "linkInBio",
    labelKey: "gateway.feature.linkInBio",
    free: false,
    pro: true,
    card: "free-missing",
  },
  {
    id: "analytics",
    labelKey: "gateway.feature.analytics",
    free: false,
    pro: true,
    card: "free-missing",
  },
  {
    id: "export",
    labelKey: "gateway.feature.export",
    free: false,
    pro: true,
    card: "pro-highlight",
  },
  {
    id: "overlays",
    labelKey: "gateway.feature.overlays",
    free: true,
    pro: true,
  },
  {
    id: "activityFeed",
    labelKey: "gateway.feature.activityFeed",
    free: true,
    pro: true,
  },
  {
    id: "giveaways",
    labelKey: "gateway.feature.giveaways",
    free: "Basic",
    pro: "Full suite",
  },
  {
    id: "schedule",
    labelKey: "gateway.feature.schedule",
    free: true,
    pro: true,
  },
  {
    id: "priority",
    labelKey: "gateway.feature.priority",
    free: false,
    pro: true,
  },
];

export const GATEWAY_STORAGE_KEY = "creovix.gateway.completed";

export function isGatewayCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GATEWAY_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGatewayCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GATEWAY_STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
