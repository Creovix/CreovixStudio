import { useEffect, useState } from "react";

import { LinkInBioText } from "@/components/link-in-bio/LinkInBioText";
import type { GalleryImage } from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

export function LinkInBioGallery({
  images,
  title,
  className,
}: {
  images: GalleryImage[];
  title?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduce || images.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [images.length, reduce]);

  if (images.length === 0) {
    return (
      <div className={cn("grid h-full place-items-center text-sm", className)} style={{ color: "var(--bio-muted)" }}>
        Empty gallery
      </div>
    );
  }

  return (
    <div className={cn("relative h-full min-h-28 overflow-hidden", className)}>
      {images.map((image, imageIndex) => (
        <img
          key={image.id}
          src={image.url}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{
            opacity: imageIndex === index ? 1 : 0,
            transition: reduce ? "none" : "opacity 700ms ease",
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8">
        {title ? (
          <LinkInBioText className="text-sm font-semibold text-white">{title}</LinkInBioText>
        ) : null}
        {images.length > 1 ? (
          <div className="mt-1.5 flex gap-1">
            {images.map((image, imageIndex) => (
              <span
                key={image.id}
                className="h-1 flex-1 rounded-full"
                style={{ background: imageIndex === index ? "white" : "rgba(255,255,255,0.35)" }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
