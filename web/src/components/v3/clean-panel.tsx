"use client";

import { useState } from "react";
import { SprayCan } from "lucide-react";
import { demoRooms, demoRoomClean } from "@data/demo";
import { useV3Robot } from "@/lib/v3/store";
import { V3Collapsible } from "./collapsible-card";

const SHOWN = ["living-room", "kitchen", "dining", "setup-room", "bedroom", "hallway"];

export function V3CleanPanel() {
  const { state, selectRoom, cleanMode } = useV3Robot();
  const { targetRooms, mode } = state;
  const [cleanBtn, setCleanBtn] = useState<"all" | "stop" | "dock">("all");

  const pickMode = (m: "all" | "stop" | "dock") => {
    setCleanBtn(m);
    cleanMode(m);
  };

  const cleanFor = (id: string) =>
    demoRoomClean.find((c) => c.roomId === id)?.lastCleaned ?? "—";

  const modeWord = mode === "cleaning" ? "cleaning" : mode === "docked" ? "docked" : "idle";

  return (
    <V3Collapsible
      icon={<SprayCan className="w-4 h-4" />}
      title="Clean"
      summary={`${targetRooms.length} rooms · ${modeWord}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => pickMode("all")}
          className={`px-3 py-1.5 text-xs font-semibold ${cleanBtn === "all" ? "v3-btn-coral" : "v3-btn-ghost"}`}
        >
          All rooms
        </button>
        <button
          onClick={() => pickMode("stop")}
          className={`px-3 py-1.5 text-xs font-semibold ${cleanBtn === "stop" ? "v3-btn-coral" : "v3-btn-ghost"}`}
        >
          Stop
        </button>
        <button
          onClick={() => pickMode("dock")}
          className={`px-3 py-1.5 text-xs font-semibold ${cleanBtn === "dock" ? "v3-btn-coral" : "v3-btn-ghost"}`}
        >
          Dock
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {demoRooms
          .filter((r) => SHOWN.includes(r.id))
          .map((room) => {
            const active = targetRooms.includes(room.id);
            return (
              <button
                key={room.id}
                onClick={() => selectRoom(room.id)}
                className="rounded-lg border p-2.5 text-left transition-all active:scale-[0.98]"
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
    </V3Collapsible>
  );
}
