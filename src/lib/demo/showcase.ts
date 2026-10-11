import type { RobotStatus } from "../types";
import { DOCK } from "./physics";

/** Visitors who are not driving see the mark move, charge, run low, then sit idle. */
export const SHOWCASE_ORDER = ["moving", "charging", "low", "idle"] as const;
export type ShowcasePhase = (typeof SHOWCASE_ORDER)[number];
export const SHOWCASE_PHASE_MS = 8_000;

export const MARK_PREVIEWS = [
  "offline",
  "fault",
  "stopped",
  "charging",
  "charged",
  "low",
  "moving",
  "idle",
] as const;
export type MarkPreview = (typeof MARK_PREVIEWS)[number];

export function isMarkPreview(value: string | null | undefined): value is MarkPreview {
  return !!value && (MARK_PREVIEWS as readonly string[]).includes(value);
}

export function showcasePhase(now: number): ShowcasePhase {
  const index = Math.floor(Math.max(0, now) / SHOWCASE_PHASE_MS) % SHOWCASE_ORDER.length;
  return SHOWCASE_ORDER[index];
}

function movingPose(now: number): NonNullable<RobotStatus["pose"]> {
  const angle = ((now % 20_000) / 20_000) * Math.PI * 2;
  return {
    x: 0.5 + Math.cos(angle) * 0.18,
    y: 0.45 + Math.sin(angle) * 0.12,
    heading: angle + Math.PI / 2,
  };
}

export function applyShowcase(base: RobotStatus, now: number): RobotStatus {
  const phase = showcasePhase(now);
  const pose = base.pose ? { ...base.pose } : { x: DOCK.x, y: DOCK.y, heading: 0 };
  if (phase === "moving") {
    return {
      ...base,
      connected: true,
      state: "cleaning",
      activity: "moving",
      charging: false,
      battery: 72,
      stuck: false,
      pose: movingPose(now),
    };
  }
  if (phase === "charging") {
    return {
      ...base,
      connected: true,
      state: "docked",
      activity: "charging",
      charging: true,
      battery: 64,
      stuck: false,
      pose: { x: DOCK.x, y: DOCK.y, heading: 0 },
    };
  }
  if (phase === "low") {
    return {
      ...base,
      connected: true,
      state: "idle",
      activity: "idle",
      charging: false,
      battery: 12,
      stuck: false,
      pose,
    };
  }
  return {
    ...base,
    connected: true,
    state: "idle",
    activity: "idle",
    charging: false,
    battery: 81,
    stuck: false,
    pose,
  };
}

/** Pins one logo state. Used by `?mark=` so each state can be shown on the real page. */
export function statusForPreview(preview: MarkPreview, base: RobotStatus): RobotStatus {
  const pose = base.pose ? { ...base.pose } : { x: 0.5, y: 0.55, heading: 0.2 };
  const shared: RobotStatus = { ...base, stuck: false, pose };
  switch (preview) {
    case "offline":
      return { ...shared, connected: false, state: "idle", activity: "offline", charging: false, battery: 40 };
    case "fault":
      return { ...shared, connected: true, state: "error", activity: "fault", charging: false, battery: 54, stuck: true };
    case "stopped":
      return { ...shared, connected: true, state: "idle", activity: "stopped", charging: false, battery: 61 };
    case "charging":
      return {
        ...shared,
        connected: true,
        state: "docked",
        activity: "charging",
        charging: true,
        battery: 64,
        pose: { x: DOCK.x, y: DOCK.y, heading: 0 },
      };
    case "charged":
      return {
        ...shared,
        connected: true,
        state: "docked",
        activity: "charging",
        charging: true,
        battery: 100,
        pose: { x: DOCK.x, y: DOCK.y, heading: 0 },
      };
    case "low":
      return { ...shared, connected: true, state: "idle", activity: "idle", charging: false, battery: 14 };
    case "moving":
      return { ...shared, connected: true, state: "cleaning", activity: "moving", charging: false, battery: 72 };
    case "idle":
      return { ...shared, connected: true, state: "idle", activity: "idle", charging: false, battery: 81 };
    default: {
      const exhaustive: never = preview;
      return exhaustive;
    }
  }
}
