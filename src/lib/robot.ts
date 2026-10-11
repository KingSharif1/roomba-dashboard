import type { CleaningSession, CustomRoute, LearningItem, NoGoZone, RobotStatus } from "./types";
import * as demo from "./mockRobot";
import { robotSession } from "./robot-session";

/**
 * Legacy facade over the shared robot session.
 * New UI should use `useRobot()` from `@/hooks/use-robot`.
 * A URL saved in the browser cannot unlock the real robot.
 */

export function setRobotUrl(url: string): void {
  // Ignored. ROBOT_URL is read on the server and released only to the owner.
  void url;
}

export function clearRobotUrl(): void {
  // Ignored. See setRobotUrl.
}

export function getRobotUrlSetting(): string {
  return robotSession.getRobotUrl() ?? "mock";
}

export function isMockMode(): boolean {
  return robotSession.isDemo();
}

export async function getStatus(): Promise<RobotStatus> {
  if (robotSession.isDemo()) return demo.getStatus();
  const base = robotSession.getRobotUrl();
  if (!base) return demo.getStatus();
  const res = await fetch(`${base}/status`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function startCleaning(): Promise<{ success: boolean }> {
  return robotSession.commands.start();
}

export async function stopCleaning(): Promise<{ success: boolean }> {
  return robotSession.commands.stop();
}

export async function emergencyStop(): Promise<{ success: boolean }> {
  return robotSession.commands.stop();
}

export async function returnToDock(): Promise<{ success: boolean }> {
  return robotSession.commands.dock();
}

export async function drive(linear: number, angular: number): Promise<{ success: boolean }> {
  return robotSession.commands.drive(linear, angular);
}

export async function getSessions(): Promise<CleaningSession[]> {
  if (robotSession.isDemo()) return demo.getSessions();
  return fetchList("/sessions");
}

export async function getLearningItems(): Promise<LearningItem[]> {
  if (robotSession.isDemo()) return demo.getLearningItems();
  return fetchList("/learning");
}

export async function verifyLearningItem(id: string, label: string): Promise<{ success: boolean }> {
  if (robotSession.isDemo()) {
    const result = await demo.verifyLearningItem(id, label);
    robotSession.noteDemoMutation();
    return result;
  }
  return postJson(`/learning/${id}/verify`, { label });
}

export async function dismissLearningItem(id: string): Promise<{ success: boolean }> {
  if (robotSession.isDemo()) {
    const result = await demo.dismissLearningItem(id);
    robotSession.noteDemoMutation();
    return result;
  }
  return postJson(`/learning/${id}/dismiss`);
}

export async function getNoGoZones(): Promise<NoGoZone[]> {
  if (robotSession.isDemo()) return demo.getNoGoZones();
  return fetchList("/zones");
}

export async function getRoutes(): Promise<CustomRoute[]> {
  if (robotSession.isDemo()) return demo.getRoutes();
  return fetchList("/routes");
}

export function getMapUrl(): string {
  return robotSession.getSnapshot().mapUrl;
}

export function getCameraUrl(): string {
  return robotSession.getSnapshot().cameraUrl;
}

export function startLiveUpdates(
  onUpdate: (status: RobotStatus) => void,
  onDisconnect?: () => void,
): () => void {
  const release = robotSession.retain();
  let connected = robotSession.getSnapshot().status.connected;
  const unsubscribe = robotSession.subscribe(() => {
    const status = robotSession.getSnapshot().status;
    onUpdate(status);
    if (connected && !status.connected) onDisconnect?.();
    connected = status.connected;
  });
  onUpdate(robotSession.getSnapshot().status);
  return () => {
    unsubscribe();
    release();
  };
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const robotUrl = robotSession.getRobotUrl();
  if (!robotUrl) {
    return { success: false, error: "Demo mode — the live robot is not available for this session" };
  }
  try {
    const res = await fetch(`${robotUrl}/status`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return { success: true };
    return { success: false, error: `HTTP ${res.status}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Connection failed" };
  }
}

async function fetchList<T>(path: string): Promise<T> {
  const base = robotSession.getRobotUrl();
  if (!base) throw new Error("Demo mode");
  const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function postJson(path: string, body?: unknown): Promise<{ success: boolean }> {
  const base = robotSession.getRobotUrl();
  if (!base) return { success: false };
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(5000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) return { success: false };
  return res.json();
}
