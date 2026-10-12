import { isRobotActivity, type RobotActivity } from "./mark-state";
import type { RobotState, RobotStatus } from "./types";

const KNOWN_STATES: readonly RobotState[] = ["idle", "cleaning", "docked", "returning", "error"];

function isKnownState(value: string): value is RobotState {
  return (KNOWN_STATES as readonly string[]).includes(value);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parsePose(value: unknown): RobotStatus["pose"] {
  if (!value || typeof value !== "object") return null;
  const pose = value as Record<string, unknown>;
  const x = finiteNumber(pose.x);
  const y = finiteNumber(pose.y);
  const heading = finiteNumber(pose.heading);
  if (x == null || y == null || heading == null) return null;
  return { x, y, heading };
}

/**
 * Fill activity and charging when the Pi omits the new fields.
 * An explicit activity or charging flag from the robot is left alone.
 */
export function withDerivedMark(status: RobotStatus): RobotStatus {
  const charging =
    typeof status.charging === "boolean"
      ? status.charging
      : status.state === "docked" && status.battery < 100;

  let activity = status.activity;
  if (!activity) {
    if (status.connected === false) activity = "offline";
    else if (status.state === "error" || status.stuck) activity = "fault";
    else if (status.state === "cleaning" || status.state === "returning") activity = "moving";
    else if (status.state === "docked" || charging) activity = "charging";
    else activity = "idle";
  }

  return { ...status, activity, charging };
}

/** Accept a /status or /live payload. Unknown optional fields are dropped. */
export function normalizeRobotStatus(value: unknown): RobotStatus | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const battery = finiteNumber(raw.battery);
  if (battery == null || typeof raw.connected !== "boolean" || typeof raw.state !== "string") return null;

  let activity: RobotActivity | undefined;
  if (typeof raw.activity === "string" && isRobotActivity(raw.activity)) activity = raw.activity;
  else if (!isKnownState(raw.state) && isRobotActivity(raw.state)) activity = raw.state;

  const state: RobotState = isKnownState(raw.state)
    ? raw.state
    : raw.state === "fault" || raw.state === "stuck"
      ? "error"
      : raw.state === "moving"
        ? "cleaning"
        : raw.state === "charging" || raw.state === "charged"
          ? "docked"
          : "idle";

  const status: RobotStatus = {
    battery,
    state,
    connected: raw.connected,
    lastSeen: typeof raw.lastSeen === "string" ? raw.lastSeen : new Date().toISOString(),
    pose: parsePose(raw.pose),
  };
  if (typeof raw.stuck === "boolean") status.stuck = raw.stuck;
  if (activity) status.activity = activity;
  if (typeof raw.charging === "boolean") status.charging = raw.charging;
  if (typeof raw.chargingState === "string") status.chargingState = raw.chargingState;
  const voltage = finiteNumber(raw.voltage);
  const current = finiteNumber(raw.current);
  const temperature = finiteNumber(raw.temperature);
  if (voltage != null) status.voltage = voltage;
  if (current != null) status.current = current;
  if (temperature != null) status.temperature = temperature;
  return withDerivedMark(status);
}
