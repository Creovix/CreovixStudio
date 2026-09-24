/**
 * Canonical public origin. Production must be https://cylixstudio.com
 * (no trailing slash). Used for OAuth redirect_uri, EventSub callbacks, and clip links.
 *
 * Always set PUBLIC_SITE_URL on Vercel/Cloudflare so Twitch/Kick redirect_uri
 * matches the exact URLs registered in each developer console — do not rely on
 * preview hosts or www/apex mismatches from request headers alone.
 */
export function publicSiteUrl(request?: Request): string {
  const configured = (process.env["PUBLIC_SITE_URL"] ?? process.env["SITE_URL"] ?? "")
    .trim()
    .replace(/\/$/, "");
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured;
  }
  if (!request) return "http://localhost:3000";
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  return `${proto}://${host}`;
}
