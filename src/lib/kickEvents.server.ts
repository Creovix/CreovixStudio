const REQUIRED_KICK_EVENTS = [
  { name: "chat.message.sent", version: 1 },
  { name: "channel.reward.redemption.updated", version: 1 },
] as const;

type KickSubscription = {
  id?: string;
  event?: string;
  broadcaster_user_id?: number;
};

/** Ensures Kick delivers chat and reward redemptions to the configured app webhook. */
export async function ensureKickMediaSubscriptions(
  accessToken: string,
  broadcasterUserId: string,
): Promise<{ ok: boolean; subscribed: string[]; errors: string[] }> {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  const broadcasterId = Number(broadcasterUserId);
  const query = Number.isSafeInteger(broadcasterId)
    ? `?broadcaster_user_id=${encodeURIComponent(String(broadcasterId))}`
    : "";
  const existingResponse = await fetch(`https://api.kick.com/public/v1/events/subscriptions${query}`, {
    headers,
  });
  const existingJson = existingResponse.ok
    ? await existingResponse.json() as { data?: KickSubscription[] }
    : { data: [] as KickSubscription[] };
  const existing = new Set((existingJson.data ?? []).map((item) => item.event));
  const missing = REQUIRED_KICK_EVENTS.filter((event) => !existing.has(event.name));
  if (!missing.length) return { ok: true, subscribed: [], errors: [] };

  const response = await fetch("https://api.kick.com/public/v1/events/subscriptions", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      events: missing,
      method: "webhook",
      ...(Number.isSafeInteger(broadcasterId) ? { broadcaster_user_id: broadcasterId } : {}),
    }),
  });
  const payload = await response.json().catch(() => ({})) as {
    data?: Array<{ name?: string; error?: string }>;
    message?: string;
  };
  const rows = payload.data ?? [];
  const subscribed = rows.filter((row) => !row.error && row.name).map((row) => String(row.name));
  const errors = rows.filter((row) => row.error).map((row) => `${row.name ?? "event"}: ${row.error}`);
  if (!response.ok && payload.message) errors.push(payload.message);
  return { ok: response.ok && errors.length === 0, subscribed, errors };
}