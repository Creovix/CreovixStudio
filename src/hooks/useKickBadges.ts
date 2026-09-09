import { useEffect, useState } from "react";

/**
 * A badge exactly as Kick delivers it inside `sender.identity.badges`.
 * `count` carries the tier (subscriber months, gifted subs, …) and any
 * `*_image_url` field Kick may add later is preserved so new badge types
 * render without a code change.
 */
export type KickBadge = {
  type: string;
  text?: string | null;
  count?: number | null;
  /** Direct artwork URL when the payload already carries one. */
  imageUrl?: string | null;
};

/** channelSlug -> { months tier -> CDN url }, resolved from the channel API. */
const channelSubBadgeCache = new Map<string, Map<number, string>>();
/** Kick global badge artwork, resolved once per page when available. */
const globalBadgeCache = new Map<string, string>();
const inflight = new Map<string, Promise<Map<number, string>>>();

function readUrl(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["src", "url", "srcset", "original"]) {
      const nested = record[key];
      if (typeof nested === "string" && nested.startsWith("http")) return nested;
    }
  }
  return null;
}

/** Extracts the artwork URL from any Kick badge-ish object shape. */
export function badgeAssetUrl(raw: Record<string, unknown>): string | null {
  for (const key of [
    "active_asset_url",
    "badge_image_url",
    "image_url",
    "image",
    "src",
    "asset_url",
    "badge_image",
  ]) {
    const url = readUrl(raw[key]);
    if (url) return url;
  }
  return null;
}

async function loadChannelBadges(slug: string): Promise<Map<number, string>> {
  const cached = channelSubBadgeCache.get(slug);
  if (cached) return cached;

  const existing = inflight.get(slug);
  if (existing) return existing;

  const request = (async () => {
    const tiers = new Map<number, string>();
    try {
      const response = await fetch(
        `https://kick.com/api/v2/channels/${encodeURIComponent(slug.toLowerCase())}`,
        { headers: { accept: "application/json" } },
      );
      if (response.ok) {
        const payload = (await response.json()) as {
          subscriber_badges?: Record<string, unknown>[];
          role_badges?: Record<string, unknown>[];
        };
        for (const badge of payload.subscriber_badges ?? []) {
          const months = Number(badge["months"] ?? badge["count"] ?? 0);
          const url = badgeAssetUrl(badge);
          if (url && Number.isFinite(months)) tiers.set(months, url);
        }
        for (const badge of payload.role_badges ?? []) {
          const type = String(badge["type"] ?? "").toLowerCase();
          const url = badgeAssetUrl(badge);
          if (type && url) globalBadgeCache.set(type, url);
        }
      }
    } catch {
      /* Kick blocks some egress; vector fallbacks keep the overlay intact */
    }
    channelSubBadgeCache.set(slug, tiers);
    return tiers;
  })();

  inflight.set(slug, request);
  return request;
}

export type KickBadgeResolver = (badge: KickBadge) => string | null;

/** Raw badge type -> Kick's official global badge asset filename. */
const KICK_GLOBAL_BADGE_FILE: Record<string, string> = {
  broadcaster: "broadcaster",
  host: "broadcaster",
  moderator: "moderator",
  mod: "moderator",
  global_moderator: "global-moderator",
  "global-moderator": "global-moderator",
  staff: "staff",
  admin: "staff",
  trainee: "trainee",
  vip: "vip",
  og: "og",
  founder: "og",
  verified: "verified",
  sidekick: "sidekick",
  subscriber: "subscriber",
  sub_gifter: "sub-gifter",
  "sub-gifter": "sub-gifter",
  subgifter: "sub-gifter",
};

/** Official Kick CDN artwork for a global badge type (never a drawn shape). */
export function kickGlobalBadgeUrl(type: string): string | null {
  const key = type.trim().toLowerCase().replace(/\s+/g, "_");
  const file = KICK_GLOBAL_BADGE_FILE[key] ?? KICK_GLOBAL_BADGE_FILE[key.replace(/_/g, "-")];
  return file ? `https://db.kick.com/badges/${file}.png` : null;
}

/**
 * Channel-aware Kick badge resolver.
 *
 * Subscriber badges resolve to the streamer's own custom tier artwork
 * (highest tier at or below the badge count). Everything else falls back to
 * the URL carried by the payload, then to the built-in Kick vector marks.
 */
export function useKickBadges(channelSlug: string | null, enabled: boolean): KickBadgeResolver {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !channelSlug) return;
    let active = true;
    void loadChannelBadges(channelSlug).then(() => {
      if (active) setVersion((value) => value + 1);
    });
    return () => {
      active = false;
    };
  }, [channelSlug, enabled]);

  return (badge: KickBadge) => {
    if (badge.imageUrl) return badge.imageUrl;
    const type = badge.type.toLowerCase();

    if (type === "subscriber" || type === "sub") {
      const tiers = channelSlug ? channelSubBadgeCache.get(channelSlug) : null;
      if (tiers && tiers.size > 0) {
        const months = Number(badge.count ?? 0);
        let best: { months: number; url: string } | null = null;
        for (const [tier, url] of tiers) {
          if (tier <= months && (!best || tier > best.months)) best = { months: tier, url };
        }
        if (best) return best.url;
        // No tier matched the month count: use the lowest configured badge.
        const lowest = [...tiers.entries()].sort((a, b) => a[0] - b[0])[0];
        if (lowest) return lowest[1];
      }
      return kickGlobalBadgeUrl(type);
    }

    return globalBadgeCache.get(type) ?? kickGlobalBadgeUrl(type);
  };
}
