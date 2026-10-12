"use client";

import { useState } from "react";
import { Plus, Minus, Crosshair, Expand } from "lucide-react";
import type { DemoRobotState } from "@/lib/v3/types";

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

// Dotted cleaning path through the living room (decorative SVG path)
const cleanPath =
  "M 235 205 L 265 185 L 280 160 L 260 148 L 225 155 L 215 185 L 235 205 Z M 240 240 L 235 275 L 255 288 L 270 272";

export function V3FloorMap({ robot }: { robot: DemoRobotState }) {
  const [view, setView] = useState<"bird" | "fp">("bird");
  const [zoom, setZoom] = useState(1);
  const stella = zoneById[robot.location.roomId ?? "living-room"] ?? zoneById["living-room"];

  return (
    <div className="v3-panel relative overflow-hidden">
      {/* Stella status card (top-left overlay) */}
      <div className="absolute top-3 left-3 z-10 v3-chip px-3 py-2 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full"
          style={{ background: "radial-gradient(circle at 35% 35%, #c7cbe8, #6b6e94)" }}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Stella</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(255,122,92,0.18)", color: "var(--v3-coral)" }}
            >
              Cleaning
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>
            Room <span className="text-white font-medium">{robot.location.label}</span>
            <span className="mx-2">·</span>Run <span className="text-white font-medium">{robot.runMinutes} min</span>
          </div>
        </div>
      </div>

      {/* View toggle (top-right) */}
      <div className="absolute top-3 right-3 z-10 flex rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--v3-border)" }}>
        {(["bird", "fp"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              background: view === v ? "var(--v3-coral)" : "var(--v3-surface)",
              color: view === v ? "#1a0f0a" : "var(--v3-text)",
            }}
          >
            {v === "bird" ? "Bird's-eye" : "First-person"}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 top-16 z-10 flex flex-col rounded-lg overflow-hidden border"
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

      {/* Map */}
      <svg
        viewBox="0 0 400 320"
        className="w-full block"
        style={{ aspectRatio: "400 / 320" }}
        role="img"
        aria-label="Floor plan map"
      >
        <g style={{ transform: `scale(${zoom})`, transformOrigin: "200px 160px" }}>
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
              stroke={z.id === robot.location.roomId ? "#ff7a5c" : "#5a5d8f"}
              strokeWidth={z.id === robot.location.roomId ? 2 : 1.2}
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
              {z.id === "bathroom" ? "bath" : z.id === "setup-room" ? "setup" : z.id.replace("-", " ")}
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

        {/* Stella marker */}
        <g>
          <circle cx={stella.x + 62} cy={stella.y + 50} r="9" fill="#ff7a5c" />
          <circle cx={stella.x + 62} cy={stella.y + 50} r="14" fill="none" stroke="#ff7a5c" opacity="0.4" />
        </g>
        </g>
      </svg>

      {/* Stella label chip */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 flex items-center gap-1.5"
        style={{ left: "56%", top: "38%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-coral)" }} />
        <span className="font-medium">Stella</span>
        <span style={{ color: "var(--v3-muted)" }}>{robot.location.label}</span>
      </div>

      {/* Couch chip */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 hidden sm:flex items-center gap-1.5"
        style={{ right: "3%", top: "42%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-mint)" }} />
        Couch moved <span style={{ color: "var(--v3-muted)" }}>spot cleaned</span>
      </div>

      {/* Dock chip */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 flex items-center gap-1.5"
        style={{ right: "10%", top: "58%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-mint)" }} />
        Dock
      </div>

      {/* Next chip */}
      <div
        className="absolute z-10 v3-chip px-2.5 py-1 flex items-center gap-1.5"
        style={{ right: "6%", bottom: "16%" }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--v3-mint)" }} />
        Next · <span className="font-medium">Kitchen</span>
        <span style={{ color: "var(--v3-muted)" }}>ETA 2 min</span>
      </div>

      {/* Route chip (bottom-left) */}
      <div className="absolute left-3 bottom-12 z-10 v3-chip px-3 py-2 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full border flex items-center justify-center"
          style={{ borderColor: "var(--v3-border)" }}
        >
          <span style={{ color: "var(--v3-coral)", fontSize: 16 }}>➤</span>
        </div>
        <div className="text-xs">
          <div className="font-medium">{robot.location.label} → Kitchen</div>
          <div style={{ color: "var(--v3-muted)" }}>
            heading {robot.heading} · speed {robot.speed}%
          </div>
        </div>
      </div>

      {/* Legend (bottom-center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 v3-chip px-3 py-1.5 flex items-center gap-3 text-[11px]"
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

      {/* Live camera thumbnail (bottom-right) */}
      <div className="absolute right-3 bottom-3 z-10 w-32 h-24 rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--v3-border)", background: "#0c0d1f" }}>
        <div className="absolute top-1 left-2 text-[10px] flex items-center gap-1 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white v3-pulse" /> live
        </div>
        {/* simulated camera frame */}
        <div className="w-full h-full flex">
          <div className="w-1/3" style={{ background: "#3a2c22" }} />
          <div className="w-1/3" style={{ background: "#5a5a6e" }} />
          <div className="w-1/3" style={{ background: "#2c2c40" }} />
        </div>
        <div className="absolute bottom-1 right-1 z-10">
          <Expand className="w-3 h-3" style={{ color: "var(--v3-muted)" }} />
        </div>
      </div>
    </div>
  );
}
