"use client";

import { useState } from "react";
import { useV3Robot } from "@/lib/v3/store";

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center justify-between w-full py-3 text-left">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs mt-0.5" style={{ color: "var(--v3-muted)" }}>{hint}</span>}
      </span>
      <span
        className="w-11 h-6 rounded-full p-0.5 flex transition-colors"
        style={{
          background: on ? "var(--v3-coral)" : "var(--v3-surface-2)",
          justifyContent: on ? "flex-end" : "flex-start",
        }}
      >
        <span className="w-5 h-5 rounded-full bg-white" />
      </span>
    </button>
  );
}

export function V3SettingsView() {
  const { state, setSoundTrigger } = useV3Robot();
  const [auto, setAuto] = useState(true);
  const [notify, setNotify] = useState(true);
  const [learning, setLearning] = useState(true);
  const [night, setNight] = useState(false);

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Cleaning</span>
        <Toggle on={auto} onChange={setAuto} label="Auto schedule" hint="Run weeknights at 8 PM when the apartment is empty" />
        <Toggle on={night} onChange={setNight} label="Quiet hours" hint="Cap speed at 40% between 10 PM and 7 AM" />
      </div>
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Notifications</span>
        <Toggle on={notify} onChange={setNotify} label="Door-blocked alerts" hint="Ping when a closed door blocks a run" />
      </div>
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Voice</span>
        <Toggle
          on={state.soundTrigger}
          onChange={setSoundTrigger}
          label="Sound-triggered recording"
          hint="Auto-record on loud sudden noises; ignores music and speech. Off by default — no audio is captured yet (UI preview)."
        />
      </div>
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Robot</span>
        <Toggle on={learning} onChange={setLearning} label="Learning" hint="Adapt routes from run history" />
        <div className="py-3 text-sm" style={{ color: "var(--v3-muted)" }}>
          Stella · v3 · Roomba 694 + Pi 4
        </div>
      </div>
    </div>
  );
}
