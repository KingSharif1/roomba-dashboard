import type { RobotStatus } from "../types";

/** Demo map is a 4 meter square drawn in the existing 0–1 map frame. */
export const DEMO_ROOM_METERS = 4;
export const DOCK = { x: 0.5, y: 0.8 };

export type Pose = { x: number; y: number; heading: number };

export function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Integrate a drive command. `heading` is radians, matching the current map canvas. */
export function integrateDrivePose(
  pose: Pose,
  linear: number,
  angular: number,
  dtSec: number,
  roomMeters = DEMO_ROOM_METERS,
): Pose {
  const heading = pose.heading + angular * dtSec;
  const distance = (linear * dtSec) / roomMeters;
  return {
    x: clampUnit(pose.x + Math.cos(heading) * distance),
    y: clampUnit(pose.y + Math.sin(heading) * distance),
    heading,
  };
}

export function jitterPose(pose: Pose, dtSec: number, random: () => number): Pose {
  const heading = pose.heading + (random() - 0.5) * 0.5;
  const step = 0.02 * dtSec;
  return {
    x: clampUnit(pose.x + Math.cos(heading) * step),
    y: clampUnit(pose.y + Math.sin(heading) * step),
    heading,
  };
}

export function approachDock(pose: Pose, dtSec: number): { pose: Pose; arrived: boolean } {
  const gain = Math.min(1, dtSec * 0.8);
  const x = pose.x + (DOCK.x - pose.x) * gain;
  const y = pose.y + (DOCK.y - pose.y) * gain;
  const arrived = Math.abs(x - DOCK.x) < 0.02 && Math.abs(y - DOCK.y) < 0.02;
  return { pose: { x, y, heading: pose.heading }, arrived };
}

export type MotionInput = {
  status: RobotStatus;
  linear: number;
  angular: number;
  dtSec: number;
  manual: boolean;
  autoCleaning: boolean;
  random?: () => number;
};

export type MotionResult = {
  status: RobotStatus;
  manual: boolean;
};

export function stepMotion(input: MotionInput): MotionResult {
  const random = input.random ?? Math.random;
  const status: RobotStatus = {
    ...input.status,
    pose: input.status.pose ? { ...input.status.pose } : { x: DOCK.x, y: DOCK.y, heading: 0 },
  };
  let manual = input.manual;
  const dt = Math.max(0, input.dtSec);
  const moving = Math.abs(input.linear) > 0.001 || Math.abs(input.angular) > 0.001;

  if (moving) {
    if (status.state === "docked" || status.state === "idle" || status.state === "error" || status.state === "returning") {
      status.state = "cleaning";
      if (!input.autoCleaning) manual = true;
    }
    status.pose = integrateDrivePose(status.pose!, input.linear, input.angular, dt);
    status.battery = Math.max(5, status.battery - 0.08 * dt);
    return { status, manual };
  }

  if (manual && !input.autoCleaning) {
    manual = false;
    status.state = "idle";
  }

  if (status.state === "cleaning") {
    status.battery = Math.max(5, status.battery - 0.1 * dt);
    if (status.battery <= 15) status.state = "returning";
    else status.pose = jitterPose(status.pose!, dt, random);
  } else if (status.state === "returning") {
    status.battery = Math.max(5, status.battery - 0.05 * dt);
    const docked = approachDock(status.pose!, dt);
    status.pose = docked.pose;
    if (docked.arrived) {
      status.state = "docked";
      status.pose = { x: DOCK.x, y: DOCK.y, heading: 0 };
    }
  } else if (status.state === "docked") {
    status.battery = Math.min(100, status.battery + 0.2 * dt);
  }

  return { status, manual };
}
