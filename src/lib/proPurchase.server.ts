import type { SupabaseClient } from "@supabase/supabase-js";

import { sendEmail, sendSms } from "@/lib/email.server";
import type { ProBillingInterval } from "@/lib/plans";
import {
  durationDaysForInterval,
  formatActivationCode,
  intervalLabel,
} from "@/lib/proPurchase";
import { buildProActivationEmail } from "@/lib/proPurchaseEmail";
import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

export type FulfillProPurchaseInput = {
  email: string;
  userId?: string | null;
  interval: ProBillingInterval | "lifetime" | "custom";
  durationDays?: number;
  amountCents?: number | null;
  currency?: string;
  provider: string;
  providerPaymentId: string;
  phone?: string | null;
  siteUrl: string;
  metadata?: Record<string, unknown>;
};

export type FulfillProPurchaseResult =
  | {
      ok: true;
      purchaseId: string;
      code: string;
      durationDays: number;
      email: { delivered: boolean; error?: string };
      sms: { delivered: boolean; error?: string };
      idempotent: boolean;
    }
  | { ok: false; error: string };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 16; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

async function insertUniqueCode(
  admin: AdminClient,
  args: {
    durationDays: number;
    purchaserUserId: string | null;
    notes: string;
    codeExpiresAt: string | null;
  },
): Promise<{ id: string; code: string } | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const { data, error } = await admin
      .from("activation_codes")
      .insert({
        code,
        duration_days: args.durationDays,
        is_used: false,
        is_active: true,
        is_revoked: false,
        notes: args.notes,
        source: "purchase",
        purchaser_user_id: args.purchaserUserId,
        code_expires_at: args.codeExpiresAt,
      } as never)
      .select("id, code")
      .single();

    if (!error && data) return data as { id: string; code: string };
    // Unique violation — retry
    if (error && /duplicate|unique/i.test(error.message)) continue;
    console.error("[pro-purchase] insert code failed", error);
    return null;
  }
  return null;
}

/**
 * After a successful Pro payment:
 * 1. Record the purchase (idempotent on provider + payment id)
 * 2. Generate an unused activation code linked to the buyer
 * 3. Email (and optionally SMS) the code
 *
 * Does NOT activate Pro — the user must redeem the code in Settings.
 */
export async function fulfillProPurchase(
  admin: AdminClient,
  input: FulfillProPurchaseInput,
): Promise<FulfillProPurchaseResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: "invalid_email" };

  const provider = (input.provider || "checkout").trim().slice(0, 64);
  const providerPaymentId = input.providerPaymentId.trim().slice(0, 191);
  if (!providerPaymentId) return { ok: false, error: "missing_payment_id" };

  const durationDays = durationDaysForInterval(input.interval, input.durationDays);
  const currency = (input.currency || "USD").toUpperCase().slice(0, 8);

  // Idempotent replay: return existing code without re-activating.
  const { data: existing } = await admin
    .from("pro_purchases")
    .select("id, activation_code_id, code_delivered_at")
    .eq("provider", provider)
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (existing?.activation_code_id) {
    const { data: codeRow } = await admin
      .from("activation_codes")
      .select("code, duration_days")
      .eq("id", existing.activation_code_id)
      .maybeSingle();

    if (codeRow?.code) {
      return {
        ok: true,
        purchaseId: existing.id,
        code: codeRow.code,
        durationDays: codeRow.duration_days,
        email: { delivered: Boolean(existing.code_delivered_at) },
        sms: { delivered: false, error: "skipped_idempotent" },
        idempotent: true,
      };
    }
  }

  let userId = input.userId?.trim() || null;
  if (!userId) {
    const { data: profile } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  // Code itself remains redeemable for 1 year if unused (subscription days apply on redeem).
  const codeExpiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString();
  const notes = `purchase:${provider}:${providerPaymentId}`;

  const inserted = await insertUniqueCode(admin, {
    durationDays,
    purchaserUserId: userId,
    notes,
    codeExpiresAt,
  });
  if (!inserted) return { ok: false, error: "code_generation_failed" };

  const { data: purchase, error: purchaseError } = await admin
    .from("pro_purchases")
    .insert({
      user_id: userId,
      email,
      billing_interval: input.interval === "custom" ? "custom" : input.interval,
      duration_days: durationDays,
      amount_cents: input.amountCents ?? null,
      currency,
      provider,
      provider_payment_id: providerPaymentId,
      status: "paid",
      activation_code_id: inserted.id,
      metadata: (input.metadata ?? {}) as never,
    } as never)
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    console.error("[pro-purchase] insert purchase failed", purchaseError);
    // Best-effort: keep the code but report failure so the webhook can retry carefully.
    return { ok: false, error: purchaseError?.message ?? "purchase_insert_failed" };
  }

  await admin
    .from("activation_codes")
    .update({ purchase_id: purchase.id } as never)
    .eq("id", inserted.id);

  const mail = buildProActivationEmail({
    toEmail: email,
    code: inserted.code,
    interval: input.interval,
    durationDays,
    siteUrl: input.siteUrl,
  });

  const emailResult = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  if (emailResult.ok) {
    await admin
      .from("pro_purchases")
      .update({ code_delivered_at: new Date().toISOString() } as never)
      .eq("id", purchase.id);
  }

  let smsResult: { delivered: boolean; error?: string } = { delivered: false };
  const phone = input.phone?.trim();
  if (phone) {
    const duration = intervalLabel(input.interval, durationDays);
    const sms = await sendSms(
      phone,
      `CylixStudio Pro (${duration}) code: ${formatActivationCode(inserted.code)}. Redeem in Settings → Account. Do not share.`,
    );
    smsResult = sms.ok
      ? { delivered: true }
      : { delivered: false, error: sms.error };
  }

  console.info("[pro-purchase] fulfilled (pending manual redeem)", {
    purchaseId: purchase.id,
    email,
    durationDays,
    emailDelivered: emailResult.ok,
    idempotent: false,
  });

  return {
    ok: true,
    purchaseId: purchase.id,
    code: inserted.code,
    durationDays,
    email: emailResult.ok
      ? { delivered: true }
      : { delivered: false, error: emailResult.error },
    sms: smsResult,
    idempotent: false,
  };
}
