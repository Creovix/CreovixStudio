/**
 * Canonical public origin for production OAuth / EventSub / clip links.
 *
 * Vercel permanently redirects apex → www (308), so the only safe production
 * origin is https://www.cylixstudio.com (no trailing slash). Twitch/Kick
 * developer consoles must register www redirect URIs to match.
 *
 * Always set PUBLIC_SITE_URL on Vercel. Values are trimmed, de-quoted, and
 * apex cylixstudio.com is rewritten to www so env typos cannot break OAuth.
 */

export const CANONICAL_PRODUCTION_ORIGIN = "https://www.cylixstudio.com";

/** Trim, strip wrapping quotes, drop trailing slash; apex → www for this product. */
export function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.hostname === "cylixstudio.com") {
      url.hostname = "www.cylixstudio.com";
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}

export function publicSiteUrl(request?: Request): string {
  const configured = normalizeSiteUrl(
    process.env["PUBLIC_SITE_URL"] ?? process.env["SITE_URL"] ?? "",
  );
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured;
  }
  if (!request) return "http://localhost:3000";

  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const hostHeader = (request.headers.get("x-forwarded-host") ?? url.host)
    .split(",")[0]
    ?.trim();
  const host = hostHeader || url.host;
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (hostname === "cylixstudio.com" || hostname === "www.cylixstudio.com") {
    return CANONICAL_PRODUCTION_ORIGIN;
  }

  return `${proto}://${host}`;
}
