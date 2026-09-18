import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Loader2 } from "lucide-react";

import { PlatformAsset } from "@/components/icons/platformAssets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fireTestEvent, sendTestChatMessage, type TestEventInput } from "@/lib/simulate.functions";
import {
  TEST_EVENT_GROUPS,
  TEST_EVENT_TAB_LABEL,
  type TestEventSpec,
} from "@/lib/testEvents";
import { isTestMode } from "@/lib/testMode";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
 * Platform tabs keep the panel short; only the active source’s events show.
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
  const [tab, setTab] = useState<TestEventInput["platform"]>(TEST_EVENT_GROUPS[0]!.platform);

  const activeGroup = useMemo(
    () => TEST_EVENT_GROUPS.find((group) => group.platform === tab) ?? TEST_EVENT_GROUPS[0]!,
    [tab],
  );

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
          className={cn(
            "group relative inline-flex min-h-11 items-center gap-2.5 overflow-hidden rounded-xl px-4 py-2.5",
            "text-sm font-semibold tracking-tight text-foreground",
            "border border-primary/40 shadow-[0_10px_28px_-16px_rgba(124,58,237,0.85)]",
            "transition-[transform,box-shadow,border-color,filter] duration-200 ease-out",
            "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_16px_36px_-14px_rgba(124,58,237,0.95)]",
            "active:translate-y-0 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 42%, #141414) 0%, color-mix(in oklab, var(--primary) 18%, #0c0c0c) 48%, color-mix(in oklab, var(--cyan) 12%, #101010) 100%)",
          }}
        >
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(120deg, transparent 20%, color-mix(in oklab, white 12%, transparent) 48%, transparent 78%)",
            }}
            aria-hidden
          />
          {pending ? (
            <Loader2 className="relative size-4 animate-spin text-primary-foreground/90" aria-hidden />
          ) : (
            <FlaskConical className="relative size-4 text-primary-glow" aria-hidden />
          )}
          <span className="relative">{t("activity.testEvent")}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(28rem,calc(100vw-1.25rem))] overflow-hidden rounded-2xl border-white/10 bg-[rgba(12,12,12,0.97)] p-0 shadow-2xl shadow-black/50"
      >
        <div className="border-b border-white/8 px-3 pb-2.5 pt-3">
          <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Platform
          </p>
          <div
            className={cn(
              "flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain pb-1",
              "scroll-smooth snap-x snap-mandatory",
              /* Beat the global scrollbar-hide rules so every platform stays reachable */
              "![scrollbar-width:thin] ![-ms-overflow-style:auto]",
              "[&::-webkit-scrollbar]:!block [&::-webkit-scrollbar]:h-1.5",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20",
              "[&::-webkit-scrollbar-track]:bg-transparent",
            )}
            role="tablist"
            aria-label="Test event platforms"
          >
            {TEST_EVENT_GROUPS.map((group) => {
              const selected = group.platform === activeGroup.platform;
              return (
                <button
                  key={group.platform}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => setTab(group.platform)}
                  className={cn(
                    "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-medium",
                    "whitespace-nowrap transition-[color,background-color,box-shadow,border-color] duration-200 ease-out",
                    selected
                      ? "bg-zinc-800 text-foreground shadow-sm ring-1 ring-white/10"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  <PlatformAsset name={group.icon} size={12} label="" />
                  <span>{TEST_EVENT_TAB_LABEL[group.platform]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={activeGroup.platform}
          role="tabpanel"
          className="animate-in fade-in-0 slide-in-from-top-1 p-3 duration-200"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <span
              className="size-1.5 rounded-full"
              style={{ background: activeGroup.color }}
              aria-hidden
            />
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t(activeGroup.headingKey)}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {activeGroup.events.map((event) => (
              <DropdownMenuItem
                key={`${activeGroup.platform}-${event.type}-${event.label}`}
                disabled={pending}
                className="cursor-pointer rounded-xl border border-transparent px-3 py-2.5 text-[0.82rem] focus:border-white/8 focus:bg-white/[0.06]"
                onSelect={() => void pick(activeGroup.platform, event)}
              >
                <span
                  className="me-2 size-1.5 shrink-0 rounded-full"
                  style={{ background: activeGroup.color }}
                />
                {event.label}
              </DropdownMenuItem>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
