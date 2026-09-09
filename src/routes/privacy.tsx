import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Creovix Studio" },
      {
        name: "tiktok-developers-site-verification",
        content: "TG3OrSUXmfGrebUgymWUiCpJMPANy5z3",
      },
      {
        name: "description",
        content:
          "How Creovix Studio collects, uses, stores and deletes data from connected streaming accounts such as Twitch, Kick and TikTok.",
      },
      { property: "og:title", content: "Privacy Policy — Creovix Studio" },
      {
        property: "og:description",
        content: "What data Creovix Studio reads from your connected streaming accounts, and why.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 4 September 2026</p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Who we are</h2>
          <p className="mt-2">
            Creovix Studio is a live stream overlay tool for creators. Contact:{" "}
            <span className="text-foreground">store@creovix.com</span>
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Data we collect</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>Account basics: email address, display name and avatar.</li>
            <li>
              Connected platform data you authorise: public profile (open id, username, avatar),
              follower and channel statistics, and channel events such as follows, subscriptions,
              gifts, cheers and donations.
            </li>
            <li>
              Access and refresh tokens for the platforms you connect, stored so widgets can keep
              reading live data.
            </li>
            <li>Widget settings and the events shown in your activity feed.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
          <p className="mt-2">
            Only to operate the product: render your overlays, count follower and goal progress,
            drive the subathon timer, and show your activity history. We do not sell your data or
            use it for advertising.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">TikTok data</h2>
          <p className="mt-2">
            With the scopes you approve (user.info.basic, user.info.profile, user.info.stats) we
            read your TikTok display name, avatar, profile link and follower count. This is shown
            only to you inside your dashboard and in the overlays you choose to display. It is never
            shared with third parties.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Storage and security</h2>
          <p className="mt-2">
            Data is stored in an access-controlled database where every record is restricted to its
            owner. Tokens are only read by our servers, never exposed in the browser.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Deleting your data</h2>
          <p className="mt-2">
            Disconnect a platform in Settings to revoke access and remove its stored tokens. To
            delete your whole account and all related data, email{" "}
            <span className="text-foreground">store@creovix.com</span> and we will remove it.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cookies</h2>
          <p className="mt-2">
            We use only essential cookies needed to keep you signed in and to secure the sign-in
            flow. No tracking or advertising cookies.
          </p>
        </div>
      </section>
    </main>
  );
}
