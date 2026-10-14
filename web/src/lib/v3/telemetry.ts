// Stella v3 telemetry — the "gold data" for future training.
// Every run, map event, door event, drive command, and audio trigger is
// logged to Supabase via the server route (no auth; service-role key stays
// server-side). Fire-and-forget: logging never blocks the UI.

export type TelemetryKind =
  | "run_start"
  | "run_stop"
  | "room_select"
  | "drive"
  | "dock"
  | "door_blocked"
  | "timeline_dismiss"
  | "voice_listen"
  | "voice_speak"
  | "audio_trigger"
  | "battery_snapshot"
  | "setting"
  | "auto_return"
  | "twerk"
  | "voice_heard"
  | "dance_party";

export interface TelemetryEvent {
  kind: TelemetryKind;
  at: string;
  session: string;
  data?: Record<string, unknown>;
}

let sessionId: string | null = null;
function session(): string {
  if (!sessionId) {
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return sessionId;
}

export function logTelemetry(kind: TelemetryKind, data?: Record<string, unknown>): void {
  try {
    const evt: TelemetryEvent = { kind, at: new Date().toISOString(), session: session(), data };
    // Beacon when available (survives page unload); fall back to fetch.
    const body = JSON.stringify(evt);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/v3/telemetry", body);
    } else {
      fetch("/api/v3/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // telemetry must never break the dashboard
  }
}
