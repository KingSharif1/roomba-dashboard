"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronLeft, ChevronRight, Square, Joystick } from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";
import { V3Collapsible } from "./collapsible-card";

const SPEEDS = [25, 50, 75, 100];

function JoystickStick() {
  const { drive } = useV3Robot();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const lastDir = useRef<string>("stop");

  const sendDrive = useCallback((x: number, y: number) => {
    // x: -1 (left) to 1 (right), y: -1 (up) to 1 (down)
    const threshold = 0.3;
    let dir = "stop";
    if (Math.abs(x) < threshold && Math.abs(y) < threshold) dir = "stop";
    else if (Math.abs(y) > Math.abs(x)) dir = y < 0 ? "up" : "down";
    else dir = x < 0 ? "left" : "right";
    if (dir !== lastDir.current) {
      lastDir.current = dir;
      drive(dir as any);
    }
  }, [drive]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 24;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    setPos({ x: dx, y: dy });
    sendDrive(dx / maxR, dy / maxR);
  }, [sendDrive]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setActive(true);
    handleMove(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    handleMove(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    setActive(false);
    setPos({ x: 0, y: 0 });
    lastDir.current = "stop";
    drive("stop");
  };

  return (
    <div className="flex items-center justify-center py-2 select-none">
      <div
        ref={baseRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-40 h-40 rounded-full border-2 relative touch-none cursor-grab active:cursor-grabbing"
        style={{
          borderColor: "var(--v3-border)",
          background: "radial-gradient(circle, rgba(255,122,92,0.06) 0%, transparent 70%)",
        }}
        role="slider"
        aria-label="Drive joystick"
        aria-valuetext={active ? "driving" : "centered"}
      >
        {/* direction hints */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px]" style={{ color: "var(--v3-muted)" }}>▲</span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px]" style={{ color: "var(--v3-muted)" }}>▼</span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--v3-muted)" }}>◀</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--v3-muted)" }}>▶</span>
        <div
          className="absolute w-14 h-14 rounded-full shadow-lg"
          style={{
            background: active ? "var(--v3-coral)" : "rgba(255,122,92,0.85)",
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            transition: active ? "none" : "transform 0.15s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export function V3DrivePanel() {
  const { state, drive, setSpeed } = useV3Robot();
  const { speed, heading } = state;
  const [mode, setMode] = useState<"pad" | "stick">("pad");

  const dirBtn =
    "w-14 h-14 rounded-lg border flex items-center justify-center hover:opacity-75 active:scale-95 transition-all";

  return (
    <V3Collapsible
      icon={<Joystick className="w-4 h-4" />}
      title="Drive"
      summary={`${speed}% · ${heading}`}
    >
      <div className="flex items-center gap-2 ml-auto">
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
            <ChevronUp className="w-6 h-6 rotate-180" />
          </button>
          <span />
        </div>
      ) : (
        <JoystickStick />
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
    </V3Collapsible>
  );
}
