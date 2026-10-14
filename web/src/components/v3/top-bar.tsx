"use client";

import { Settings, Mic } from "lucide-react";
import { StellaMark } from "@/components/v3/stella-logo";
import { modeLabel, useV3Robot } from "@/lib/v3/store";
import type { RobotMode, VoiceState } from "../../../../data/types";

function logoAnimClass(mode: RobotMode, voice: VoiceState): string {
  if (voice === "listening") return "v3-logo-listen";
  if (voice === "speaking") return "v3-logo-speak";
  switch (mode) {
    case "cleaning":
      return "v3-logo-clean";
    case "docked":
      return "v3-logo-charge";
    default:
      return "";
  }
}

function voiceLabel(voice: VoiceState): string | null {
  if (voice === "listening") return "Listening…";
  if (voice === "speaking") return "Speaking…";
  return null;
}

export function V3TopBar({ onSettings }: { onSettings?: () => void }) {
  const { state, toggleListening } = useV3Robot();
  const { mode, battery, location, voice, connection } = state;
  const vlabel = voiceLabel(voice);

  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b shrink-0"
      style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)" }}>
      <div className="flex items-center gap-3">
        <span className={logoAnimClass(mode, voice)} style={{ display: "inline-flex", borderRadius: 10, border: "1px solid var(--v3-coral)" }}>
          <StellaMark size={38} />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-[0.25em] flex items-center gap-2">
            {/* Status light: green = LIVE on tailnet, amber = DEMO */}
            <span
              title={connection === "live" ? "Live — connected to Stella" : connection === "connecting" ? "Connecting…" : "Demo mode"}
              className="w-2.5 h-2.5 rounded-full v3-pulse shrink-0"
              style={{
                background: connection === "live" ? "var(--v3-mint)" : connection === "connecting" ? "var(--v3-muted)" : "var(--v3-amber)",
                boxShadow: connection === "live"
                  ? "0 0 8px rgba(94,234,212,0.9)"
                  : connection === "demo" ? "0 0 8px rgba(251,191,36,0.7)" : "none",
              }}
            />
            STELLA
            {connection === "live" && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest"
                style={{ background: "rgba(94,234,212,0.15)", color: "var(--v3-mint)" }}
              >
                LIVE
              </span>
            )}
            {connection === "demo" && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-widest"
                style={{ background: "rgba(143,145,184,0.12)", color: "var(--v3-muted)" }}
              >
                Demo
              </span>
            )}
          </h1>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--v3-muted)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full v3-pulse"
              style={{ background: vlabel ? "var(--v3-mint)" : mode === "cleaning" ? "var(--v3-coral)" : mode === "docked" ? "var(--v3-mint)" : "var(--v3-muted)" }}
            />
            {vlabel ?? `${modeLabel(mode)} · ${location.label}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button
          aria-label={voice === "idle" ? "Start listening" : "Stop listening"}
          onClick={toggleListening}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-80"
          style={{
            borderColor: voice === "idle" ? "var(--v3-border)" : "var(--v3-mint)",
            background: voice === "idle" ? "transparent" : "rgba(94,234,212,0.12)",
          }}
        >
          <Mic className="w-4 h-4" style={{ color: voice === "idle" ? "var(--v3-muted)" : "var(--v3-mint)" }} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-8 h-4 rounded-sm border flex items-center p-0.5"
            style={{ borderColor: mode === "docked" ? "var(--v3-mint)" : "var(--v3-coral)" }}
          >
            <div
              className="h-full rounded-sm"
              style={{
                width: `${battery}%`,
                background: mode === "docked" ? "var(--v3-mint)" : "var(--v3-coral)",
              }}
            />
          </div>
          <span className="mono font-semibold">{battery}%</span>
        </div>
        <button
          aria-label="Settings"
          onClick={onSettings}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-80"
          style={{ borderColor: "var(--v3-border)" }}
        >
          <Settings className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
        </button>
      </div>
    </header>
  );
}
