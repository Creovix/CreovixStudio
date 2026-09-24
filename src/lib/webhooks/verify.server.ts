import { createHmac, timingSafeEqual, createVerify } from "crypto";

const KICK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/+l1WnlRrGSolDMA+A8
6rAhMbQGmQ2SapVcGM3zq8ANXjnhDWocMqfWcTd95btDydITa10kDvHzw9WQOqp2
MZI7ZyrfzJuz5nhTPCiJwTwnEtWft7nV14BYRDHvlfqPUaZ+1KR4OCaO/wWIk/rQ
L/TjY0M70gse8rlBkbo2a8rKhu69RQTRsoaf4DVhDPEeSeI5jVrRDGAMGL3cGuyY
6CLKGdjVEM78g3JfYOvDU/RvfqD7L89TZ3iN94jrmWdGz34JNlEI5hqK8dd7C5EF
BEbZ5jgB8s8ReQV8H+MkuffjdAj3ajDDX3DOJMIut1lBrUVD1AaSrGCKHooWoL2e
twIDAQAB
-----END PUBLIC KEY-----`;

/** Constant-time comparison of two ASCII/hex/base64 strings. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Twitch EventSub — HMAC-SHA256 over (messageId + timestamp + rawBody),
 * compared against the `Twitch-Eventsub-Message-Signature` header.
 */
export function verifyTwitchSignature(params: {
  secret: string;
  messageId: string | null;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
}): boolean {
  const { secret, messageId, timestamp, signature, rawBody } = params;
  if (!messageId || !timestamp || !signature) return false;

  // Reject replays older than 10 minutes (Twitch's own recommendation).
  const sent = Date.parse(timestamp);
  if (Number.isNaN(sent) || Math.abs(Date.now() - sent) > 10 * 60 * 1000) return false;

  const expected =
    "sha256=" +
    createHmac("sha256", secret)
      .update(messageId + timestamp + rawBody)
      .digest("hex");
  return safeEqual(signature, expected);
}

/**
 * Kick — RSA-SHA256 signature over (messageId.timestamp.rawBody), base64 in
 * `Kick-Event-Signature`, verified with Kick's public key. Projects using a
 * shared-secret relay instead can set KICK_WEBHOOK_SECRET for HMAC mode.
 */
export function verifyKickSignature(params: {
  publicKeyPem: string | undefined;
  hmacSecret: string | undefined;
  messageId: string | null;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
}): boolean {
  const { publicKeyPem, hmacSecret, messageId, timestamp, signature, rawBody } = params;
  if (!signature || !messageId || !timestamp) return false;
  const payload = `${messageId}.${timestamp}.${rawBody}`;

  const verificationKey = publicKeyPem?.trim() || KICK_PUBLIC_KEY;
  if (verificationKey) {
    try {
      const verifier = createVerify("RSA-SHA256");
      verifier.update(payload);
      verifier.end();
      return verifier.verify(verificationKey, Buffer.from(signature, "base64"));
    } catch {
      return false;
    }
  }

  if (hmacSecret) {
    const expected = createHmac("sha256", hmacSecret).update(payload).digest("base64");
    return safeEqual(signature, expected);
  }

  return false;
}

/**
 * StreamElements sends HS256 JWTs. Verifies signature with the channel's
 * StreamElements JWT secret and returns the decoded payload.
 */
export function verifyStreamElementsJwt(
  token: string,
  secret: string,
): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts as [string, string, string];

  const expected = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8")) as {
      alg?: string;
    };
    if (decodedHeader.alg !== "HS256") return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    const exp = decoded["exp"];
    if (typeof exp === "number" && exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}
