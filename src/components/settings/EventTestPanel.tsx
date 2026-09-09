import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";

import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { fireTestEvent, type TestEventInput } from "@/lib/simulate.functions";

type Group = {
  platform: TestEventInput["platform"];
  label: string;
  color: string;
  events: { type: TestEventInput["eventType"]; label: string; amount?: number }[];
};

/**
 * Only the events each source is actually allowed to report — the same
 * routing the live ingest pipeline enforces.
 */
const GROUPS: Group[] = [
  {
    platform: "KICK",
    label: "Kick",
    color: "#53FC18",
    events: [
      { type: "FOLLOW", label: "Follow" },
      { type: "SUBSCRIPTION", label: "Sub" },
      { type: "GIFT_SUB", label: "Gift Sub" },
      { type: "RAID", label: "Raid" },
    ],
  },
  {
    platform: "TWITCH",
    label: "Twitch",
    color: "#9F77F7",
    events: [
      { type: "FOLLOW", label: "Follow" },
      { type: "SUBSCRIPTION", label: "Sub" },
      { type: "GIFT_SUB", label: "Gift Sub" },
      { type: "BITS", label: "100 Bits", amount: 100 },
      { type: "RAID", label: "Raid" },
    ],
  },
  {
    platform: "YOUTUBE",
    label: "YouTube",
    color: "#FF4444",
    events: [
      { type: "FOLLOW", label: "Subscribe" },
      { type: "SUBSCRIPTION", label: "Membership" },
      { type: "DONATION", label: "Super Chat $5", amount: 5 },
    ],
  },
  {
    platform: "TIKTOK",
    label: "TikTok",
    color: "#2DCCD3",
    events: [
      { type: "FOLLOW", label: "Follow" },
      { type: "DONATION", label: "Gift $2", amount: 2 },
    ],
  },
  {
    platform: "X",
    label: "X (Twitter)",
    color: "#E7E9EA",
    events: [{ type: "FOLLOW", label: "Follower" }],
  },
  {
    platform: "STREAMLABS",
    label: "Streamlabs",
    color: "#80F5D2",
    events: [{ type: "DONATION", label: "Donation $10", amount: 10 }],
  },
  {
    platform: "STREAMELEMENTS",
    label: "StreamElements",
    color: "#4FC3F7",
    events: [{ type: "DONATION", label: "Tip $5", amount: 5 }],
  },
];

/** Developer harness for firing one simulated event per platform. */
export function EventTestPanel() {
  const run = useServerFn(fireTestEvent);
  const [name, setName] = useState("");
  const [log, setLog] = useState<{ text: string; ok: boolean }[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: TestEventInput) =>
      (await run({ data: input })) as
        | { ok: true; result: { status: string; secondsAdded?: number } }
        | { ok: false; error: string },
  });

  const fire = async (group: Group, event: Group["events"][number]) => {
    const id = `${group.platform}-${event.type}`;
    setPending(id);
    try {
      const response = await mutation.mutateAsync({
        platform: group.platform,
        eventType: event.type,
        amount: event.amount ?? null,
        actorName: name || null,
      });
      const text = response.ok
        ? `${group.label} · ${event.label} → ${response.result.status}${
            response.result.secondsAdded ? ` (+${response.result.secondsAdded}s)` : ""
          }`
        : `${group.label} · ${event.label} → ${response.error}`;
      setLog((prev) => [{ text, ok: response.ok }, ...prev].slice(0, 12));
    } catch (error) {
      setLog((prev) =>
        [
          { text: `${group.label} · ${event.label} → ${(error as Error).message}`, ok: false },
          ...prev,
        ].slice(0, 12),
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="glass-3d space-y-5 rounded-2xl p-6">
      <div>
        <p className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
          Test events
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
          <Zap className="size-4 text-primary" aria-hidden /> Simulate platform events
        </h2>
        <p className="mt-1 text-[0.8rem] text-muted-foreground">
          Each button sends one real event through the live pipeline, so your widgets and the
          Activity Feed update exactly as they would for a real viewer.
        </p>
      </div>

      <label className="block max-w-xs text-sm">
        <span className="text-[0.8rem] text-muted-foreground">Sender name (optional)</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="TestViewer"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <div
            key={group.platform}
            className="rounded-xl border border-[oklch(1_0_0/0.08)] bg-background/40 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: group.color }}>
              <PlatformIcon platform={group.platform} size={14} />
              {group.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.events.map((event) => {
                const id = `${group.platform}-${event.type}`;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void fire(group, event)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {pending === id ? "Sending…" : event.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {log.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {log.map((entry, index) => (
            <li
              key={`${entry.text}-${index}`}
              className={entry.ok ? "text-emerald-300" : "text-destructive"}
            >
              {entry.text}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
