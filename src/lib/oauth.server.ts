import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export type OAuthProvider = "twitch" | "kick" | "streamelements" | "streamlabs" | "tiktok";

export type ProviderProfile = {
  id: string;
  username: string;
  email: string | null;
  image: string | null;
  /** Extra provider fields persisted into connection metadata (e.g. followers). */
  extra?: Record<string, unknown>;
};

type ProviderConfig = {
  platform: "TWITCH" | "KICK" | "STREAMELEMENTS" | "STREAMLABS" | "TIKTOK";
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  usesPkce: boolean;
  clientIdEnv: string;
  clientSecretEnv: string;
  fetchProfile: (accessToken: string, clientId: string) => Promise<ProviderProfile>;
};

export const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  twitch: {
    platform: "TWITCH",
    authorizeUrl: "https://id.twitch.tv/oauth2/authorize",
    tokenUrl: "https://id.twitch.tv/oauth2/token",
    scopes: [
      "user:read:email",
      "moderator:read:followers",
      "channel:read:subscriptions",
      "bits:read",
    ].join(" "),
    usesPkce: false,
    clientIdEnv: "TWITCH_CLIENT_ID",
    clientSecretEnv: "TWITCH_CLIENT_SECRET",
    fetchProfile: async (accessToken, clientId) => {
      const res = await fetch("https://api.twitch.tv/helix/users", {
        headers: { Authorization: `Bearer ${accessToken}`, "Client-Id": clientId },
      });
      if (!res.ok) throw new Error(`Twitch profile request failed: ${res.status}`);
      const json = (await res.json()) as {
        data: Array<{
          id: string;
          login: string;
          display_name: string;
          email?: string;
          profile_image_url?: string;
        }>;
      };
      const user = json.data?.[0];
      if (!user) throw new Error("Twitch profile response was empty");
      return {
        id: user.id,
        username: user.display_name || user.login,
        email: user.email ?? null,
        image: user.profile_image_url ?? null,
      };
    },
  },
  kick: {
    platform: "KICK",
    authorizeUrl: "https://id.kick.com/oauth/authorize",
    tokenUrl: "https://id.kick.com/oauth/token",
    scopes: ["user:read", "channel:read", "channel:write", "chat:write", "streamkey:read", "channel:rewards:read", "channel:rewards:write", "events:subscribe"].join(" "),
    usesPkce: true,
    clientIdEnv: "KICK_CLIENT_ID",
    clientSecretEnv: "KICK_CLIENT_SECRET",
    fetchProfile: async (accessToken) => {
      const res = await fetch("https://api.kick.com/public/v1/users", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Kick profile request failed: ${res.status}`);
      const json = (await res.json()) as {
        data: Array<{
          user_id: number | string;
          name?: string;
          email?: string;
          profile_picture?: string;
        }>;
      };
      const user = json.data?.[0];
      if (!user) throw new Error("Kick profile response was empty");
      return {
        id: String(user.user_id),
        username: user.name ?? `kick_${user.user_id}`,
        email: user.email ?? null,
        image: user.profile_picture ?? null,
      };
    },
  },
  streamelements: {
    platform: "STREAMELEMENTS",
    authorizeUrl: "https://api.streamelements.com/oauth2/authorize",
    tokenUrl: "https://api.streamelements.com/oauth2/token",
    scopes: ["channel:read", "tips:read", "activities:read"].join(" "),
    usesPkce: false,
    clientIdEnv: "STREAMELEMENTS_CLIENT_ID",
    clientSecretEnv: "STREAMELEMENTS_CLIENT_SECRET",
    fetchProfile: async (accessToken) => {
      const res = await fetch("https://api.streamelements.com/kappa/v2/channels/me", {
        headers: { Authorization: `oAuth ${accessToken}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`StreamElements profile request failed: ${res.status}`);
      const user = (await res.json()) as {
        _id?: string;
        username?: string;
        displayName?: string;
        email?: string;
        avatar?: string;
      };
      if (!user?._id) throw new Error("StreamElements profile response was empty");
      return {
        id: user._id,
        username: user.displayName || user.username || `se_${user._id}`,
        email: user.email ?? null,
        image: user.avatar ?? null,
      };
    },
  },
  streamlabs: {
    platform: "STREAMLABS",
    authorizeUrl: "https://streamlabs.com/api/v2.0/authorize",
    tokenUrl: "https://streamlabs.com/api/v2.0/token",
    scopes: ["donations.read", "alerts.create", "socket.token"].join(" "),
    usesPkce: false,
    clientIdEnv: "STREAMLABS_CLIENT_ID",
    clientSecretEnv: "STREAMLABS_CLIENT_SECRET",
    fetchProfile: async (accessToken) => {
      const res = await fetch("https://streamlabs.com/api/v2.0/user", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Streamlabs profile request failed: ${res.status}`);
      const json = (await res.json()) as {
        streamlabs?: { id?: number | string; display_name?: string; thumbnail?: string };
        twitch?: { display_name?: string; name?: string };
        youtube?: { title?: string };
      };
      const account = json.streamlabs;
      if (!account?.id) throw new Error("Streamlabs profile response was empty");
      return {
        id: String(account.id),
        username:
          account.display_name ||
          json.twitch?.display_name ||
          json.twitch?.name ||
          json.youtube?.title ||
          `streamlabs_${account.id}`,
        email: null,
        image: account.thumbnail ?? null,
      };
    },
  },
  tiktok: {
    platform: "TIKTOK",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "user.info.profile", "user.info.stats"].join(","),
    usesPkce: true,
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    fetchProfile: async (accessToken) => {
      const fields = "open_id,union_id,display_name,avatar_url,follower_count,profile_deep_link";
      const res = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`TikTok profile request failed: ${res.status} ${await res.text()}`);
      const json = (await res.json()) as {
        data?: {
          user?: {
            open_id?: string;
            union_id?: string;
            display_name?: string;
            avatar_url?: string;
            follower_count?: number;
          };
        };
      };
      const user = json.data?.user;
      if (!user?.open_id) throw new Error("TikTok profile response was empty");
      return {
        id: user.open_id,
        username: user.display_name || `tiktok_${user.open_id.slice(0, 8)}`,
        email: null,
        image: user.avatar_url ?? null,
        extra: {
          open_id: user.open_id,
          union_id: user.union_id ?? null,
          display_name: user.display_name ?? null,
          avatar_url: user.avatar_url ?? null,
          follower_count: typeof user.follower_count === "number" ? user.follower_count : null,
        },
      };
    },
  },
};

export const isOAuthProvider = (value: string): value is OAuthProvider =>
  value === "twitch" ||
  value === "kick" ||
  value === "streamelements" ||
  value === "streamlabs" ||
  value === "tiktok";

export const base64Url = (input: Buffer) =>
  input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const createVerifier = () => base64Url(randomBytes(32));
export const createState = () => base64Url(randomBytes(24));
export const challengeFor = (verifier: string) =>
  base64Url(createHash("sha256").update(verifier).digest());

export const redirectUriFor = (request: Request, provider: OAuthProvider) => {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = `${forwardedProto ?? url.protocol.replace(":", "")}://${forwardedHost ?? url.host}`;
  // TikTok apps register the shorter callback path; it forwards to the handler.
  if (provider === "tiktok") return `${origin}/api/auth/callback/tiktok`;
  return `${origin}/api/public/auth/${provider}/callback`;
};

function requestIsHttps(request: Request): boolean {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return proto === "https";
}

export const cookie = (request: Request, name: string, value: string, maxAge: number) => {
  const secure = requestIsHttps(request) ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
};

export const readCookie = (request: Request, name: string) => {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string | string[];
};

export const exchangeCode = async (args: {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
  verifier: string | null;
}): Promise<TokenResponse> => {
  const config = PROVIDERS[args.provider];
  const isTikTok = args.provider === "tiktok";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri,
    client_secret: args.clientSecret,
  });
  body.set(isTikTok ? "client_key" : "client_id", args.clientId);
  if (config.usesPkce && args.verifier) body.set("code_verifier", args.verifier);

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) {
    throw new Error(`${args.provider} token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
};

/* ---------------------------------------------------------------------------
 * Account-linking state
 * OAuth flows started from Settings must attach the connection to the signed-in
 * user instead of minting a new session. The user id travels in the `state`
 * parameter, signed with a server-only secret so the callback can trust it.
 * ------------------------------------------------------------------------- */

const linkSecret = () =>
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_URL"] ?? "creovix-link";

export const signLinkState = (userId: string, ttlSeconds = 600) => {
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = `${userId}.${exp}`;
  const mac = base64Url(createHmac("sha256", linkSecret()).update(payload).digest());
  return `link:${payload}.${mac}`;
};

export const verifyLinkState = (state: string): string | null => {
  if (!state.startsWith("link:")) return null;
  const [userId, expRaw, mac] = state.slice(5).split(".");
  if (!userId || !expRaw || !mac) return null;
  const expected = base64Url(
    createHmac("sha256", linkSecret()).update(`${userId}.${expRaw}`).digest(),
  );
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  if (Number(expRaw) < Date.now()) return null;
  return userId;
};

/** Streamlabs socket token — required for realtime donation alerts. */
export const fetchStreamlabsSocketToken = async (accessToken: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://streamlabs.com/api/v2.0/socket/token?access_token=${encodeURIComponent(accessToken)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { socket_token?: string };
    return json.socket_token ?? null;
  } catch {
    return null;
  }
};
