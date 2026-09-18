import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Lightweight CSS-3D "spatial" scene: layered translucent rings, glass panes
 * and floating capsules that react to pointer parallax. No WebGL, no assets —
 * cheap enough to keep a live OBS dashboard smooth.
 */
export function SpatialScene({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: px * 10, y: py * -8 });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{ perspective: "1200px" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 30% 20%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%), radial-gradient(50% 60% at 78% 78%, color-mix(in oklab, var(--cyan) 12%, transparent), transparent 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="spatial-float absolute start-[8%] top-[14%] size-40 rounded-full border border-primary/30"
          style={{
            transform: "translateZ(60px)",
            background:
              "conic-gradient(from 210deg, color-mix(in oklab, var(--primary) 30%, transparent), transparent 55%, color-mix(in oklab, var(--cyan) 24%, transparent))",
            filter: "blur(0.3px)",
            maskImage: "radial-gradient(circle, transparent 58%, #000 60%)",
          }}
        />
        <div
          className="spatial-float absolute end-[12%] top-[22%] h-28 w-44 rounded-2xl border border-white/10"
          style={{
            animationDelay: "1.4s",
            transform: "translateZ(90px) rotate(-8deg)",
            background:
              "linear-gradient(140deg, color-mix(in oklab, var(--elevated) 90%, transparent), color-mix(in oklab, var(--background) 70%, transparent))",
            boxShadow: "0 30px 60px -40px #000",
            backdropFilter: "blur(8px)",
          }}
        />
        <div
          className="spatial-float absolute bottom-[16%] start-[26%] h-14 w-36 rounded-full border border-cyan/25"
          style={{
            animationDelay: "2.6s",
            transform: "translateZ(40px)",
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--cyan) 22%, transparent), transparent)",
          }}
        />
        <div
          className="spatial-spin absolute bottom-[10%] end-[22%] size-24 rounded-full border border-white/10"
          style={{ transform: "translateZ(20px)" }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
