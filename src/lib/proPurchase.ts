import type { ProBillingInterval } from "@/lib/plans";
import { PRO_BILLING_OPTIONS } from "@/lib/plans";

/** Calendar days granted when a Pro activation code is redeemed. */
export function durationDaysForInterval(interval: ProBillingInterval | "lifetime" | "custom", customDays?: number): number {
  if (interval === "lifetime") return 36500;
  if (interval === "custom") return Math.min(Math.max(Math.round(customDays ?? 30), 1), 36500);
  return PRO_BILLING_OPTIONS[interval].months * 30;
}

export function intervalLabel(interval: ProBillingInterval | "lifetime" | "custom", durationDays: number): string {
  if (interval === "lifetime" || durationDays >= 36500) return "Lifetime";
  if (interval === "yearly" || durationDays >= 365) return "1 year";
  if (interval === "six_months" || durationDays >= 180) return "6 months";
  if (interval === "monthly" || durationDays >= 30) return "1 month";
  return `${durationDays} days`;
}

/** Format 16-char code as XXXX-XXXX-XXXX-XXXX for email / SMS. */
export function formatActivationCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return clean.replace(/(.{4})(?=.)/g, "$1-");
}
