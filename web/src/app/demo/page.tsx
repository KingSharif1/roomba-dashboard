"use client";

import { useState } from "react";
import { V3RobotProvider, useV3Robot } from "@/lib/v3/store";
import { V3DrivePanel } from "@/components/v3/drive-panel";
import { V3FloorMap } from "@/components/v3/floor-map";
import { StellaMascot } from "@/components/v3/stella-mascot";

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
          <div className="mt-3 p-2 text-xs w-full" style={{ background: "var(--eng-panel-2)", border: "1px solid var(--eng-border)", borderRadius: "8px" }}>
            <span style={{ color: "var(--eng-muted)" }}>&gt; </span>
            <span className="eng-readout-cyan">{voiceLine}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Voice settings - pick Stella's voice */
function EngVoiceSettings() {
  const { setVoicePreference, speak, availableVoices, ttsVoiceURI } = useV3Robot();
  const [open, setOpen] = useState(false);

  const englishVoices = availableVoices.filter(v => v.lang.startsWith("en"));

  return (
    <div className="eng-panel">
      <button
        onClick={() => setOpen(o => !o)}
        className="eng-panel-header w-full text-left cursor-pointer"
        style={{ background: "var(--eng-panel-2)" }}
      >
        <span className="eng-panel-title">Voice Settings</span>
        <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--eng-cyan)" }}>
          {open ? "[−]" : "[+]"}
        </span>
      </button>
      {open && (
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--eng-border)" }}>
          <div className="text-[10px]" style={{ color: "var(--eng-muted)" }}>
            Choose Stella's voice ({englishVoices.length} available):
          </div>
          <select
            value={ttsVoiceURI || ""}
            onChange={(e) => setVoicePreference(e.target.value)}
            className="w-full p-2 text-xs"
            style={{
              background: "var(--eng-bg-deep)",
              border: "1px solid var(--eng-border)",
              borderRadius: "8px",
              color: "var(--eng-text)",
            }}
          >
            <option value="">Auto (best available)</option>
            {englishVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          <div className="flex justify-center">
            <button
              onClick={() => speak("Hello, I'm Stella. How do I sound?")}
              className="eng-btn"
            >
              🔊 Test
            </button>
          </div>
          {englishVoices.length <= 2 && (
            <div className="text-[10px]" style={{ color: "var(--eng-amber)" }}>
              Your device only has {englishVoices.length} voice(s). For more voices, try Chrome on desktop or install additional TTS voices in your device settings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Cleaning controls - vacuum and brushes */
function EngCleaning() {
  const { state, cleaning, setCleaningMotors } = useV3Robot();
  const isLive = state.connection === "live";
  const [open, setOpen] = useState(false);
  const anyOn = cleaning.vacuum || cleaning.main_brush || cleaning.side_brush;

  const toggle = (key: "vacuum" | "main_brush" | "side_brush") => {
    const next = { ...cleaning, [key]: !cleaning[key] };
    setCleaningMotors(next.vacuum, next.main_brush, next.side_brush);
  };

  const allOff = () => setCleaningMotors(false, false, false);
  const allOn = () => setCleaningMotors(true, true, true);

  return (
    <div className="eng-panel">
      <button
        onClick={() => setOpen(o => !o)}
        className="eng-panel-header w-full text-left cursor-pointer"
        style={{ background: "var(--eng-panel-2)" }}
      >
        <span className="eng-panel-title">
          Cleaning {anyOn && <span style={{ color: "var(--eng-green)" }}>●</span>}
        </span>
        <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--eng-cyan)" }}>
          {open ? "[−]" : "[+]"}
        </span>
      </button>
      {open && (
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--eng-border)" }}>
          {!isLive && (
            <div className="text-[10px]" style={{ color: "var(--eng-amber)" }}>
              Connect to Stella to control cleaning
            </div>
          )}
          {[
            { key: "vacuum" as const, label: "Vacuum", icon: "🌀" },
            { key: "main_brush" as const, label: "Main Brush", icon: "🧹" },
            { key: "side_brush" as const, label: "Side Brush", icon: "🖌️" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              disabled={!isLive}
              className="w-full flex items-center justify-between p-2"
              style={{
                background: cleaning[key] ? "rgba(0, 255, 136, 0.1)" : "var(--eng-panel-2)",
                border: `1px solid ${cleaning[key] ? "var(--eng-green)" : "var(--eng-border)"}`,
                borderRadius: "8px",
                opacity: isLive ? 1 : 0.5,
              }}
            >
              <span className="text-xs">{icon} {label}</span>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{
                  background: cleaning[key] ? "var(--eng-green)" : "var(--eng-border)",
                  color: cleaning[key] ? "var(--eng-bg-deep)" : "var(--eng-muted)",
                }}
              >
                {cleaning[key] ? "ON" : "OFF"}
              </span>
            </button>
          ))}
          <div className="flex gap-2 justify-center pt-1">
            <button onClick={allOn} disabled={!isLive} className="eng-btn">
              All On
            </button>
            <button onClick={allOff} disabled={!isLive} className="eng-btn">
              All Off
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Engineering telemetry */
function EngTelemetry() {
  const { state } = useV3Robot();
  const { battery, mode, connection } = state;
  const isLive = connection === "live";

  // Simplified modes: ACTIVE (can move) / CHARGING / STANDBY
  // CLEANING reserved for when we control vacuum/brushes
  const displayMode = !isLive ? "OFFLINE"
    : mode === "cleaning" ? "ACTIVE"
    : mode === "docked" ? "CHARGING"
    : "STANDBY";

  const modeColor = displayMode === "ACTIVE" ? "var(--eng-green)"
    : displayMode === "CHARGING" ? "var(--eng-amber)"
    : "var(--eng-muted)";

  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Status</span>
        <span className={`eng-led ${isLive ? "eng-led-green" : "eng-led-amber"}`} />
      </div>
      <div className="p-3 space-y-3">
        {/* Big mode display */}
        <div className="text-center py-2">
          <div className="text-2xl font-bold tracking-widest" style={{ color: modeColor, textShadow: `0 0 20px ${modeColor}` }}>
            {displayMode}
          </div>
        </div>
        {/* Battery bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--eng-muted)" }}>
            <span>BATTERY</span>
            <span className="eng-readout">{isLive ? `${Math.round(battery)}%` : "—"}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--eng-panel-2)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${isLive ? battery : 0}%`,
                background: battery > 50 ? "var(--eng-green)" : battery > 20 ? "var(--eng-amber)" : "var(--eng-red)",
                boxShadow: `0 0 10px ${battery > 50 ? "var(--eng-green)" : "var(--eng-amber)"}`,
              }}
            />
          </div>
        </div>
        <div className="eng-telemetry">
          <span className="eng-telemetry-label">Link</span>
          <span className="eng-telemetry-value eng-readout-cyan">{connection.toUpperCase()}</span>
        </div>
        <div className="eng-telemetry">
          <span className="eng-telemetry-label">Position</span>
          <span className="eng-telemetry-value" style={{ color: "var(--eng-muted)" }}>No SLAM</span>
        </div>
      </div>
    </div>
  );
}

/* Engineering drive control */
function EngDrive() {
  const { state, wakeRobot } = useV3Robot();
  const isLive = state.connection === "live";
  const [open, setOpen] = useState(true);

  return (
    <div className="eng-panel">
      <button
        onClick={() => setOpen(o => !o)}
        className="eng-panel-header w-full text-left cursor-pointer"
        style={{ background: "var(--eng-panel-2)" }}
      >
        <span className="eng-panel-title">Manual Drive</span>
        <span className="flex items-center gap-2">
          <span className="text-[9px] tracking-widest" style={{ color: "var(--eng-muted)" }}>HOLD TO MOVE</span>
          <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--eng-cyan)" }}>
            {open ? "[−]" : "[+]"}
          </span>
        </span>
      </button>
      {open && (
        <>
          {!isLive && (
            <div className="p-3 flex flex-col items-center gap-2" style={{ borderTop: "1px solid var(--eng-border)" }}>
              <button
                onClick={() => wakeRobot()}
                className="eng-btn eng-btn-primary"
              >
                ⏰ Wake Stella
              </button>
              <div className="text-[10px] text-center" style={{ color: "var(--eng-muted)" }}>
                Not responding — press to reconnect
              </div>
            </div>
          )}
          <div className="p-4 flex justify-center" style={{ borderTop: "1px solid var(--eng-border)" }}>
            <V3DrivePanel />
          </div>
        </>
      )}
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
        <EngVoiceSettings />
        <EngDrive />
        <EngCleaning />
        <EngMap />
        <EngTelemetry />
        <StellaMascot />

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
