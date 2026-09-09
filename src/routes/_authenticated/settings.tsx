import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AdminCodesPanel } from "@/components/settings/AdminCodesPanel";
import { ConnectionsPanel } from "@/components/settings/ConnectionsPanel";
import { EventTestPanel } from "@/components/settings/EventTestPanel";
import { SubscriptionPanel } from "@/components/settings/SubscriptionPanel";
import { useIsAdmin } from "@/hooks/useSubscription";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Creovix" },
      {
        name: "description",
        content: "Manage platform connections, your creator profile and workspace preferences.",
      },
      { property: "og:title", content: "Settings — Creovix" },
      {
        property: "og:description",
        content: "Connections, profile and workspace preferences in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const BASE_TABS = ["Profile", "Connections", "Subscription", "Workspace"] as const;
const ADMIN_TAB = "🔑 Admin - Redeem Codes";
const TEST_TAB = "🧪 Test Events";
type Tab = (typeof BASE_TABS)[number] | typeof ADMIN_TAB | typeof TEST_TAB;


function SettingsPage() {
  const { user } = Route.useRouteContext();
  const { data } = useWorkspace(user.id);
  const isAdmin = useIsAdmin(user.id);
  const [tab, setTab] = useState<Tab>("Profile");
  const TABS: Tab[] = isAdmin.data ? [...BASE_TABS, ADMIN_TAB, TEST_TAB] : [...BASE_TABS];


  return (
    <AppShell
      user={user}
      profile={data?.profile}
      title="Settings"
      subtitle="Connections, account and workspace preferences."
    >
      <div className="glass-3d mb-6 inline-flex flex-wrap gap-1 rounded-full p-1">
        {TABS.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setTab(entry)}
            className={`rounded-full px-4 py-1.5 text-[0.8rem] font-medium transition-colors ${
              tab === entry
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry}
          </button>
        ))}
      </div>

      {tab === ADMIN_TAB && isAdmin.data ? <AdminCodesPanel /> : null}

      {tab === TEST_TAB && isAdmin.data ? <EventTestPanel /> : null}

      {tab === "Connections" ? <ConnectionsPanel userId={user.id} /> : null}

      {tab === "Subscription" ? <SubscriptionPanel userId={user.id} /> : null}


      {tab === "Profile" ? (
        <section className="glass-3d max-w-xl rounded-2xl p-6">
          <p className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
            Profile
          </p>
          <p className="mt-3 text-sm">{data?.profile?.name ?? user.email}</p>
          <p className="text-[0.8rem] text-muted-foreground">{user.email}</p>
          <p className="mt-4 text-[0.8rem] text-muted-foreground">
            Your account is linked through your streaming platform login.
          </p>
        </section>
      ) : null}

      {tab === "Workspace" ? (
        <section className="glass-3d max-w-xl rounded-2xl p-6">
          <p className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Widgets</dt>
              <dd>{data?.subathons.length ?? 0} workspace(s)</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Active connections</dt>
              <dd>{(data?.connections ?? []).filter((c) => c.is_active).length}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[0.8rem] text-muted-foreground">
            Widgets are created and customised from the Home hub.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
