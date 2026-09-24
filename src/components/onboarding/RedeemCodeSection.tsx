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
        "rounded-xl border border-white/[0.07] bg-zinc-950/80 px-3 py-2.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:max-w-[11.5rem]">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Ticket className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[0.78rem] font-semibold tracking-tight">{t("gateway.redeem.title")}</p>
            <p className="truncate text-[0.68rem] text-muted-foreground">{t("gateway.redeem.hint")}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
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
              "h-9 flex-1 border-white/10 bg-white/[0.03] text-center font-mono text-sm tracking-[0.16em]",
              raw.length === 0
                ? "focus-visible:border-primary/50"
                : valid
                  ? "border-emerald-500/50"
                  : "border-amber-500/40",
            )}
          />
          <Button
            type="button"
            size="sm"
            disabled={!valid || pending}
            onClick={() => void activate()}
            className="h-9 shrink-0 px-4 text-[0.78rem] font-semibold sm:min-w-[7.5rem]"
          >
            {pending ? t("gateway.redeem.activating") : t("gateway.redeem.cta")}
          </Button>
        </div>
      </div>

      {feedback ? (
        <div
          role="status"
          className={cn(
            "mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.72rem]",
            feedback.kind === "success"
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/35 bg-red-500/10 text-red-400",
          )}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          )}
          <span className="truncate">{feedback.message}</span>
        </div>
      ) : null}
    </section>
  );
}
