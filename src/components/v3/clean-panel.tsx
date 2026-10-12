"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { demoRooms, demoRoomClean } from "@/lib/v3/demo";

export function V3CleanPanel() {
  const [selected, setSelected] = useState<string[]>(["living-room"]);
  const [mode, setMode] = useState<"all" | "stop" | "dock">("all");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const cleanFor = (id: string) =>
    demoRoomClean.find((c) => c.roomId === id)?.lastCleaned ?? "—";

  return (
    <div className="v3-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="v3-panel-title">Clean</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("all")}
            className={`px-3 py-1.5 text-xs font-semibold ${mode === "all" ? "v3-btn-coral" : "v3-btn-ghost"}`}
          >
            All rooms
          </button>
          <button
            onClick={() => setMode("stop")}
            className={`px-3 py-1.5 text-xs font-semibold ${mode === "stop" ? "v3-btn-coral" : "v3-btn-ghost"}`}
          >
            Stop
          </button>
          <button
            onClick={() => setMode("dock")}
            className={`px-3 py-1.5 text-xs font-semibold ${mode === "dock" ? "v3-btn-coral" : "v3-btn-ghost"}`}
          >
            Dock
          </button>
          <ChevronDown className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {demoRooms
          .filter((r) => ["living-room", "kitchen", "dining", "setup-room", "bedroom", "hallway"].includes(r.id))
          .map((room) => {
            const active = selected.includes(room.id);
            return (
              <button
                key={room.id}
                onClick={() => toggle(room.id)}
                className="rounded-lg border p-2.5 text-left transition-all"
                style={{
                  borderColor: active ? "var(--v3-coral)" : "var(--v3-border-soft)",
                  background: active ? "rgba(255,122,92,0.07)" : "transparent",
                }}
              >
                {/* room shape glyph */}
                <div className="h-12 mb-1.5 flex items-center justify-center">
                  <div
                    className="rounded-sm"
                    style={{
                      width: room.id === "hallway" ? 64 : 44,
                      height: 40,
                      background: active ? "rgba(255,122,92,0.25)" : "rgba(124,140,248,0.18)",
                      border: `1px solid ${active ? "var(--v3-coral)" : "#5a5d8f"}`,
                    }}
                  />
                </div>
                <div className="text-sm font-medium">{room.name}</div>
                <div className="text-[11px]" style={{ color: "var(--v3-muted)" }}>
                  {cleanFor(room.id)}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
