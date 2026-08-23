import type { RobotStatus, CleaningSession, LearningItem, NoGoZone, CustomRoute } from "./types";
import * as mock from "./mockRobot";

const STORAGE_KEY = "roomba_robot_url";
const ENV_ROBOT_URL = process.env.NEXT_PUBLIC_ROBOT_URL;

function getRobotUrl(): string | null {
  if (typeof window === "undefined") return ENV_ROBOT_URL || null;
  return localStorage.getItem(STORAGE_KEY) || ENV_ROBOT_URL || null;
}

function shouldUseMock(): boolean {
  const url = getRobotUrl();
  return !url || url === "mock";
}

export function setRobotUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, url);
  window.dispatchEvent(new Event("robotUrlChanged"));
}

export function getRobotUrlSetting(): string {
  return getRobotUrl() || "mock";
}

export function clearRobotUrl(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("robotUrlChanged"));
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const robotUrl = getRobotUrl();
  if (!robotUrl || robotUrl === "mock") {
    throw new Error("Mock mode - should not reach fetchApi");
  }
  
  const res = await fetch(`${robotUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
}

export async function getStatus(): Promise<RobotStatus> {
  if (shouldUseMock()) return mock.getStatus();
  return fetchApi<RobotStatus>("/status");
}

export async function startCleaning(): Promise<{ success: boolean }> {
  if (shouldUseMock()) return mock.startCleaning();
  return fetchApi<{ success: boolean }>("/control/start", { method: "POST" });
}

export async function stopCleaning(): Promise<{ success: boolean }> {
  if (shouldUseMock()) return mock.stopCleaning();
  return fetchApi<{ success: boolean }>("/control/stop", { method: "POST" });
}

export async function returnToDock(): Promise<{ success: boolean }> {
  if (shouldUseMock()) return mock.returnToDock();
  return fetchApi<{ success: boolean }>("/control/dock", { method: "POST" });
}

export async function getSessions(): Promise<CleaningSession[]> {
  if (shouldUseMock()) return mock.getSessions();
  return fetchApi<CleaningSession[]>("/sessions");
}

export async function getLearningItems(): Promise<LearningItem[]> {
  if (shouldUseMock()) return mock.getLearningItems();
  return fetchApi<LearningItem[]>("/learning");
}

export async function verifyLearningItem(id: string, label: string): Promise<{ success: boolean }> {
  if (shouldUseMock()) return mock.verifyLearningItem(id, label);
  return fetchApi<{ success: boolean }>(`/learning/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function dismissLearningItem(id: string): Promise<{ success: boolean }> {
  if (shouldUseMock()) return mock.dismissLearningItem(id);
  return fetchApi<{ success: boolean }>(`/learning/${id}/dismiss`, { method: "POST" });
}

export async function getNoGoZones(): Promise<NoGoZone[]> {
  if (shouldUseMock()) return mock.getNoGoZones();
  return fetchApi<NoGoZone[]>("/zones");
}

export async function getRoutes(): Promise<CustomRoute[]> {
  if (shouldUseMock()) return mock.getRoutes();
  return fetchApi<CustomRoute[]>("/routes");
}

export function getMapUrl(): string {
  if (shouldUseMock()) return "/mock/map-placeholder.png";
  return `${getRobotUrl()}/map`;
}

export function getCameraUrl(): string {
  if (shouldUseMock()) return "/mock/camera-placeholder.jpg";
  return `${getRobotUrl()}/camera/stream`;
}

export function startLiveUpdates(onUpdate: (status: RobotStatus) => void): () => void {
  if (shouldUseMock()) {
    return mock.startMockUpdates(onUpdate) || (() => {});
  }
  
  const robotUrl = getRobotUrl();
  const ws = new WebSocket(`${robotUrl?.replace("http", "ws")}/live`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
    }
  };
  
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  return () => ws.close();
}

export function isMockMode(): boolean {
  return shouldUseMock();
}

export async function testConnection(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${url}/status`, { 
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Connection failed" };
  }
}
