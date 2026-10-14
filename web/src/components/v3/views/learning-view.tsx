"use client";

import { Lightbulb, TrendingUp, MapPin, Clock } from "lucide-react";

const patterns = [
  {
    icon: Clock,
    title: "Morning runs finish 22% faster",
    detail: "Stella cleans quickest between 7–9 AM when the apartment is empty.",
  },
  {
    icon: MapPin,
    title: "Kitchen gets skipped",
    detail: "Kitchen door was closed on 4 of the last 10 runs. Consider a schedule nudge.",
  },
  {
    icon: TrendingUp,
    title: "Living room dirt trending down",
    detail: "Debris events in the living room dropped 31% over the last 2 weeks.",
  },
];

export function V3LearningView() {
  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="v3-panel p-4 flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(94,234,212,0.12)" }}
        >
          <Lightbulb className="w-5 h-5" style={{ color: "var(--v3-mint)" }} />
        </span>
        <div>
          <div className="font-semibold">3 new insights</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>
            Learned from 214 runs across 9 weeks
          </div>
        </div>
      </div>
      {patterns.map((p) => {
        const Icon = p.icon;
        return (
          <div key={p.title} className="v3-panel p-4 flex gap-3">
            <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--v3-coral)" }} />
            <div>
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="text-sm mt-1" style={{ color: "var(--v3-muted)" }}>{p.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
