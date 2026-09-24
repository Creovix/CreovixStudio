import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Ticket } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCode, normalizeCode } from "@/hooks/useSubscription";
import { useLanguage } from "@/lib/i18n";
import { markGatewayCompleted } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Feedback = { kind: "success" | "error"; message: string } | null;

type RedeemCodeSectionProps = {
  onActivated?: () => void;
  className?: string;
};

export function RedeemCodeSection({ onActivated, className }: RedeemCodeSectionProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const raw = normalizeCode(value);
  const valid = raw.length === 16;

  const activate = async () => {
    if (!valid) return;
    setPending(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.rpc("redeem_activation_code", { p_code: raw });
      if (error) throw error;
      const result = data as {
        ok: boolean;
        reason?: string;
        duration_days?: number;
        is_lifetime?: boolean;
        expires_at?: string;
      } | null;

      if (result?.ok) {
        const days = result.duration_days ?? 30;
        const until = result.expires_at ? new Date(result.expires_at).toLocaleDateString() : "";
        setFeedback({
          kind: "success",
          message: result.is_lifetime
            ? t("gateway.redeem.successLifetime")
            : t("gateway.redeem.successDays").replace("{days}", String(days)).replace("{until}", until),
        });
        markGatewayCompleted();
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        window.setTimeout(() => onActivated?.(), 1200);
        return;
      }

      setFeedback({
        kind: "error",
        message:
          result?.reason === "expired"
            ? t("gateway.redeem.expired")
            : t("gateway.redeem.invalid"),
      });
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : t("gateway.redeem.failed"),
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      id="redeem"
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-zinc-950/70 p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Ticket className="size-4" aria-hidden />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em]">
              {t("gateway.redeem.eyebrow")}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t("gateway.redeem.title")}
          </h2>
          <p className="max-w-md text-[0.88rem] leading-relaxed text-muted-foreground">
            {t("gateway.redeem.body")}
          </p>
        </div>

        <div className="w-full max-w-md shrink-0 space-y-3">
          <label className="sr-only" htmlFor="gateway-redeem-code">
            {t("gateway.redeem.label")}
          </label>
          <Input
            id="gateway-redeem-code"
            dir="ltr"
            value={formatCode(value)}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void activate();
            }}
            placeholder="XXXX - XXXX - XXXX - XXXX"
            aria-invalid={raw.length > 0 && !valid}
            className={cn(
              "h-12 border-white/10 bg-white/[0.03] text-center font-mono text-base tracking-[0.2em]",
              raw.length === 0
                ? "focus-visible:border-primary/50"
                : valid
                  ? "border-emerald-500/50"
                  : "border-amber-500/40",
            )}
          />
          <p className="text-center text-[0.7rem] text-muted-foreground">{raw.length}/16</p>

          {feedback ? (
            <div
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[0.8rem]",
                feedback.kind === "success"
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/35 bg-red-500/10 text-red-400",
              )}
            >
              {feedback.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span>{feedback.message}</span>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={!valid || pending}
            onClick={() => void activate()}
            className="h-11 w-full text-sm font-semibold"
          >
            {pending ? t("gateway.redeem.activating") : t("gateway.redeem.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
