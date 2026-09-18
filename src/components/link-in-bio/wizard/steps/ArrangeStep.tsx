import { useWizard } from "@/components/link-in-bio/wizard/WizardProvider";
import { wizardUi } from "@/components/link-in-bio/wizard/wizardTokens";

export function ArrangeStep() {
  const { draft, focusId } = useWizard();
  const selected = draft.links.find((link) => link.id === focusId && link.enabled);

  return (
    <div className="grid gap-3">
      <p className="text-sm leading-relaxed text-white/50">
        Arrange on the page. Drag a tile to move it. Click to select, then use the handles or keys 1–4 for 1×1, 2×1,
        1×2, and 2×2. Arrows grow or shrink.
      </p>
      {draft.links.some((link) => link.kind === "link" && link.enabled) ? (
        <p className={wizardUi.hint}>
          {selected ? `Selected · ${selected.title || selected.platform}` : "Click a tile on the page to select it."}
        </p>
      ) : (
        <p className={wizardUi.hint}>No platforms yet. Go back to add them, or publish a blank page from the dock.</p>
      )}
    </div>
  );
}
