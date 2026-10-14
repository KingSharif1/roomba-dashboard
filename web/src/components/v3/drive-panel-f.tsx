"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Square,
  LayoutGrid, Joystick, Gauge,
} from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";

/* ═══════════════ Design F drive panel — game/HUD controller ═══════════════
   Big touch-friendly stick + D-pad, HUD readouts, design-F variables.
   drive() semantics unchanged (up/down/left/right/stop; Pi watchdog resend). */

const SPEEDS = [25, 50, 75, 100];

function dirLabel(x: number, y: number): string {
  const dead = 0.12;
  if (Math.abs(x) < dead && Math.abs(y) < dead) return "—";
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const ang = Math.atan2(x, -y); // y up = north
  const idx = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return names[idx];
}

function Stick() {
  const { drive } = useV3Robot();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mag, setMag] = useState(0);
  const [active, setActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const lastDir = useRef<string>("stop");

  const sendDrive = useCallback((x: number, y: number) => {
    const threshold = 0.3;
    let d = "stop";
    if (Math.abs(x) < threshold && Math.abs(y) < threshold) d = "stop";
    else if (Math.abs(y) > Math.abs(x)) d = y < 0 ? "up" : "down";
    else d = x < 0 ? "left" : "right";
    lastDir.current = d;
    drive(d as "up" | "down" | "left" | "right" | "stop");
  }, [drive]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 46;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    setPos({ x: dx, y: dy });
    const nx = dx / maxR, ny = dy / maxR;
    setMag(Math.min(100, Math.round(Math.hypot(nx, ny) * 100)));
    sendDrive(nx, ny);
  }, [sendDrive]);

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setActive(true);
    handleMove(e.clientX, e.clientY);
  };
  const move = (e: React.PointerEvent) => { if (active) handleMove(e.clientX, e.clientY); };
  const up = () => {
    setActive(false); setPos({ x: 0, y: 0 }); setMag(0);
    lastDir.current = "stop"; drive("stop");
  };

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (lastDir.current !== "stop") drive(lastDir.current as "up" | "down" | "left" | "right");
    }, 100);
    return () => clearInterval(id);
  }, [active, drive]);

  const hud = dirLabel(pos.x / 90, pos.y / 90);

  return (
    <div className="f-drive">
      <div className="f-stick-wrap">
        <div
          ref={baseRef}
          className={`f-stick ${active ? "on" : ""}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          role="slider"
          aria-label="Drive joystick"
          aria-valuetext={active ? `driving ${hud} ${mag} percent` : "centered"}
        >
          {/* subtle reticle */}
          <span className="ret h" /><span className="ret v" />
          {/* knob */}
          <span
            className="knob"
            style={{
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              transition: active ? "none" : "transform .18s ease-out",
            }}
          >
            <Joystick className="w-7 h-7" />
          </span>
        </div>
      </div>
      <div className="f-drive-read mono">
        <span className="dir">{hud}</span>
        <span className="mag">{mag}%</span>
      </div>
    </div>
  );
}

function Pad() {
  const { drive, activeDirection } = useV3Robot();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = (d: "up" | "down" | "left" | "right") => {
    drive(d);
    timer.current = setInterval(() => drive(d), 100);
  };
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    drive("stop");
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const btn = (d: "up" | "down" | "left" | "right", label: string, icon: React.ReactNode) => (
    <button
      key={d}
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); start(d); }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`f-padbtn ${activeDirection === d ? "on" : ""}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="f-drive">
      <div className="f-pad">
        <span />
        {btn("up", "Forward", <ChevronUp className="w-8 h-8" />)}
        <span />
        {btn("left", "Left", <ChevronLeft className="w-8 h-8" />)}
        <button
          aria-label="Stop"
          onClick={stop}
          className="f-padbtn stop"
        >
          <Square className="w-5 h-5" fill="currentColor" />
        </button>
        {btn("right", "Right", <ChevronRight className="w-8 h-8" />)}
        <span />
        {btn("down", "Back", <ChevronDown className="w-8 h-8" />)}
        <span />
      </div>
      <div className="f-drive-read mono">
        <span className="dir">{activeDirection ? activeDirection.toUpperCase() : "—"}</span>
      </div>
    </div>
  );
}

export function FDrivePanel() {
  const { state, setSpeed } = useV3Robot();
  const { speed } = state;
  const [mode, setMode] = useState<"stick" | "pad">("stick");

  return (
    <div>
      <div className="flex justify-center mb-4">
        <div className="seg" style={{ padding: 3 }}>
          {(["stick", "pad"] as const).map((m) => (
            <button
              key={m}
              className={mode === m ? "on" : ""}
              onClick={() => setMode(m)}
              style={{ padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {m === "stick" ? <Joystick className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              {m === "stick" ? "Stick" : "Pad"}
            </button>
          ))}
        </div>
      </div>

      {mode === "stick" ? <Stick /> : <Pad />}

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="lbl" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Gauge className="w-3.5 h-3.5" /> Speed
          </span>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--acc)" }}>{speed}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="f-speed"
          aria-label="Drive speed"
          style={{
            background: `linear-gradient(to right, var(--acc) 0%, var(--acc) ${speed}%, var(--soft) ${speed}%)`,
          }}
        />
        <div className="f-speedticks mono" aria-hidden>
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={speed === s ? "on" : ""}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
