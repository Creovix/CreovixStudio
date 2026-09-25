import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const SEAL_SCRIPT_SRC =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js";
const SEAL_TOKEN = "NzNyMEZtczVDeE4Szi4WHN4bmpodz09";

/**
 * المركز السعودي للأعمال — شارة متجر موثق (أسفل اليسار).
 * Hidden on OBS overlay routes so the seal never appears in browser sources.
 */
export function SaudiBusinessSeal() {
  const hide = useRouterState({
    select: (s) => s.location.pathname.startsWith("/overlay"),
  });

  useEffect(() => {
    if (hide) return;
    if (document.querySelector(`script[src="${SEAL_SCRIPT_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = SEAL_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, [hide]);

  if (hide) return null;

  return (
    <div
      className="sbc-verify-seal"
      data-token={SEAL_TOKEN}
      data-position="bottom-left"
    />
  );
}
