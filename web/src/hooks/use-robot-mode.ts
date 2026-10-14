"use client";

import { useSyncExternalStore } from "react";
import { robotSession } from "@/lib/robot-session";

function getSnapshot(): boolean {
  return robotSession.isDemo();
}

function getServerSnapshot(): boolean {
  return true;
}

/** True when this session is on the simulated robot. */
export function useRobotMode(): boolean {
  return useSyncExternalStore(robotSession.subscribe, getSnapshot, getServerSnapshot);
}
