import { useNavigate } from "@tanstack/react-router";

import { LinkInBioDashboard } from "@/components/link-in-bio/LinkInBioDashboard";
import { LinkInBioWizard } from "@/components/link-in-bio/wizard";
import { AppShell } from "@/components/layout/AppShell";
import { useLinkInBioDraft } from "@/hooks/useLinkInBioDraft";

export function LinkInBioStudio({
  userId,
  user,
  workspaceProfile,
  forceSetup,
  step,
}: {
  userId: string;
  user: { email?: string | undefined; id: string };
  workspaceProfile?: { name: string | null; image: string | null } | null;
  forceSetup: boolean;
  step?: number;
}) {
  const draft = useLinkInBioDraft(userId);
  const navigate = useNavigate();
  const goDashboard = () => {
    void navigate({ to: "/link-in-bio", search: {}, replace: true });
  };
  const goSetup = (nextStep = 1) => {
    void navigate({ to: "/link-in-bio", search: { setup: true, step: nextStep }, replace: true });
  };

  if (draft.loading) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading your page…</div>;
  }

  const showWizard = forceSetup || !draft.profile.setupCompleted;
  if (showWizard) {
    return (
      <LinkInBioWizard
        draft={draft}
        step={step}
        canExit={draft.profile.setupCompleted}
        onExit={goDashboard}
      />
    );
  }

  return (
    <AppShell
      user={user}
      profile={workspaceProfile}
      title="Link in Bio"
      subtitle="Your public page. Click the preview or Replay setup to go through the guided flow again."
    >
      <LinkInBioDashboard draft={draft} onReplay={() => goSetup(1)} />
    </AppShell>
  );
}
