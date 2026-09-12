import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, FlaskConical, Gem, Loader2, Star, UserPlus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fireTestEvent, sendTestChatMessage, type TestEventInput } from "@/lib/simulate.functions";
import { isTestMode } from "@/lib/testMode";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

export type InjectedFeedEvent = {
  id: string;
  platform: string;
  event_type: string;
  actor_name: string | null;
  amount: number | null;
  currency: string | null;
  quantity: number;
  seconds_added: number;
  message: string | null;
  created_at: string;
};

type Kind = "FOLLOW" | "DONATION" | "SUBSCRIPTION" | "BITS";

type Connection = { platform: string; is_active?: boolean | null };

const KINDS: {
  type: Kind;
  label: TranslationKey;
  icon: typeof UserPlus;
}[] = [
  { type: "FOLLOW", label: "activity.test.follower", icon: UserPlus },
  { type: "DONATION", label: "activity.test.donation", icon: DollarSign },
  { type: "SUBSCRIPTION", label: "activity.test.subscriber", icon: Star },
  { type: "BITS", label: "activity.test.bits", icon: Gem },
];

const CHAT_KEY: Record<Kind, TranslationKey> = {
  FOLLOW: "activity.chat.FOLLOW",
  DONATION: "activity.chat.DONATION",
  SUBSCRIPTION: "activity.chat.SUBSCRIPTION",
  BITS: "activity.chat.BITS",
};

function pickPlatform(eventType: Kind, connections: Connection[]): TestEventInput["platform"] {
  const active = new Set(
    connections.filter((item) => item.is_active !== false).map((item) => item.platform),
  );
  const first = (
    list: TestEventInput["platform"][],
    fallback: TestEventInput["platform"],
  ): TestEventInput["platform"] => list.find((platform) => active.has(platform)) ?? fallback;

  if (eventType === "BITS") return "TWITCH";
  if (eventType === "DONATION") {
    return first(["STREAMLABS", "STREAMELEMENTS", "YOUTUBE", "TIKTOK"], "MANUAL");
  }
  if (eventType === "SUBSCRIPTION") {
    return first(["TWITCH", "KICK", "YOUTUBE"], "TWITCH");
  }
  return first(["TWITCH", "KICK", "TIKTOK", "YOUTUBE", "X"], "TWITCH");
}

function buildLocalEvent(kind: Kind, platform: TestEventInput["platform"]): InjectedFeedEvent {
  const stamp = Math.floor(Math.random() * 900 + 100);
  const actors: Record<Kind, string> = {
    FOLLOW: `TestFan${stamp}`,
    DONATION: `TestDonor${stamp}`,
    SUBSCRIPTION: `TestSub${stamp}`,
    BITS: `TestCheer${stamp}`,
  };
  const amount = kind === "DONATION" ? 5 : kind === "BITS" ? 100 : null;
  const message =
    kind === "DONATION" ? "Keep it up!" : kind === "BITS" ? "Let's go!" : null;

  return {
    id: `local-${crypto.randomUUID()}`,
    platform,
    event_type: kind,
    actor_name: actors[kind],
    amount,
    currency: kind === "DONATION" ? "USD" : null,
    quantity: 1,
    seconds_added: 0,
    message,
    created_at: new Date().toISOString(),
  };
}

/**
 * Header control: pick a synthetic follow / tip / sub / bits event.
 * The row is injected locally immediately; authenticated sessions also run
 * the existing ingest + overlay chat test pipeline.
 */
export function TestEventMenu({
  connections,
  widgetId,
  onInject,
  onPersisted,
}: {
  connections: Connection[];
  widgetId?: string | null;
  onInject: (event: InjectedFeedEvent) => void;
  onPersisted?: (localId: string, realId: string) => void;
}) {
  const { t } = useLanguage();
  const fire = useServerFn(fireTestEvent);
  const testChat = useServerFn(sendTestChatMessage);
  const [pending, setPending] = useState(false);

  const pick = async (kind: Kind) => {
    if (pending) return;
    const platform = pickPlatform(kind, connections);
    const local = buildLocalEvent(kind, platform);
    onInject(local);
    if (isTestMode()) return;

    setPending(true);
    try {
      const response = (await fire({
        data: {
          platform,
          eventType: kind,
          amount: local.amount,
          actorName: local.actor_name,
          message: local.message,
        },
      })) as
        | { ok: true; result: { status: string; eventId?: string | null } }
        | { ok: false; error: string };

      if (response.ok && response.result.eventId) {
        onPersisted?.(local.id, response.result.eventId);
      }

      if (widgetId) {
        const author = local.actor_name ?? "TestViewer";
        void testChat({
          data: {
            widgetId,
            author,
            text: `${author} ${t(CHAT_KEY[kind])}`,
          },
        }).catch(() => {
          /* overlay chat is best-effort; the feed row already landed */
        });
      }
    } catch {
      /* local row stays — auth/subathon gaps should not hide the test */
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/15 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/25 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <FlaskConical className="size-4 text-primary" aria-hidden />
          )}
          {t("activity.testEvent")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {KINDS.map((kind) => {
          const Icon = kind.icon;
          return (
            <DropdownMenuItem
              key={kind.type}
              disabled={pending}
              className="gap-2.5 py-2.5 text-start"
              onSelect={() => void pick(kind.type)}
            >
              <Icon className="size-4 text-primary" aria-hidden />
              {t(kind.label)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
