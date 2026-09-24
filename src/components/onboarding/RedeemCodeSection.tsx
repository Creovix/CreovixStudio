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
            : t("gateway.redeem.successDays")
                .replace("{days}", String(days))
                .replace("{until}", until),
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
        "rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 sm:p-7",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Ticket className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
            {t("gateway.redeem.title")}
          </h2>
          <p className="mt-0.5 text-[0.82rem] text-zinc-400">{t("gateway.redeem.body")}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
            "h-11 flex-1 border-zinc-700 bg-zinc-900/60 text-center font-mono text-[0.95rem] tracking-[0.18em]",
            raw.length === 0
              ? "focus-visible:border-primary/50"
              : valid
                ? "border-emerald-500/55"
                : "border-amber-500/45",
          )}
        />
        <Button
          type="button"
          disabled={!valid || pending}
          onClick={() => void activate()}
          className="h-11 shrink-0 px-6 text-sm font-semibold sm:min-w-[9rem]"
        >
          {pending ? t("gateway.redeem.activating") : t("gateway.redeem.cta")}
        </Button>
      </div>

      {feedback ? (
        <div
          role="status"
          className={cn(
            "mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[0.8rem]",
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
    </section>
  );
}
