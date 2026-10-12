"use client";

import { cn } from "@/lib/utils";
import type { RobotState } from "@/lib/types";
import {
  markStateFor,
  MARK_COLORS,
  type MarkState,
} from "@/components/brand/live-mark";

interface StatusIndicatorProps {
  state: RobotState;
  connected: boolean;
  battery?: number;
  className?: string;
}

const stateLabel: Record<RobotState, string> = {
  idle: "IDLE",
  cleaning: "CLEANING",
  docked: "DOCKED",
  returning: "RETURNING",
  error: "ERROR",
};

/** Which mark states get the ping/pulse treatment on the chip dot. */
const PULSING: MarkState[] = ["moving", "charging", "low", "fault"];

export function StatusIndicator({ state, connected, battery = 100, className }: StatusIndicatorProps) {
  const markState = markStateFor({ state, connected, battery, lastSeen: "", pose: null });
  const color = MARK_COLORS[markState];
  const pulse = PULSING.includes(markState);
  const label = !connected ? "OFFLINE" : stateLabel[state];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-3 w-3">
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-3 w-3"
          style={{ backgroundColor: color }}
        />
      </span>
      <span
        className="font-medium uppercase tracking-wider text-sm"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
