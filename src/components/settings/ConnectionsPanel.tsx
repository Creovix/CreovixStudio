import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  connectStreamElements,
  connectStreamlabsSocket,
  startPlatformLink,
} from "@/lib/connections.functions";
import { useLanguage } from "@/lib/i18n";

type OAuthProviderId = "twitch" | "kick" | "tiktok";

const OAUTH_PLATFORMS: Array<{
  platform: "TWITCH" | "KICK" | "TIKTOK";
  provider: OAuthProviderId;
  label: string;
  dot: string;
  description: string;
  descriptionAr: string;
  buttonClass: string;
  accent: string;
}> = [
  {
    platform: "TWITCH",
    provider: "twitch",
    label: "Twitch",
    dot: "bg-twitch",
    description: "Follows, subs, gift subs and bits via EventSub.",
    descriptionAr: "المتابعات والاشتراكات والهدايا والبِتس عبر EventSub.",
    buttonClass: "bg-twitch text-twitch-foreground",
    accent: "border-twitch/45 shadow-[0_16px_40px_-28px_var(--twitch)]",
  },
  {
    platform: "KICK",
    provider: "kick",
    label: "Kick",
    dot: "bg-kick",
    description: "Follows, subscriptions and gift subs via Kick webhooks.",
    descriptionAr: "المتابعات والاشتراكات والهدايا عبر ويبهوك Kick.",
    buttonClass: "bg-kick text-kick-foreground",
    accent: "border-kick/45 shadow-[0_16px_40px_-28px_var(--kick)]",
  },
  {
    platform: "TIKTOK",
    provider: "tiktok",
    label: "TikTok",
    dot: "bg-[#FE2C55]",
    description: "Profile, avatar and live follower stats via Login Kit.",
    descriptionAr: "الملف الشخصي والصورة وعدد المتابعين عبر TikTok Login Kit.",
    buttonClass: "bg-[#FE2C55] text-white",
    accent: "border-[#FE2C55]/45 shadow-[0_16px_40px_-28px_#FE2C55]",
  },
];

const CARD =
  "glass-3d flex h-[28rem] w-full min-w-0 flex-col overflow-hidden rounded-3xl border p-6";

export function ConnectionsPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data } = useWorkspace(userId);
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const linkFn = useServerFn(startPlatformLink);
  const connectSeFn = useServerFn(connectStreamElements);
  const connectSlFn = useServerFn(connectStreamlabsSocket);

  const [jwtDraft, setJwtDraft] = useState("");
  const [showJwt, setShowJwt] = useState(false);
  const [seError, setSeError] = useState<string | null>(null);
  const [slDraft, setSlDraft] = useState("");
  const [showSl, setShowSl] = useState(false);
  const [slError, setSlError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (!connected) return;
    const labels: Record<string, string> = {
      tiktok: ar ? "تم ربط حساب TikTok بنجاح!" : "TikTok Account Connected Successfully!",
      twitch: ar ? "تم ربط حساب Twitch بنجاح!" : "Twitch Account Connected Successfully!",
      kick: ar ? "تم ربط حساب Kick بنجاح!" : "Kick Account Connected Successfully!",
    };
    toast.success(labels[connected] ?? (ar ? "تم الربط بنجاح!" : "Account Connected Successfully!"));
    params.delete("connected");
    const rest = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
  }, [ar]);

  const connections = data?.connections ?? [];
  const findConnection = (platform: string) => connections.find((c) => c.platform === platform);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace", userId] });

  const startOAuth = async (provider: OAuthProviderId) => {
    setBusy(provider);
    setError(null);
    try {
      const { url } = await linkFn({ data: { provider } });
      window.location.href = url;
    } catch (err) {
      setBusy(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const saveStreamElements = async () => {
    const token = jwtDraft.trim().replace(/^bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
    if (!token) return;
    setBusy("STREAMELEMENTS");
    setSeError(null);
    try {
      const result = await connectSeFn({ data: { token } });
      if (!result.ok) {
        setSeError(
          ar
            ? "توكن StreamElements غير صالح. تأكد منه وحاول مرة أخرى."
            : "Invalid StreamElements Token. Please check and try again.",
        );
        return;
      }
      setJwtDraft("");
      setShowJwt(false);
      toast.success(
        ar ? `تم ربط StreamElements (${result.username})` : `StreamElements connected (${result.username})`,
      );
      void refresh();
    } catch (err) {
      setSeError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const saveStreamlabsToken = async () => {
    const token = slDraft.trim();
    if (!token) return;
    setBusy("STREAMLABS_TOKEN");
    setSlError(null);
    try {
      const result = await connectSlFn({ data: { token } });
      if (!result.ok) {
        setSlError(
          ar
            ? "توكن Socket API غير صالح. انسخه كاملاً من إعدادات Streamlabs."
            : "Invalid Socket API Token. Copy the full token from Streamlabs settings.",
        );
        return;
      }
      setSlDraft("");
      setShowSl(false);
      toast.success(ar ? "تم ربط Streamlabs مباشرة" : "Streamlabs connected via Socket API");
      void refresh();
      void queryClient.invalidateQueries({ queryKey: ["streamlabs-socket-token"] });
    } catch (err) {
      setSlError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error: writeError } = await supabase
      .from("platform_connections")
      .update({ is_active: isActive })
      .eq("id", id);
    if (writeError) setError(writeError.message);
    void refresh();
  };

  const disconnect = async (id: string) => {
    const { error: writeError } = await supabase.from("platform_connections").delete().eq("id", id);
    if (writeError) setError(writeError.message);
    void refresh();
  };

  const StatusBadge = ({ connection }: { connection: { is_active: boolean } | undefined }) =>
    connection ? (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
          connection.is_active
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connection.is_active ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"
          }`}
        />
        {connection.is_active ? (ar ? "متصل" : "CONNECTED") : ar ? "متوقف" : "PAUSED"}
      </span>
    ) : (
      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
        {ar ? "غير متصل" : "Not connected"}
      </span>
    );

  const seConnection = findConnection("STREAMELEMENTS");
  const slSocketConnection = connections.find(
    (c) =>
      c.platform === "STREAMLABS" &&
      (c.metadata as { source?: string } | null)?.source === "socket_token",
  );

  return (
    <div className="w-full">
      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex w-full justify-center overflow-x-auto pb-1">
        <div className="grid w-full min-w-[80rem] max-w-[96rem] grid-cols-5 items-stretch gap-8">
          {OAUTH_PLATFORMS.map((entry) => {
            const connection = findConnection(entry.platform);
            return (
              <section key={entry.platform} className={`${CARD} ${entry.accent}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {connection?.metadata &&
                    (connection.metadata as { avatar_url?: string | null }).avatar_url ? (
                      <img
                        src={(connection.metadata as { avatar_url?: string }).avatar_url}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry.dot}`} />
                    )}
                    <h3 className="truncate text-base font-semibold">{entry.label}</h3>
                  </div>
                  <StatusBadge connection={connection} />
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {ar ? entry.descriptionAr : entry.description}
                </p>
                <p className="mt-4 min-h-12 text-sm text-muted-foreground">
                  {connection?.username ? (
                    <>
                      <span>{ar ? "الحساب" : "Account"}: </span>
                      <span className="font-medium text-foreground">{connection.username}</span>
                    </>
                  ) : (
                    <span className="opacity-0">.</span>
                  )}
                </p>
                <div className="mt-auto flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy === entry.provider}
                    onClick={() => startOAuth(entry.provider)}
                    className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${entry.buttonClass}`}
                  >
                    {busy === entry.provider ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {connection ? (ar ? "إعادة الربط" : "Reconnect") : ar ? "ربط" : "Connect"} {entry.label}
                  </button>
                  {connection ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(connection.id, !connection.is_active)}
                        className="h-8 flex-1 rounded-lg border border-border text-[11px] font-medium hover:bg-secondary"
                      >
                        {connection.is_active ? (ar ? "إيقاف" : "Pause") : ar ? "استئناف" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={() => disconnect(connection.id)}
                        className="h-8 flex-1 rounded-lg border border-border text-[11px] font-medium text-destructive hover:bg-destructive/10"
                      >
                        {ar ? "فصل" : "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <div className="h-8" aria-hidden />
                  )}
                </div>
              </section>
            );
          })}

          <section className={`${CARD} border-[#31C48D]/45 shadow-[0_16px_40px_-28px_#31C48D]`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#31C48D]" />
                <h3 className="truncate text-base font-semibold">Streamlabs</h3>
              </div>
              <StatusBadge connection={slSocketConnection} />
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {ar
                ? "الصق توكن Socket API لاستقبال التبرعات والتنبيهات مباشرة."
                : "Paste your Socket API token to receive tips, subs and raids live."}
            </p>
            <div className="relative mt-4">
              <input
                type={showSl ? "text" : "password"}
                value={slDraft}
                onChange={(event) => {
                  setSlDraft(event.target.value);
                  setSlError(null);
                }}
                placeholder="Socket API Token"
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 pe-9 font-mono text-xs outline-none focus:border-[#31C48D]"
              />
              <button
                type="button"
                onClick={() => setShowSl((v) => !v)}
                aria-label={showSl ? "Hide token" : "Show token"}
                className="absolute inset-y-0 end-1 my-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                {showSl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {slError ? (
              <p className="mt-1 line-clamp-1 text-[11px] text-destructive">{slError}</p>
            ) : null}
            <a
              href="https://streamlabs.com/dashboard#/settings/api-settings"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {ar ? "إعدادات API" : "API settings"}
            </a>
            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                disabled={busy === "STREAMLABS_TOKEN" || !slDraft.trim()}
                onClick={saveStreamlabsToken}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#31C48D] px-3 text-sm font-semibold text-[#04231a] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === "STREAMLABS_TOKEN" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {ar ? "حفظ وربط" : "Save & Connect"}
              </button>
              {slSocketConnection ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(slSocketConnection.id, !slSocketConnection.is_active)}
                    className="h-8 flex-1 rounded-lg border border-border text-[11px] font-medium hover:bg-secondary"
                  >
                    {slSocketConnection.is_active ? (ar ? "إيقاف" : "Pause") : ar ? "استئناف" : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnect(slSocketConnection.id)}
                    className="h-8 flex-1 rounded-lg border border-border text-[11px] font-medium text-destructive hover:bg-destructive/10"
                  >
                    {ar ? "فصل" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <div className="h-8" aria-hidden />
              )}
            </div>
          </section>

          <section className={`${CARD} border-[#0066FF]/45 shadow-[0_16px_40px_-28px_#0066FF]`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0066FF]" />
                <h3 className="truncate text-base font-semibold">StreamElements</h3>
              </div>
              <StatusBadge connection={seConnection} />
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {ar
                ? "أدخل توكن JWT لمزامنة التبرعات والتنبيهات."
                : "Enter your account JWT token to sync donations and alerts."}
            </p>
            <div className="relative mt-4">
              <input
                type={showJwt ? "text" : "password"}
                value={jwtDraft}
                onChange={(event) => {
                  setJwtDraft(event.target.value);
                  setSeError(null);
                }}
                placeholder="JWT Token"
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 pe-9 font-mono text-xs outline-none focus:border-[#0066FF]"
              />
              <button
                type="button"
                onClick={() => setShowJwt((v) => !v)}
                aria-label={showJwt ? "Hide token" : "Show token"}
                className="absolute inset-y-0 end-1 my-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                {showJwt ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {seError ? (
              <p className="mt-1 line-clamp-1 text-[11px] text-destructive">{seError}</p>
            ) : null}
            <a
              href="https://streamelements.com/dashboard/account/channels"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {ar ? "أين أجد JWT؟" : "Where is my JWT?"}
            </a>
            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                disabled={busy === "STREAMELEMENTS" || !jwtDraft.trim()}
                onClick={saveStreamElements}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === "STREAMELEMENTS" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {ar ? "حفظ وربط" : "Save & Connect"}
              </button>
              {seConnection ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(seConnection.id, !seConnection.is_active)}
                    className="h-8 flex-1 rounded-lg border border-border text-[11px] font-medium hover:bg-secondary"
                  >
                    {seConnection.is_active ? (ar ? "إيقاف" : "Pause") : ar ? "استئناف" : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnect(seConnection.id)}
                    className="h-8 flex-1 rounded-lg border border-border text-[11px] font-medium text-destructive hover:bg-destructive/10"
                  >
                    {ar ? "فصل" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <div className="h-8" aria-hidden />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
