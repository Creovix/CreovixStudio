import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Loader2 } from "lucide-react";

import { PlatformAsset } from "@/components/icons/platformAssets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fireTestEvent, sendTestChatMessage, type TestEventInput } from "@/lib/simulate.functions";
import { TEST_EVENT_GROUPS, type TestEventSpec } from "@/lib/testEvents";
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

type Connection = { platform: string; is_active?: boolean | null };

const CHAT_KEY: Record<TestEventInput["eventType"], TranslationKey> = {
  FOLLOW: "activity.chat.FOLLOW",
  DONATION: "activity.chat.DONATION",
  SUBSCRIPTION: "activity.chat.SUBSCRIPTION",
  BITS: "activity.chat.BITS",
  GIFT_SUB: "activity.chat.GIFT_SUB",
  RAID: "activity.chat.RAID",
  LIKE: "activity.chat.LIKE",
};

function actorFor(type: TestEventInput["eventType"]): string {
  const stamp = Math.floor(Math.random() * 900 + 100);
  if (type === "DONATION") return `TestDonor${stamp}`;
  if (type === "SUBSCRIPTION") return `TestSub${stamp}`;
  if (type === "GIFT_SUB") return `TestGifter${stamp}`;
  if (type === "BITS") return `TestCheer${stamp}`;
  if (type === "RAID") return `TestRaider${stamp}`;
  if (type === "LIKE") return `TestFan${stamp}`;
  return `TestFan${stamp}`;
}

function buildLocalEvent(
  platform: TestEventInput["platform"],
  spec: TestEventSpec,
): InjectedFeedEvent {
  const amount =
    spec.amount ??
    (spec.type === "DONATION" ? 5 : spec.type === "BITS" ? 100 : null);
  const quantity = Math.max(1, Math.round(spec.quantity ?? 1));

  return {
    id: `local-${crypto.randomUUID()}`,
    platform,
    event_type: spec.type,
    actor_name: actorFor(spec.type),
    amount,
    currency: spec.type === "DONATION" ? "USD" : null,
    quantity,
    seconds_added: 0,
    message: spec.message ?? null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Header control: fire a synthetic event for any ingest source.
 * The row is injected locally immediately; authenticated sessions also run
 * the existing ingest + overlay chat test pipeline.
 */
export function TestEventMenu({
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

  const pick = async (platform: TestEventInput["platform"], spec: TestEventSpec) => {
    if (pending) return;
    const local = buildLocalEvent(platform, spec);
    onInject(local);
    if (isTestMode()) return;

    setPending(true);
    try {
      const response = (await fire({
        data: {
          platform,
          eventType: spec.type,
          amount: local.amount,
          actorName: local.actor_name,
          message: local.message,
          quantity: local.quantity,
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
            text: `${author} ${t(CHAT_KEY[spec.type])}`,
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
      <DropdownMenuContent align="end" className="min-w-60 p-1.5">
        {TEST_EVENT_GROUPS.map((group, index) => (
          <DropdownMenuGroup key={group.platform}>
            {index > 0 ? <DropdownMenuSeparator className="bg-white/8" /> : null}
            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <PlatformAsset name={group.icon} size={12} label="" />
              {t(group.headingKey)}
            </DropdownMenuLabel>
            {group.events.map((event) => (
              <DropdownMenuItem
                key={`${group.platform}-${event.type}-${event.label}`}
                disabled={pending}
                className="gap-2 py-1.5 text-start text-[0.82rem]"
                onSelect={() => void pick(group.platform, event)}
              >
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: group.color }} />
                {event.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
