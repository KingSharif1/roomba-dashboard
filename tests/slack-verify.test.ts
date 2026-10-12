import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { verifySlackSignature } from "../src/lib/slack/verify.ts";

const SECRET = "test_signing_secret";

function sign(secret: string, timestamp: string, body: string): string {
  return `v0=${createHmac("sha256", secret)
    .update(`v0:${timestamp}:${body}`)
    .digest("hex")}`;
}

test("a valid signature passes", () => {
  const now = 1_700_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const body = JSON.stringify({ type: "event_callback" });
  const signature = sign(SECRET, timestamp, body);

  assert.equal(
    verifySlackSignature({
      signingSecret: SECRET,
      signature,
      timestamp,
      rawBody: body,
      now,
    }),
    true,
  );
});

test("a wrong signing secret fails", () => {
  const now = 1_700_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const body = "payload";
  const signature = sign("the_wrong_secret", timestamp, body);

  assert.equal(
    verifySlackSignature({
      signingSecret: SECRET,
      signature,
      timestamp,
      rawBody: body,
      now,
    }),
    false,
  );
});

test("a tampered body fails", () => {
  const now = 1_700_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const signature = sign(SECRET, timestamp, "original body");

  assert.equal(
    verifySlackSignature({
      signingSecret: SECRET,
      signature,
      timestamp,
      rawBody: "tampered body",
      now,
    }),
    false,
  );
});

test("a stale timestamp (older than 5 minutes) fails", () => {
  const now = 1_700_000_000_000;
  // 6 minutes in the past.
  const timestamp = String(Math.floor(now / 1000) - 60 * 6);
  const body = "payload";
  const signature = sign(SECRET, timestamp, body);

  assert.equal(
    verifySlackSignature({
      signingSecret: SECRET,
      signature,
      timestamp,
      rawBody: body,
      now,
    }),
    false,
  );
});

test("a missing signature header fails", () => {
  const now = 1_700_000_000_000;
  const timestamp = String(Math.floor(now / 1000));

  assert.equal(
    verifySlackSignature({
      signingSecret: SECRET,
      signature: undefined,
      timestamp,
      rawBody: "payload",
      now,
    }),
    false,
  );
});

test("a missing signing secret fails", () => {
  const now = 1_700_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const body = "payload";
  const signature = sign(SECRET, timestamp, body);

  assert.equal(
    verifySlackSignature({
      signingSecret: undefined,
      signature,
      timestamp,
      rawBody: body,
      now,
    }),
    false,
  );
});
