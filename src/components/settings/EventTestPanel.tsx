import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";

import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { fireTestEvent, type TestEventInput } from "@/lib/simulate.functions";
import { useLanguage } from "@/lib/i18n";

type Group = {
  platform: TestEventInput["platform"];
  label: string;
  color: string;
  events: { type: TestEventInput["eventType"]; labelEn: string; labelAr: string; amount?: number }[];
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
      { type: "FOLLOW", labelEn: "Follow", labelAr: "متابعة" },
      { type: "SUBSCRIPTION", labelEn: "Sub", labelAr: "اشتراك" },
      { type: "GIFT_SUB", labelEn: "Gift Sub", labelAr: "هدية اشتراك" },
      { type: "RAID", labelEn: "Raid", labelAr: "غارة" },
    ],
  },
  {
    platform: "TWITCH",
    label: "Twitch",
    color: "#9F77F7",
    events: [
      { type: "FOLLOW", labelEn: "Follow", labelAr: "متابعة" },
      { type: "SUBSCRIPTION", labelEn: "Sub", labelAr: "اشتراك" },
      { type: "GIFT_SUB", labelEn: "Gift Sub", labelAr: "هدية اشتراك" },
      { type: "BITS", labelEn: "100 Bits", labelAr: "100 بت", amount: 100 },
      { type: "RAID", labelEn: "Raid", labelAr: "غارة" },
    ],
  },
  {
    platform: "YOUTUBE",
    label: "YouTube",
    color: "#FF4444",
    events: [
      { type: "FOLLOW", labelEn: "Subscribe", labelAr: "اشتراك قناة" },
      { type: "SUBSCRIPTION", labelEn: "Membership", labelAr: "عضوية" },
      { type: "DONATION", labelEn: "Super Chat $5", labelAr: "سوبر شات $5", amount: 5 },
    ],
  },
  {
    platform: "TIKTOK",
    label: "TikTok",
    color: "#2DCCD3",
    events: [
      { type: "FOLLOW", labelEn: "Follow", labelAr: "متابعة" },
      { type: "DONATION", labelEn: "Gift $2", labelAr: "هدية $2", amount: 2 },
    ],
  },
  {
    platform: "X",
    label: "X (Twitter)",
    color: "#E7E9EA",
    events: [{ type: "FOLLOW", labelEn: "Follower", labelAr: "متابع" }],
  },
  {
    platform: "STREAMLABS",
    label: "Streamlabs",
    color: "#80F5D2",
    events: [{ type: "DONATION", labelEn: "Donation $10", labelAr: "تبرع $10", amount: 10 }],
  },
  {
    platform: "STREAMELEMENTS",
    label: "StreamElements",
    color: "#4FC3F7",
    events: [{ type: "DONATION", labelEn: "Tip $5", labelAr: "إكرامية $5", amount: 5 }],
  },
];

/** Developer harness for firing one simulated event per platform. */
export function EventTestPanel() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
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
    const label = ar ? event.labelAr : event.labelEn;
    setPending(id);
    try {
      const response = await mutation.mutateAsync({
        platform: group.platform,
        eventType: event.type,
        amount: event.amount ?? null,
        actorName: name || null,
      });
      const text = response.ok
        ? `${group.label} · ${label} → ${response.result.status}${
            response.result.secondsAdded ? ` (+${response.result.secondsAdded}s)` : ""
          }`
        : `${group.label} · ${label} → ${response.error}`;
      setLog((prev) => [{ text, ok: response.ok }, ...prev].slice(0, 12));
    } catch (error) {
      setLog((prev) =>
        [
          { text: `${group.label} · ${label} → ${(error as Error).message}`, ok: false },
          ...prev,
        ].slice(0, 12),
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <section>
      <p className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
        {t("settings.test.title")}
      </p>
      <h2 className="mt-1 flex items-center gap-2 text-[0.95rem] font-semibold">
        <Zap className="size-4 text-primary" aria-hidden />
        {t("settings.test.heading")}
      </h2>
      <p className="mt-1 max-w-2xl text-[0.78rem] text-muted-foreground">{t("settings.test.body")}</p>

      <label className="mt-6 block max-w-xs text-sm">
        <span className="text-[0.8rem] text-muted-foreground">{t("settings.test.sender")}</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="TestViewer"
          className="mt-1 w-full rounded-lg border border-white/5 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <div className="mt-6 divide-y divide-white/5 border-y border-white/5">
        {GROUPS.map((group) => (
          <div
            key={group.platform}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: group.color }}>
              <PlatformIcon platform={group.platform} size={14} />
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.events.map((event) => {
                const id = `${group.platform}-${event.type}`;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void fire(group, event)}
                    className="rounded-full border border-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {pending === id
                      ? t("settings.test.sending")
                      : ar
                        ? event.labelAr
                        : event.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {log.length > 0 ? (
        <ul className="mt-6 space-y-1 text-xs">
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
