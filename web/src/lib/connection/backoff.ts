/** Reconnect timing. Full jitter keeps many clients from retrying in lockstep. */
export const BACKOFF = {
  baseMs: 500,
  capMs: 15_000,
} as const;

/**
 * Delay before attempt `attempt` (0 = first retry).
 * `random` returns a value in [0, 1). The result is in [0, min(cap, base * 2^attempt)).
 */
export function backoffDelayMs(attempt: number, random: () => number = Math.random): number {
  const safeAttempt = Math.max(0, attempt);
  const ceiling = Math.min(BACKOFF.capMs, BACKOFF.baseMs * 2 ** safeAttempt);
  return Math.floor(random() * ceiling);
}
