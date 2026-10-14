import assert from "node:assert/strict";
import { test } from "node:test";
import { applyShowcase, SHOWCASE_PHASE_MS, statusForPreview } from "../src/lib/demo/showcase.ts";
import { markStateFrom, statusTone, TONE_HEX } from "../src/lib/mark-state.ts";
import { normalizeRobotStatus } from "../src/lib/robot-status.ts";
import type { RobotStatus } from "../src/lib/types.ts";

const base: RobotStatus = {
  battery: 80,
  state: "idle",
  connected: true,
  lastSeen: "2026-01-01T00:00:00.000Z",
  pose: { x: 0.5, y: 0.5, heading: 0 },
};

test("mark state follows offline, fault, stopped, charge, low, moving, idle", () => {
  assert.equal(markStateFrom(null), "offline");
  assert.equal(markStateFrom({ connected: false, activity: "fault", battery: 10 }), "offline");
  assert.equal(markStateFrom({ connected: true, activity: "offline", battery: 80 }), "offline");
  assert.equal(markStateFrom({ connected: true, activity: "fault", charging: true, battery: 10 }), "fault");
  assert.equal(markStateFrom({ connected: true, activity: "stopped", charging: true, battery: 10 }), "stopped");
  assert.equal(markStateFrom({ connected: true, activity: "charging", battery: 64 }), "charging");
  assert.equal(markStateFrom({ connected: true, charging: true, battery: 99 }), "full");
  assert.equal(markStateFrom({ connected: true, charging: true, battery: 98.9 }), "charging");
  assert.equal(markStateFrom({ connected: true, activity: "moving", battery: 19.9 }), "low");
  assert.equal(markStateFrom({ connected: true, activity: "moving", battery: 20 }), "moving");
  assert.equal(markStateFrom({ connected: true, activity: "idle", battery: 80 }), "idle");
  assert.equal(markStateFrom({ connected: true, battery: 80 }), "idle");
});

test("status colors stay on one meaning", () => {
  assert.equal(statusTone({ connected: true, activity: "moving", battery: 70 }), "ok");
  assert.equal(statusTone({ connected: true, activity: "idle", battery: 80 }), "ok");
  assert.equal(statusTone({ connected: true, activity: "charging", battery: 100 }), "ok");
  assert.equal(statusTone({ connected: true, activity: "charging", battery: 40 }), "charging");
  assert.equal(statusTone({ connected: true, battery: 12 }), "low");
  assert.equal(statusTone({ connected: true, activity: "stopped", battery: 80 }), "alert");
  assert.equal(statusTone({ connected: true, activity: "fault", battery: 80 }), "alert");
  assert.equal(statusTone({ connected: false, battery: 80 }), "offline");
  assert.equal(TONE_HEX.ok, "#00ff9d");
  assert.equal(TONE_HEX.charging, "#ffd23f");
  assert.equal(TONE_HEX.low, "#ff7a1a");
  assert.equal(TONE_HEX.alert, "#ff3b3b");
  assert.equal(TONE_HEX.offline, "#666666");
});

test("optional pi fields are kept and missing ones are derived", () => {
  const live = normalizeRobotStatus({
    battery: 41,
    state: "idle",
    connected: true,
    lastSeen: "2026-01-01T00:00:00.000Z",
    pose: { x: 1, y: 2, heading: 0 },
    activity: "stopped",
    charging: false,
    chargingState: "off",
    voltage: 14.2,
    current: -0.4,
    temperature: 31,
    extra: "ignore",
  });
  assert.equal(live?.activity, "stopped");
  assert.equal(live?.charging, false);
  assert.equal(live?.chargingState, "off");
  assert.equal(live?.voltage, 14.2);
  assert.equal(live?.current, -0.4);
  assert.equal(live?.temperature, 31);
  assert.equal("extra" in (live ?? {}), false);
  assert.equal(markStateFrom(live), "stopped");

  const legacy = normalizeRobotStatus({
    battery: 78,
    state: "docked",
    connected: true,
    lastSeen: "2026-01-01T00:00:00.000Z",
    pose: null,
  });
  assert.equal(legacy?.activity, "charging");
  assert.equal(legacy?.charging, true);
  assert.equal(markStateFrom(legacy), "charging");

  const cleaning = normalizeRobotStatus({ ...base, state: "cleaning", battery: 10 });
  assert.equal(cleaning?.activity, "moving");
  assert.equal(markStateFrom(cleaning), "low");

  const broken = normalizeRobotStatus({
    ...base,
    voltage: "14V",
    current: Number.NaN,
    temperature: null,
    activity: "nope",
    chargingState: 1,
  });
  assert.equal(broken?.voltage, undefined);
  assert.equal(broken?.current, undefined);
  assert.equal(broken?.temperature, undefined);
  assert.equal(broken?.chargingState, undefined);
  assert.equal(broken?.activity, "idle");

  assert.equal(normalizeRobotStatus({ battery: 1, connected: true }), null);
  assert.equal(normalizeRobotStatus(null), null);
});

test("demo showcase cycles moving, charging, low, and idle", () => {
  const phases = [0, 1, 2, 3, 4].map((step) => markStateFrom(applyShowcase(base, step * SHOWCASE_PHASE_MS)));
  assert.deepEqual(phases, ["moving", "charging", "low", "idle", "moving"]);
});

test("a mark preview pins each logo state", () => {
  const expected = {
    offline: "offline",
    fault: "fault",
    stopped: "stopped",
    charging: "charging",
    charged: "full",
    low: "low",
    moving: "moving",
    idle: "idle",
  } as const;
  for (const [preview, mark] of Object.entries(expected)) {
    assert.equal(markStateFrom(statusForPreview(preview as keyof typeof expected, base)), mark);
  }
});
