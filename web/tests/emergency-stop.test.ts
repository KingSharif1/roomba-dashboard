import assert from "node:assert/strict";
import { test } from "node:test";
import { issueEmergencyStop } from "../src/lib/connection/emergency-stop.ts";

test("demo stop stays local", async () => {
  let demo = 0;
  let rest = 0;
  const result = await issueEmergencyStop({
    demo: true,
    socketOpen: true,
    sendSocket: () => { throw new Error("should not send"); },
    postStop: async () => { rest += 1; return { success: true }; },
    postZeroDrive: async () => ({ success: true }),
    applyDemoStop: () => { demo += 1; },
  });
  assert.equal(result.via, "demo");
  assert.equal(result.success, true);
  assert.equal(demo, 1);
  assert.equal(rest, 0);
});

test("a down socket falls back to REST immediately", async () => {
  const order: string[] = [];
  const result = await issueEmergencyStop({
    demo: false,
    socketOpen: false,
    sendSocket: () => order.push("socket"),
    postStop: async () => { order.push("rest"); return { success: true }; },
    postZeroDrive: async () => { order.push("drive"); return { success: false }; },
    applyDemoStop: () => order.push("demo"),
  });
  assert.deepEqual(order, ["rest", "drive"]);
  assert.equal(result.via, "rest");
  assert.equal(result.success, true);
});

test("an open socket still posts REST because /live is status-only", async () => {
  const order: string[] = [];
  const result = await issueEmergencyStop({
    demo: false,
    socketOpen: true,
    sendSocket: (payload) => {
      order.push(payload);
    },
    postStop: async () => { order.push("rest"); return { success: true }; },
    postZeroDrive: async () => { order.push("drive"); return { success: true }; },
    applyDemoStop: () => order.push("demo"),
  });
  assert.equal(order[0], JSON.stringify({ type: "stop" }));
  assert.deepEqual(order.slice(1), ["rest", "drive"]);
  assert.equal(result.via, "socket+rest");
});

test("a socket send failure still posts REST", async () => {
  let rest = 0;
  const result = await issueEmergencyStop({
    demo: false,
    socketOpen: true,
    sendSocket: () => { throw new Error("closed"); },
    postStop: async () => { rest += 1; return { success: true }; },
    postZeroDrive: async () => ({ success: false }),
    applyDemoStop: () => {},
  });
  assert.equal(rest, 1);
  assert.equal(result.via, "rest");
  assert.equal(result.success, true);
});
