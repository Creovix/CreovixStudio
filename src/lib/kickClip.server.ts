import { supabaseAdmin } from "@/lib/supabase/client.server";

/**
 * Kick has no clip-creation API (KickDevDocs#71 is still open) and its internal
 * `clips/init` / `clips/finalize` routes need a browser session plus Cloudflare
 * clearance, so clips are produced the way working third-party Kick bots do it:
 * a rolling DVR buffer of the channel's public HLS segments is kept warm while
 * the channel is live, and `!clip` cuts the last N seconds out of that buffer.
 */

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years
/** Keep a few minutes of the live feed so `!clip 120` has material to cut. */
const BUFFER_WINDOW_SECONDS = 240;
/** Don't hammer the CDN: at most one playlist refresh per this many ms. */
const REFRESH_THROTTLE_MS = 8_000;
/** Playback URLs are signed and rotate, so re-resolve them periodically. */
const VARIANT_TTL_MS = 10 * 60 * 1000;
/** Upper bound for waiting on new segments when the buffer is still cold. */
const FORWARD_FILL_MS = 60_000;

const UA = { "User-Agent": "Mozilla/5.0 CreovixStudio" } as const;

type ChannelInfo = {
  slug: string;
  playbackUrl: string | null;
  isLive: boolean;
  title: string | null;
  thumbnail: string | null;
};

export async function fetchKickChannel(slug: string): Promise<ChannelInfo | null> {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json", ...UA },
    });
    if (!res.ok) {
      console.warn("[clip-capture] channel lookup failed", res.status, slug);
      return null;
    }
    const json = (await res.json()) as {
      slug?: string;
      playback_url?: string | null;
      livestream?: { is_live?: boolean; session_title?: string; thumbnail?: { url?: string } | null } | null;
    };
    return {
      slug: json.slug ?? slug,
      playbackUrl: json.playback_url ?? null,
      isLive: Boolean(json.livestream?.is_live),
      title: json.livestream?.session_title ?? null,
      thumbnail: json.livestream?.thumbnail?.url ?? null,
    };
  } catch (error) {
    console.error("[clip-capture] channel lookup error", error);
    return null;
  }
}

/** Picks a reasonable quality variant (highest bandwidth under ~4 Mbps). */
function pickVariant(master: string, masterUrl: string): string | null {
  const lines = master.split("\n").map((l) => l.trim());
  const variants: { bandwidth: number; url: string }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line?.startsWith("#EXT-X-STREAM-INF")) continue;
    const bandwidth = Number(/BANDWIDTH=(\d+)/.exec(line)?.[1] ?? 0);
    const target = lines[i + 1];
    if (!target || target.startsWith("#")) continue;
    variants.push({ bandwidth, url: new URL(target, masterUrl).toString() });
  }
  if (!variants.length) return null;
  variants.sort((a, b) => a.bandwidth - b.bandwidth);
  const capped = variants.filter((v) => v.bandwidth <= 4_000_000);
  return (capped.at(-1) ?? variants[0])!.url;
}

type Segment = { url: string; duration: number; seq: number; at: number };

/**
 * Segment URLs are opaque and signed, but the media sequence number plus the
 * program date time identify each segment uniquely inside the rolling window.
 */
function parseSegments(playlist: string, playlistUrl: string): Segment[] {
  const lines = playlist.split("\n").map((l) => l.trim());
  const segments: Segment[] = [];
  let sequence = Number(/#EXT-X-MEDIA-SEQUENCE:(\d+)/.exec(playlist)?.[1] ?? 0);
  let duration = 0;
  let at = 0;
  for (const line of lines) {
    if (line.startsWith("#EXT-X-PROGRAM-DATE-TIME:")) {
      at = Date.parse(line.slice(25)) || 0;
      continue;
    }
    if (line.startsWith("#EXTINF:")) {
      duration = Number.parseFloat(line.slice(8)) || 0;
      continue;
    }
    if (!line || line.startsWith("#")) continue;
    segments.push({
      url: new URL(line, playlistUrl).toString(),
      duration,
      seq: sequence,
      at: at || Date.now(),
    });
    sequence += 1;
    at = at ? at + duration * 1000 : 0;
  }
  return segments;
}

type BufferRow = {
  slug: string;
  variant_url: string | null;
  variant_refreshed_at: string | null;
  segments: Segment[];
  updated_at: string;
};

async function loadBuffer(userId: string): Promise<BufferRow | null> {
  const { data } = await supabaseAdmin
    .from("kick_stream_buffers")
    .select("slug, variant_url, variant_refreshed_at, segments, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    slug: data.slug,
    variant_url: data.variant_url,
    variant_refreshed_at: data.variant_refreshed_at,
    segments: Array.isArray(data.segments) ? (data.segments as unknown as Segment[]) : [],
    updated_at: data.updated_at,
  };
}

async function resolveVariant(slug: string): Promise<string | null> {
  const channel = await fetchKickChannel(slug);
  if (!channel?.playbackUrl) return null;
  const masterRes = await fetch(channel.playbackUrl, { headers: UA });
  if (!masterRes.ok) return null;
  const master = await masterRes.text();
  if (!master.startsWith("#EXTM3U")) return null;
  return pickVariant(master, masterRes.url || channel.playbackUrl);
}

function mergeSegments(existing: Segment[], incoming: Segment[]): Segment[] {
  const bySeq = new Map<number, Segment>();
  for (const segment of [...existing, ...incoming]) bySeq.set(segment.seq, segment);
  const merged = [...bySeq.values()].sort((a, b) => a.seq - b.seq);
  // Trim to the retention window, oldest first.
  let total = 0;
  const kept: Segment[] = [];
  for (let i = merged.length - 1; i >= 0; i -= 1) {
    const segment = merged[i]!;
    if (total >= BUFFER_WINDOW_SECONDS) break;
    kept.unshift(segment);
    total += segment.duration;
  }
  return kept;
}

/**
 * Appends whatever is currently on the live edge to the creator's rolling
 * buffer. Called on every Kick chat webhook (throttled), which keeps the buffer
 * warm for as long as the channel has any chat activity.
 */
export async function refreshKickBuffer(
  userId: string,
  slug: string,
  options: { force?: boolean } = {},
): Promise<{ seconds: number; segments: number }> {
  const row = await loadBuffer(userId);
  const staleSlug = row?.slug !== slug;
  const since = row ? Date.now() - Date.parse(row.updated_at) : Infinity;
  if (!options.force && !staleSlug && since < REFRESH_THROTTLE_MS) {
    const seconds = (row?.segments ?? []).reduce((sum, s) => sum + s.duration, 0);
    return { seconds, segments: row?.segments.length ?? 0 };
  }

  let variantUrl = staleSlug ? null : row?.variant_url ?? null;
  const variantAge = row?.variant_refreshed_at ? Date.now() - Date.parse(row.variant_refreshed_at) : Infinity;
  let variantRefreshedAt = row?.variant_refreshed_at ?? null;
  if (!variantUrl || variantAge > VARIANT_TTL_MS) {
    variantUrl = await resolveVariant(slug);
    variantRefreshedAt = new Date().toISOString();
  }
  if (!variantUrl) return { seconds: 0, segments: 0 };

  let playlistRes = await fetch(variantUrl, { headers: UA });
  if (!playlistRes.ok) {
    // Signed variant expired mid-stream — resolve a fresh one once.
    variantUrl = await resolveVariant(slug);
    variantRefreshedAt = new Date().toISOString();
    if (!variantUrl) return { seconds: 0, segments: 0 };
    playlistRes = await fetch(variantUrl, { headers: UA });
    if (!playlistRes.ok) return { seconds: 0, segments: 0 };
  }

  const incoming = parseSegments(await playlistRes.text(), variantUrl);
  const segments = mergeSegments(staleSlug ? [] : row?.segments ?? [], incoming);
  const seconds = segments.reduce((sum, s) => sum + s.duration, 0);

  await supabaseAdmin.from("kick_stream_buffers").upsert(
    {
      user_id: userId,
      slug,
      variant_url: variantUrl,
      variant_refreshed_at: variantRefreshedAt,
      segments: segments as unknown as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return { seconds, segments: segments.length };
}

export type CapturedClip = {
  url: string;
  path: string;
  seconds: number;
  bytes: number;
};

function tail(segments: Segment[], duration: number): Segment[] {
  const picked: Segment[] = [];
  let seconds = 0;
  for (let i = segments.length - 1; i >= 0 && seconds < duration; i -= 1) {
    const segment = segments[i]!;
    picked.unshift(segment);
    seconds += segment.duration;
  }
  return picked;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cuts the last `duration` seconds out of the rolling buffer, topping it up
 * from the live edge when the buffer is still colder than the request, and
 * stores the result as a single MPEG-TS file with a long-lived signed URL.
 */
export async function captureKickClip(
  userId: string,
  slug: string,
  duration: number,
): Promise<CapturedClip | { error: string }> {
  try {
    await refreshKickBuffer(userId, slug, { force: true });
    let buffer = (await loadBuffer(userId))?.segments ?? [];
    let available = buffer.reduce((sum, s) => sum + s.duration, 0);

    // Cold buffer (first !clip of the session): keep pulling the live edge until
    // enough material exists or the fill budget runs out.
    const deadline = Date.now() + FORWARD_FILL_MS;
    while (available + 1 < duration && Date.now() < deadline) {
      await sleep(4_000);
      await refreshKickBuffer(userId, slug, { force: true });
      buffer = (await loadBuffer(userId))?.segments ?? [];
      const next = buffer.reduce((sum, s) => sum + s.duration, 0);
      if (next <= available) break; // stream ended or playlist stalled
      available = next;
    }

    const picked = tail(buffer, duration);
    if (!picked.length) return { error: "stream_offline" };

    const parts: Uint8Array[] = [];
    let seconds = 0;
    for (const segment of picked) {
      const res = await fetch(segment.url, { headers: UA });
      if (!res.ok) continue;
      parts.push(new Uint8Array(await res.arrayBuffer()));
      seconds += segment.duration;
    }
    const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
    if (!total) return { error: "download_failed" };

    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.byteLength;
    }

    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.ts`;
    const upload = await supabaseAdmin.storage.from("clips").upload(path, merged, {
      contentType: "video/mp2t",
      upsert: false,
    });
    if (upload.error) {
      console.error("[clip-capture] upload failed", upload.error.message);
      return { error: "upload_failed" };
    }

    const signed = await supabaseAdmin.storage.from("clips").createSignedUrl(path, SIGNED_URL_TTL);
    if (signed.error || !signed.data?.signedUrl) {
      console.error("[clip-capture] signing failed", signed.error?.message);
      return { error: "sign_failed" };
    }

    console.log("[clip-capture] captured clip", {
      requested: duration,
      seconds: Math.round(seconds),
      bytes: total,
      path,
    });
    return { url: signed.data.signedUrl, path, seconds: Math.round(seconds), bytes: total };
  } catch (error) {
    console.error("[clip-capture] capture error", error);
    return { error: "capture_failed" };
  }
}
