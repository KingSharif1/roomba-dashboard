"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Square } from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";

const SPEEDS = [25, 50, 75, 100];

export function V3DrivePanel() {
  const { state, drive, setSpeed } = useV3Robot();
  const { speed } = state;
  const [mode, setMode] = useState<"pad" | "stick">("pad");

  const dirBtn =
    "w-14 h-14 rounded-lg border flex items-center justify-center hover:opacity-75 active:scale-95 transition-all";

  return (
    <div className="v3-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="v3-panel-title">Drive</span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--v3-border)" }}>
            {(["pad", "stick"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 text-xs font-semibold capitalize"
                style={{
                  background: mode === m ? "var(--v3-coral)" : "transparent",
                  color: mode === m ? "#1a0f0a" : "var(--v3-text)",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <ChevronDown className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
        </div>
      </div>

      {mode === "pad" ? (
        <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
          <span />
          <button aria-label="Forward" onClick={() => drive("up")} className={dirBtn} style={{ borderColor: "var(--v3-border)" }}>
            <ChevronUp className="w-6 h-6" />
          </button>
          <span />
          <button aria-label="Left" onClick={() => drive("left")} className={dirBtn} style={{ borderColor: "var(--v3-border)" }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            aria-label="Stop"
            onClick={() => drive("stop")}
            className={dirBtn}
            style={{ borderColor: "var(--v3-coral)", background: "rgba(255,122,92,0.1)" }}
          >
            <Square className="w-4 h-4" style={{ color: "var(--v3-coral)" }} fill="currentColor" />
          </button>
          <button aria-label="Right" onClick={() => drive("right")} className={dirBtn} style={{ borderColor: "var(--v3-border)" }}>
            <ChevronRight className="w-6 h-6" />
          </button>
          <span />
          <button aria-label="Back" onClick={() => drive("down")} className={dirBtn} style={{ borderColor: "var(--v3-border)" }}>
            <ChevronDown className="w-6 h-6" />
          </button>
          <span />
        </div>
      ) : (
        <div className="flex items-center justify-center h-[172px]">
          <div
            className="w-32 h-32 rounded-full border-2 relative"
            style={{ borderColor: "var(--v3-border)" }}
          >
            <div
              className="absolute w-12 h-12 rounded-full"
              style={{
                background: "var(--v3-coral)",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${state.dx * 0.5}px), calc(-50% + ${state.dy * 0.5}px))`,
              }}
            />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span style={{ color: "var(--v3-muted)" }}>Speed</span>
          <span className="mono font-semibold">{speed}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="v3-slider w-full"
          aria-label="Speed"
          style={{
            background: `linear-gradient(to right, var(--v3-coral) 0%, var(--v3-coral) ${speed}%, var(--v3-surface-2) ${speed}%)`,
          }}
        />
        <div className="grid grid-cols-4 gap-2 mt-2">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`py-1.5 text-xs font-semibold rounded-lg ${
                speed === s ? "v3-btn-coral" : "v3-btn-ghost"
              }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
