import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
}> = [
  {
    platform: "TWITCH",
    provider: "twitch",
    label: "Twitch",
    dot: "bg-twitch",
    description: "Follows, subs (tier 1/2/3), gift subs and bits via EventSub.",
    descriptionAr: "المتابعات والاشتراكات والهدايا والبِتس عبر EventSub.",
    buttonClass: "bg-twitch text-twitch-foreground",
  },
  {
    platform: "KICK",
    provider: "kick",
    label: "Kick",
    dot: "bg-kick",
    description: "Follows, subscriptions and gift subs via Kick webhooks.",
    descriptionAr: "المتابعات والاشتراكات والهدايا عبر ويبهوك Kick.",
    buttonClass: "bg-kick text-kick-foreground",
  },
  {
    platform: "TIKTOK",
    provider: "tiktok",
    label: "TikTok",
    dot: "bg-[#FE2C55]",
    description: "Profile, avatar and live follower stats via TikTok Login Kit.",
    descriptionAr: "الملف الشخصي والصورة وعدد المتابعين المباشر عبر TikTok Login Kit.",
    buttonClass: "bg-[#FE2C55] text-white",
  },
];

const JWT_STEPS: Array<[string, string]> = [
  ["Go to StreamElements.com and click your profile icon.", "افتح StreamElements.com واضغط صورة حسابك."],
  ['Open "Account Settings".', "افتح «Account Settings»."],
  ['Click "Show Secrets" and copy your JWT Token.', "اضغط «Show Secrets» وانسخ JWT Token."],
];

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
  const [helperOpen, setHelperOpen] = useState(false);
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
    // Accept any pasted value; strip an accidental "Bearer " prefix or quotes.
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

  const cardClass = "glass-3d rounded-2xl p-5";

  const StatusBadge = ({ connection }: { connection: { is_active: boolean } | undefined }) =>
    connection ? (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          connection.is_active
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            connection.is_active ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"
          }`}
        />
        {connection.is_active ? (ar ? "متصل" : "CONNECTED") : ar ? "متوقف" : "PAUSED"}
      </span>
    ) : (
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
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
    <div>
      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {OAUTH_PLATFORMS.map((entry) => {
          const connection = findConnection(entry.platform);
          return (
            <section key={entry.platform} className={cardClass}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {connection?.metadata &&
                  (connection.metadata as { avatar_url?: string | null }).avatar_url ? (
                    <img
                      src={(connection.metadata as { avatar_url?: string }).avatar_url}
                      alt={`${entry.label} account avatar`}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <span className={`mt-1 h-3 w-3 rounded-full ${entry.dot}`} />
                  )}
                  <div>
                    <h3 className="text-base font-semibold">{entry.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ar ? entry.descriptionAr : entry.description}
                    </p>
                  </div>
                </div>
                <StatusBadge connection={connection} />
              </div>

              {connection ? (
                <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>{ar ? "الحساب" : "Account"}</dt>
                    <dd className="text-foreground">{connection.username ?? "—"}</dd>
                  </div>
                  {typeof (connection.metadata as { follower_count?: number } | null)
                    ?.follower_count === "number" ? (
                    <div className="flex justify-between gap-4">
                      <dt>{ar ? "المتابعون" : "Followers"}</dt>
                      <dd className="text-foreground">
                        {(
                          connection.metadata as { follower_count: number }
                        ).follower_count.toLocaleString()}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4">
                    <dt>{ar ? "الصلاحيات" : "Scopes"}</dt>
                    <dd className="text-foreground">{connection.scopes.length}</dd>
                  </div>
                </dl>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === entry.provider}
                  onClick={() => startOAuth(entry.provider)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${entry.buttonClass}`}
                >
                  {busy === entry.provider ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {connection ? (ar ? "إعادة الربط" : "Reconnect") : ar ? "ربط" : "Connect"}{" "}
                  {entry.label}
                </button>
                {connection ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleActive(connection.id, !connection.is_active)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      {connection.is_active
                        ? ar
                          ? "إيقاف مؤقت"
                          : "Pause"
                        : ar
                          ? "استئناف"
                          : "Resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => disconnect(connection.id)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      {ar ? "فصل" : "Disconnect"}
                    </button>
                  </>
                ) : null}
              </div>
            </section>
          );
        })}

        {/* Streamlabs — direct Socket API token card */}
        <section className={`${cardClass} border-[#31C48D]/30 shadow-[0_18px_50px_-24px_#31C48D]`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 rounded-full bg-[#31C48D]" />
              <div>
                <h3 className="text-base font-semibold">Streamlabs Socket API Token</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ar
                    ? "اربط Streamlabs فوراً بدون OAuth: الصق توكن Socket API لاستقبال التبرعات والاشتراكات والبِتس مباشرة."
                    : "Connect Streamlabs instantly without OAuth: paste your Socket API Token to receive tips, subs, bits, follows and raids live."}
                </p>
              </div>
            </div>
            <StatusBadge connection={slSocketConnection} />
          </div>

          <div className="mt-4">
            <div className="relative">
              <input
                type={showSl ? "text" : "password"}
                value={slDraft}
                onChange={(event) => {
                  setSlDraft(event.target.value);
                  setSlError(null);
                }}
                placeholder={ar ? "أدخل توكن Socket API الخاص بـ Streamlabs..." : "Enter your Streamlabs Socket API Token..."}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pe-11 font-mono text-sm outline-none transition-colors focus:border-[#31C48D]"
              />
              <button
                type="button"
                onClick={() => setShowSl((v) => !v)}
                aria-label={showSl ? "Hide token" : "Show token"}
                className="absolute inset-y-0 end-2 my-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                {showSl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {slError ? <p className="mt-2 text-sm text-destructive">{slError}</p> : null}

            <p className="mt-3 text-xs text-muted-foreground">
              {ar
                ? "Streamlabs ← Settings ← API Settings ← API Tokens ← Socket API Token"
                : "Streamlabs → Settings → API Settings → API Tokens → Socket API Token"}
            </p>

            <a
              href="https://streamlabs.com/dashboard#/settings/api-settings"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              {ar ? "فتح إعدادات API في Streamlabs" : "Open Streamlabs API settings"}
            </a>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === "STREAMLABS_TOKEN" || !slDraft.trim()}
                onClick={saveStreamlabsToken}
                className="inline-flex items-center gap-2 rounded-lg bg-[#31C48D] px-4 py-2 text-sm font-semibold text-[#04231a] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === "STREAMLABS_TOKEN" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ar ? "حفظ وربط" : "Save & Connect"}
              </button>
              {slSocketConnection ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleActive(slSocketConnection.id, !slSocketConnection.is_active)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {slSocketConnection.is_active
                      ? ar
                        ? "إيقاف مؤقت"
                        : "Pause"
                      : ar
                        ? "استئناف"
                        : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnect(slSocketConnection.id)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    {ar ? "فصل" : "Disconnect"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* StreamElements — JWT token card */}
        <section className={`${cardClass} border-[#0066FF]/30 shadow-[0_18px_50px_-24px_#0066FF]`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 rounded-full bg-[#0066FF]" />
              <div>
                <h3 className="text-base font-semibold">
                  {ar ? "ربط StreamElements" : "StreamElements Connection"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ar
                    ? "أدخل توكن JWT الخاص بحسابك في StreamElements لمزامنة التبرعات والتنبيهات."
                    : "Enter your StreamElements Account JWT Token to sync donations and alerts."}
                </p>
              </div>
            </div>
            <StatusBadge connection={seConnection} />
          </div>

          {seConnection ? (
            <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>{ar ? "القناة" : "Channel"}</dt>
                <dd className="text-foreground">{seConnection.username ?? "—"}</dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-4">
            <div className="relative">
              <input
                type={showJwt ? "text" : "password"}
                value={jwtDraft}
                onChange={(event) => {
                  setJwtDraft(event.target.value);
                  setSeError(null);
                }}
                placeholder="••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pe-11 font-mono text-sm outline-none transition-colors focus:border-[#0066FF]"
              />
              <button
                type="button"
                onClick={() => setShowJwt((v) => !v)}
                aria-label={showJwt ? "Hide token" : "Show token"}
                className="absolute inset-y-0 end-2 my-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                {showJwt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {seError ? <p className="mt-2 text-sm text-destructive">{seError}</p> : null}

            <button
              type="button"
              onClick={() => setHelperOpen((v) => !v)}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {ar ? "أين أجد توكن JWT؟" : "Where do I find my JWT Token?"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${helperOpen ? "rotate-180" : ""}`}
              />
            </button>
            {helperOpen ? (
              <ol className="mt-2 space-y-1 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                {JWT_STEPS.map((step, index) => (
                  <li key={step[0]}>
                    {ar ? `${index + 1}. ${step[1]}` : `Step ${index + 1}: ${step[0]}`}
                  </li>
                ))}
              </ol>
            ) : null}

            <a
              href="https://streamelements.com/dashboard/account/channels"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              {ar ? "فتح إعدادات حساب StreamElements" : "Open StreamElements account settings"}
            </a>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === "STREAMELEMENTS" || !jwtDraft.trim()}
                onClick={saveStreamElements}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === "STREAMELEMENTS" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ar ? "حفظ وربط" : "Save & Connect"}
              </button>
              {seConnection ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleActive(seConnection.id, !seConnection.is_active)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {seConnection.is_active
                      ? ar
                        ? "إيقاف مؤقت"
                        : "Pause"
                      : ar
                        ? "استئناف"
                        : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnect(seConnection.id)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    {ar ? "فصل" : "Disconnect"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
