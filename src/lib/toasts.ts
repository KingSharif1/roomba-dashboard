import type { AccessRole, CommandResult, ConnectionPhase } from "./types";

/** How long a success toast stays up before it leaves on its own. */
export const SUCCESS_TOAST_MS = 2_500;

export const TOAST = {
  unreachable: "Robot unreachable. Check Tailscale.",
  reconnected: "Reconnected",
  stopped: "Stopped",
  stopFailed: "Stop failed",
  startFailed: "Start failed",
  dockFailed: "Dock failed",
  driveFailed: "Drive failed",
  notOwner: "Not the owner",
  signInFailed: "Sign-in failed",
  signInUnavailable: "Sign-in unavailable",
  sessionExpired: "Session expired",
  linkSent: "Link sent",
  robotError: "Robot error",
  lowBattery: "Low battery",
  stuck: "Robot stuck",
  reachable: "Reachable",
  testFailed: "Test failed",
  saved: "Saved",
  saveFailed: "Save failed",
} as const;

export const LOW_BATTERY_PERCENT = 15;

export const TOAST_KEY = {
  link: "link",
  reconnected: "link-back",
  stopOk: "stop-ok",
  start: "command:start",
  stop: "command:stop",
  dock: "command:dock",
  drive: "command:drive",
  owner: "auth:owner",
  session: "auth:session",
  signIn: "auth:signin",
  linkSent: "auth:sent",
  robotError: "robot:error",
  lowBattery: "robot:battery",
  stuck: "robot:stuck",
  probe: "link-test",
  saved: "settings:saved",
  save: "settings:save",
} as const;

export type ToastTone = "error" | "success";

export type ToastRecord = {
  id: number;
  key: string;
  tone: ToastTone;
  message: string;
  /** Null errors stay until resolved or dismissed. Successes carry an expiry. */
  expiresAt: number | null;
};

export type ToastState = {
  items: ToastRecord[];
  nextId: number;
  /** Error keys already raised this episode. Dismissing the toast does not clear the latch. */
  latched: string[];
};

export type ToastOp =
  | { type: "push"; key: string; tone: ToastTone; message: string }
  | { type: "resolve"; key: string };

export type CommandName = "start" | "stop" | "dock" | "drive";

export type LinkMemory = {
  /** The live socket phase is reconnecting or offline. */
  phaseDown: boolean;
  /** The unreachable toast was already raised for this episode. */
  shown: boolean;
};

export type ConditionMemory = {
  error: boolean;
  stuck: boolean;
  battery: boolean;
};

const FAIL_MESSAGE: Record<CommandName, string> = {
  start: TOAST.startFailed,
  stop: TOAST.stopFailed,
  dock: TOAST.dockFailed,
  drive: TOAST.driveFailed,
};

const COMMAND_KEY: Record<CommandName, string> = {
  start: TOAST_KEY.start,
  stop: TOAST_KEY.stop,
  dock: TOAST_KEY.dock,
  drive: TOAST_KEY.drive,
};

export function emptyToasts(): ToastState {
  return { items: [], nextId: 1, latched: [] };
}

export function initialLinkMemory(): LinkMemory {
  return { phaseDown: false, shown: false };
}

export function initialConditionMemory(): ConditionMemory {
  return { error: false, stuck: false, battery: false };
}

export function pushToast(state: ToastState, input: { key: string; tone: ToastTone; message: string }, now: number): ToastState {
  if (input.tone === "error" && state.latched.includes(input.key)) return state;
  const existing = state.items.find((item) => item.key === input.key);
  if (existing && existing.message === input.message && existing.tone === input.tone) return state;
  const items = state.items.filter((item) => item.key !== input.key);
  items.push({
    id: state.nextId,
    key: input.key,
    tone: input.tone,
    message: input.message,
    expiresAt: input.tone === "success" ? now + SUCCESS_TOAST_MS : null,
  });
  return {
    items,
    nextId: state.nextId + 1,
    latched: input.tone === "error" ? [...state.latched, input.key] : state.latched,
  };
}

export function dismissToast(state: ToastState, id: number): ToastState {
  const items = state.items.filter((item) => item.id !== id);
  if (items.length === state.items.length) return state;
  return { ...state, items };
}

export function resolveToast(state: ToastState, key: string): ToastState {
  const items = state.items.filter((item) => item.key !== key);
  const latched = state.latched.filter((item) => item !== key);
  if (items.length === state.items.length && latched.length === state.latched.length) return state;
  return { ...state, items, latched };
}

export function expireToasts(state: ToastState, now: number): ToastState {
  const items = state.items.filter((item) => item.expiresAt == null || item.expiresAt > now);
  if (items.length === state.items.length) return state;
  return { ...state, items };
}

export function applyToastOps(state: ToastState, ops: readonly ToastOp[], now: number): ToastState {
  let current = state;
  for (const op of ops) {
    current = op.type === "resolve"
      ? resolveToast(current, op.key)
      : pushToast(current, op, now);
  }
  return current;
}

function isPhaseDown(phase: ConnectionPhase): boolean {
  return phase === "reconnecting" || phase === "offline";
}

/**
 * Live link toasts. Demo mode never raises the Tailscale message, including
 * simulated drops. One unreachable toast per outage. Reconnect clears it.
 */
export function reduceLinkToast(
  memory: LinkMemory,
  input: { demo: boolean; phase: ConnectionPhase },
): { memory: LinkMemory; ops: ToastOp[] } {
  if (input.demo) {
    if (!memory.phaseDown && !memory.shown) return { memory, ops: [] };
    return {
      memory: initialLinkMemory(),
      ops: [
        { type: "resolve", key: TOAST_KEY.link },
        { type: "resolve", key: TOAST_KEY.reconnected },
      ],
    };
  }

  if (input.phase === "connecting") return { memory, ops: [] };

  if (isPhaseDown(input.phase)) {
    if (memory.shown) {
      if (memory.phaseDown) return { memory, ops: [] };
      return { memory: { ...memory, phaseDown: true }, ops: [] };
    }
    return {
      memory: { phaseDown: true, shown: true },
      ops: [
        { type: "resolve", key: TOAST_KEY.reconnected },
        { type: "push", key: TOAST_KEY.link, tone: "error", message: TOAST.unreachable },
      ],
    };
  }

  if (input.phase === "connected") {
    if (!memory.phaseDown) return { memory, ops: [] };
    return {
      memory: initialLinkMemory(),
      ops: [
        { type: "resolve", key: TOAST_KEY.link },
        { type: "push", key: TOAST_KEY.reconnected, tone: "success", message: TOAST.reconnected },
      ],
    };
  }

  return { memory, ops: [] };
}

/** HTTP timeout, DNS, or TLS failure while the socket phase has not dropped yet. */
export function noteLinkUnreachable(memory: LinkMemory): { memory: LinkMemory; ops: ToastOp[] } {
  if (memory.shown) return { memory, ops: [] };
  return {
    memory: { ...memory, shown: true },
    ops: [
      { type: "resolve", key: TOAST_KEY.reconnected },
      { type: "push", key: TOAST_KEY.link, tone: "error", message: TOAST.unreachable },
    ],
  };
}

/** A later successful live command clears an HTTP-only outage. The socket episode stays put. */
export function noteLinkRecovered(memory: LinkMemory): { memory: LinkMemory; ops: ToastOp[] } {
  if (memory.phaseDown || !memory.shown) return { memory, ops: [] };
  return {
    memory: { ...memory, shown: false },
    ops: [{ type: "resolve", key: TOAST_KEY.link }],
  };
}

export function commandToastOps(
  command: CommandName,
  result: CommandResult,
  demo: boolean,
): { ops: ToastOp[]; unreachable: boolean } {
  const key = COMMAND_KEY[command];
  if (result.success) {
    const ops: ToastOp[] = [{ type: "resolve", key }];
    if (command === "stop") {
      ops.push({ type: "push", key: TOAST_KEY.stopOk, tone: "success", message: TOAST.stopped });
    }
    return { ops, unreachable: false };
  }

  if (result.status === 403 || result.reason === "forbidden") {
    return {
      ops: [{ type: "push", key: TOAST_KEY.owner, tone: "error", message: TOAST.notOwner }],
      unreachable: false,
    };
  }
  if (result.status === 401 || result.reason === "unauthorized") {
    return {
      ops: [{ type: "push", key: TOAST_KEY.session, tone: "error", message: TOAST.sessionExpired }],
      unreachable: false,
    };
  }
  if (result.reason === "unreachable") {
    if (demo) {
      return {
        ops: [{ type: "push", key, tone: "error", message: FAIL_MESSAGE[command] }],
        unreachable: false,
      };
    }
    return { ops: [], unreachable: true };
  }
  return {
    ops: [{ type: "push", key, tone: "error", message: FAIL_MESSAGE[command] }],
    unreachable: false,
  };
}

const FAILURE_RANK = ["forbidden", "unauthorized", "unreachable", "rejected"] as const;

export function dominantFailure(results: readonly CommandResult[]): CommandResult {
  const failures = results.filter((result) => !result.success);
  if (failures.length === 0) return { success: true };
  for (const reason of FAILURE_RANK) {
    const match = failures.find((result) => result.reason === reason);
    if (match) return match;
  }
  return failures[0];
}

export type AuthToastCode = "not-owner" | "auth" | "unavailable" | "expired" | "sent";

export function authToastOps(code: AuthToastCode): ToastOp[] {
  switch (code) {
    case "not-owner":
      return [{ type: "push", key: TOAST_KEY.owner, tone: "error", message: TOAST.notOwner }];
    case "auth":
      return [{ type: "push", key: TOAST_KEY.signIn, tone: "error", message: TOAST.signInFailed }];
    case "unavailable":
      return [{ type: "push", key: TOAST_KEY.signIn, tone: "error", message: TOAST.signInUnavailable }];
    case "expired":
      return [{ type: "push", key: TOAST_KEY.session, tone: "error", message: TOAST.sessionExpired }];
    case "sent":
      return [{ type: "push", key: TOAST_KEY.linkSent, tone: "success", message: TOAST.linkSent }];
    default: {
      const exhaustive: never = code;
      return exhaustive;
    }
  }
}

export function accessTransitionOps(
  prevRole: AccessRole,
  next: { role: AccessRole; email: string | null },
  voluntary: boolean,
): ToastOp[] {
  if (next.role === "owner") {
    return [
      { type: "resolve", key: TOAST_KEY.owner },
      { type: "resolve", key: TOAST_KEY.session },
    ];
  }
  if (prevRole !== "owner") return [];
  if (voluntary) return [];
  if (!next.email) return authToastOps("expired");
  return authToastOps("not-owner");
}

export function isStuckStatus(status: { state: string; stuck?: boolean }): boolean {
  return status.stuck === true || status.state === "stuck";
}

export function reduceConditionToasts(
  memory: ConditionMemory,
  input: {
    demo: boolean;
    linkUp: boolean;
    state: string;
    battery: number;
    charging: boolean;
    stuck: boolean;
  },
): { memory: ConditionMemory; ops: ToastOp[] } {
  if (input.demo || !input.linkUp) {
    if (!memory.error && !memory.stuck && !memory.battery) return { memory, ops: [] };
    const ops: ToastOp[] = [];
    if (memory.error) ops.push({ type: "resolve", key: TOAST_KEY.robotError });
    if (memory.stuck) ops.push({ type: "resolve", key: TOAST_KEY.stuck });
    if (memory.battery) ops.push({ type: "resolve", key: TOAST_KEY.lowBattery });
    return { memory: initialConditionMemory(), ops };
  }

  const errorOn = input.state === "error";
  const stuckOn = input.stuck;
  const batteryOn = input.battery <= LOW_BATTERY_PERCENT && !input.charging;
  if (errorOn === memory.error && stuckOn === memory.stuck && batteryOn === memory.battery) {
    return { memory, ops: [] };
  }

  const ops: ToastOp[] = [];
  const next: ConditionMemory = { error: errorOn, stuck: stuckOn, battery: batteryOn };
  if (errorOn && !memory.error) ops.push({ type: "push", key: TOAST_KEY.robotError, tone: "error", message: TOAST.robotError });
  if (!errorOn && memory.error) ops.push({ type: "resolve", key: TOAST_KEY.robotError });
  if (stuckOn && !memory.stuck) ops.push({ type: "push", key: TOAST_KEY.stuck, tone: "error", message: TOAST.stuck });
  if (!stuckOn && memory.stuck) ops.push({ type: "resolve", key: TOAST_KEY.stuck });
  if (batteryOn && !memory.battery) ops.push({ type: "push", key: TOAST_KEY.lowBattery, tone: "error", message: TOAST.lowBattery });
  if (!batteryOn && memory.battery) ops.push({ type: "resolve", key: TOAST_KEY.lowBattery });
  return { memory: next, ops };
}

export function probeToastOps(result: CommandResult, demo: boolean): { ops: ToastOp[]; unreachable: boolean } {
  if (demo) return { ops: [], unreachable: false };
  if (result.success) {
    return {
      ops: [{ type: "push", key: TOAST_KEY.probe, tone: "success", message: TOAST.reachable }],
      unreachable: false,
    };
  }
  if (result.status === 403 || result.reason === "forbidden") {
    return { ops: authToastOps("not-owner"), unreachable: false };
  }
  if (result.status === 401 || result.reason === "unauthorized") {
    return { ops: authToastOps("expired"), unreachable: false };
  }
  if (result.reason === "unreachable") return { ops: [], unreachable: true };
  return {
    ops: [{ type: "push", key: TOAST_KEY.probe, tone: "error", message: TOAST.testFailed }],
    unreachable: false,
  };
}

export function savedToastOps(): ToastOp[] {
  return [{ type: "push", key: TOAST_KEY.saved, tone: "success", message: TOAST.saved }];
}

export function saveFailedToastOps(): ToastOp[] {
  return [{ type: "push", key: TOAST_KEY.save, tone: "error", message: TOAST.saveFailed }];
}
