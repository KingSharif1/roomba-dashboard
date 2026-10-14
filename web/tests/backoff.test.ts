import assert from "node:assert/strict";
import { test } from "node:test";
import { BACKOFF, backoffDelayMs } from "../src/lib/connection/backoff.ts";

test("backoff delay is full jitter inside the capped exponential window", () => {
  assert.equal(backoffDelayMs(10, () => 0), 0);

  const ceiling = BACKOFF.capMs;
  const high = backoffDelayMs(10, () => 0.999);
  assert.equal(high, Math.floor(0.999 * ceiling));
  assert.ok(high < ceiling);

  const secondRetry = backoffDelayMs(1, () => 0.5);
  const expected = Math.min(BACKOFF.capMs, BACKOFF.baseMs * 2);
  assert.equal(secondRetry, Math.floor(0.5 * expected));
});

test("negative attempts are treated as the first retry", () => {
  assert.equal(backoffDelayMs(-4, () => 0.5), Math.floor(0.5 * BACKOFF.baseMs));
});
