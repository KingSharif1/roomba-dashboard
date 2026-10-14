"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
    // Send continuously — Pi watchdog stops wheels 0.2s after last cmd
    const threshold = 0.3;
    let dir = "stop";
    if (Math.abs(x) < threshold && Math.abs(y) < threshold) dir = "stop";
    else if (Math.abs(y) > Math.abs(x)) dir = y < 0 ? "up" : "down";
    else dir = x < 0 ? "left" : "right";
    lastDir.current = dir;
    drive(dir as any);
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

  // Continuous drive: resend current direction every 100ms while active
  // (Pi watchdog stops wheels 0.2s after last command)
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (lastDir.current !== "stop") {
        drive(lastDir.current as any);
      }
    }, 100);
    return () => clearInterval(id);
  }, [active, drive]);

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


function HoldPad({ drive, dirBtn }: { drive: (d: "up"|"down"|"left"|"right"|"stop") => void; dirBtn: string }) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = (dir: "up"|"down"|"left"|"right") => {
    drive(dir);
    timer.current = setInterval(() => drive(dir), 100);
  };
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    drive("stop");
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const { activeDirection } = useV3Robot();
  const btn = (dir: "up"|"down"|"left"|"right", label: string, icon: React.ReactNode) => {
    const isActive = activeDirection === dir;
    return (
      <button
        aria-label={label}
        onPointerDown={(e) => { e.preventDefault(); start(dir); }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        className={dirBtn + " touch-none select-none"}
        style={{
          borderColor: isActive ? "var(--eng-cyan)" : "var(--v3-border)",
          background: isActive ? "rgba(0, 212, 255, 0.2)" : "transparent",
          boxShadow: isActive ? "0 0 15px rgba(0, 212, 255, 0.4)" : "none",
          transform: isActive ? "scale(0.95)" : "scale(1)",
        }}
      >
        {icon}
      </button>
    );
  };
  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
      <span />
      {btn("up", "Forward", <ChevronUp className="w-6 h-6" />)}
      <span />
      {btn("left", "Left", <ChevronLeft className="w-6 h-6" />)}
      <button
        aria-label="Stop"
        onClick={() => { if (timer.current) clearInterval(timer.current); drive("stop"); }}
        className={dirBtn}
        style={{ borderColor: "var(--v3-coral)", background: "rgba(255,122,92,0.1)" }}
      >
        <Square className="w-4 h-4" style={{ color: "var(--v3-coral)" }} fill="currentColor" />
      </button>
      {btn("right", "Right", <ChevronRight className="w-6 h-6" />)}
      <span />
      {btn("down", "Back", <ChevronUp className="w-6 h-6 rotate-180" />)}
      <span />
    </div>
  );
}

export function V3DrivePanel() {
  const { state, drive, setSpeed } = useV3Robot();
  const { speed, heading } = state;
  const [mode, setMode] = useState<"pad" | "stick">("pad");

  const dirBtn =
    "w-14 h-14 rounded-2xl border flex items-center justify-center hover:opacity-75 active:scale-95 transition-all";

  return (
    <div>
      {/* Segmented mode switcher */}
      <div className="flex justify-center mb-4">
        <div
          className="relative flex p-1 rounded-full"
          style={{ background: "var(--eng-panel-2)", border: "1px solid var(--eng-border)" }}
        >
          {(["pad", "stick"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="relative z-10 px-6 py-2 text-[11px] font-bold tracking-widest uppercase rounded-full transition-all"
              style={{
                color: mode === m ? "var(--eng-bg-deep)" : "var(--eng-muted)",
              }}
            >
              {mode === m && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "var(--eng-cyan)",
                    boxShadow: "0 0 15px rgba(0, 212, 255, 0.4)",
                    zIndex: -1,
                  }}
                />
              )}
              <span className="relative z-10">{m === "pad" ? "▦ Pad" : "⊕ Stick"}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === "pad" ? (
        <HoldPad drive={drive} dirBtn={dirBtn} />
      ) : (
        <JoystickStick />
      )}

      <div className="mt-3">
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
