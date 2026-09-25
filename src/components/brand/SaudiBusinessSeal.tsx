import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const SEAL_SCRIPT_SRC =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js";
const SEAL_API_BASE =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi";
/** Official SBC token (متجر موثق) — must match Dashboard registration. */
const SEAL_TOKEN = "NzNyMEZtczVDeE04SzI4WHN4bmpodz09";
const SEAL_COLLAPSED_H = 44;

function removeOrphanFloatingFrames() {
  document.querySelectorAll("body > iframe.sbc-seal-frame").forEach((node) => node.remove());
}

function sealSrc(token: string, lang: string) {
  // pos=top → certificate card opens upward (seal.js / seal page convention).
  return `${SEAL_API_BASE}/seal?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}&pos=top`;
}

/** Anchor iframe bottom edge so height growth expands upward, not off-screen. */
function applyUpwardGrowth(frame: HTMLIFrameElement, height: number) {
  frame.style.height = `${height}px`;
  frame.style.marginTop = height > SEAL_COLLAPSED_H ? `${SEAL_COLLAPSED_H - height}px` : "0px";
}

/**
 * Inline mount on the right — never fixed to a viewport corner.
 * Uses pos=top so the SBC certificate panel opens upward.
 */
function mountSealInline(container: HTMLElement) {
  removeOrphanFloatingFrames();

  const token = container.getAttribute("data-token");
  if (!token) return;

  const lang = (document.documentElement.getAttribute("lang") || "ar").substring(0, 2);
  const src = sealSrc(token, lang);

  let frame = container.querySelector<HTMLIFrameElement>("iframe.sbc-seal-frame");
  if (frame) {
    if (!/[?&]pos=top(?:&|$)/.test(frame.src)) {
      frame.src = src;
    }
    return;
  }

  container.setAttribute("data-sbc-mounted", "1");

  frame = document.createElement("iframe");
  frame.className = "sbc-seal-frame";
  frame.src = src;
  frame.title = "SBC Verification";
  frame.setAttribute("loading", "eager");
  frame.setAttribute("scrolling", "no");
  frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
  frame.style.border = "0";
  frame.style.width = "120px";
  frame.style.height = `${SEAL_COLLAPSED_H}px`;
  frame.style.maxWidth = "100%";
  frame.style.background = "transparent";
  frame.style.position = "relative";
  frame.style.display = "block";
  frame.style.marginTop = "0px";
  frame.style.transition = "width .18s ease,height .18s ease,margin-top .18s ease";

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
 * Right-aligned dashboard footer; certificate popup opens upward (pos=top).
 */
export function SaudiBusinessSeal({ className }: SaudiBusinessSealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Avoid seal.js fixed corner logic (triggered by top/bottom in data-position).
    container.removeAttribute("data-position");

    const tryMount = () => {
      window.setTimeout(() => {
        removeOrphanFloatingFrames();
        const floating = document.querySelector("body > iframe.sbc-seal-frame");
        if (floating) floating.remove();
        mountSealInline(container);
      }, 80);
    };

    ensureSealScript(tryMount);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { sbcSeal?: boolean; width?: number; height?: number } | null;
      if (!data || data.sbcSeal !== true) return;
      const frame = container.querySelector<HTMLIFrameElement>("iframe.sbc-seal-frame");
      if (!frame || frame.contentWindow !== event.source) return;
      if (data.width) frame.style.width = `${data.width}px`;
      if (typeof data.height === "number") applyUpwardGrowth(frame, data.height);
    };
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <footer
      className={cn(
        "sbc-seal-slot mt-8 flex justify-end border-t border-[oklch(1_0_0/0.06)] pt-6",
        className,
      )}
    >
      {/*
        No data-position — keeps the iframe in-flow on the right.
        Popup direction is controlled via iframe ?pos=top.
      */}
      <div
        ref={containerRef}
        className="sbc-verify-seal"
        data-token={SEAL_TOKEN}
      />
    </footer>
  );
}
