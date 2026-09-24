/**
 * Canonical public origin. Production must be https://creovixstudio.org
 * (no trailing slash). Used for OAuth redirect_uri, EventSub callbacks, and clip links.
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
