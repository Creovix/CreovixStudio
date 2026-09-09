import { useEffect, useRef } from "react";

/**
 * Plays clips captured from Kick. Clips stored by us are raw MPEG-TS segments,
 * which browsers cannot decode natively, so those are remuxed with mpegts.js.
 */
export function ClipPlayer({ src, poster }: { src: string; poster?: string | undefined }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isTs = /\.ts(\?|$)/i.test(src);

  useEffect(() => {
    if (!isTs) return;
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;
    let player: { destroy: () => void } | null = null;

    void (async () => {
      const mpegts = (await import("mpegts.js")).default;
      if (destroyed || !mpegts.isSupported()) return;
      const instance = mpegts.createPlayer({ type: "mpegts", isLive: false, url: src });
      player = instance;
      instance.attachMediaElement(video);
      instance.load();
      void Promise.resolve(instance.play()).catch(() => undefined);
    })();

    return () => {
      destroyed = true;
      player?.destroy();
    };
  }, [src, isTs]);

  return (
    <video
      ref={videoRef}
      {...(isTs ? {} : { src })}
      poster={poster}
      controls
      autoPlay
      playsInline
      className="size-full"
    />
  );
}
