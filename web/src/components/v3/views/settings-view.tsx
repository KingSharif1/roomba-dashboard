"use client";

import { useV3Robot, type V3Settings } from "@/lib/v3/store";

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
  const { state, setSetting } = useV3Robot();
  const s: V3Settings = state.settings;

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Cleaning</span>
        <Toggle
          on={s.autoSchedule}
          onChange={(v) => setSetting("autoSchedule", v)}
          label="Auto schedule"
          hint="Run weeknights at 8 PM when the apartment is empty. Also returns Stella to the dock when the battery runs low."
        />
        <Toggle
          on={s.quietHours}
          onChange={(v) => setSetting("quietHours", v)}
          label="Quiet hours"
          hint="Cap speed at 40% between 10 PM and 7 AM"
        />
      </div>
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Notifications</span>
        <Toggle
          on={s.doorAlerts}
          onChange={(v) => setSetting("doorAlerts", v)}
          label="Door-blocked alerts"
          hint="Ping when a closed door blocks a run"
        />
      </div>
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Voice</span>
        <Toggle
          on={s.soundTrigger}
          onChange={(v) => setSetting("soundTrigger", v)}
          label="Sound-triggered recording"
          hint="Auto-record on loud sudden noises; ignores music and speech. Off by default — no audio is captured yet (UI preview)."
        />
      </div>
      <div className="v3-panel px-4 divide-y" style={{ borderColor: "var(--v3-border-soft)" }}>
        <span className="v3-panel-title block pt-4 pb-1">Robot</span>
        <Toggle
          on={s.learning}
          onChange={(v) => setSetting("learning", v)}
          label="Learning"
          hint="Adapt routes from run history"
        />
        <div className="py-3 text-sm" style={{ color: "var(--v3-muted)" }}>
          Stella · v3 · Roomba 694 + Pi 4
        </div>
      </div>
    </div>
  );
}
