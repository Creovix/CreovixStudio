import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const SEAL_SCRIPT_SRC =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js";
const SEAL_API_BASE =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi";
/** Official SBC token (متجر موثق) — must match Dashboard registration. */
const SEAL_TOKEN = "NzNyMEZtczVDeE04SzI4WHN4bmpodz09";

function removeOrphanFloatingFrames() {
  // seal.js with data-position pins iframes on document.body — strip leftovers.
  document.querySelectorAll("body > iframe.sbc-seal-frame").forEach((node) => node.remove());
}

/**
 * Always mount inline inside the host container (never fixed/absolute on body).
 * Omitting data-position is what seal.js needs for non-floating placement;
 * we still mount ourselves for SPA reliability.
 */
function mountSealInline(container: HTMLElement) {
  removeOrphanFloatingFrames();

  if (container.querySelector("iframe.sbc-seal-frame")) return;

  if (container.getAttribute("data-sbc-mounted") === "1") {
    container.removeAttribute("data-sbc-mounted");
  }

  const token = container.getAttribute("data-token");
  if (!token) return;

  container.setAttribute("data-sbc-mounted", "1");

  const lang = (document.documentElement.getAttribute("lang") || "ar").substring(0, 2);
  const frame = document.createElement("iframe");
  frame.className = "sbc-seal-frame";
  // pos=inline is ignored by their page but avoids "bottom/top" floating semantics
  frame.src = `${SEAL_API_BASE}/seal?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}&pos=inline`;
  frame.title = "SBC Verification";
  frame.setAttribute("loading", "eager");
  frame.setAttribute("scrolling", "no");
  frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
  frame.style.border = "0";
  frame.style.width = "120px";
  frame.style.height = "44px";
  frame.style.maxWidth = "100%";
  frame.style.background = "transparent";
  frame.style.position = "relative";
  frame.style.display = "block";
  frame.style.transition = "width .18s ease,height .18s ease";

  container.appendChild(frame);
}

function ensureSealScript(onReady: () => void) {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SEAL_SCRIPT_SRC}"]`,
  );
  if (existing) {
    onReady();
    return;
  }

  const script = document.createElement("script");
  script.src = SEAL_SCRIPT_SRC;
  script.async = true;
  script.onload = () => onReady();
  script.onerror = () => onReady();
  document.body.appendChild(script);
}

type SaudiBusinessSealProps = {
  className?: string;
};

/**
 * المركز السعودي للأعمال — شارة متجر موثق.
 * Inline footer placement (no data-position → seal.js will not pin a corner).
 */
export function SaudiBusinessSeal({ className }: SaudiBusinessSealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Never allow corner floating — strip attribute if anything re-adds it.
    container.removeAttribute("data-position");

    const tryMount = () => {
      window.setTimeout(() => {
        removeOrphanFloatingFrames();
        // If seal.js appended a fixed body frame, drop it and remount inline.
        const floating = document.querySelector("body > iframe.sbc-seal-frame");
        if (floating) floating.remove();
        if (!container.querySelector("iframe.sbc-seal-frame")) {
          mountSealInline(container);
        }
      }, 80);
    };

    ensureSealScript(tryMount);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { sbcSeal?: boolean; width?: number; height?: number } | null;
      if (!data || data.sbcSeal !== true) return;
      const frame = container.querySelector<HTMLIFrameElement>("iframe.sbc-seal-frame");
      if (!frame || frame.contentWindow !== event.source) return;
      if (data.width) frame.style.width = `${data.width}px`;
      if (data.height) frame.style.height = `${data.height}px`;
    };
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <footer
      className={cn(
        "sbc-seal-slot mt-8 flex justify-start border-t border-[oklch(1_0_0/0.06)] pt-6",
        className,
      )}
    >
      {/*
        Intentionally omit data-position. seal.js treats bottom/top as fixed
        viewport anchors; without it the iframe stays inside this container.
      */}
      <div
        ref={containerRef}
        className="sbc-verify-seal"
        data-token={SEAL_TOKEN}
      />
    </footer>
  );
}
