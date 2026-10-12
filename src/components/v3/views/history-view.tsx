"use client";

import { Clock, ChevronRight } from "lucide-react";

const runs = [
  { id: "r1", title: "Living room · Kitchen · Dining", detail: "Today 2:28 AM · 50 min · 42 m²", battery: "61%" },
  { id: "r2", title: "Setup Room", detail: "Yesterday 10:28 PM · 30 min · 18 m²", battery: "78%" },
  { id: "r3", title: "All rooms", detail: "Yesterday 4:28 PM · 1 h 10 min · 68 m²", battery: "34%" },
  { id: "r4", title: "Bedroom · Hallway", detail: "Oct 10 · 9:15 PM · 35 min · 24 m²", battery: "55%" },
  { id: "r5", title: "Living room", detail: "Oct 9 · 8:02 AM · 25 min · 20 m²", battery: "81%" },
];

export function V3HistoryView() {
  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["5", "runs this week"],
          ["3 h 10 m", "clean time"],
          ["152 m²", "area covered"],
        ].map(([v, l]) => (
          <div key={l} className="v3-panel p-4 text-center">
            <div className="text-2xl font-bold mono">{v}</div>
            <div className="text-xs mt-1" style={{ color: "var(--v3-muted)" }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="v3-panel p-4 flex flex-col gap-1">
        <span className="v3-panel-title mb-2">Recent runs</span>
        {runs.map((r) => (
          <button
            key={r.id}
            className="flex items-center gap-3 py-3 border-b last:border-0 text-left hover:opacity-80"
            style={{ borderColor: "var(--v3-border-soft)" }}
          >
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,122,92,0.1)" }}
            >
              <Clock className="w-5 h-5" style={{ color: "var(--v3-coral)" }} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">{r.title}</span>
              <span className="block text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>{r.detail}</span>
            </span>
            <span className="mono text-xs shrink-0" style={{ color: "var(--v3-mint)" }}>{r.battery}</span>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--v3-muted)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
