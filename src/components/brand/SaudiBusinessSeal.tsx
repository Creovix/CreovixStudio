import { useEffect } from "react";

import { cn } from "@/lib/utils";

const SEAL_SCRIPT_SRC =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js";
const SEAL_TOKEN = "NzNyMEZtczVDeE4Szi4WHN4bmpodz09";

type SaudiBusinessSealProps = {
  className?: string;
};

/**
 * المركز السعودي للأعمال — شارة متجر موثق.
 * Rendered inline in the dashboard footer (not fixed corner).
 */
export function SaudiBusinessSeal({ className }: SaudiBusinessSealProps) {
  useEffect(() => {
    if (document.querySelector(`script[src="${SEAL_SCRIPT_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = SEAL_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <footer
      className={cn(
        "mt-8 flex justify-start border-t border-[oklch(1_0_0/0.06)] pt-6",
        className,
      )}
    >
      <div className="sbc-seal-slot relative inline-flex min-h-[4.5rem] items-center justify-start opacity-90">
        {/* Omit data-position so seal.js does not pin to a viewport corner. */}
        <div className="sbc-verify-seal" data-token={SEAL_TOKEN} />
      </div>
    </footer>
  );
}
