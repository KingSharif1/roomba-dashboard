export type RobotState = "idle" | "cleaning" | "docked" | "returning" | "error";

export type RobotStatus = {
  battery: number;
  state: RobotState;
  connected: boolean;
  lastSeen: string;
  pose: { x: number; y: number; heading: number } | null;
};

export type CleaningSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  coveragePercent: number;
  batteryUsedPercent: number;
};

export type NoGoZone = {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  createdAt: string;
};

export type Waypoint = {
  id: string;
  x: number;
  y: number;
  order: number;
};

export type CustomRoute = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: string;
};

export type LearningItem = {
  id: string;
  imageUrl: string;
  detectedAt: string;
  location: { x: number; y: number };
  suggestedLabel: string | null;
  userLabel: string | null;
  status: "pending" | "verified" | "dismissed";
};

export type Settings = {
  piAddress: string;
  autoReturnToDock: boolean;
  lowBatteryThreshold: number;
};
