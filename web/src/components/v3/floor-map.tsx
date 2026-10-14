"use client";

import { useRef, useState } from "react";
import { Plus, Minus, Crosshair, Expand, ChevronUp } from "lucide-react";
import { demoRooms } from "@data/demo";
import { modeLabel, useV3Robot } from "@/lib/v3/store";

// Simplified floor-plan geometry for the SVG. Room names come from demo data;
// the SVG only draws zones — no coordinates cross the UI boundary as data.

interface Zone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: "hardwood" | "carpet";
}

const zones: Zone[] = [
  { id: "bedroom", x: 20, y: 10, w: 120, h: 90, floor: "carpet" },
  { id: "bathroom", x: 150, y: 10, w: 55, h: 60, floor: "hardwood" },
  { id: "closet", x: 210, y: 10, w: 40, h: 60, floor: "hardwood" },
  { id: "setup-room", x: 260, y: 10, w: 110, h: 90, floor: "carpet" },
  { id: "hallway", x: 150, y: 78, w: 100, h: 42, floor: "hardwood" },
  { id: "living-room", x: 175, y: 128, w: 125, h: 100, floor: "carpet" },
  { id: "dining", x: 175, y: 236, w: 88, h: 72, floor: "hardwood" },
  { id: "kitchen", x: 272, y: 236, w: 82, h: 72, floor: "hardwood" },
];

const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));
const nameById = Object.fromEntries(demoRooms.map((r) => [r.id, r.name]));

// Dotted cleaning path through the living room (decorative SVG path)
const cleanPath =
  "M 235 205 L 265 185 L 280 160 L 260 148 L 225 155 L 215 185 L 235 205 Z M 240 240 L 235 275 L 255 288 L 270 272";

export function V3FloorMap() {
  const { state } = useV3Robot();
  const { location, mode, runMinutes, heading, speed, dx, dy, mx, my, voice, voiceLine } = state;
  const [view, setView] = useState<"bird" | "fp">("bird");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const stella = zoneById[location.roomId ?? "living-room"] ?? zoneById["living-room"];
  // Animated marker: glides along the cleaning path in the living room,
  // snaps to the room zone center elsewhere. Manual drive offsets apply.
  const inLiving = (location.roomId ?? "living-room") === "living-room";
  const baseX = inLiving ? mx : stella.x + 62;
  const baseY = inLiving ? my : stella.y + 50;
  const markX = baseX + dx;
  const markY = baseY + dy;
  const isCleaning = mode === "cleaning";

  // Drag-to-pan on the map
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const vb = 400 / (e.currentTarget as Element).getBoundingClientRect().width;
    setPan({
      x: drag.current.px + (e.clientX - drag.current.sx) * vb,
      y: drag.current.py + (e.clientY - drag.current.sy) * vb,
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="v3-panel relative overflow-hidden h-full flex flex-col">
      {/* Stella status card (top-left overlay) — compact on mobile */}
      <div className="absolute top-3 left-3 z-10 v3-chip px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3">
        <div
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full shrink-0"
          style={{ background: "radial-gradient(circle at 35% 35%, #c7cbe8, #6b6e94)" }}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Stella</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: isCleaning ? "rgba(255,122,92,0.18)" : "rgba(94,234,212,0.15)",
                color: isCleaning ? "var(--v3-coral)" : "var(--v3-mint)",
              }}
            >
              {modeLabel(mode)}
            </span>
          </div>
          <div className="hidden sm:block text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>
            Room <span className="text-white font-medium">{location.label}</span>
            <span className="mx-2">·</span>Run <span className="text-white font-medium">{runMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Voice status chip — shows while listening/speaking (demo) */}
      {(voice === "listening" || voice === "speaking") && (
        <div
          className="absolute top-[104px] sm:top-3 left-1/2 -translate-x-1/2 z-20 v3-chip px-4 py-2 flex items-center gap-2 max-w-[calc(100%-6rem)]"
          style={{ borderColor: "var(--v3-mint)" }}
          role="status"
        >
          <span className="flex gap-1 items-center" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full v3-pulse"
                style={{ background: "var(--v3-mint)", animationDelay: `${i * 0.25}s` }}
              />
            ))}
          </span>
          <span className="text-sm truncate">
            {voice === "listening" ? "Listening…" : voiceLine ?? "Speaking…"}
          </span>
        </div>
      )}

      {/* View toggle (top-right) — drops below the status card on mobile */}
      <div className="absolute top-[68px] sm:top-3 right-3 z-10 flex rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--v3-border)" }}>
        {(["bird", "fp"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium"
            style={{
              background: view === v ? "var(--v3-coral)" : "var(--v3-surface)",
              color: view === v ? "#1a0f0a" : "var(--v3-text)",
            }}
          >
            {v === "bird" ? "Bird's-eye" : "First-person"}
          </button>
        ))}
        <a
          href="/3d"
          className="px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium flex items-center gap-1 border-l"
          style={{ borderColor: "var(--v3-border)", background: "var(--v3-surface)", color: "var(--v3-mint)" }}
        >
          3D
        </a>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 top-40 sm:top-16 z-10 flex flex-col rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--v3-border)", background: "var(--v3-surface)" }}>
        <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
          className="p-2 hover:opacity-70 border-b" style={{ borderColor: "var(--v3-border-soft)" }}>
          <Plus className="w-4 h-4" />
        </button>
        <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          className="p-2 hover:opacity-70 border-b" style={{ borderColor: "var(--v3-border-soft)" }}>
          <Minus className="w-4 h-4" />
        </button>
        <button aria-label="Recenter" onClick={() => setZoom(1)} className="p-2 hover:opacity-70">
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Map — drag to pan, buttons to zoom; fills its container */}
      <svg
        viewBox="0 0 400 320"
        preserveAspectRatio="xMidYMid slice"
        className="v3-map-svg w-full block touch-none cursor-grab active:cursor-grabbing flex-1 min-h-0"
        role="img"
        aria-label="Floor plan map"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "200px 160px" }}>
        <defs>
          <radialGradient id="cleanGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff7a5c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff7a5c" stopOpacity="0" />
          </radialGradient>
          <pattern id="carpetDots" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#7c8cf8" opacity="0.25" />
          </pattern>
        </defs>

        {/* cleaned-area glow */}
        <ellipse cx="238" cy="180" rx="85" ry="65" fill="url(#cleanGlow)" />

        {zones.map((z) => (
          <g key={z.id}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              fill={z.floor === "carpet" ? "url(#carpetDots)" : "transparent"}
              stroke={z.id === location.roomId ? "#ff7a5c" : "#5a5d8f"}
              strokeWidth={z.id === location.roomId ? 2 : 1.2}
              opacity={0.9}
            />
            <text
              x={z.x + z.w / 2}
              y={z.y + z.h / 2}
              textAnchor="middle"
              fill="#8f91b8"
              fontSize={z.w < 70 ? 7 : 9}
              letterSpacing="1.5"
              style={{ textTransform: "uppercase" }}
            >
              {(nameById[z.id] ?? z.id).toUpperCase()}
            </text>
          </g>
        ))}

        {/* cleaning path */}
        <path
          d={cleanPath}
          fill="none"
          stroke="#ff7a5c"
          strokeWidth="2"
          strokeDasharray="5 5"
          opacity="0.85"
        />
        {/* path to kitchen */}
        <path
          d="M 255 240 L 280 258 L 300 260"
          fill="none"
          stroke="#5eead4"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.8"
        />

        {/* Stella marker — glides along the path, drive offsets apply */}
        <g style={{ transition: "cx 0.7s linear, cy 0.7s linear" }}>
          <circle cx={markX} cy={markY} r="9" fill={isCleaning ? "#ff7a5c" : "#5eead4"} />
          <circle cx={markX} cy={markY} r="14" fill="none"
            stroke={isCleaning ? "#ff7a5c" : "#5eead4"} opacity="0.4" />
        </g>
        </g>
      </svg>

      {/* Stella label chip — hidden on mobile to reduce crowding */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 hidden sm:flex items-center gap-1.5"
        style={{ left: "56%", top: "38%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-coral)" }} />
        <span className="font-medium">Stella</span>
        <span style={{ color: "var(--v3-muted)" }}>{location.label}</span>
      </div>

      {/* Couch chip */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 hidden sm:flex items-center gap-1.5"
        style={{ right: "3%", top: "42%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-mint)" }} />
        Couch moved <span style={{ color: "var(--v3-muted)" }}>spot cleaned</span>
      </div>

      {/* Dock chip — hidden on mobile */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 hidden sm:flex items-center gap-1.5"
        style={{ right: "10%", top: "58%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-mint)" }} />
        Dock
      </div>

      {/* Next chip — compact on mobile, moved left to clear the camera tile */}
      <div className="absolute z-10 v3-chip px-2.5 py-1 flex items-center gap-1.5 left-3 bottom-[4.5rem] sm:left-auto sm:right-[6%] sm:bottom-[16%]">
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-mint)" }} />
        <span className="hidden sm:inline">Next ·</span>
        <span className="font-medium">Kitchen</span>
        <span style={{ color: "var(--v3-muted)" }}>2 min</span>
      </div>

      {/* Route chip (bottom-left) — desktop only, was clipping on 375px */}
      <div className="absolute left-3 bottom-12 z-10 v3-chip px-3 py-2 hidden sm:flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full border flex items-center justify-center"
          style={{ borderColor: "var(--v3-border)" }}
        >
          <span style={{ color: "var(--v3-coral)", fontSize: 16 }}>➤</span>
        </div>
        <div className="text-xs">
          <div className="font-medium">{location.label} → Kitchen</div>
          <div style={{ color: "var(--v3-muted)" }}>
            heading {heading} · speed {speed}%
          </div>
        </div>
      </div>

      {/* Legend (bottom-center) — compact on mobile */}
      <div className="absolute bottom-3 left-3 sm:left-1/2 sm:-translate-x-1/2 z-10 v3-chip px-2.5 sm:px-3 py-1.5 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]"
        style={{ color: "var(--v3-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm border" style={{ borderColor: "#5a5d8f" }} /> Hardwood
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ background: "rgba(124,140,248,0.3)" }} /> Carpet
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ background: "rgba(94,234,212,0.5)" }} /> Cleaned
        </span>
      </div>

      {/* Live camera thumbnail (bottom-right) — smaller on mobile */}
      <div className="absolute right-3 bottom-3 z-10 w-20 h-14 sm:w-32 sm:h-24 rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--v3-border)", background: "#0c0d1f" }}>
        <div className="absolute top-1 left-2 text-[10px] flex items-center gap-1 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white v3-pulse" /> live
        </div>
        {/* simulated camera frame — subtle drift so it feels live */}
        <div className="w-full h-full flex v3-cam-drift">
          <div className="w-1/3" style={{ background: "#3a2c22" }} />
          <div className="w-1/3" style={{ background: "#5a5a6e" }} />
          <div className="w-1/3" style={{ background: "#2c2c40" }} />
          <div className="w-1/3 shrink-0" style={{ background: "#3a2c22" }} />
        </div>
        <div className="absolute bottom-1 right-1 z-10">
          <Expand className="w-3 h-3" style={{ color: "var(--v3-muted)" }} />
        </div>
      </div>
    </div>
  );
}
