"use client";

import { useSyncExternalStore } from "react";
import * as robot from "@/lib/robot";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("robotUrlChanged", onStoreChange);
  return () => window.removeEventListener("robotUrlChanged", onStoreChange);
}

function getSnapshot(): boolean {
  return robot.isMockMode();
}

function getServerSnapshot(): boolean {
  return true;
}

export function useRobotMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
