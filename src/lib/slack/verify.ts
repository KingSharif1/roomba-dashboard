import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifySlackSignatureArgs {
  /** The Slack app signing secret (from the app's Basic Information page). */
  signingSecret: string | undefined | null;
  /** The value of the `x-slack-signature` header, e.g. `v0=abcdef...`. */
  signature: string | undefined | null;
  /** The value of the `x-slack-request-timestamp` header (unix seconds, as a string). */
  timestamp: string | undefined | null;
  /** The exact, unparsed request body. */
  rawBody: string;
  /** Current time in ms. Defaults to `Date.now()`. Injectable for tests. */
  now?: number;
}

/** Max allowed difference between now and the request timestamp (5 minutes). */
const MAX_SKEW_SECONDS = 60 * 5;

/**
 * Verify a Slack request signature per
 * https://api.slack.com/authentication/verifying-requests-from-slack.
 *
 * Returns `true` only when the signature is present, fresh (within 5 minutes),
 * and matches an HMAC-SHA256 of `v0:${timestamp}:${rawBody}` keyed with the
 * signing secret.
 */
export function verifySlackSignature({
  signingSecret,
  signature,
  timestamp,
  rawBody,
  now = Date.now(),
}: VerifySlackSignatureArgs): boolean {
  if (!signingSecret || !signature || !timestamp) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  // Replay protection: reject stale (or far-future) timestamps.
  const nowSeconds = now / 1000;
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_SKEW_SECONDS) {
    return false;
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac("sha256", signingSecret)
    .update(base)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  // timingSafeEqual throws on unequal lengths — guard first.
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
