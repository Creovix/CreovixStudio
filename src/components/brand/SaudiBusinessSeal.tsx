import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const SEAL_SCRIPT_SRC =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js";
const SEAL_API_BASE =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi";
/** Official SBC token (متجر موثق) — must match Dashboard registration. */
const SEAL_TOKEN = "NzNyMEZtczVDeE04SzI4WHN4bmpodz09";

function removeFloatingFrames() {
  document.querySelectorAll("iframe.sbc-seal-frame").forEach((node) => node.remove());
}

/**
 * Mirrors seal.js mount() so SPA remounts still work after the official
 * script has already run its one-shot DOMContentLoaded init.
 */
function mountSealFrame(container: HTMLElement) {
  const existing = document.querySelector("iframe.sbc-seal-frame");
  if (existing) return;

  if (container.getAttribute("data-sbc-mounted") === "1") {
    container.removeAttribute("data-sbc-mounted");
  }

  const token = container.getAttribute("data-token");
  if (!token) return;

  container.setAttribute("data-sbc-mounted", "1");

  const lang = (document.documentElement.getAttribute("lang") || "ar").substring(0, 2);
  const pos = (container.getAttribute("data-position") || "").toLowerCase();
  const floating = pos.includes("bottom") || pos.includes("top");
  const vert = pos.includes("bottom") ? "bottom" : "top";

  const frame = document.createElement("iframe");
  frame.className = "sbc-seal-frame";
  frame.src = `${SEAL_API_BASE}/seal?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}&pos=${vert}`;
  frame.title = "SBC Verification";
  frame.setAttribute("loading", "eager");
  frame.setAttribute("scrolling", "no");
  frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
  frame.style.border = "0";
  frame.style.width = "120px";
  frame.style.height = "44px";
  frame.style.maxWidth = "100%";
  frame.style.background = "transparent";
  frame.style.colorScheme = "light";
  frame.style.transition = "width .18s ease,height .18s ease";

  if (floating) {
    frame.style.position = "fixed";
    frame.style.zIndex = "2147483000";
    const margin = "18px";
    if (vert === "top") frame.style.top = margin;
    else frame.style.bottom = margin;
    if (pos.includes("right")) frame.style.right = margin;
    else frame.style.left = margin;
    document.body.appendChild(frame);
  } else {
    container.appendChild(frame);
  }
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
  script.onerror = () => onReady(); // fall back to local mount if CDN blocked
  document.body.appendChild(script);
}

/**
 * المركز السعودي للأعمال — شارة متجر موثق.
 * Official markup: `.sbc-verify-seal` + seal.js in `<body>`, bottom-left.
 * Hidden on OBS `/overlay/*` routes so the badge never appears in browser sources.
 */
export function SaudiBusinessSeal() {
  const hide = useRouterState({
    select: (s) => s.location.pathname.startsWith("/overlay"),
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hide) {
      removeFloatingFrames();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const tryMount = () => {
      // Give the official script a beat to mount; if it no-ops (SPA), mount ourselves.
      window.setTimeout(() => {
        if (!document.querySelector("iframe.sbc-seal-frame")) {
          mountSealFrame(container);
        }
      }, 50);
    };

    ensureSealScript(tryMount);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { sbcSeal?: boolean; width?: number; height?: number } | null;
      if (!data || data.sbcSeal !== true) return;
      document.querySelectorAll<HTMLIFrameElement>("iframe.sbc-seal-frame").forEach((frame) => {
        if (frame.contentWindow !== event.source) return;
        if (data.width) frame.style.width = `${data.width}px`;
        if (data.height) frame.style.height = `${data.height}px`;
      });
    };
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [hide]);

  if (hide) return null;

  return (
    <div
      ref={containerRef}
      className="sbc-verify-seal"
      data-token={SEAL_TOKEN}
      data-position="bottom-left"
    />
  );
}
