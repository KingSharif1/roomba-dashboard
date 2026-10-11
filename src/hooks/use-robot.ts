"use client";

import { useSyncExternalStore } from "react";
import { robotSession } from "@/lib/robot-session";
import type { RobotCommands, RobotSnapshot } from "@/lib/types";

const SERVER_SNAPSHOT: RobotSnapshot = {
  loading: true,
  status: {
    battery: 0,
    state: "idle",
    connected: false,
    lastSeen: "1970-01-01T00:00:00.000Z",
    pose: null,
  },
  connection: {
    phase: "demo",
    label: "Demo mode",
    linkUp: false,
    robotReady: false,
    attempt: 0,
    demo: true,
  },
  access: {
    role: "unknown",
    email: null,
    demo: true,
    robotConfigured: false,
  },
  zones: [],
  routes: [],
  sessions: [],
  learning: [],
  mapUrl: "/mock/map-placeholder.png",
  cameraUrl: "/mock/camera-placeholder.jpg",
};

function getServerSnapshot(): RobotSnapshot {
  return SERVER_SNAPSHOT;
}

export type UseRobot = RobotSnapshot & {
  commands: RobotCommands;
  /** Drop the demo link so the UI cycles Reconnecting… → Robot offline → Demo mode. */
  simulateDrop: (durationMs?: number) => void;
};

/**
 * Shared robot state for the visual redesign.
 * Requires `RobotProvider` (already mounted in the root layout).
 */
export function useRobot(): UseRobot {
  const snapshot = useSyncExternalStore(robotSession.subscribe, robotSession.getSnapshot, getServerSnapshot);
  return {
    ...snapshot,
    commands: robotSession.commands,
    simulateDrop: robotSession.simulateDrop,
  };
}
