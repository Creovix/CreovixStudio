import { formatActivationCode, intervalLabel } from "@/lib/proPurchase";
import type { ProBillingInterval } from "@/lib/plans";

export type ProCodeEmailParams = {
  toEmail: string;
  code: string;
  interval: ProBillingInterval | "lifetime" | "custom";
  durationDays: number;
  siteUrl: string;
};

export function buildProActivationEmail(params: ProCodeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const pretty = formatActivationCode(params.code);
  const duration = intervalLabel(params.interval, params.durationDays);
  const settingsUrl = `${params.siteUrl.replace(/\/$/, "")}/settings?setup=subscription`;
  const subject = `Your CylixStudio Pro activation code (${duration})`;

  const text = [
    "CylixStudio Pro — activation code",
    "",
    `Thanks for your purchase. Your Pro plan (${duration}) is ready.`,
    "",
    `Activation code: ${pretty}`,
    "",
    "How to activate:",
    "1. Sign in to CylixStudio",
    `2. Open Settings → Account & subscription (${settingsUrl})`,
    "3. Click “Enter activation code” and paste the code above",
    "",
    "Pro is not turned on until you redeem this code. Keep it private.",
    "",
    "— CylixStudio",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a1a1aa;">CylixStudio Pro</p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#fafafa;">Your activation code</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#a1a1aa;">
                Thanks for your purchase. Your <strong style="color:#e4e4e7;">${duration}</strong> Pro access is ready —
                redeem the code below in Settings to unlock Pro features. Your account stays inactive until you activate.
              </p>
              <div style="margin:0 0 24px;padding:18px 16px;border-radius:12px;background:#0a0a0a;border:1px solid rgba(190,225,252,0.35);text-align:center;">
                <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">Activation code</p>
                <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:22px;letter-spacing:0.18em;color:#bee1fc;font-weight:600;">${pretty}</p>
              </div>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#e4e4e7;">How to activate</p>
              <ol style="margin:0 0 22px;padding-inline-start:18px;font-size:13px;line-height:1.65;color:#a1a1aa;">
                <li>Sign in to CylixStudio</li>
                <li>Open <strong style="color:#d4d4d8;">Settings → Account &amp; subscription</strong></li>
                <li>Choose <strong style="color:#d4d4d8;">Enter activation code</strong> and paste the code</li>
              </ol>
              <a href="${settingsUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#bee1fc;color:#111;font-size:13px;font-weight:600;text-decoration:none;">Open Settings</a>
              <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#71717a;">
                Do not share this code. It can only be used once. If you didn’t make this purchase, contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
