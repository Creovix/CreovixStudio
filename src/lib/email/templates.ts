import type { ProBillingInterval } from "@/lib/plans";
import { formatActivationCode, intervalLabel } from "@/lib/proPurchase";
import { escapeHtml, renderMasterEmailLayout } from "@/lib/email/layout";

export type EmailLocale = "ar" | "en";

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

export type ProActivationTemplateInput = {
  siteUrl: string;
  code: string;
  interval: ProBillingInterval | "lifetime" | "custom";
  durationDays: number;
  locale?: EmailLocale;
};

export type WelcomeTemplateInput = {
  siteUrl: string;
  displayName?: string | null;
  locale?: EmailLocale;
};

export type InvoiceNoticeTemplateInput = {
  siteUrl: string;
  amountLabel: string;
  intervalLabel: string;
  paymentId: string;
  locale?: EmailLocale;
};

export type GiftActivationTemplateInput = {
  siteUrl: string;
  code: string;
  interval: ProBillingInterval | "lifetime" | "custom";
  durationDays: number;
  giftMessage?: string | null;
  /** Buyer display — shown as the sender of the gift */
  fromName?: string | null;
  locale?: EmailLocale;
};

export type DirectActivatedTemplateInput = {
  siteUrl: string;
  interval: ProBillingInterval | "lifetime" | "custom";
  durationDays: number;
  expiresAt?: string | null;
  locale?: EmailLocale;
};

/** Pro activation code — Arabic-first, master layout. */
export function buildProActivationTemplate(input: ProActivationTemplateInput): BuiltEmail {
  const locale = input.locale ?? "ar";
  const pretty = formatActivationCode(input.code);
  const duration = intervalLabel(input.interval, input.durationDays);
  const settingsUrl = `${input.siteUrl.replace(/\/$/, "")}/settings?setup=subscription`;

  if (locale === "en") {
    const subject = `Your CylixStudio Pro activation code (${duration})`;
    const bodyHtml = `
      <p style="margin:0 0 16px;">Thanks for your purchase. Your <strong style="color:#e4e4e7;">${escapeHtml(duration)}</strong> Pro access is ready. Redeem the code below in Settings — Pro stays off until you activate.</p>
      <div style="margin:0 0 20px;padding:18px 16px;border-radius:12px;background:#0a0a0a;border:1px solid rgba(190,225,252,0.35);text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">Activation code</p>
        <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;letter-spacing:0.16em;color:#bee1fc;font-weight:700;direction:ltr;">${escapeHtml(pretty)}</p>
      </div>
      <p style="margin:0 0 8px;font-weight:700;color:#e4e4e7;">How to activate</p>
      <ol style="margin:0;padding-inline-start:18px;">
        <li>Sign in to CylixStudio</li>
        <li>Open <strong style="color:#d4d4d8;">Settings → Account &amp; subscription</strong></li>
        <li>Choose <strong style="color:#d4d4d8;">Enter activation code</strong> and paste the code</li>
      </ol>
      <p style="margin:18px 0 0;font-size:12px;color:#71717a;">Do not share this code. It can only be used once.</p>
    `;
    const text = [
      "CylixStudio Pro — activation code",
      "",
      `Duration: ${duration}`,
      `Code: ${pretty}`,
      "",
      `Redeem at: ${settingsUrl}`,
      "",
      "Pro is not active until you redeem this code.",
    ].join("\n");

    return {
      subject,
      text,
      html: renderMasterEmailLayout({
        siteUrl: input.siteUrl,
        locale: "en",
        eyebrow: "CylixStudio Pro",
        title: "Your activation code",
        preheader: `Pro ${duration} — code ${pretty}`,
        bodyHtml,
        cta: { label: "Open Settings", href: settingsUrl },
      }),
    };
  }

  const subject = `رمز تفعيل CylixStudio Pro (${duration})`;
  const bodyHtml = `
    <p style="margin:0 0 16px;">شكرًا لشرائك. اشتراك <strong style="color:#e4e4e7;">Pro</strong> لمدة <strong style="color:#e4e4e7;">${escapeHtml(duration)}</strong> جاهز. فعّل الرمز أدناه من الإعدادات — لن يُفعَّل Pro تلقائيًا قبل إدخال الرمز.</p>
    <div style="margin:0 0 20px;padding:18px 16px;border-radius:12px;background:#0a0a0a;border:1px solid rgba(190,225,252,0.35);text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;color:#71717a;">رمز التفعيل</p>
      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;letter-spacing:0.16em;color:#bee1fc;font-weight:700;direction:ltr;">${escapeHtml(pretty)}</p>
    </div>
    <p style="margin:0 0 8px;font-weight:700;color:#e4e4e7;">طريقة التفعيل</p>
    <ol style="margin:0;padding-inline-start:18px;">
      <li>سجّل الدخول إلى CylixStudio</li>
      <li>افتح <strong style="color:#d4d4d8;">الإعدادات ← الحساب والاشتراك</strong></li>
      <li>اختر <strong style="color:#d4d4d8;">إدخال رمز التفعيل</strong> والصق الرمز</li>
    </ol>
    <p style="margin:18px 0 0;font-size:12px;color:#71717a;">لا تشارك هذا الرمز مع أحد. يُستخدم مرة واحدة فقط.</p>
  `;
  const text = [
    "CylixStudio Pro — رمز التفعيل",
    "",
    `المدة: ${duration}`,
    `الرمز: ${pretty}`,
    "",
    `التفعيل من: ${settingsUrl}`,
    "",
    "لن يُفعَّل Pro حتى تدخل الرمز يدويًا.",
  ].join("\n");

  return {
    subject,
    text,
    html: renderMasterEmailLayout({
      siteUrl: input.siteUrl,
      locale: "ar",
      eyebrow: "CylixStudio Pro",
      title: "رمز تفعيل اشتراكك",
      preheader: `Pro ${duration} — ${pretty}`,
      bodyHtml,
      cta: { label: "فتح الإعدادات", href: settingsUrl },
    }),
  };
}

export function buildWelcomeTemplate(input: WelcomeTemplateInput): BuiltEmail {
  const locale = input.locale ?? "ar";
  const name = input.displayName?.trim() || (locale === "ar" ? "صديقنا" : "there");
  const site = input.siteUrl.replace(/\/$/, "");

  if (locale === "en") {
    const subject = "Welcome to CylixStudio";
    const bodyHtml = `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0;">You’re in. Connect Kick or Twitch, build your overlays, and go live with CylixStudio.</p>
    `;
    return {
      subject,
      text: `Welcome to CylixStudio, ${name}. Open ${site}/dashboard to get started.`,
      html: renderMasterEmailLayout({
        siteUrl: site,
        locale: "en",
        eyebrow: "Welcome",
        title: "You’re ready to stream",
        preheader: "Welcome to CylixStudio",
        bodyHtml,
        cta: { label: "Open dashboard", href: `${site}/dashboard` },
      }),
    };
  }

  const subject = "مرحبًا بك في CylixStudio";
  const bodyHtml = `
    <p style="margin:0 0 12px;">أهلًا ${escapeHtml(name)}،</p>
    <p style="margin:0;">تم إنشاء حسابك. اربط Kick أو Twitch وابنِ أدواتك المباشرة من لوحة التحكم.</p>
  `;
  return {
    subject,
    text: `مرحبًا بك في CylixStudio. ابدأ من: ${site}/dashboard`,
    html: renderMasterEmailLayout({
      siteUrl: site,
      locale: "ar",
      eyebrow: "ترحيب",
      title: "حسابك جاهز للبث",
      preheader: "مرحبًا بك في CylixStudio",
      bodyHtml,
      cta: { label: "فتح لوحة التحكم", href: `${site}/dashboard` },
    }),
  };
}

export function buildInvoiceNoticeTemplate(input: InvoiceNoticeTemplateInput): BuiltEmail {
  const locale = input.locale ?? "ar";
  const site = input.siteUrl.replace(/\/$/, "");

  if (locale === "en") {
    const subject = `Payment received — ${input.amountLabel}`;
    const bodyHtml = `
      <p style="margin:0 0 12px;">We received your payment of <strong style="color:#e4e4e7;">${escapeHtml(input.amountLabel)}</strong> for <strong style="color:#e4e4e7;">${escapeHtml(input.intervalLabel)}</strong>.</p>
      <p style="margin:0;font-size:12px;color:#71717a;direction:ltr;">Reference: ${escapeHtml(input.paymentId)}</p>
      <p style="margin:16px 0 0;">Your Pro activation code is sent in a separate email (or the same checkout flow).</p>
    `;
    return {
      subject,
      text: `Payment ${input.amountLabel} for ${input.intervalLabel}. Ref: ${input.paymentId}`,
      html: renderMasterEmailLayout({
        siteUrl: site,
        locale: "en",
        eyebrow: "Billing",
        title: "Payment confirmed",
        preheader: subject,
        bodyHtml,
      }),
    };
  }

  const subject = `تم استلام الدفع — ${input.amountLabel}`;
  const bodyHtml = `
    <p style="margin:0 0 12px;">استلمنا دفعتك بمبلغ <strong style="color:#e4e4e7;">${escapeHtml(input.amountLabel)}</strong> لمدة <strong style="color:#e4e4e7;">${escapeHtml(input.intervalLabel)}</strong>.</p>
    <p style="margin:0;font-size:12px;color:#71717a;direction:ltr;">Reference: ${escapeHtml(input.paymentId)}</p>
    <p style="margin:16px 0 0;">رمز تفعيل Pro يُرسل في بريد منفصل ضمن نفس عملية الشراء.</p>
  `;
  return {
    subject,
    text: `تم الدفع ${input.amountLabel} — ${input.intervalLabel}. المرجع: ${input.paymentId}`,
    html: renderMasterEmailLayout({
      siteUrl: site,
      locale: "ar",
      eyebrow: "الفواتير",
      title: "تأكيد الدفع",
      preheader: subject,
      bodyHtml,
    }),
  };
}

/** Gift activation code — personal message + redeem CTA. */
export function buildGiftActivationTemplate(input: GiftActivationTemplateInput): BuiltEmail {
  const locale = input.locale ?? "ar";
  const pretty = formatActivationCode(input.code);
  const duration = intervalLabel(input.interval, input.durationDays);
  const settingsUrl = `${input.siteUrl.replace(/\/$/, "")}/settings?setup=subscription`;
  const fromLabel = input.fromName?.trim() || "CylixStudio";
  const message = input.giftMessage?.trim();

  const messageBlock = message
    ? locale === "en"
      ? `<blockquote style="margin:0 0 20px;padding:14px 16px;border-radius:12px;border:1px solid rgba(190,225,252,0.25);background:rgba(190,225,252,0.06);color:#e4e4e7;font-style:italic;line-height:1.65;">“${escapeHtml(message)}”</blockquote>
         <p style="margin:0 0 16px;font-size:12px;color:#71717a;">— ${escapeHtml(fromLabel)}</p>`
      : `<blockquote style="margin:0 0 20px;padding:14px 16px;border-radius:12px;border:1px solid rgba(190,225,252,0.25);background:rgba(190,225,252,0.06);color:#e4e4e7;font-style:italic;line-height:1.65;">«${escapeHtml(message)}»</blockquote>
         <p style="margin:0 0 16px;font-size:12px;color:#71717a;">— ${escapeHtml(fromLabel)}</p>`
    : "";

  if (locale === "en") {
    const subject = `A CylixStudio Pro gift for you (${duration})`;
    const bodyHtml = `
      <p style="margin:0 0 16px;"><strong style="color:#e4e4e7;">${escapeHtml(fromLabel)}</strong> sent you <strong style="color:#e4e4e7;">CylixStudio Pro</strong> for <strong style="color:#e4e4e7;">${escapeHtml(duration)}</strong>.</p>
      ${messageBlock}
      <div style="margin:0 0 20px;padding:18px 16px;border-radius:12px;background:#0a0a0a;border:1px solid rgba(190,225,252,0.35);text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">Gift activation code</p>
        <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;letter-spacing:0.16em;color:#bee1fc;font-weight:700;direction:ltr;">${escapeHtml(pretty)}</p>
      </div>
      <p style="margin:0 0 8px;font-weight:700;color:#e4e4e7;">Redeem at cylixstudio.com</p>
      <ol style="margin:0;padding-inline-start:18px;">
        <li>Sign in (or create an account)</li>
        <li>Open <strong style="color:#d4d4d8;">Settings → Account &amp; subscription</strong></li>
        <li>Choose <strong style="color:#d4d4d8;">Enter activation code</strong> and paste the code</li>
      </ol>
      <p style="margin:18px 0 0;font-size:12px;color:#71717a;">This code works once. Don’t share it publicly.</p>
    `;
    const text = [
      "CylixStudio Pro — gift activation code",
      "",
      `From: ${fromLabel}`,
      message ? `Message: ${message}` : null,
      `Duration: ${duration}`,
      `Code: ${pretty}`,
      "",
      `Redeem at: ${settingsUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      subject,
      text,
      html: renderMasterEmailLayout({
        siteUrl: input.siteUrl,
        locale: "en",
        eyebrow: "Gift",
        title: "Someone gifted you Pro",
        preheader: `Pro gift ${duration} — ${pretty}`,
        bodyHtml,
        cta: { label: "Activate on CylixStudio", href: settingsUrl },
      }),
    };
  }

  const subject = `هدية CylixStudio Pro لك (${duration})`;
  const bodyHtml = `
    <p style="margin:0 0 16px;">أرسل لك <strong style="color:#e4e4e7;">${escapeHtml(fromLabel)}</strong> اشتراك <strong style="color:#e4e4e7;">Pro</strong> لمدة <strong style="color:#e4e4e7;">${escapeHtml(duration)}</strong>.</p>
    ${messageBlock}
    <div style="margin:0 0 20px;padding:18px 16px;border-radius:12px;background:#0a0a0a;border:1px solid rgba(190,225,252,0.35);text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;color:#71717a;">رمز هدية التفعيل</p>
      <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;letter-spacing:0.16em;color:#bee1fc;font-weight:700;direction:ltr;">${escapeHtml(pretty)}</p>
    </div>
    <p style="margin:0 0 8px;font-weight:700;color:#e4e4e7;">التفعيل على cylixstudio.com</p>
    <ol style="margin:0;padding-inline-start:18px;">
      <li>سجّل الدخول (أو أنشئ حساباً)</li>
      <li>افتح <strong style="color:#d4d4d8;">الإعدادات ← الحساب والاشتراك</strong></li>
      <li>اختر <strong style="color:#d4d4d8;">إدخال رمز التفعيل</strong> والصق الرمز</li>
    </ol>
    <p style="margin:18px 0 0;font-size:12px;color:#71717a;">الرمز لمرة واحدة فقط. لا تنشره علناً.</p>
  `;
  const text = [
    "CylixStudio Pro — رمز هدية",
    "",
    `من: ${fromLabel}`,
    message ? `الرسالة: ${message}` : null,
    `المدة: ${duration}`,
    `الرمز: ${pretty}`,
    "",
    `التفعيل: ${settingsUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    text,
    html: renderMasterEmailLayout({
      siteUrl: input.siteUrl,
      locale: "ar",
      eyebrow: "هدية",
      title: "وصلك اشتراك Pro كهدية",
      preheader: `هدية Pro ${duration} — ${pretty}`,
      bodyHtml,
      cta: { label: "تفعيل على CylixStudio", href: settingsUrl },
    }),
  };
}

/** Confirmation after direct Pro activation (no code). */
export function buildDirectActivatedTemplate(input: DirectActivatedTemplateInput): BuiltEmail {
  const locale = input.locale ?? "ar";
  const duration = intervalLabel(input.interval, input.durationDays);
  const site = input.siteUrl.replace(/\/$/, "");
  const dashUrl = `${site}/dashboard`;
  const expires =
    input.expiresAt && !Number.isNaN(Date.parse(input.expiresAt))
      ? new Date(input.expiresAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")
      : null;

  if (locale === "en") {
    const subject = `CylixStudio Pro is active (${duration})`;
    const bodyHtml = `
      <p style="margin:0 0 12px;">Payment succeeded — <strong style="color:#e4e4e7;">Pro</strong> is now active on your account for <strong style="color:#e4e4e7;">${escapeHtml(duration)}</strong>.</p>
      ${expires ? `<p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;">Valid until <strong style="color:#e4e4e7;">${escapeHtml(expires)}</strong>.</p>` : ""}
      <p style="margin:0;">No activation code needed — jump into the studio whenever you’re ready.</p>
    `;
    return {
      subject,
      text: `CylixStudio Pro (${duration}) is active on your account.${expires ? ` Until ${expires}.` : ""} Open ${dashUrl}`,
      html: renderMasterEmailLayout({
        siteUrl: site,
        locale: "en",
        eyebrow: "Pro unlocked",
        title: "You’re on Pro",
        preheader: subject,
        bodyHtml,
        cta: { label: "Open dashboard", href: dashUrl },
      }),
    };
  }

  const subject = `تم تفعيل CylixStudio Pro (${duration})`;
  const bodyHtml = `
    <p style="margin:0 0 12px;">تم الدفع بنجاح — اشتراك <strong style="color:#e4e4e7;">Pro</strong> مفعّل الآن على حسابك لمدة <strong style="color:#e4e4e7;">${escapeHtml(duration)}</strong>.</p>
    ${expires ? `<p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;">صالح حتى <strong style="color:#e4e4e7;">${escapeHtml(expires)}</strong>.</p>` : ""}
    <p style="margin:0;">لا تحتاج رمزاً — ادخل الاستوديو مباشرة.</p>
  `;
  return {
    subject,
    text: `تم تفعيل CylixStudio Pro (${duration}) على حسابك.${expires ? ` حتى ${expires}.` : ""} ${dashUrl}`,
    html: renderMasterEmailLayout({
      siteUrl: site,
      locale: "ar",
      eyebrow: "تم التفعيل",
      title: "أنت الآن على Pro",
      preheader: subject,
      bodyHtml,
      cta: { label: "فتح لوحة التحكم", href: dashUrl },
    }),
  };
}

export type EmailTemplateId =
  | "pro_activation"
  | "welcome"
  | "invoice_notice"
  | "gift_activation"
  | "direct_activated";

export type EmailTemplatePayload =
  | { template: "pro_activation"; data: ProActivationTemplateInput }
  | { template: "welcome"; data: WelcomeTemplateInput }
  | { template: "invoice_notice"; data: InvoiceNoticeTemplateInput }
  | { template: "gift_activation"; data: GiftActivationTemplateInput }
  | { template: "direct_activated"; data: DirectActivatedTemplateInput }
  | { template: "custom"; data: { siteUrl: string; title: string; bodyHtml: string; subject: string; text: string; locale?: EmailLocale; cta?: { label: string; href: string } } };

export function buildEmailFromTemplate(payload: EmailTemplatePayload): BuiltEmail {
  switch (payload.template) {
    case "pro_activation":
      return buildProActivationTemplate(payload.data);
    case "welcome":
      return buildWelcomeTemplate(payload.data);
    case "invoice_notice":
      return buildInvoiceNoticeTemplate(payload.data);
    case "gift_activation":
      return buildGiftActivationTemplate(payload.data);
    case "direct_activated":
      return buildDirectActivatedTemplate(payload.data);
    case "custom": {
      const locale = payload.data.locale ?? "ar";
      return {
        subject: payload.data.subject,
        text: payload.data.text,
        html: renderMasterEmailLayout({
          siteUrl: payload.data.siteUrl,
          locale,
          title: payload.data.title,
          bodyHtml: payload.data.bodyHtml,
          ...(payload.data.cta ? { cta: payload.data.cta } : {}),
          preheader: payload.data.subject,
        }),
      };
    }
    default: {
      const _exhaustive: never = payload;
      return _exhaustive;
    }
  }
}
