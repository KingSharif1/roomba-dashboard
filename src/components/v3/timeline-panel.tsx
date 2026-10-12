"use client";

import { ChevronDown, ChevronRight, X } from "lucide-react";
import { demoTimeline } from "@/lib/v3/demo";
import { useV3Robot } from "@/lib/v3/store";

export function V3TimelinePanel() {
  const { state, dismissTimeline } = useV3Robot();
  const visible = demoTimeline.filter((ev) => !state.timelineHidden.has(ev.id));

  return (
    <div className="v3-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="v3-panel-title">Timeline</span>
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--v3-coral)" }}>
          All <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--v3-muted)" }} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <p className="text-sm" style={{ color: "var(--v3-muted)" }}>
            All caught up — nothing new.
          </p>
        )}
        {visible.map((ev) => (
          <div key={ev.id} className="flex gap-3 group">
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
                      onClick={() => dismissTimeline(ev.id)}
                      className="px-2.5 py-1 text-[11px] rounded border hover:opacity-80"
                      style={{ borderColor: "var(--v3-border)", color: "var(--v3-muted)" }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                aria-label={`Dismiss ${ev.title}`}
                onClick={() => dismissTimeline(ev.id)}
                className="p-1 rounded hover:opacity-70"
              >
                <X className="w-3.5 h-3.5" style={{ color: "var(--v3-muted)" }} />
              </button>
              {ev.kind === "run" && (
                <ChevronRight className="w-4 h-4 mt-0.5" style={{ color: "var(--v3-muted)" }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
