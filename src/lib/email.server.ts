/**
 * Transactional email via Resend (https://resend.com).
 * Configure RESEND_API_KEY + EMAIL_FROM. No-ops with a clear error when unset.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const from =
    process.env["EMAIL_FROM"]?.trim() ||
    process.env["RESEND_FROM"]?.trim() ||
    "CylixStudio <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing — skipping send to", input.to);
    return { ok: false, error: "email_not_configured", skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    console.error("[email] Resend failed", res.status, body);
    return { ok: false, error: body.message ?? `resend_${res.status}` };
  }

  return { ok: true, id: body.id ?? "sent" };
}

/** Optional SMS via Twilio when TWILIO_* env vars + phone are present. */
export async function sendSms(toPhone: string, body: string): Promise<SendEmailResult> {
  const sid = process.env["TWILIO_ACCOUNT_SID"]?.trim();
  const token = process.env["TWILIO_AUTH_TOKEN"]?.trim();
  const from = process.env["TWILIO_FROM"]?.trim();
  if (!sid || !token || !from) {
    return { ok: false, error: "sms_not_configured", skipped: true };
  }

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
}
