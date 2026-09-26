/**
 * Production email service — Resend SDK.
 * Server-only: import from *.server.ts / API routes / createServerFn handlers.
 *
 * From address defaults to: CylixStudio <noreply@cylixstudio.com>
 * Env: RESEND_API_KEY (required), EMAIL_FROM (optional override)
 */
import { Resend } from "resend";

import {
  buildEmailFromTemplate,
  type BuiltEmail,
  type EmailTemplatePayload,
} from "@/lib/email/templates";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

const DEFAULT_FROM = "CylixStudio <noreply@cylixstudio.com>";

function resolveFrom(): string {
  return (
    process.env["EMAIL_FROM"]?.trim() ||
    process.env["RESEND_FROM"]?.trim() ||
    DEFAULT_FROM
  );
}

function getResendClient(): Resend | null {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function normalizeRecipients(to: string | string[]): string[] {
  const list = (Array.isArray(to) ? to : [to])
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.includes("@"));
  return [...new Set(list)];
}

/** Low-level send — HTML + text already built. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = normalizeRecipients(input.to);
  if (recipients.length === 0) {
    console.error("[email] invalid recipient", { to: input.to });
    return { ok: false, error: "invalid_recipient" };
  }

  const client = getResendClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY missing — skipping send", {
      to: recipients,
      subject: input.subject,
    });
    return { ok: false, error: "email_not_configured", skipped: true };
  }

  const from = resolveFrom();

  try {
    const { data, error } = await client.emails.send({
      from,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
    });

    if (error) {
      console.error("[email] Resend API error", {
        to: recipients,
        subject: input.subject,
        message: error.message,
        name: error.name,
      });
      return { ok: false, error: error.message || "resend_error" };
    }

    const id = data?.id ?? "sent";
    console.info("[email] sent", { id, to: recipients, subject: input.subject, from });
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Resend threw", { to: recipients, subject: input.subject, message });
    return { ok: false, error: message };
  }
}

/**
 * Build a named template (or custom body) with the master layout, then send.
 */
export async function sendTemplateEmail(
  to: string | string[],
  payload: EmailTemplatePayload,
  options?: { replyTo?: string; tags?: Array<{ name: string; value: string }> },
): Promise<SendEmailResult & { built?: BuiltEmail }> {
  let built: BuiltEmail;
  try {
    built = buildEmailFromTemplate(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] template build failed", { message, template: payload.template });
    return { ok: false, error: `template_build_failed:${message}` };
  }

  const result = await sendEmail({
    to,
    subject: built.subject,
    html: built.html,
    text: built.text,
    ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
    tags: options?.tags ?? [{ name: "template", value: payload.template }],
  });

  return { ...result, built };
}

/** Optional SMS via Twilio when TWILIO_* env vars + phone are present. */
export async function sendSms(
  toPhone: string,
  body: string,
): Promise<SendEmailResult> {
  const sid = process.env["TWILIO_ACCOUNT_SID"]?.trim();
  const token = process.env["TWILIO_AUTH_TOKEN"]?.trim();
  const from = process.env["TWILIO_FROM"]?.trim();
  if (!sid || !token || !from) {
    return { ok: false, error: "sms_not_configured", skipped: true };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: toPhone, From: from, Body: body }).toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[sms] Twilio failed", res.status, text.slice(0, 200));
      return { ok: false, error: `twilio_${res.status}` };
    }

    return { ok: true, id: "sms_sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sms] Twilio threw", message);
    return { ok: false, error: message };
  }
}
