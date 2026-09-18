import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, MessageSquare, Radio, Zap } from "lucide-react";

import { sendTestChatMessage, simulateStreamEvent } from "@/lib/simulate.functions";
import { syncTwitchEventSub } from "@/lib/eventsub.functions";
import type { WidgetType } from "@/lib/widgets";

/**
 * Lets a creator fire real payloads through the production pipeline so they
 * can confirm the OBS browser source reacts instantly — no real viewers,
 * no waiting for a live stream.
 */
export function TestSimulatePanel({
  widgetId,
  type,
  lang,
}: {
  widgetId: string;
  type: WidgetType;
  lang: "ar" | "en";
}) {
  const simulate = useServerFn(simulateStreamEvent);
  const testChat = useServerFn(sendTestChatMessage);
  const syncEvents = useServerFn(syncTwitchEventSub);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  const isChat = type === "CHAT_BOX";

  const run = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const result = (await action()) as { ok?: boolean; error?: string };
      if (result && result.ok === false) {
        setMessage(
          result.error === "no_subathon"
            ? "Create a subathon first so rules can apply."
            : `⚠️ ${result.error}`,
        );
      } else {
        setMessage(success);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const buttonClass =
    "flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-semibold transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50";
  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <FlaskConical className="size-4 text-primary" aria-hidden />
        {"🧪 Test & Simulate"}
      </p>

      {isChat ? (
        <div className="space-y-2">
          <input
            type="text"
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
            placeholder={"Type a test message…"}
            className={inputClass}
            dir="auto"
            onKeyDown={(event) => {
              if (event.key === "Enter" && customText.trim()) {
                void run(
                  "chat",
                  () =>
                    testChat({
                      data: { widgetId, text: customText.trim() },
                    }),
                  "Message sent ✅",
                );
                setCustomText("");
              }
            }}
          />
          <button
            type="button"
            disabled={busy !== null || !customText.trim()}
            className={buttonClass}
            onClick={() => {
              void run(
                "chat",
                () =>
                  testChat({
                    data: { widgetId, text: customText.trim() },
                  }),
                "Message sent ✅",
              );
              setCustomText("");
            }}
          >
            <MessageSquare className="size-4" aria-hidden />
            {busy === "chat"
              ? "…"
              : "Send Test Chat Message"}
          </button>
        </div>
      ) : type === "TIKTOK_TAPPERS" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {["hala_live", "mvp_gamer", "noorx"].map((tapper) => (
            <button
              key={tapper}
              type="button"
              disabled={busy !== null}
              className={buttonClass}
              onClick={() =>
                void run(
                  tapper,
                  () =>
                    simulate({
                      data: {
                        widgetId,
                        platform: "TIKTOK",
                        eventType: "LIKE",
                        actorName: tapper,
                        quantity: 25 + Math.floor(Math.random() * 120),
                      },
                    }),
                  "Taps sent ✅",
                )
              }
            >
              <Zap className="size-4" aria-hidden />
              {busy === tapper ? "…" : `Send taps as ${tapper}`}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy !== null}
            className={buttonClass}
            onClick={() =>
              void run(
                "twitch",
                () =>
                  simulate({
                    data: { widgetId, platform: "TWITCH", eventType: "FOLLOW" },
                  }),
                "Twitch follow sent ✅",
              )
            }
          >
            <Zap className="size-4" aria-hidden />
            {busy === "twitch"
              ? "…"
              : "Simulate Twitch Follow"}
          </button>

          <button
            type="button"
            disabled={busy !== null}
            className={buttonClass}
            onClick={() =>
              void run(
                "kick",
                () =>
                  simulate({
                    data: { widgetId, platform: "KICK", eventType: "SUBSCRIPTION" },
                  }),
                "Kick sub sent ✅",
              )
            }
          >
            <Zap className="size-4" aria-hidden />
            {busy === "kick" ? "…" : "Simulate Kick Sub"}
          </button>

          <button
            type="button"
            disabled={busy !== null}
            className={buttonClass}
            onClick={() =>
              void run(
                "chat",
                () => testChat({ data: { widgetId } }),
                "Test chat message sent ✅",
              )
            }
          >
            <MessageSquare className="size-4" aria-hidden />
            {busy === "chat" ? "…" : "Send Test Chat Message"}
          </button>

          <button
            type="button"
            disabled={busy !== null}
            className={buttonClass}
            onClick={() =>
              void run(
                "eventsub",
                () => syncEvents({}),
                "Twitch live events enabled ✅",
              )
            }
          >
            <Radio className="size-4" aria-hidden />
            {busy === "eventsub"
              ? "…"
              : "Enable Twitch live events"}
          </button>
        </div>
      )}

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <p className="text-[11px] text-muted-foreground">
        {"Every button runs the real ingest pipeline and broadcasts instantly to OBS."}
      </p>
    </div>
  );
}
