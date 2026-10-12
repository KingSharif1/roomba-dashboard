"use client";

import { ChevronDown } from "lucide-react";
import { demoBatteryHistory } from "@/lib/v3/demo";

export function V3BatteryPanel({ battery, minutesLeft }: { battery: number; minutesLeft: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const filled = (battery / 100) * C;

  const max = Math.max(...demoBatteryHistory);
  const min = Math.min(...demoBatteryHistory);
  const pts = demoBatteryHistory
    .map((v, i) => {
      const x = (i / (demoBatteryHistory.length - 1)) * 200;
      const y = 30 - ((v - min) / (max - min || 1)) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="v3-panel p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="v3-panel-title">Battery</span>
        <ChevronDown className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
      </div>
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="#2c2e56" strokeWidth="11" />
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="#5eead4"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${C}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold mono">{battery}%</span>
          <span className="text-xs" style={{ color: "var(--v3-muted)" }}>
            ≈ {minutesLeft} min left
          </span>
        </div>
      </div>
      <svg viewBox="0 0 200 34" className="w-full h-9 mt-1" aria-hidden>
        <polyline points={pts} fill="none" stroke="#5eead4" strokeWidth="1.5" opacity="0.8" />
      </svg>
    </div>
  );
}
