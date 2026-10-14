"use client";
// Living logo: the inner ring behaves like the Roomba's Clean-button LED.
// Color rules (same everywhere in the app):
//   green = OK/working · yellow = charging · orange = low battery
//   red = stopped/fault · gray = offline
// Drive it from GET /status or WS /live: <LiveMark status={status} />
// Demo mode: pass status from the mock generator; it animates the same way.

import { markStateFrom, type MarkState, type RobotStatusLike } from "@/lib/mark-state";

export { LOW_BATTERY, markStateFrom, type MarkState, type RobotStatusLike } from "@/lib/mark-state";

const LABEL: Record<MarkState, string> = {
  idle: "Idle",
  moving: "Moving",
  charging: "Charging",
  full: "Charged",
  low: "Low battery",
  stopped: "Stopped",
  fault: "Fault",
  offline: "Offline",
};

export function LiveMark({
  status,
  state,
  size = 32,
  className = "",
}: {
  status?: RobotStatusLike | null;
  state?: MarkState;
  size?: number;
  className?: string;
}) {
  const st = state ?? markStateFrom(status);
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      fill="none"
      className={`live-mark lm-${st} ${className}`}
      role="img"
      aria-label={`Robot status: ${LABEL[st]}`}
      data-mark={st}
    >
      <circle className="lm-body" cx="64" cy="64" r="52" strokeWidth="10" />
      <circle className="lm-led" cx="64" cy="64" r="38" strokeWidth="5" />
      <path className="lm-sweep" d="M64 64L49.5 31.6A35.5 35.5 0 0 1 78.5 31.6Z" />
      <rect className="lm-puck" x="55" y="55" width="18" height="18" />
    </svg>
  );
}
