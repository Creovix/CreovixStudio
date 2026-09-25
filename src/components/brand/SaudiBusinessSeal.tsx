import { cn } from "@/lib/utils";

/** Official SBC certificate page for CylixStudio (opens in a new tab). */
const SBC_CERTIFICATE_URL =
  "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/certificate?token=NzNyMEZtczVDeE04SzI4WHN4bmpodz09";

type SaudiBusinessSealProps = {
  className?: string;
};

/** Compact Saudi flag mark for the “صناعة سعودية” line. */
function SaudiFlagMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 16"
      aria-hidden
      focusable="false"
    >
      <rect width="24" height="16" rx="2" fill="#006C35" />
      <path
        fill="#fff"
        d="M5.2 5.1h13.6v1.15H5.2zm1.4 2.35h10.8c.2 1.55-.55 2.85-2.05 3.55-.7.35-1.55.55-2.55.55h-1.6c-1 0-1.85-.2-2.55-.55-1.5-.7-2.25-2-2.05-3.55zm4.2 4.05h2.4v1.35h-2.4z"
      />
      <path
        fill="#fff"
        d="M6.4 11.6h11.2c0 .55-.35.95-.85 1.15H7.25c-.5-.2-.85-.6-.85-1.15z"
      />
    </svg>
  );
}

/**
 * Dashboard footer identity — centered SBC verification link + Saudi-made line.
 * Uses the project Saudi font files; no iframe / floating seal chrome.
 */
export function SaudiBusinessSeal({ className }: SaudiBusinessSealProps) {
  return (
    <footer
      className={cn(
        "mt-8 flex justify-center border-t border-[oklch(1_0_0/0.06)] pt-6 pb-1",
        className,
      )}
    >
      <div
        dir="rtl"
        lang="ar"
        className="font-saudi flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 px-1 text-[0.8rem] leading-none text-muted-foreground"
      >
        <a
          href={SBC_CERTIFICATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-normal tracking-wide transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          موثّق لدى المركز السعودي للأعمال
        </a>

        <span
          aria-hidden
          className="size-1 shrink-0 rounded-full bg-[oklch(1_0_0/0.22)]"
        />

        <span className="inline-flex items-center gap-1.5 font-normal tracking-wide">
          <SaudiFlagMark className="size-[0.95rem] shrink-0 opacity-90" />
          صناعة سعودية
        </span>
      </div>
    </footer>
  );
}
