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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] tracking-widest" style={{ color: "var(--eng-muted)" }}>LINK</div>
            <div className={`font-bold text-sm ${isLive ? "eng-glow-green" : "eng-glow-amber"}`}>
              {isLive ? "● LIVE" : "○ " + connection.toUpperCase()}
            </div>
          </div>
          <div className="text-right min-w-[80px]">
            <div className="text-[10px] tracking-widest mb-1" style={{ color: "var(--eng-muted)" }}>
              PWR {Math.round(battery)}%{mode === "idle" ? <span className="eng-charge-bolt">⚡</span> : null}
            </div>
            <div className={`eng-bar ${battery > 50 ? "eng-bar-green" : battery > 20 ? "eng-bar-amber" : "eng-bar-red"} ${mode === "idle" ? "eng-charging" : ""}`}>
              <div className="eng-bar-fill" style={{ width: `${battery}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-widest" style={{ color: "var(--eng-muted)" }}>MODE</div>
            <div className="eng-glow-cyan font-bold text-sm">{mode.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Jarvis-style voice interface */
function EngVoice() {
  const { state, toggleListening } = useV3Robot();
  const { voice, voiceLine } = state;
  const isListening = voice === "listening";
  const isSpeaking = voice === "speaking";
  const isActive = isListening || isSpeaking;

  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Stella Voice</span>
        <span className={`eng-led ${isListening ? "eng-led-green" : isSpeaking ? "eng-led-amber" : "eng-led-off"}`} />
      </div>
      <div className="p-4 flex flex-col items-center">
        {/* Jarvis circular HUD */}
        <button
          onClick={() => toggleListening()}
          className="jarvis-orb"
          data-state={isListening ? "listening" : isSpeaking ? "speaking" : "idle"}
          aria-label={isListening ? "Stop listening" : "Push to talk"}
        >
          <span className="jarvis-ring jarvis-ring-1" />
          <span className="jarvis-ring jarvis-ring-2" />
          <span className="jarvis-ring jarvis-ring-3" />
          <span className="jarvis-core">
            {isListening ? (
              <span className="jarvis-bars">
                {[...Array(7)].map((_, i) => (
                  <span key={i} className="jarvis-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </span>
            ) : (
              <span className="jarvis-mic">◉</span>
            )}
          </span>
          <span className="jarvis-label">
            {isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : "TAP TO TALK"}
          </span>
        </button>
        {voiceLine && (
          <div className="mt-3 p-2 text-xs w-full" style={{ background: "var(--eng-panel-2)", border: "1px solid var(--eng-border)" }}>
            <span style={{ color: "var(--eng-muted)" }}>&gt; </span>
            <span className="eng-readout-cyan">{voiceLine}</span>
          </div>
        )}
        <div className="mt-2 text-[10px] leading-relaxed text-center" style={{ color: "var(--eng-muted)" }}>
          Try: "twerk" · "play YoungBoy" · "open Spotify" · "twerk and play YoungBoy on living room"
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
  const { state, wakeRobot } = useV3Robot();
  const isLive = state.connection === "live";

  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Manual Drive</span>
        <span className="text-[9px] tracking-widest" style={{ color: "var(--eng-muted)" }}>HOLD TO MOVE</span>
      </div>
      {!isLive && (
        <div className="p-3" style={{ borderBottom: "1px solid var(--eng-border)" }}>
          <button
            onClick={() => wakeRobot()}
            className="eng-btn eng-btn-primary w-full"
            style={{ padding: "12px" }}
          >
            ⏰ WAKE STELLA
          </button>
          <div className="mt-2 text-[10px]" style={{ color: "var(--eng-muted)" }}>
            Stella is not responding. Press to restart the driver and reconnect.
          </div>
        </div>
      )}
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
  const { state } = useV3Robot();
  const isLiveHeader = state.connection === "live";
  const batteryHeader = state.battery;
  return (
    <div className="eng eng-grid-bg min-h-screen flex flex-col">
      <EngHeader />

      <div className="eng-ticker">
        <span>STELLA UNIT-01 // SYSTEMS NOMINAL // {isLiveHeader ? "UPLINK ACTIVE" : "STANDBY MODE"} // BATTERY {Math.round(batteryHeader)}% // READY FOR COMMANDS //</span>
      </div>

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
