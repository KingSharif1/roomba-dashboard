import assert from "node:assert/strict";
import { test } from "node:test";
import { describeConnection } from "../src/lib/connection/labels.ts";
import { toWebSocketUrl } from "../src/lib/connection/ws-url.ts";
import {
  DEMO_DROP_FOR_MS,
  DEMO_OFFLINE_AFTER_MS,
  demoLinkPhase,
  forceDemoDrop,
  initialDemoLink,
  stepDemoLink,
} from "../src/lib/demo/link.ts";
import { integrateDrivePose } from "../src/lib/demo/physics.ts";

test("connection labels stay in plain language", () => {
  assert.equal(describeConnection("demo", true), "Demo mode");
  assert.equal(describeConnection("connecting", false), "Connecting…");
  assert.equal(describeConnection("reconnecting", false), "Reconnecting…");
  assert.equal(describeConnection("offline", false), "Robot offline");
  assert.equal(describeConnection("connected", true), "Connected");
  assert.equal(describeConnection("connected", false), "Robot offline");
});

test("https robot origins become wss /live", () => {
  assert.equal(toWebSocketUrl("https://roomba.example.ts.net"), "wss://roomba.example.ts.net/live");
  assert.equal(toWebSocketUrl("http://127.0.0.1:8000/"), "ws://127.0.0.1:8000/live");
});

test("drive commands move the demo pose", () => {
  const next = integrateDrivePose({ x: 0.5, y: 0.5, heading: 0 }, 0.4, 0, 1, 4);
  assert.ok(Math.abs(next.x - 0.6) < 1e-9);
  assert.ok(Math.abs(next.y - 0.5) < 1e-9);

  const turned = integrateDrivePose({ x: 0.5, y: 0.5, heading: 0 }, 0, Math.PI / 2, 1, 4);
  assert.ok(Math.abs(turned.heading - Math.PI / 2) < 1e-9);
  assert.equal(turned.x, 0.5);
});

test("a simulated drop moves through reconnecting and offline", () => {
  const start = 1_000;
  let link = initialDemoLink(start);
  assert.equal(demoLinkPhase(link, start), "demo");

  link = forceDemoDrop(link, start, DEMO_DROP_FOR_MS);
  assert.equal(demoLinkPhase(link, start), "reconnecting");
  assert.equal(demoLinkPhase(link, start + DEMO_OFFLINE_AFTER_MS), "offline");
  assert.equal(demoLinkPhase(link, start + DEMO_DROP_FOR_MS), "demo");
});

test("the demo link drops on its own and then returns", () => {
  const start = 0;
  const link = initialDemoLink(start);
  const dropped = stepDemoLink(link, link.nextDropAt);
  assert.equal(demoLinkPhase(dropped, dropped.dropStarted ?? 0), "reconnecting");
  assert.equal(demoLinkPhase(dropped, dropped.dropUntil), "demo");
});
