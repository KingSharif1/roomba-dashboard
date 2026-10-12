"use client";

import { cn } from "@/lib/utils";
import { Battery, BatteryCharging, BatteryLow, BatteryWarning } from "lucide-react";

interface BatteryIndicatorProps {
  level: number;
  charging?: boolean;
  className?: string;
}

export function BatteryIndicator({ level, charging, className }: BatteryIndicatorProps) {
  // Mark color rules: yellow = charging, orange = low battery (<20), green = OK.
  const getColor = () => {
    if (charging) return "text-[#ffd23f]";
    if (level < 20) return "text-[#ff7a1a]";
    return "text-accent";
  };
  
  const getIcon = () => {
    if (charging) return BatteryCharging;
    if (level < 20) return BatteryLow;
    if (level < 40) return BatteryWarning;
    return Battery;
  };
  
  const Icon = getIcon();
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("w-5 h-5", getColor())} />
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
