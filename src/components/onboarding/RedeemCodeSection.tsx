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
<<<<<<< HEAD
  /** Tighter spacing for the single-viewport welcome gateway. */
  compact?: boolean;
};

export function RedeemCodeSection({ onActivated, className, compact }: RedeemCodeSectionProps) {
=======
};

export function RedeemCodeSection({ onActivated, className }: RedeemCodeSectionProps) {
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
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
<<<<<<< HEAD
        "rounded-2xl border border-zinc-800 bg-zinc-950/90",
        compact ? "rounded-xl p-3.5 sm:p-4" : "p-6 sm:p-7",
        className,
      )}
    >
      <div className={cn("flex items-center", compact ? "gap-2.5" : "gap-3")}>
        <span
          className={cn(
            "grid shrink-0 place-items-center border border-primary/30 bg-primary/10 text-primary",
            compact ? "size-8 rounded-lg" : "size-10 rounded-xl",
          )}
        >
          <Ticket className={compact ? "size-3.5" : "size-4"} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            className={cn(
              "font-semibold tracking-tight text-zinc-50",
              compact ? "text-[0.95rem]" : "text-lg",
            )}
          >
            {t("gateway.redeem.title")}
          </h2>
          <p className={cn("text-zinc-400", compact ? "mt-0 text-[0.72rem] line-clamp-1" : "mt-0.5 text-[0.82rem]")}>
            {t("gateway.redeem.body")}
          </p>
        </div>
      </div>

      <div className={cn("flex flex-col sm:flex-row sm:items-stretch", compact ? "mt-3 gap-2" : "mt-5 gap-3")}>
=======
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
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
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
<<<<<<< HEAD
            "flex-1 border-zinc-700 bg-zinc-900/60 text-center font-mono tracking-[0.18em]",
            compact ? "h-9 text-[0.82rem]" : "h-11 text-[0.95rem]",
=======
            "h-11 flex-1 border-zinc-700 bg-zinc-900/60 text-center font-mono text-[0.95rem] tracking-[0.18em]",
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
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
<<<<<<< HEAD
          className={cn(
            "shrink-0 font-semibold sm:min-w-[9rem]",
            compact ? "h-9 px-4 text-[0.82rem]" : "h-11 px-6 text-sm",
          )}
=======
          className="h-11 shrink-0 px-6 text-sm font-semibold sm:min-w-[9rem]"
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
        >
          {pending ? t("gateway.redeem.activating") : t("gateway.redeem.cta")}
        </Button>
      </div>

      {feedback ? (
        <div
          role="status"
          className={cn(
<<<<<<< HEAD
            "flex items-start gap-2 rounded-xl border text-[0.8rem]",
            compact ? "mt-2 px-3 py-2 text-[0.72rem]" : "mt-4 px-3.5 py-2.5",
=======
            "mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[0.8rem]",
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
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
