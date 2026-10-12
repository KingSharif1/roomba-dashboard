import type {
  Room,
  Door,
  RobotLocation,
  DoorBlockedEvent,
  DemoRobotState,
} from "./types";

// Demo seed — same shapes as the real robot API (contract.md).
// Kitchen door is closed so the door-blocked toast path is exercisable.

export const demoRooms: Room[] = [
  { id: "bedroom", name: "Bedroom" },
  { id: "bathroom", name: "Bath" },
  { id: "closet", name: "Closet" },
  { id: "setup-room", name: "Setup Room" },
  { id: "hallway", name: "Hall" },
  { id: "living-room", name: "Living" },
  { id: "dining", name: "Dining" },
  { id: "kitchen", name: "Kitchen" },
];

export const demoDoors: Door[] = [
  {
    id: "kitchen-door",
    name: "Kitchen door",
    rooms: ["dining", "kitchen"],
    state: "closed",
    checkedAt: new Date().toISOString(),
  },
  {
    id: "bedroom-door",
    name: "Bedroom door",
    rooms: ["hallway", "bedroom"],
    state: "open",
    checkedAt: new Date().toISOString(),
  },
  {
    id: "bath-door",
    name: "Bath door",
    rooms: ["hallway", "bathroom"],
    state: "unknown",
    checkedAt: null,
  },
];

export const demoLocation: RobotLocation = {
  roomId: "living-room",
  label: "Living room",
};

export const demoDoorBlockedEvent: DoorBlockedEvent = {
  type: "door_blocked",
  id: "evt-kitchen-door-20261012",
  doorId: "kitchen-door",
  roomId: "kitchen",
  message: "Kitchen door closed, couldn't enter",
  at: new Date().toISOString(),
};

export const demoRobot: DemoRobotState = {
  mode: "cleaning",
  battery: 61,
  batteryMinutesLeft: 52,
  location: demoLocation,
  runMinutes: 18,
  heading: "NE",
  speed: 50,
};

export const demoBatteryHistory: number[] = [
  78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61,
];

export interface RoomCleanInfo {
  roomId: string;
  lastCleaned: string;
}

export const demoRoomClean: RoomCleanInfo[] = [
  { roomId: "living-room", lastCleaned: "12h ago" },
  { roomId: "kitchen", lastCleaned: "1d ago" },
  { roomId: "dining", lastCleaned: "1d ago" },
  { roomId: "setup-room", lastCleaned: "3d ago" },
  { roomId: "bedroom", lastCleaned: "5d ago" },
  { roomId: "hallway", lastCleaned: "2d ago" },
];

export interface TimelineEvent {
  id: string;
  title: string;
  detail?: string;
  kind: "alert" | "run";
  actions?: string[];
}

export const demoTimeline: TimelineEvent[] = [
  {
    id: "tl-cable",
    title: "Cable · Kitchen",
    kind: "alert",
    actions: ["Keep away", "Ignore"],
  },
  {
    id: "tl-run-1",
    title: "Living · Kitchen · Dining",
    detail: "Today 2:28 AM · 50 min",
    kind: "run",
  },
  {
    id: "tl-run-2",
    title: "Setup room",
    detail: "Yesterday 10:28 PM · 30 min",
    kind: "run",
  },
  {
    id: "tl-run-3",
    title: "All rooms",
    detail: "Yesterday 4:28 PM · 1 h 10 min",
    kind: "run",
  },
];
