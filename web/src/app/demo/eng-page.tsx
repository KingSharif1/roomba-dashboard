"use client";

import { useState } from "react";
import { V3RobotProvider, useV3Robot } from "@/lib/v3/store";
import { V3DrivePanel } from "@/components/v3/drive-panel";
import { V3FloorMap } from "@/components/v3/floor-map";

/* Engineering status header */
function EngHeader() {
  const { state } = useV3Robot();
  const { connection, battery, mode } = state;
  const isLive = connection === "live";

  return (
    <header className="eng-panel" style={{ borderLeft: "none", borderRight: "none", borderTop: "none" }}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span className={`eng-led ${isLive ? "eng-led-green" : "eng-led-amber"}`} />
          <div>
            <div className="text-sm font-bold tracking-widest">STELLA</div>
            <div className="text-[10px] tracking-widest" style={{ color: "var(--eng-muted)" }}>
              UNIT-01 // ROBOT CONTROL
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <div className="text-[9px] tracking-widest" style={{ color: "var(--eng-muted)" }}>LINK</div>
            <div className={`font-bold ${isLive ? "eng-readout-green" : "eng-readout"}`}>
              {isLive ? "LIVE" : connection.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-widest" style={{ color: "var(--eng-muted)" }}>PWR</div>
            <div className="eng-readout font-bold">{Math.round(battery)}%</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-widest" style={{ color: "var(--eng-muted)" }}>MODE</div>
            <div className="eng-readout-cyan font-bold text-xs">{mode.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Engineering voice control */
function EngVoice() {
  const { state, toggleListening } = useV3Robot();
  const { voice, voiceLine } = state;

  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Voice Command</span>
        <span className={`eng-led ${voice === "listening" ? "eng-led-green" : voice === "speaking" ? "eng-led-amber" : "eng-led-off"}`} />
      </div>
      <div className="p-3">
        <button onClick={() => toggleListening()} className="eng-btn eng-btn-primary w-full">
          {voice === "listening" ? "● LISTENING..." : voice === "speaking" ? "◐ SPEAKING..." : "○ PUSH TO TALK"}
        </button>
        {voiceLine && (
          <div className="mt-2 p-2 text-xs" style={{ background: "var(--eng-panel-2)", border: "1px solid var(--eng-border)" }}>
            <span style={{ color: "var(--eng-muted)" }}>&gt; </span>
            <span className="eng-readout-cyan">{voiceLine}</span>
          </div>
        )}
        <div className="mt-2 text-[10px] leading-relaxed" style={{ color: "var(--eng-muted)" }}>
          CMDS: forward · back · left · right · stop · dock · twerk · open spotify
        </div>
      </div>
    </div>
  );
}

/* Engineering telemetry */
function EngTelemetry() {
  const { state } = useV3Robot();
  const { battery, mode, location } = state;

  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Telemetry</span>
      </div>
      <div className="p-3">
        <div className="eng-telemetry">
          <span className="eng-telemetry-label">Battery</span>
          <span className="eng-telemetry-value eng-readout">{Math.round(battery)}%</span>
        </div>
        <div className="eng-telemetry">
          <span className="eng-telemetry-label">Mode</span>
          <span className="eng-telemetry-value eng-readout-cyan">{mode.toUpperCase()}</span>
        </div>
        <div className="eng-telemetry">
          <span className="eng-telemetry-label">Position</span>
          <span className="eng-telemetry-value">{location.label || "—"}</span>
        </div>
        <div className="eng-telemetry">
          <span className="eng-telemetry-label">Uptime</span>
          <span className="eng-telemetry-value eng-readout">--:--:--</span>
        </div>
      </div>
    </div>
  );
}

/* Engineering drive control */
function EngDrive() {
  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Manual Drive</span>
        <span className="text-[9px] tracking-widest" style={{ color: "var(--eng-muted)" }}>HOLD TO MOVE</span>
      </div>
      <div className="p-4 flex justify-center">
        <V3DrivePanel />
      </div>
    </div>
  );
}

/* Engineering map */
function EngMap() {
  const [open, setOpen] = useState(false);

  return (
    <div className="eng-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="eng-panel-header w-full text-left cursor-pointer"
        style={{ background: "var(--eng-panel-2)" }}
      >
        <span className="eng-panel-title">Floor Map</span>
        <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--eng-cyan)" }}>
          {open ? "[−] COLLAPSE" : "[+] EXPAND"}
        </span>
      </button>
      {open && (
        <div className="h-[50dvh] md:h-[400px] overflow-hidden" style={{ borderTop: "1px solid var(--eng-border)" }}>
          <V3FloorMap />
        </div>
      )}
    </div>
  );
}

function EngDashboardInner() {
  return (
    <div className="eng eng-grid-bg min-h-screen flex flex-col">
      <EngHeader />

      <main className="flex-1 p-3 space-y-3 max-w-2xl mx-auto w-full pb-8">
        <EngVoice />
        <EngDrive />
        <EngMap />
        <EngTelemetry />

        <div className="text-center text-[10px] tracking-widest pt-4" style={{ color: "var(--eng-dim)" }}>
          STELLA UNIT-01 // ENGINEERING BUILD
        </div>
      </main>
    </div>
  );
}

export default function EngDashboard() {
  return (
    <V3RobotProvider>
      <EngDashboardInner />
    </V3RobotProvider>
  );
}
