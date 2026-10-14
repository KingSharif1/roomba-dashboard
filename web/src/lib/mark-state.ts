// Living-mark state. Same rules as the logo file:
// offline (no connection) > fault > stopped > charging (≥99% = charged) > low (<20%) > moving > idle.

export type MarkState =
  | "idle"
  | "moving"
  | "charging"
  | "full"
  | "low"
  | "stopped"
  | "fault"
  | "offline";

export type RobotActivity = "offline" | "charging" | "moving" | "stopped" | "idle" | "fault";

export type RobotStatusLike = {
  connected?: boolean;
  activity?: string;
  charging?: boolean;
  battery?: number;
};

export const LOW_BATTERY = 20;
export const CHARGED_PERCENT = 99;

const ACTIVITIES: readonly RobotActivity[] = ["offline", "charging", "moving", "stopped", "idle", "fault"];

export function isRobotActivity(value: string): value is RobotActivity {
  return (ACTIVITIES as readonly string[]).includes(value);
}

export function markStateFrom(s?: RobotStatusLike | null): MarkState {
  if (!s || s.connected === false || s.activity === "offline") return "offline";
  if (s.activity === "fault") return "fault";
  if (s.activity === "stopped") return "stopped";
  const b = s.battery ?? 100;
  if (s.charging || s.activity === "charging") return b >= CHARGED_PERCENT ? "full" : "charging";
  if (b < LOW_BATTERY) return "low";
  if (s.activity === "moving") return "moving";
  return "idle";
}

/** Green = OK/working, yellow = charging, orange = low, red = stopped/fault, gray = offline. */
export type StatusTone = "ok" | "charging" | "low" | "alert" | "offline";

export function statusTone(s?: RobotStatusLike | null): StatusTone {
  const mark = markStateFrom(s);
  if (mark === "offline") return "offline";
  if (mark === "fault" || mark === "stopped") return "alert";
  if (mark === "charging") return "charging";
  if (mark === "low") return "low";
  return "ok";
}

export const TONE_HEX: Record<StatusTone, string> = {
  ok: "#00ff9d",
  charging: "#ffd23f",
  low: "#ff7a1a",
  alert: "#ff3b3b",
  offline: "#666666",
};

export const TONE_TEXT: Record<StatusTone, string> = {
  ok: "text-accent",
  charging: "text-charging",
  low: "text-warning",
  alert: "text-danger",
  offline: "text-muted",
};

export const TONE_BG: Record<StatusTone, string> = {
  ok: "bg-accent",
  charging: "bg-charging",
  low: "bg-warning",
  alert: "bg-danger",
  offline: "bg-muted",
};

export function toneRgba(tone: StatusTone, alpha: number): string {
  const hex = TONE_HEX[tone].slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function robotPaint(s?: RobotStatusLike | null): { fill: string; glow: string } {
  const tone = statusTone(s);
  return { fill: TONE_HEX[tone], glow: toneRgba(tone, 0.4) };
}
