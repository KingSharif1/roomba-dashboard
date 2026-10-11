"use client";

import { markStateFrom, statusTone, TONE_BG, TONE_TEXT, type MarkState, type RobotStatusLike } from "@/lib/mark-state";
import { cn } from "@/lib/utils";

const LABEL: Record<MarkState, string> = {
  idle: "IDLE",
  moving: "MOVING",
  charging: "CHARGING",
  full: "CHARGED",
  low: "LOW",
  stopped: "STOPPED",
  fault: "FAULT",
  offline: "OFFLINE",
};

export function StatusIndicator({ status, className }: { status: RobotStatusLike; className?: string }) {
  const mark = markStateFrom(status);
  const tone = statusTone(status);
  const pulse = mark === "moving" || mark === "charging" || mark === "low" || mark === "fault";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-3 w-3">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", TONE_BG[tone])} />
        )}
        <span className={cn("relative inline-flex rounded-full h-3 w-3", TONE_BG[tone])} />
      </span>
      <span className={cn("font-medium uppercase tracking-wider text-sm", TONE_TEXT[tone])}>{LABEL[mark]}</span>
    </div>
  );
}
