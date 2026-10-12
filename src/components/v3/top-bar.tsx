"use client";

import { Settings } from "lucide-react";
import type { DemoRobotState } from "@/lib/v3/types";

export function V3TopBar({ robot }: { robot: DemoRobotState }) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b shrink-0"
      style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)" }}>
      <div className="flex items-center gap-3">
        <img
          src="/brand/stella-paper-mark.svg"
          alt="Stella"
          width={40}
          height={40}
          className="w-10 h-10 rounded-[10px] shrink-0"
        />
        <div>
          <h1 className="text-xl font-bold tracking-[0.25em]">STELLA</h1>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--v3-muted)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full v3-pulse"
              style={{ background: robot.mode === "cleaning" ? "var(--v3-coral)" : "var(--v3-mint)" }}
            />
            {robot.mode === "cleaning" ? "Cleaning" : robot.mode} · {robot.location.label}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-8 h-4 rounded-sm border flex items-center p-0.5"
            style={{ borderColor: "var(--v3-mint)" }}
          >
            <div
              className="h-full rounded-sm"
              style={{ width: `${robot.battery}%`, background: "var(--v3-mint)" }}
            />
          </div>
          <span className="mono font-semibold">{robot.battery}%</span>
        </div>
        <button
          aria-label="Settings"
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-80"
          style={{ borderColor: "var(--v3-border)" }}
        >
          <Settings className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
        </button>
      </div>
    </header>
  );
}
