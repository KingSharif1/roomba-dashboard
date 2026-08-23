"use client";

import { cn } from "@/lib/utils";
import type { RobotState } from "@/lib/types";

interface StatusIndicatorProps {
  state: RobotState;
  connected: boolean;
  className?: string;
}

const stateConfig: Record<RobotState, { label: string; color: string; pulse: boolean }> = {
  idle: { label: "IDLE", color: "bg-muted", pulse: false },
  cleaning: { label: "CLEANING", color: "bg-accent", pulse: true },
  docked: { label: "DOCKED", color: "bg-accent", pulse: false },
  returning: { label: "RETURNING", color: "bg-warning", pulse: true },
  error: { label: "ERROR", color: "bg-danger", pulse: true },
};

export function StatusIndicator({ state, connected, className }: StatusIndicatorProps) {
  const config = stateConfig[state];
  
  if (!connected) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-danger" />
        </span>
        <span className="text-danger font-medium uppercase tracking-wider text-sm">
          OFFLINE
        </span>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-3 w-3">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.color
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-3 w-3", config.color)} />
      </span>
      <span
        className={cn(
          "font-medium uppercase tracking-wider text-sm",
          state === "error" && "text-danger",
          state === "cleaning" && "text-accent",
          state === "returning" && "text-warning",
          (state === "idle" || state === "docked") && "text-foreground"
        )}
      >
        {config.label}
      </span>
    </div>
  );
}
