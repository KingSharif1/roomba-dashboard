"use client";

import { useV3Robot } from "@/lib/v3/store";

/* Engineering floor map — clean SVG, fits mobile, no clutter.
   Dark blueprint style with cyan accents. */

interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZONES: Zone[] = [
  { id: "bedroom", label: "BEDROOM", x: 10, y: 10, w: 130, h: 90 },
  { id: "bath", label: "BATH", x: 150, y: 10, w: 60, h: 55 },
  { id: "closet", label: "CLOSET", x: 220, y: 10, w: 50, h: 55 },
  { id: "office", label: "OFFICE", x: 280, y: 10, w: 110, h: 90 },
  { id: "hall", label: "HALL", x: 150, y: 72, w: 120, h: 36 },
  { id: "living", label: "LIVING", x: 150, y: 116, w: 140, h: 110 },
  { id: "dining", label: "DINING", x: 150, y: 234, w: 100, h: 66 },
  { id: "kitchen", label: "KITCHEN", x: 260, y: 234, w: 100, h: 66 },
];

const VB_W = 400;
const VB_H = 310;

export function V3FloorMap() {
  const { state } = useV3Robot();
  const { location, mode, connection } = state;
  const isLive = connection === "live";

  const roomId = location.roomId ?? "living";
  const zone = ZONES.find((z) => z.id === roomId) ?? ZONES[5];
  const sx = zone.x + zone.w / 2;
  const sy = zone.y + zone.h / 2;

  return (
    <div className="w-full h-full relative" style={{ background: "#060809" }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="eng-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#1e2530"
              strokeWidth="0.5"
              opacity="0.6"
            />
          </pattern>
        </defs>
        <rect width={VB_W} height={VB_H} fill="url(#eng-grid)" />

        {ZONES.map((z) => {
          const isActive = z.id === roomId;
          return (
            <g key={z.id}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                fill={isActive ? "rgba(0,212,255,0.08)" : "rgba(30,37,48,0.4)"}
                stroke={isActive ? "#00d4ff" : "#2e3a4a"}
                strokeWidth={isActive ? 1.5 : 1}
              />
              {isActive && (
                <>
                  <path
                    d={`M ${z.x} ${z.y + 8} L ${z.x} ${z.y} L ${z.x + 8} ${z.y}`}
                    stroke="#00d4ff"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${z.x + z.w - 8} ${z.y} L ${z.x + z.w} ${z.y} L ${z.x + z.w} ${z.y + 8}`}
                    stroke="#00d4ff"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${z.x} ${z.y + z.h - 8} L ${z.x} ${z.y + z.h} L ${z.x + 8} ${z.y + z.h}`}
                    stroke="#00d4ff"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${z.x + z.w - 8} ${z.y + z.h} L ${z.x + z.w} ${z.y + z.h} L ${z.x + z.w} ${z.y + z.h - 8}`}
                    stroke="#00d4ff"
                    strokeWidth="2"
                    fill="none"
                  />
                </>
              )}
              <text
                x={z.x + z.w / 2}
                y={z.y + 14}
                textAnchor="middle"
                fontSize="8"
                letterSpacing="1.5"
                fill={isActive ? "#00d4ff" : "#5a6a7e"}
                fontFamily="monospace"
                fontWeight={isActive ? 700 : 400}
              >
                {z.label}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${sx}, ${sy})`}>
          <circle
            r="18"
            fill="none"
            stroke="#ffb000"
            strokeWidth="1"
            opacity="0.4"
            strokeDasharray="4 3"
          />
          <circle r="8" fill="#0a0c10" stroke="#ffb000" strokeWidth="2" />
          <path d="M 0 -8 L 4 -2 L -4 -2 Z" fill="#ffb000" />
          {isLive && (
            <circle r="8" fill="none" stroke="#ffb000" strokeWidth="1" opacity="0.6">
              <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        <text x="10" y={VB_H - 10} fontSize="9" fill="#5a6a7e" fontFamily="monospace" letterSpacing="1">
          {isLive ? "● LIVE TRACKING" : "○ DEMO MODE"}
        </text>
        <text x={VB_W - 10} y={VB_H - 10} textAnchor="end" fontSize="9" fill="#5a6a7e" fontFamily="monospace" letterSpacing="1">
          {mode.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
