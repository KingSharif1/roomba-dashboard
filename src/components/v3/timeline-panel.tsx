"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { demoTimeline } from "@/lib/v3/demo";

export function V3TimelinePanel() {
  return (
    <div className="v3-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="v3-panel-title">Timeline</span>
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--v3-coral)" }}>
          All <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--v3-muted)" }} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {demoTimeline.map((ev) => (
          <div key={ev.id} className="flex gap-3">
            <div
              className="w-0.5 rounded shrink-0"
              style={{ background: ev.kind === "alert" ? "var(--v3-mint)" : "var(--v3-coral)" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{ev.title}</div>
              {ev.detail && (
                <div className="text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>
                  {ev.detail}
                </div>
              )}
              {ev.actions && (
                <div className="flex gap-2 mt-2">
                  {ev.actions.map((a) => (
                    <button
                      key={a}
                      className="px-2.5 py-1 text-[11px] rounded border"
                      style={{ borderColor: "var(--v3-border)", color: "var(--v3-muted)" }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {ev.kind === "run" && (
              <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--v3-muted)" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
