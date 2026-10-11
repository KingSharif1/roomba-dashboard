import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TOAST,
  TOAST_KEY,
  SUCCESS_TOAST_MS,
  accessTransitionOps,
  applyToastOps,
  authToastOps,
  commandToastOps,
  dismissToast,
  dominantFailure,
  emptyToasts,
  expireToasts,
  initialConditionMemory,
  initialLinkMemory,
  noteLinkRecovered,
  noteLinkUnreachable,
  probeToastOps,
  pushToast,
  reduceConditionToasts,
  resolveToast,
  reduceLinkToast,
  type ConditionMemory,
  type LinkMemory,
  type ToastState,
} from "../src/lib/toasts.ts";
import type { CommandResult, ConnectionPhase } from "../src/lib/types.ts";

function messages(state: ToastState): string[] {
  return state.items.map((item) => item.message);
}

function stepLink(memory: LinkMemory, state: ToastState, phase: ConnectionPhase, demo = false, now = 0) {
  const reduced = reduceLinkToast(memory, { demo, phase });
  return { memory: reduced.memory, state: applyToastOps(state, reduced.ops, now) };
}

test("a live outage raises one Tailscale toast until reconnect", () => {
  let memory = initialLinkMemory();
  let state = emptyToasts();
  ({ memory, state } = stepLink(memory, state, "connecting"));
  assert.deepEqual(messages(state), []);

  ({ memory, state } = stepLink(memory, state, "reconnecting"));
  assert.deepEqual(messages(state), [TOAST.unreachable]);
  assert.equal(state.items[0].tone, "error");
  assert.equal(state.items[0].expiresAt, null);
  const id = state.items[0].id;

  ({ memory, state } = stepLink(memory, state, "offline"));
  ({ memory, state } = stepLink(memory, state, "reconnecting"));
  ({ memory, state } = stepLink(memory, state, "connecting"));
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].id, id);

  state = dismissToast(state, id);
  ({ memory, state } = stepLink(memory, state, "offline"));
  assert.deepEqual(messages(state), []);

  ({ memory, state } = stepLink(memory, state, "connected", false, 10));
  assert.deepEqual(messages(state), [TOAST.reconnected]);
  assert.equal(state.items[0].tone, "success");
  assert.equal(state.items[0].expiresAt, 10 + SUCCESS_TOAST_MS);

  state = expireToasts(state, 10 + SUCCESS_TOAST_MS);
  assert.deepEqual(messages(state), []);

  ({ memory, state } = stepLink(memory, state, "offline"));
  assert.deepEqual(messages(state), [TOAST.unreachable]);
});

test("demo mode never shows the Tailscale toast, and leaving live mode clears it", () => {
  let memory = initialLinkMemory();
  let state = emptyToasts();
  ({ memory, state } = stepLink(memory, state, "reconnecting", true));
  ({ memory, state } = stepLink(memory, state, "offline", true));
  assert.deepEqual(messages(state), []);

  ({ memory, state } = stepLink(memory, state, "offline", false));
  assert.deepEqual(messages(state), [TOAST.unreachable]);
  ({ memory, state } = stepLink(memory, state, "offline", true));
  assert.deepEqual(messages(state), []);
  assert.equal(memory.shown, false);
});

test("the first successful connect is not announced as reconnected", () => {
  const reduced = reduceLinkToast(initialLinkMemory(), { demo: false, phase: "connected" });
  assert.deepEqual(reduced.ops, []);
});

test("an HTTP failure shares the unreachable toast and a later success clears it", () => {
  let memory = initialLinkMemory();
  let state = emptyToasts();
  const first = noteLinkUnreachable(memory);
  memory = first.memory;
  state = applyToastOps(state, first.ops, 0);
  const again = noteLinkUnreachable(memory);
  assert.equal(again.memory, memory);
  state = applyToastOps(state, again.ops, 0);
  assert.deepEqual(messages(state), [TOAST.unreachable]);

  const stillUp = reduceLinkToast(memory, { demo: false, phase: "connected" });
  assert.deepEqual(stillUp.ops, []);

  const recovered = noteLinkRecovered(memory);
  state = applyToastOps(state, recovered.ops, 0);
  assert.deepEqual(messages(state), []);
  assert.equal(recovered.memory.shown, false);
});

test("command failures, rejections, and stop confirmation", () => {
  const now = 50;
  const fail = (command: "start" | "dock" | "drive" | "stop", result: CommandResult, demo = false) => {
    const planned = commandToastOps(command, result, demo);
    return planned;
  };

  const start = fail("start", { success: false, reason: "rejected" });
  assert.equal(start.unreachable, false);
  assert.equal(start.ops[0].type === "push" && start.ops[0].message, TOAST.startFailed);

  const dock = fail("dock", { success: false, status: 500, reason: "rejected" });
  assert.equal(dock.ops[0].type === "push" && dock.ops[0].message, TOAST.dockFailed);

  const drive = fail("drive", { success: false, reason: "rejected" });
  let state = applyToastOps(emptyToasts(), drive.ops, now);
  state = applyToastOps(state, commandToastOps("drive", { success: false, reason: "rejected" }, false).ops, now);
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].message, TOAST.driveFailed);
  state = applyToastOps(state, commandToastOps("drive", { success: true }, false).ops, now);
  assert.deepEqual(messages(state), []);

  const forbidden = commandToastOps("start", { success: false, status: 403, reason: "forbidden" }, false);
  assert.equal(forbidden.ops[0].type === "push" && forbidden.ops[0].message, TOAST.notOwner);
  assert.equal(forbidden.ops[0].type === "push" && forbidden.ops[0].key, TOAST_KEY.owner);

  const expired = commandToastOps("dock", { success: false, status: 401, reason: "unauthorized" }, false);
  assert.equal(expired.ops[0].type === "push" && expired.ops[0].message, TOAST.sessionExpired);

  const liveDown = commandToastOps("drive", { success: false, reason: "unreachable" }, false);
  assert.equal(liveDown.unreachable, true);
  assert.deepEqual(liveDown.ops, []);

  const demoDown = commandToastOps("start", { success: false, reason: "unreachable" }, true);
  assert.equal(demoDown.unreachable, false);
  assert.equal(demoDown.ops[0].type === "push" && demoDown.ops[0].message, TOAST.startFailed);

  const stopped = commandToastOps("stop", { success: true }, true);
  state = applyToastOps(emptyToasts(), stopped.ops, now);
  state = applyToastOps(state, commandToastOps("stop", { success: true }, false).ops, now);
  assert.deepEqual(messages(state), [TOAST.stopped]);
  assert.equal(state.items[0].tone, "success");
  state = expireToasts(state, now + SUCCESS_TOAST_MS);
  assert.deepEqual(messages(state), []);

  const routine = commandToastOps("start", { success: true }, false);
  assert.deepEqual(applyToastOps(emptyToasts(), routine.ops, now).items, []);

  const stopFailed = commandToastOps("stop", { success: false, reason: "rejected" }, false);
  const sticky = applyToastOps(emptyToasts(), stopFailed.ops, now);
  assert.equal(sticky.items[0].message, TOAST.stopFailed);
  assert.equal(expireToasts(sticky, now + 60_000).items.length, 1);
});

test("stop reports the most serious failure when REST and drive both miss", () => {
  assert.deepEqual(dominantFailure([{ success: true }, { success: true }]), { success: true });
  const picked = dominantFailure([
    { success: false, reason: "unreachable" },
    { success: false, status: 403, reason: "forbidden" },
  ]);
  assert.equal(picked.reason, "forbidden");
  const network = dominantFailure([
    { success: false, reason: "rejected" },
    { success: false, reason: "unreachable" },
  ]);
  assert.equal(network.reason, "unreachable");
});

test("sign-in, session loss, and a voluntary logout", () => {
  assert.equal(authToastOps("auth")[0].type === "push" && authToastOps("auth")[0].message, TOAST.signInFailed);
  assert.equal(authToastOps("unavailable")[0].type === "push" && authToastOps("unavailable")[0].message, TOAST.signInUnavailable);
  assert.equal(authToastOps("sent")[0].type === "push" && authToastOps("sent")[0].tone, "success");
  assert.equal(authToastOps("not-owner")[0].type === "push" && authToastOps("not-owner")[0].message, TOAST.notOwner);
  assert.equal(authToastOps("expired")[0].type === "push" && authToastOps("expired")[0].message, TOAST.sessionExpired);

  assert.deepEqual(accessTransitionOps("unknown", { role: "visitor", email: null }, false), []);
  assert.equal(
    accessTransitionOps("owner", { role: "visitor", email: null }, false)[0].type === "push"
      && accessTransitionOps("owner", { role: "visitor", email: null }, false)[0].message,
    TOAST.sessionExpired,
  );
  assert.equal(
    accessTransitionOps("owner", { role: "visitor", email: "other@example.com" }, false)[0].type === "push"
      && accessTransitionOps("owner", { role: "visitor", email: "other@example.com" }, false)[0].message,
    TOAST.notOwner,
  );
  assert.deepEqual(accessTransitionOps("owner", { role: "visitor", email: null }, true), []);
  const restored = accessTransitionOps("visitor", { role: "owner", email: "sharifahmed.dev@gmail.com" }, false);
  assert.deepEqual(restored.map((op) => op.type === "resolve" && op.key), [TOAST_KEY.owner, TOAST_KEY.session]);
});

test("robot error, low battery, and stuck are one sticky toast each and stay quiet in demo", () => {
  let memory: ConditionMemory = initialConditionMemory();
  let state = emptyToasts();
  const step = (patch: Partial<Parameters<typeof reduceConditionToasts>[1]>) => {
    const reduced = reduceConditionToasts(memory, {
      demo: false,
      linkUp: true,
      state: "idle",
      battery: 80,
      charging: false,
      stuck: false,
      ...patch,
    });
    memory = reduced.memory;
    state = applyToastOps(state, reduced.ops, 0);
  };

  step({ demo: true, state: "error", battery: 5, stuck: true });
  assert.deepEqual(messages(state), []);

  step({ state: "error", battery: 10, stuck: true });
  assert.deepEqual(messages(state), [TOAST.robotError, TOAST.stuck, TOAST.lowBattery]);
  const ids = state.items.map((item) => item.id);
  step({ state: "error", battery: 10, stuck: true });
  assert.deepEqual(state.items.map((item) => item.id), ids);

  state = dismissToast(state, state.items[0].id);
  step({ state: "error", battery: 10, stuck: true });
  assert.equal(messages(state).includes(TOAST.robotError), false);

  step({ state: "cleaning", battery: 40, stuck: false });
  assert.deepEqual(messages(state), []);

  step({ state: "error", battery: 9, stuck: false });
  assert.deepEqual(messages(state), [TOAST.robotError, TOAST.lowBattery]);

  step({ state: "error", battery: 9, charging: true });
  assert.deepEqual(messages(state), [TOAST.robotError]);

  step({ linkUp: false, state: "error", battery: 4 });
  assert.deepEqual(messages(state), []);
});

test("a connection probe confirms reachability without repeating the Tailscale toast", () => {
  const ok = probeToastOps({ success: true }, false);
  assert.equal(ok.ops[0].type === "push" && ok.ops[0].message, TOAST.reachable);
  assert.equal(ok.ops[0].type === "push" && ok.ops[0].tone, "success");

  const down = probeToastOps({ success: false, reason: "unreachable" }, false);
  assert.equal(down.unreachable, true);
  assert.deepEqual(down.ops, []);

  const denied = probeToastOps({ success: false, status: 403, reason: "forbidden" }, false);
  assert.equal(denied.ops[0].type === "push" && denied.ops[0].message, TOAST.notOwner);

  const http = probeToastOps({ success: false, status: 500, reason: "rejected" }, false);
  assert.equal(http.ops[0].type === "push" && http.ops[0].message, TOAST.testFailed);

  assert.deepEqual(probeToastOps({ success: false, reason: "unreachable" }, true).ops, []);
});

test("duplicate keys collapse and successes expire", () => {
  let state = emptyToasts();
  state = pushToast(state, { key: "stop-ok", tone: "success", message: TOAST.stopped }, 0);
  state = pushToast(state, { key: "stop-ok", tone: "success", message: TOAST.stopped }, 100);
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].expiresAt, SUCCESS_TOAST_MS);
  assert.equal(expireToasts(state, SUCCESS_TOAST_MS - 1).items.length, 1);
  assert.equal(expireToasts(state, SUCCESS_TOAST_MS).items.length, 0);

  state = pushToast(emptyToasts(), { key: "link", tone: "error", message: TOAST.unreachable }, 0);
  assert.equal(expireToasts(state, 10_000).items.length, 1);
  const dismissed = dismissToast(state, state.items[0].id);
  assert.equal(dismissed.items.length, 0);
  const again = pushToast(dismissed, { key: "link", tone: "error", message: TOAST.unreachable }, 0);
  assert.equal(again.items.length, 0);
  const resolved = resolveToast(dismissed, "link");
  const next = pushToast(resolved, { key: "link", tone: "error", message: TOAST.unreachable }, 0);
  assert.equal(next.items.length, 1);
});
