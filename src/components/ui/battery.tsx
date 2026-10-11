"use client";

import { cn } from "@/lib/utils";
import { Battery, BatteryCharging, BatteryLow, BatteryWarning } from "lucide-react";

interface BatteryIndicatorProps {
  level: number;
  charging?: boolean;
  className?: string;
}

export function BatteryIndicator({ level, charging, className }: BatteryIndicatorProps) {
  const getColor = () => {
    if (level <= 15) return "text-danger";
    if (level <= 30) return "text-warning";
    return "text-accent";
  };
  
  const iconClass = cn("w-5 h-5", getColor());
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {charging ? (
        <BatteryCharging className={iconClass} />
      ) : level <= 15 ? (
        <BatteryLow className={iconClass} />
      ) : level <= 30 ? (
        <BatteryWarning className={iconClass} />
      ) : (
        <Battery className={iconClass} />
      )}
      <div className="flex items-baseline gap-1">
        <span className={cn("mono text-2xl font-bold", getColor())}>
          {Math.round(level)}
        </span>
        <span className="text-muted text-sm">%</span>
      </div>
      {charging && (
        <span className="text-xs text-accent uppercase tracking-wider">charging</span>
      )}
    </div>
  );
}
