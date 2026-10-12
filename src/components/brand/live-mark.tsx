"use client";
// Living logo: the inner ring behaves like the Roomba's Clean-button LED.
// Color rules (same everywhere in the app):
//   green = OK/working · yellow = charging · orange = low battery
//   red = stopped/fault · gray = offline
// Drive it from GET /status or WS /live: <LiveMark status={status} />
// Demo mode: pass status from the mock generator; it animates the same way.

import type { RobotStatus } from "@/lib/types";

export type MarkState =
  | "idle" | "moving" | "charging" | "full"
  | "low" | "stopped" | "fault" | "offline";

export type RobotStatusLike = {
  connected?: boolean;
  activity?: string;      // offline|charging|moving|stopped|idle|fault
  charging?: boolean;
  battery?: number;       // 0-100
};

export const LOW_BATTERY = 20;

export function markStateFrom(s?: RobotStatusLike | null): MarkState {
  if (!s || s.connected === false || s.activity === "offline") return "offline";
  if (s.activity === "fault") return "fault";
  if (s.activity === "stopped") return "stopped";
  const b = s.battery ?? 100;
  if (s.charging || s.activity === "charging") return b >= 99 ? "full" : "charging";
  if (b < LOW_BATTERY) return "low";
  if (s.activity === "moving") return "moving";
  return "idle";
}

/** Adapt the app's RobotStatus to the logo's input shape. */
export function robotStatusToLike(s: RobotStatus): RobotStatusLike {
  const activity: Record<RobotStatus["state"], RobotStatusLike["activity"]> = {
    idle: "idle",
    cleaning: "moving",
    docked: "charging",
    returning: "moving",
    error: "fault",
  };
  return { connected: s.connected, activity: activity[s.state], battery: s.battery };
}

/** One-liner: app RobotStatus -> logo MarkState. */
export function markStateFor(s: RobotStatus): MarkState {
  return markStateFrom(robotStatusToLike(s));
}

/** Mark state -> hex color, shared by chips, battery bar, map robot. */
export const MARK_COLORS: Record<MarkState, string> = {
  idle: "#00ff9d",
  moving: "#00ff9d",
  charging: "#ffd23f",
  full: "#00ff9d",
  low: "#ff7a1a",
  stopped: "#ff3b3b",
  fault: "#ff3b3b",
  offline: "#666666",
};

const LABEL: Record<MarkState, string> = {
  idle: "Idle", moving: "Moving", charging: "Charging", full: "Charged",
  low: "Low battery", stopped: "Stopped", fault: "Fault", offline: "Offline",
};

export function LiveMark({
  status, state, size = 32, className = "",
}: { status?: RobotStatusLike | null; state?: MarkState; size?: number; className?: string }) {
  const st = state ?? markStateFrom(status);
  return (
    <svg
      viewBox="0 0 128 128" width={size} height={size} fill="none"
      className={`live-mark lm-${st} ${className}`} role="img"
      aria-label={`Robot status: ${LABEL[st]}`}
    >
      <circle className="lm-body" cx="64" cy="64" r="52" strokeWidth="10" />
      <circle className="lm-led" cx="64" cy="64" r="38" strokeWidth="5" />
      <path className="lm-sweep" d="M64 64L49.5 31.6A35.5 35.5 0 0 1 78.5 31.6Z" />
      <rect className="lm-puck" x="55" y="55" width="18" height="18" />
    </svg>
  );
}
