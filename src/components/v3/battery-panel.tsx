"use client";

import { BatteryCharging } from "lucide-react";
import { demoBatteryHistory, demoBatteryDetail } from "@/lib/v3/demo";
import { useV3Robot } from "@/lib/v3/store";
import { V3Collapsible } from "./collapsible-card";

export function V3BatteryPanel() {
  const { state } = useV3Robot();
  const { battery, mode } = state;
  const charging = mode === "docked" || demoBatteryDetail.charging;
  const accent = charging ? "var(--v3-mint)" : "var(--v3-coral)";

  const R = 54;
  const C = 2 * Math.PI * R;
  const filled = (battery / 100) * C;

  const max = Math.max(...demoBatteryHistory);
  const min = Math.min(...demoBatteryHistory);
  const pts = demoBatteryHistory
    .map((v, i) => {
      const x = (i / (demoBatteryHistory.length - 1)) * 200;
      const y = 30 - ((v - min) / (max - min || 1)) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const rows: [string, string][] = [
    ["Status", charging ? "Charging" : "Discharging"],
    ["Voltage", `${demoBatteryDetail.voltage.toFixed(1)} V`],
    [
      "Runtime",
      charging
        ? `Full in ≈ ${demoBatteryDetail.timeToFullMin} min`
        : `≈ ${demoBatteryDetail.timeToEmptyMin} min left`,
    ],
    ["Health", `${demoBatteryDetail.health}% · ${demoBatteryDetail.cycles} cycles`],
    ["Last full charge", demoBatteryDetail.lastFullCharge],
  ];

  return (
    <V3Collapsible
      icon={<BatteryCharging className="w-4 h-4" />}
      title="Battery"
      summary={`${battery}%${charging ? " · charging" : ""}`}
    >
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="#2c2e56" strokeWidth="11" />
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={accent}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${C}`}
            style={{ transition: "stroke 0.3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold mono">{battery}%</span>
          <span className="text-xs" style={{ color: "var(--v3-muted)" }}>
            {charging ? `full in ≈ ${demoBatteryDetail.timeToFullMin} min` : `≈ ${demoBatteryDetail.timeToEmptyMin} min left`}
          </span>
        </div>
      </div>
      <svg viewBox="0 0 200 34" className="w-full h-9 mt-1" aria-hidden>
        <polyline points={pts} fill="none" stroke={accent} strokeWidth="1.5" opacity="0.8" />
      </svg>
      <dl className="mt-1 divide-y text-[13px]" style={{ borderColor: "var(--v3-border-soft)" }}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1.5">
            <dt style={{ color: "var(--v3-muted)" }}>{k}</dt>
            <dd className="mono font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </V3Collapsible>
  );
}
