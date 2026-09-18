import { useEffect, useRef, useState } from "react";

import { computeRemaining, type TimerFrame } from "@/lib/timer";

export type StreamStatus = "connecting" | "live" | "error";

/**
 * Subscribes to the overlay SSE stream and re-derives the countdown locally
 * against the last server frame, so rendering stays smooth between pushes.
 * Reconnects with backoff so an OBS browser source left running overnight
 * recovers from deploys, sleeps and dropped connections on its own.
 */
export function useTimerStream(publicToken: string | null) {
  const [frame, setFrame] = useState<TimerFrame | null>(null);
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [remaining, setRemaining] = useState(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!publicToken) return;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let cancelled = false;

    const onFrame = (next: TimerFrame) => {
      attempts = 0;
      offsetRef.current = next.serverTime - Date.now();
      setFrame(next);
      setRemaining(next.remainingSeconds);
      setStatus("live");
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(`/api/public/overlay/${publicToken}/stream`);

      source.addEventListener("init", (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as { frame: TimerFrame | null };
        if (payload.frame) onFrame(payload.frame);
        else setStatus("live");
      });
      source.addEventListener("state", (event) => {
        onFrame(JSON.parse((event as MessageEvent).data) as TimerFrame);
      });
      source.onerror = () => {
        setStatus("error");
        source?.close();
        source = null;
        if (cancelled) return;
        attempts += 1;
        const delay = Math.min(15_000, 1000 * 2 ** Math.min(attempts, 4));
        retry = setTimeout(() => {
          setStatus("connecting");
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      source?.close();
    };
  }, [publicToken]);

  useEffect(() => {
    if (!frame) return;
    const id = setInterval(() => {
      setRemaining(computeRemaining(frame, Date.now() + offsetRef.current));
    }, 250);
    return () => clearInterval(id);
  }, [frame]);

  return { frame, remaining, status };
}
