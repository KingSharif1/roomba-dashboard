"use client";

import { statusTone, TONE_BG, TONE_TEXT, type RobotStatusLike } from "@/lib/mark-state";
import { cn } from "@/lib/utils";

interface BatteryIndicatorProps {
  status: RobotStatusLike & { battery?: number };
  className?: string;
}

export function BatteryIndicator({ status, className }: BatteryIndicatorProps) {
  const level = Math.max(0, Math.min(100, status.battery ?? 0));
  const tone = statusTone(status);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn("mono text-2xl font-bold", TONE_TEXT[tone])}>{Math.round(level)}</span>
        <span className="text-muted text-sm">%</span>
      </div>
      <div className="h-2 w-full bg-surface-light" role="meter" aria-valuenow={Math.round(level)} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full", TONE_BG[tone])} style={{ width: `${level}%` }} />
      </div>
    </div>
  );
}
