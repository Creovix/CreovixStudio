import { cn } from "@/lib/utils";

/** Official SBC certificate page for CylixStudio (opens in a new tab). */
const SBC_CERTIFICATE_URL =
  "https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000329636?vt=1.WGT.1790380260.PEkaNQfueoMy.iRoh7xOccTgALXLd82AveqZlqV3oGpxTl5dTGzFYkpE";

type SaudiBusinessSealProps = {
  className?: string;
};

/**
 * Dashboard footer identity — centered SBC verification link + Saudi-made line.
 * Both lines use Saudi-Bold (Ministry of Culture typeface).
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
        className="font-saudi flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 px-1 text-[0.82rem] font-bold leading-none tracking-wide text-muted-foreground"
      >
        <a
          href={SBC_CERTIFICATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          موثّق لدى المركز السعودي للأعمال
        </a>

        <span
          aria-hidden
          className="size-1 shrink-0 rounded-full bg-[oklch(1_0_0/0.22)]"
        />

        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="select-none text-[0.95rem] leading-none">
            🇸🇦
          </span>
          صناعة سعودية
        </span>
      </div>
    </footer>
  );
}
