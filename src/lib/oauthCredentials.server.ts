import { PROVIDERS, type OAuthProvider } from "@/lib/oauth.server";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function looksLikeSupabaseOrVendorSecret(value: string): boolean {
  return (
    value.startsWith("sb_secret_") ||
    value.startsWith("sb_publishable_") ||
    value.startsWith("sk_live_") ||
    value.startsWith("sk_test_")
  );
}

/** Kick public Client IDs are not 64-char hex blobs (those are client secrets). */
function looksLikeOpaqueSecret(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

export function looksLikePublicOAuthClientId(value: string, provider: OAuthProvider): boolean {
  const v = value.trim();
  if (!v) return false;
  if (looksLikeSupabaseOrVendorSecret(v)) return false;
  const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRole && v === serviceRole) return false;
  if (provider === "kick" && looksLikeOpaqueSecret(v)) return false;
  return true;
}

export type OAuthAppCredentials =
  | { ok: true; clientId: string; clientSecret: string }
  | { ok: false; reason: "not_configured" | "client_id_invalid" };

/**
 * Public client id for authorize URLs vs server-only secret for token exchange.
 * Never returns a secret-shaped value as `clientId`.
 */
export function readOAuthAppCredentials(provider: OAuthProvider): OAuthAppCredentials {
  const config = PROVIDERS[provider];
  let clientId = env(config.clientIdEnv);
  let clientSecret = env(config.clientSecretEnv);

  if (
    clientId &&
    clientSecret &&
    !looksLikePublicOAuthClientId(clientId, provider) &&
    looksLikePublicOAuthClientId(clientSecret, provider)
  ) {
    const swapped = clientId;
    clientId = clientSecret;
    clientSecret = swapped;
  }

  if (!clientId) return { ok: false, reason: "not_configured" };
  if (!looksLikePublicOAuthClientId(clientId, provider)) {
    return { ok: false, reason: "client_id_invalid" };
  }

  return { ok: true, clientId, clientSecret };
}
