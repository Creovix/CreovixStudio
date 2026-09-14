import { useEffect, useState } from "react";

import { ModuleCard, OptionTile } from "@/components/link-in-bio/wizard/wizardUi";
import { useWizard } from "@/components/link-in-bio/wizard/WizardProvider";
import { wizardUi } from "@/components/link-in-bio/wizard/wizardTokens";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BENTO_COLOR_MODES, BACKGROUND_PRESETS, FONT_CHOICES, type BentoColorMode, type LinkInBioTheme } from "@/lib/linkInBio";
import { extractLogoPalette } from "@/lib/logoPalette";
import { cn } from "@/lib/utils";

function isPaperTheme(theme: LinkInBioTheme) {
  return theme.paletteBg === BACKGROUND_PRESETS[0]!.paletteBg;
}

function BentoModeSwatch({
  mode,
  accent,
  paper,
  customFill,
}: {
  mode: BentoColorMode;
  accent: string;
  paper: boolean;
  customFill: string;
}) {
  if (mode === "brand") {
    return (
      <span className="flex h-7 overflow-hidden rounded-lg">
        <span className="flex-1" style={{ background: "#53FC18" }} />
        <span className="flex-1" style={{ background: "#6B21A8" }} />
        <span className="flex-1" style={{ background: "#E62117" }} />
        <span className="flex-1" style={{ background: "#5865F2" }} />
      </span>
    );
  }
  if (mode === "mono") {
    return (
      <span
        className="block h-7 rounded-lg border border-white/10"
        style={{ background: paper ? "#ecece8" : "#1a1c22" }}
      />
    );
  }
  if (mode === "gradient") {
    return (
      <span
        className="block h-7 rounded-lg"
        style={{ background: `linear-gradient(160deg, #E62117 0%, ${paper ? "#f7f7f5" : "#050508"} 100%)` }}
      />
    );
  }
  if (mode === "glow") {
    return (
      <span
        className="block h-7 rounded-lg"
        style={{
          background: `color-mix(in oklab, ${accent} 55%, ${paper ? "#f7f7f5" : "#0f1117"})`,
          boxShadow: `inset 0 0 10px ${accent}`,
        }}
      />
    );
  }
  if (mode === "glass") {
    return (
      <span
        className="block h-7 rounded-lg border border-white/25"
        style={{ background: `color-mix(in oklab, ${accent} 28%, rgba(255,255,255,0.18))` }}
      />
    );
  }
  return (
    <span className="flex h-7 overflow-hidden rounded-lg">
      <span className="flex-1" style={{ background: customFill }} />
      <span className="flex-1" style={{ background: accent }} />
    </span>
  );
}

export function AtmosphereStep() {
  const { draft } = useWizard();
  const { theme, setTheme, profile } = draft;
  const [logoSync, setLogoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const onPatch = (partial: Partial<LinkInBioTheme>) => setTheme((prev) => ({ ...prev, ...partial }));

  const applyLogoPalette = async () => {
    if (!profile.avatarUrl) {
      setSyncError("Upload a logo on Profile first.");
      return;
    }
    setSyncing(true);
    setSyncError(null);
    const palette = await extractLogoPalette(profile.avatarUrl);
    setSyncing(false);
    if (!palette) {
      setSyncError("Could not read that logo (remote images need CORS). Re-upload the file and try again.");
      return;
    }
    const paper = isPaperTheme(theme);
    onPatch({
      paletteBg: paper ? "#f7f7f5" : palette.background,
      paletteFg: paper ? "#171717" : palette.foreground,
      paletteAccent: palette.accent,
      paletteMuted: paper ? "#5c5c57" : palette.muted,
      gradientStyle: "soft",
      glowStrength: Math.max(theme.glowStrength, 48),
      ambientEnabled: true,
    });
  };

  useEffect(() => {
    if (!logoSync || !profile.avatarUrl) return;
    void applyLogoPalette();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when logo or sync flag changes
  }, [logoSync, profile.avatarUrl]);

  return (
    <Tabs defaultValue="background" className="flex h-full min-h-0 flex-col">
      {FONT_CHOICES.map((font) => (
        <link key={font.id} rel="stylesheet" href={font.href} />
      ))}
      {theme.fontCustomHref ? (
        /\.(woff2?|ttf|otf)(\?|#|$)/i.test(theme.fontCustomHref) ? (
          <style>{`@font-face{font-family:"${theme.fontCustomName.replace(/["\\]/g, "") || "Custom"}";src:url("${theme.fontCustomHref.replace(/["\\]/g, "")}") format("woff2");font-display:swap;}`}</style>
        ) : (
          <link rel="stylesheet" href={theme.fontCustomHref} />
        )
      ) : null}
      <TabsList className={wizardUi.tabList}>
        <TabsTrigger value="background" className={wizardUi.tabTrigger}>
          Page background
        </TabsTrigger>
        <TabsTrigger value="typography" className={wizardUi.tabTrigger}>
          Typography
        </TabsTrigger>
      </TabsList>

      <TabsContent value="background" className={wizardUi.tabBody}>
        <div className="grid grid-cols-2 gap-3">
          {BACKGROUND_PRESETS.map((preset) => {
            const active = theme.paletteBg === preset.paletteBg && theme.paletteFg === preset.paletteFg;
            return (
              <OptionTile
                key={preset.id}
                active={active}
                onClick={() => {
                  setLogoSync(false);
                  onPatch({
                    paletteBg: preset.paletteBg,
                    paletteFg: preset.paletteFg,
                    paletteAccent: preset.paletteAccent,
                    paletteMuted: preset.paletteMuted,
                    gradientStyle: preset.gradientStyle,
                  });
                }}
              >
                <div
                  className="h-16 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)]"
                  style={{
                    background:
                      preset.id === "paper"
                        ? preset.paletteBg
                        : `linear-gradient(165deg, ${preset.paletteBg}, color-mix(in oklab, ${preset.paletteBg} 70%, ${preset.paletteAccent}))`,
                  }}
                />
                <span className="mt-3 block text-sm font-medium">{preset.label}</span>
                <span className="text-[0.68rem] text-white/40">{preset.hint}</span>
              </OptionTile>
            );
          })}
        </div>
        <div className="mt-4">
          <p className={wizardUi.label}>Bento colors</p>
          <div className="grid grid-cols-2 gap-2">
            {BENTO_COLOR_MODES.map((mode) => {
              const active = theme.bentoColorMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={cn(
                    "rounded-xl border px-2.5 py-2.5 text-start transition-colors",
                    active
                      ? "border-violet-400/45 bg-violet-500/[0.1]"
                      : "border-[rgba(255,255,255,0.08)] bg-white/[0.03] hover:border-white/12",
                  )}
                  onClick={() => onPatch({ bentoColorMode: mode.id })}
                >
                  <BentoModeSwatch
                    mode={mode.id}
                    accent={mode.id === "custom" ? theme.bentoCustomAccent : theme.paletteAccent}
                    paper={isPaperTheme(theme)}
                    customFill={theme.bentoCustomFill}
                  />
                  <span className="mt-2 block text-[0.72rem] font-medium leading-tight">{mode.label}</span>
                </button>
              );
            })}
          </div>
          {theme.bentoColorMode === "custom" ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="grid gap-1.5">
                <span className={wizardUi.label}>Card fill</span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-11 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
                    value={/^#[0-9A-Fa-f]{6}$/.test(theme.bentoCustomFill) ? theme.bentoCustomFill : "#1a1c24"}
                    onChange={(event) => onPatch({ bentoCustomFill: event.target.value })}
                  />
                  <input
                    className={cn(wizardUi.field, "min-w-0 flex-1 px-3")}
                    value={theme.bentoCustomFill}
                    onChange={(event) => onPatch({ bentoCustomFill: event.target.value })}
                  />
                </span>
              </label>
              <label className="grid gap-1.5">
                <span className={wizardUi.label}>Icon accent</span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-11 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
                    value={/^#[0-9A-Fa-f]{6}$/.test(theme.bentoCustomAccent) ? theme.bentoCustomAccent : "#7c8cff"}
                    onChange={(event) => onPatch({ bentoCustomAccent: event.target.value })}
                  />
                  <input
                    className={cn(wizardUi.field, "min-w-0 flex-1 px-3")}
                    value={theme.bentoCustomAccent}
                    onChange={(event) => onPatch({ bentoCustomAccent: event.target.value })}
                  />
                </span>
              </label>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-white/[0.03] px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Sync with logo</p>
            <p className="text-[0.68rem] text-white/40">Tint accent and glow from your avatar.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={logoSync}
              onCheckedChange={(next) => {
                setLogoSync(next);
                if (next) void applyLogoPalette();
              }}
            />
            <button
              type="button"
              className="text-sm text-white/70 hover:text-white disabled:text-white/30"
              disabled={syncing || !profile.avatarUrl}
              onClick={() => {
                setLogoSync(true);
                void applyLogoPalette();
              }}
            >
              {syncing ? "Sampling…" : "Apply"}
            </button>
          </div>
        </div>
        {syncError ? <p className={cn(wizardUi.hint, "mt-2 text-rose-300/80")}>{syncError}</p> : null}
      </TabsContent>

      <TabsContent value="typography" className={wizardUi.tabBody}>
        <ModuleCard className="mb-4 grid gap-3">
          <div>
            <label className={wizardUi.label} htmlFor="bio-font-name">
              Custom font-family
            </label>
            <input
              id="bio-font-name"
              className={cn(wizardUi.field, "w-full pl-5 pr-3")}
              placeholder="Satoshi"
              value={theme.fontCustomName}
              onChange={(event) => onPatch({ fontFamily: "custom", fontCustomName: event.target.value })}
              style={
                theme.fontCustomName
                  ? { fontFamily: `"${theme.fontCustomName.replace(/["\\]/g, "")}", system-ui, sans-serif` }
                  : undefined
              }
            />
            <p
              className="mt-2 min-h-8 rounded-xl border border-white/8 bg-black/20 px-4 py-2 text-sm text-white/80"
              style={{
                fontFamily: theme.fontCustomName
                  ? `"${theme.fontCustomName.replace(/["\\]/g, "")}", system-ui, sans-serif`
                  : undefined,
              }}
            >
              {theme.fontCustomName.trim() || "Type a family name to preview it here."}
            </p>
          </div>
          <div>
            <label className={wizardUi.label} htmlFor="bio-font-href">
              Font or stylesheet URL
            </label>
            <input
              id="bio-font-href"
              className={cn(wizardUi.field, "w-full pl-5 pr-3")}
              placeholder="https://…/font.css or a .woff2"
              value={theme.fontCustomHref}
              onChange={(event) => onPatch({ fontFamily: "custom", fontCustomHref: event.target.value })}
              style={
                theme.fontCustomName
                  ? { fontFamily: `"${theme.fontCustomName.replace(/["\\]/g, "")}", system-ui, sans-serif` }
                  : undefined
              }
            />
            <p
              className="mt-2 min-h-8 rounded-xl border border-white/8 bg-black/20 px-4 py-2 text-sm text-white/80"
              style={{
                fontFamily: theme.fontCustomName
                  ? `"${theme.fontCustomName.replace(/["\\]/g, "")}", system-ui, sans-serif`
                  : undefined,
              }}
            >
              {theme.fontCustomName.trim()
                ? `The quick brown fox — ${theme.fontCustomName}`
                : "Load a stylesheet, then type a family name to preview."}
            </p>
          </div>
        </ModuleCard>
        <div className="grid grid-cols-3 gap-2">
          {FONT_CHOICES.map((font) => {
            const active = theme.fontFamily === font.id;
            return (
              <button
                key={font.id}
                type="button"
                className={cn(
                  "flex h-[5.75rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 text-center",
                  active
                    ? "border-violet-400/45 bg-violet-500/[0.1]"
                    : "border-[rgba(255,255,255,0.08)] bg-white/[0.03] hover:border-white/12",
                )}
                onClick={() => onPatch({ fontFamily: font.id })}
              >
                <span
                  className="text-[1.45rem] font-semibold leading-none"
                  style={{ fontFamily: font.stack }}
                >
                  {font.sample}
                </span>
                <span className="min-w-0 truncate text-[0.72rem] text-white/70" style={{ fontFamily: font.stack }}>
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}
