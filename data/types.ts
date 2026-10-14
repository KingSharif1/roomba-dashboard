// Stella v3 — UI ↔ data contract (ARK projects/stella/docs/contract.md)
// UI renders room names as-is. No coordinates cross the UI boundary.

export type RoomId = string;

export interface Room {
  id: RoomId;
  name: string;
}

export type DoorState = "open" | "closed" | "unknown";

export interface Door {
  id: string;
  name: string;
  rooms: [RoomId, RoomId | null];
  state: DoorState;
  checkedAt: string | null;
}

export interface RobotLocation {
  roomId: RoomId | null;
  label: string;
}

export interface DoorBlockedEvent {
  type: "door_blocked";
  id: string;
  doorId: string;
  roomId: RoomId;
  message: string;
  at: string;
}

export type RobotMode = "cleaning" | "docked" | "idle" | "returning";

/** Voice pipeline state. UI-only in demo; the real audio pipeline
 *  (Pi mic → STT → intent → TTS) wires into the actions below later. */
export type VoiceState = "idle" | "listening" | "speaking";

export interface DemoRobotState {
  mode: RobotMode;
  battery: number; // 0-100
  batteryMinutesLeft: number;
  location: RobotLocation;
  runMinutes: number;
  heading: string;
  speed: number; // 0-100
  voice: VoiceState;
  /** demo transcript line shown while speaking */
  voiceLine: string | null;
}
