"use client";

import { useState } from "react";
import { Clock, ChevronRight } from "lucide-react";

const runs = [
  { id: "r1", title: "Living room · Kitchen · Dining", date: "Today", time: "2:28 AM", duration: "50 min", distance: "184 m", area: "42 m²", battery: "61%", events: 3 },
  { id: "r2", title: "Setup Room", date: "Yesterday", time: "10:28 PM", duration: "30 min", distance: "96 m", area: "18 m²", battery: "78%", events: 1 },
  { id: "r3", title: "All rooms", date: "Yesterday", time: "4:28 PM", duration: "1 h 10 min", distance: "312 m", area: "68 m²", battery: "34%", events: 5 },
  { id: "r4", title: "Bedroom · Hallway", date: "Oct 10", time: "9:15 PM", duration: "35 min", distance: "118 m", area: "24 m²", battery: "55%", events: 2 },
  { id: "r5", title: "Living room", date: "Oct 9", time: "8:02 AM", duration: "25 min", distance: "88 m", area: "20 m²", battery: "81%", events: 0 },
];

export function V3HistoryView() {
  const [expanded, setExpanded] = useState<string | null>(null);

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
        {runs.map((r) => {
          const open = expanded === r.id;
          return (
            <div key={r.id} className="border-b last:border-0" style={{ borderColor: "var(--v3-border-soft)" }}>
              <button
                onClick={() => setExpanded(open ? null : r.id)}
                aria-expanded={open}
                className="flex items-center gap-3 py-3 text-left hover:opacity-80 w-full"
              >
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,122,92,0.1)" }}
                >
                  <Clock className="w-5 h-5" style={{ color: "var(--v3-coral)" }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{r.title}</span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>
                    {r.date} {r.time} · {r.duration} · {r.area}
                  </span>
                </span>
                <span className="mono text-xs shrink-0" style={{ color: "var(--v3-mint)" }}>{r.battery}</span>
                <ChevronRight
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{ color: "var(--v3-muted)", transform: open ? "rotate(90deg)" : "none" }}
                />
              </button>
              {open && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pb-4 pl-[52px] text-[13px]">
                  {[
                    ["Date", `${r.date} · ${r.time}`],
                    ["Duration", r.duration],
                    ["Distance", r.distance],
                    ["Area", r.area],
                    ["Battery after", r.battery],
                    ["Events", String(r.events)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <dt style={{ color: "var(--v3-muted)" }}>{k}</dt>
                      <dd className="mono font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
