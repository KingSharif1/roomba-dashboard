"use client";

import { Settings } from "lucide-react";
import { modeLabel, useV3Robot } from "@/lib/v3/store";
import type { RobotMode } from "@/lib/v3/types";

function logoAnimClass(mode: RobotMode): string {
  switch (mode) {
    case "cleaning":
      return "v3-logo-clean";
    case "docked":
      return "v3-logo-charge";
    default:
      return "";
  }
}

export function V3TopBar({ onSettings }: { onSettings?: () => void }) {
  const { state } = useV3Robot();
  const { mode, battery, location } = state;

  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b shrink-0"
      style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)" }}>
      <div className="flex items-center gap-3">
        <img
          src="/brand/stella-paper-mark.svg"
          alt="Stella"
          width={40}
          height={40}
          className={`w-10 h-10 rounded-[10px] shrink-0 border ${logoAnimClass(mode)}`}
          style={{ borderColor: "var(--v3-coral)" }}
        />
        <div>
          <h1 className="text-xl font-bold tracking-[0.25em]">STELLA</h1>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--v3-muted)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full v3-pulse"
              style={{ background: mode === "cleaning" ? "var(--v3-coral)" : mode === "docked" ? "var(--v3-mint)" : "var(--v3-muted)" }}
            />
            {modeLabel(mode)} · {location.label}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-8 h-4 rounded-sm border flex items-center p-0.5"
            style={{ borderColor: mode === "docked" ? "var(--v3-mint)" : "var(--v3-coral)" }}
          >
            <div
              className="h-full rounded-sm"
              style={{
                width: `${battery}%`,
                background: mode === "docked" ? "var(--v3-mint)" : "var(--v3-coral)",
              }}
            />
          </div>
          <span className="mono font-semibold">{battery}%</span>
        </div>
        <button
          aria-label="Settings"
          onClick={onSettings}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-80"
          style={{ borderColor: "var(--v3-border)" }}
        >
          <Settings className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
        </button>
      </div>
    </header>
  );
}
