import { ModuleCard } from "@/components/link-in-bio/wizard/wizardUi";
import { useWizard } from "@/components/link-in-bio/wizard/WizardProvider";
import { wizardUi } from "@/components/link-in-bio/wizard/wizardTokens";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeSlug } from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

export function ProfileStep() {
  const { draft, slugLocked, unlockOn, onFile } = useWizard();
  const { profile, setProfile, slugStatus } = draft;

  return (
    <div className="grid gap-4">
      <ModuleCard>
        <label className={wizardUi.label} htmlFor="bio-slug">
          Username
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/40">/u/</span>
          <Input
            id="bio-slug"
            className={wizardUi.field}
            value={profile.slug}
            disabled={slugLocked}
            onChange={(event) => setProfile((prev) => ({ ...prev, slug: sanitizeSlug(event.target.value) }))}
            placeholder="your-name"
            autoFocus={!slugLocked}
          />
        </div>
        <p className={wizardUi.hint}>
          {slugLocked
            ? `Username is locked until ${unlockOn}.`
            : slugStatus === "checking"
              ? "Checking availability…"
              : slugStatus === "available"
                ? "This username is available."
                : slugStatus === "taken"
                  ? "That username is taken."
                  : slugStatus === "invalid"
                    ? "Use lowercase letters, numbers, and dashes."
                    : "Realtime check against saved usernames."}
        </p>
      </ModuleCard>

      <ModuleCard>
        <label className={wizardUi.label} htmlFor="bio-name">
          Display name
        </label>
        <Input
          id="bio-name"
          dir="auto"
          className={wizardUi.field}
          value={profile.displayName}
          onChange={(event) => setProfile((prev) => ({ ...prev, displayName: event.target.value }))}
        />
        <label className={cn(wizardUi.label, "mt-4")} htmlFor="bio-text">
          Bio
        </label>
        <Textarea
          id="bio-text"
          dir="auto"
          className="min-h-24 whitespace-pre-wrap break-words rounded-2xl border-[rgba(255,255,255,0.08)] bg-black/30 [overflow-wrap:anywhere]"
          value={profile.bio}
          onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
        />
      </ModuleCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleCard>
          <label className={wizardUi.label}>Avatar</label>
          <Input
            className={wizardUi.field}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void onFile(event.target.files?.[0], "avatar")}
          />
        </ModuleCard>
        <ModuleCard>
          <label className={wizardUi.label}>Header image</label>
          <Input
            className={wizardUi.field}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void onFile(event.target.files?.[0], "header")}
          />
          {profile.headerUrl ? (
            <button
              type="button"
              className="mt-2 text-xs text-white/45 hover:text-white"
              onClick={() => setProfile((prev) => ({ ...prev, headerUrl: "" }))}
            >
              Remove banner
            </button>
          ) : null}
        </ModuleCard>
      </div>
    </div>
  );
}
