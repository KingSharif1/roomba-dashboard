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

/** Plain-language link state. `label` is what the UI should show. */
export type ConnectionPhase = "demo" | "connecting" | "connected" | "reconnecting" | "offline";

export type ConnectionState = {
  phase: ConnectionPhase;
  /** Words a visitor can read: "Connected", "Reconnecting…", "Robot offline", "Demo mode". */
  label: string;
  /** Status updates are arriving (socket open, or the demo stream is running). */
  linkUp: boolean;
  /** The robot reported fresh odometry. The link can be up while this is false. */
  robotReady: boolean;
  attempt: number;
  demo: boolean;
};

export type AccessRole = "owner" | "visitor" | "unknown";

export type AccessState = {
  role: AccessRole;
  email: string | null;
  demo: boolean;
  robotConfigured: boolean;
};

export type RobotSnapshot = {
  loading: boolean;
  status: RobotStatus;
  connection: ConnectionState;
  access: AccessState;
  zones: NoGoZone[];
  routes: CustomRoute[];
  sessions: CleaningSession[];
  learning: LearningItem[];
  mapUrl: string;
  cameraUrl: string;
};

export type RobotCommands = {
  start: () => Promise<{ success: boolean }>;
  /**
   * Emergency stop. Sends immediately.
   * A stop frame is written on the live socket when it is open, and REST
   * POST /control/stop always runs because the Pi's /live socket is status-only.
   * When the socket is down, that REST call is the path that still reaches the robot.
   */
  stop: () => Promise<{ success: boolean }>;
  dock: () => Promise<{ success: boolean }>;
  /** linear m/s (+ forward), angular rad/s (+ left). */
  drive: (linear: number, angular: number) => Promise<{ success: boolean }>;
};
