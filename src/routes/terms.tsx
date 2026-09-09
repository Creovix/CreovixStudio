import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Creovix Studio" },
      {
        name: "tiktok-developers-site-verification",
        content: "FMGidZnFrpK7GvuJ8jmtExedcI6gVHIF",
      },
      {
        name: "description",
        content:
          "Terms of Service for Creovix Studio: account rules, connected streaming platforms, acceptable use and account termination.",
      },
      { property: "og:title", content: "Terms of Service — Creovix Studio" },
      {
        property: "og:description",
        content: "The rules for using Creovix Studio stream widgets and overlays.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 4 September 2026</p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-lg font-semibold text-foreground">1. The service</h2>
          <p className="mt-2">
            Creovix Studio provides live stream overlay widgets (subathon timer, goals, chat box,
            chat spotlight, emote rain and related tools) that creators embed into their
            broadcasting software.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">2. Accounts</h2>
          <p className="mt-2">
            You sign in with a streaming account (Twitch, Kick, TikTok and similar). You are
            responsible for activity on your account and for keeping your access tokens private.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">3. Connected platforms</h2>
          <p className="mt-2">
            When you connect a platform you authorise Creovix Studio to read the channel data you
            approved (profile details, follower statistics and channel events) so the widgets can
            display live information. You can disconnect any platform at any time from Settings, and
            we stop reading its data immediately.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">4. Acceptable use</h2>
          <p className="mt-2">
            Do not use the service to break the rules of any streaming platform, to harass others,
            to distribute unlawful content, or to attempt to access other users&apos; data.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">5. Licences and access</h2>
          <p className="mt-2">
            Some features require an activation code. Codes begin their validity when redeemed and
            may be revoked if obtained or used improperly.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">6. Availability</h2>
          <p className="mt-2">
            The service is provided &quot;as is&quot;. We work to keep it online but cannot
            guarantee uninterrupted availability, and we are not liable for lost stream revenue or
            other indirect damages.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">7. Termination</h2>
          <p className="mt-2">
            You may stop using the service and delete your connections at any time. We may suspend
            accounts that breach these terms.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
          <p className="mt-2">
            Questions about these terms: <span className="text-foreground">store@creovix.com</span>
          </p>
        </div>
      </section>
    </main>
  );
}
