import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CheckoutPayloadSchema = z.object({
  email: z.string().email(),
  user_id: z.string().uuid().optional().nullable(),
  interval: z.enum(["monthly", "six_months", "yearly", "lifetime", "custom"]),
  duration_days: z.number().int().min(1).max(36500).optional(),
  amount_cents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().min(3).max(8).optional(),
  provider: z.string().min(2).max(64).default("checkout"),
  payment_id: z.string().min(4).max(191),
  phone: z.string().min(6).max(32).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Payment provider webhook: successful Pro checkout → generate activation code
 * + email it. Does NOT activate Pro; user redeems in Settings.
 *
 * Auth: Authorization: Bearer <PRO_CHECKOUT_WEBHOOK_SECRET>
 *   or header x-checkout-secret / x-pro-checkout-secret
 */
export const Route = createFileRoute("/api/public/webhooks/pro-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { fulfillProPurchase } = await import("@/lib/proPurchase.server");
        const { publicSiteUrl } = await import("@/lib/siteUrl.server");
        const { safeEqual } = await import("@/lib/webhooks/verify.server");

        const expected = (
          process.env["PRO_CHECKOUT_WEBHOOK_SECRET"] ??
          process.env["CHECKOUT_WEBHOOK_SECRET"] ??
          ""
        ).trim();
        if (!expected || expected.length < 16) {
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }

        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
        const headerSecret =
          request.headers.get("x-pro-checkout-secret") ??
          request.headers.get("x-checkout-secret") ??
          "";
        const provided = (bearer || headerSecret).trim();
        if (!provided || !safeEqual(provided, expected)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const parsed = CheckoutPayloadSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { error: "invalid_payload", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const body = parsed.data;
        const { supabaseAdmin } = await import("@/lib/supabase/client.server");

        const result = await fulfillProPurchase(supabaseAdmin, {
          email: body.email,
          userId: body.user_id,
          interval: body.interval,
          durationDays: body.duration_days,
          amountCents: body.amount_cents,
          currency: body.currency,
          provider: body.provider,
          providerPaymentId: body.payment_id,
          phone: body.phone,
          siteUrl: publicSiteUrl(request),
          metadata: body.metadata,
        });

        if (!result.ok) {
          return Response.json({ error: result.error }, { status: 500 });
        }

        // Never echo the raw code in webhook responses in production logs to
        // payment providers — include it only when explicitly debugging.
        const exposeCode = process.env["NODE_ENV"] !== "production";

        return Response.json({
          ok: true,
          purchase_id: result.purchaseId,
          duration_days: result.durationDays,
          email_delivered: result.email.delivered,
          sms_delivered: result.sms.delivered,
          idempotent: result.idempotent,
          activation: "pending_manual_redeem",
          ...(exposeCode ? { code: result.code } : {}),
        });
      },
    },
  },
});
