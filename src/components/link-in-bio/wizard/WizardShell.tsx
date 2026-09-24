import { ChevronLeft, ChevronRight } from "lucide-react";

import { LinkInBioPage } from "@/components/link-in-bio/LinkInBioPage";
import { useWizard } from "@/components/link-in-bio/wizard/WizardProvider";
import { MOTION_CSS, WIZARD_COPY, wizardUi } from "@/components/link-in-bio/wizard/wizardTokens";
import { Button } from "@/components/ui/button";
import { applyBentoPlacement, publicBioPath } from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

export function WizardShell({ children }: { children: React.ReactNode }) {
  const { step, total, goBack, goNext, canProceed, canExit, onExit, finish, saving, draft, focusId, setFocusId } =
    useWizard();
  const meta = WIZARD_COPY[step - 1];
  const fillForm = step === 2 || step === 3;
  const arrange = step === 4;

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[#0a0a0a] text-neutral-100">
      <style>{MOTION_CSS}</style>

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] px-4 py-3 sm:px-5 md:px-8">
<<<<<<< HEAD
        <p className="truncate text-[0.72rem] uppercase tracking-[0.2em] text-white/38">CylixStudio · Link in Bio</p>
=======
        <p className="truncate text-[0.72rem] uppercase tracking-[0.2em] text-white/38">Creovix · Link in Bio</p>
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm tabular-nums text-white/40">
            {step} / {total}
          </span>
          {canExit ? (
            <button type="button" className="min-h-10 text-sm text-white/60 hover:text-white" onClick={onExit}>
              Back to studio
            </button>
          ) : null}
        </div>
      </header>

      <div
        className={cn(
          "relative mx-auto grid min-h-0 min-w-0 w-full max-w-[110rem] flex-1 gap-4 overflow-hidden px-5 py-3 md:px-8 lg:grid-rows-[minmax(0,1fr)]",
          arrange
            ? "grid-rows-[minmax(0,1.35fr)_minmax(7rem,26%)] lg:grid-cols-[minmax(min(22rem,100%),0.85fr)_minmax(min(40rem,48vw),1.25fr)]"
            : "grid-rows-[minmax(0,1fr)_minmax(12rem,36%)] lg:grid-cols-[minmax(min(27rem,100%),1fr)_minmax(min(36rem,42vw),1.15fr)]",
        )}
      >
        <section
          className={cn(
            "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
            arrange && "order-2 lg:order-1",
          )}
        >
          <div className="shrink-0 pb-4">
            <p className="text-xs tabular-nums text-violet-300/50">0{step}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[1.75rem]">{meta?.title}</h1>
            <p className="mt-1 text-sm text-white/45">{meta?.hint}</p>
          </div>
          <div className={cn("min-h-0 flex-1", fillForm ? "flex flex-col" : "overflow-y-auto")}>{children}</div>
        </section>

        <aside
          className={cn(
            "flex h-full min-h-0 min-w-0 overflow-hidden lg:sticky lg:top-0",
            arrange && "order-1 lg:order-2",
          )}
        >
          <div
            className="relative h-full min-h-0 w-full overflow-hidden rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)] [contain:layout]"
            style={{ background: draft.preview.theme.paletteBg }}
          >
            <div className="absolute inset-0 overflow-auto">
              <LinkInBioPage
                data={draft.preview}
                preview
                highlightId={arrange ? focusId : null}
                arrangeMode={arrange}
                onSelectTile={arrange ? setFocusId : undefined}
                onMoveTile={
                  arrange
                    ? (id, gridX, gridY) => {
                        setFocusId(id);
                        draft.setLinks((prev) => applyBentoPlacement(prev, id, { gridX, gridY }));
                      }
                    : undefined
                }
                onResizeTile={
                  arrange
                    ? (id, colSpan, rowSpan, gridX, gridY) => {
                        setFocusId(id);
                        draft.setLinks((prev) =>
                          applyBentoPlacement(prev, id, { colSpan, rowSpan, gridX, gridY }),
                        );
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </aside>
      </div>

      <footer className="relative z-20 shrink-0 border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur-xl sm:px-5 md:px-8">
        <div className="mx-auto flex w-full max-w-[110rem] items-center justify-between gap-3">
          <Button type="button" variant="ghost" className="min-h-11" disabled={step === 1} onClick={goBack}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {arrange ? (
            <div className="hidden min-w-0 flex-1 text-center sm:block">
              <p className="truncate text-sm text-white/70" dir="auto">
                {draft.profile.slug ? publicBioPath(draft.profile.slug) : "Add a username to publish"}
              </p>
            <p className="mt-0.5 text-[0.68rem] text-white/38">Drag to move. Drag edges or corners to resize, then publish.</p>
            </div>
          ) : (
            <ol className="hidden flex-1 gap-1 sm:flex">
              {WIZARD_COPY.map((item, index) => (
                <li
                  key={item.title}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    index + 1 <= step ? "bg-gradient-to-r from-violet-500 to-violet-700" : "bg-white/10",
                  )}
                />
              ))}
            </ol>
          )}
          <div className="flex gap-2 sm:gap-3">
            {step !== 1 && step !== 4 ? (
              <Button type="button" variant="ghost" className={cn(wizardUi.ctaQuiet, "min-h-11")} onClick={() => void goNext()}>
                Skip
              </Button>
            ) : null}
            {step < total ? (
              <Button type="button" className={cn(wizardUi.ctaPrimary, "min-h-11")} onClick={() => void goNext()} disabled={!canProceed || saving}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(wizardUi.ctaQuiet, "min-h-11")}
                  onClick={() => void finish(false)}
                  disabled={saving}
                >
                  Enter studio
                </Button>
                <Button
                  type="button"
                  className={cn(wizardUi.ctaPrimary, "min-h-11 min-w-[7.5rem] px-6 sm:min-w-[8.5rem] sm:px-8")}
                  onClick={() => void finish(true)}
                  disabled={!draft.profile.slug || saving}
                >
                  Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
