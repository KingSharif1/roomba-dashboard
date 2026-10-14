import type { CleaningSession, CustomRoute, LearningItem, NoGoZone, RobotStatus } from "./types";
import { learningItems, noGoZones, routes, sessions } from "@data/catalog";
import { forceDemoDrop, demoLinkPhase, initialDemoLink, stepDemoLink, type DemoLinkPhase, type DemoLinkState } from "./demo/link";
import { DOCK, stepMotion } from "./demo/physics";
import { applyShowcase, statusForPreview, type MarkPreview } from "./demo/showcase";
import { withDerivedMark } from "./robot-status";

let status: RobotStatus = applyShowcase(
  {
    battery: 78,
    state: "docked",
    connected: true,
    lastSeen: new Date().toISOString(),
    pose: { x: DOCK.x, y: DOCK.y, heading: 0 },
  },
  Date.now(),
);
let commanded = false;
let markPin: MarkPreview | null = null;

let linear = 0;
let angular = 0;
let manual = false;
let cleaningStartTime: Date | null = null;
let cleaningStartBattery = 0;
let link: DemoLinkState = initialDemoLink(Date.now());

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function copyStatus(): RobotStatus {
  const current = markPin ? statusForPreview(markPin, status) : status;
  return { ...current, pose: current.pose ? { ...current.pose } : null };
}

function deriveFromLegacy(current: RobotStatus): RobotStatus {
  return withDerivedMark({ ...current, activity: undefined, charging: undefined });
}

/** `?mark=` pins one logo state over the demo cycle. Pass null to release it. */
export function setDemoMarkPin(next: MarkPreview | null): void {
  markPin = next;
}

function noteCommand(): void {
  commanded = true;
}

export function getDemoPhase(now = Date.now()): DemoLinkPhase {
  return demoLinkPhase(link, now);
}

export function tickDemo(now = Date.now(), dtSec = 0.2): RobotStatus {
  link = stepDemoLink(link, now);
  const phase = demoLinkPhase(link, now);
  const linked = phase === "demo";
  if (markPin) {
    status = statusForPreview(markPin, status);
  } else if (!linked) {
    linear = 0;
    angular = 0;
    if (manual && !cleaningStartTime) {
      manual = false;
      status = { ...status, state: "idle" };
    }
  } else if (!commanded && !manual && !cleaningStartTime) {
    status = applyShowcase(status, now);
  } else {
    const stepped = stepMotion({
      status,
      linear,
      angular,
      dtSec,
      manual,
      autoCleaning: cleaningStartTime !== null,
    });
    status = deriveFromLegacy(stepped.status);
    manual = stepped.manual;
  }
  if (markPin) {
    status = { ...status, lastSeen: new Date(now).toISOString() };
  } else {
    status = { ...status, connected: linked, lastSeen: new Date(now).toISOString() };
    if (!linked) status = deriveFromLegacy(status);
  }
  return copyStatus();
}

export function simulateConnectionDrop(durationMs?: number, now = Date.now()): void {
  link = forceDemoDrop(link, now, durationMs);
  status = deriveFromLegacy({ ...status, connected: false });
}

/** Returns false when the demo link is down so drive does not move a "disconnected" robot. */
export function setDemoDrive(nextLinear: number, nextAngular: number, now = Date.now()): boolean {
  if (demoLinkPhase(link, now) !== "demo") return false;
  noteCommand();
  linear = nextLinear;
  angular = nextAngular;
  const moving = Math.abs(nextLinear) > 0.001 || Math.abs(nextAngular) > 0.001;
  if (moving) {
    if (status.state === "docked" || status.state === "idle" || status.state === "error" || status.state === "returning") {
      status = { ...status, state: "cleaning" };
      if (!cleaningStartTime) manual = true;
    }
  } else if (manual && !cleaningStartTime) {
    manual = false;
    status = { ...status, state: "idle" };
  }
  status = deriveFromLegacy(status);
  return true;
}

function finishCleaningSession(): void {
  if (!cleaningStartTime) return;
  const duration = Math.max(1, Math.floor((Date.now() - cleaningStartTime.getTime()) / 1000));
  const batteryUsed = Math.max(0, cleaningStartBattery - status.battery);
  sessions.unshift({
    id: `session-${Date.now()}`,
    startedAt: cleaningStartTime.toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: duration,
    coveragePercent: Math.floor(Math.random() * 30) + 60,
    batteryUsedPercent: Math.round(batteryUsed),
  });
  cleaningStartTime = null;
}

export function demoEmergencyStop(): void {
  noteCommand();
  linear = 0;
  angular = 0;
  manual = false;
  if (status.state === "cleaning" || status.state === "returning") {
    finishCleaningSession();
    status = { ...status, state: "idle" };
  }
  status = deriveFromLegacy(status);
}

export async function getStatus(): Promise<RobotStatus> {
  await delay(50);
  return copyStatus();
}

export function readStatus(): RobotStatus {
  return copyStatus();
}

export async function startCleaning(): Promise<{ success: boolean }> {
  await delay(100);
  if (demoLinkPhase(link, Date.now()) !== "demo") return { success: false };
  if (status.state === "docked" || status.state === "idle") {
    noteCommand();
    status = deriveFromLegacy({ ...status, state: "cleaning" });
    cleaningStartTime = new Date();
    cleaningStartBattery = status.battery;
    manual = false;
    return { success: true };
  }
  return { success: false };
}

export async function stopCleaning(): Promise<{ success: boolean }> {
  await delay(100);
  demoEmergencyStop();
  return { success: true };
}

export async function returnToDock(): Promise<{ success: boolean }> {
  await delay(100);
  if (demoLinkPhase(link, Date.now()) !== "demo") return { success: false };
  if (status.state === "docked") return { success: false };
  noteCommand();
  linear = 0;
  angular = 0;
  manual = false;
  finishCleaningSession();
  status = deriveFromLegacy({ ...status, state: "returning" });
  return { success: true };
}

export async function getSessions(): Promise<CleaningSession[]> {
  await delay(50);
  return [...sessions];
}

export function readSessions(): CleaningSession[] {
  return [...sessions];
}

export async function getLearningItems(): Promise<LearningItem[]> {
  await delay(50);
  return learningItems.map((item) => ({ ...item, location: { ...item.location } }));
}

export function readLearningItems(): LearningItem[] {
  return learningItems.map((item) => ({ ...item, location: { ...item.location } }));
}

export async function verifyLearningItem(id: string, label: string): Promise<{ success: boolean }> {
  await delay(100);
  const item = learningItems.find((entry) => entry.id === id);
  if (!item) return { success: false };
  item.userLabel = label;
  item.status = "verified";
  return { success: true };
}

export async function dismissLearningItem(id: string): Promise<{ success: boolean }> {
  await delay(100);
  const item = learningItems.find((entry) => entry.id === id);
  if (!item) return { success: false };
  item.status = "dismissed";
  return { success: true };
}

export async function getNoGoZones(): Promise<NoGoZone[]> {
  await delay(50);
  return noGoZones.map((zone) => ({ ...zone, points: zone.points.map((point) => ({ ...point })) }));
}

export function readNoGoZones(): NoGoZone[] {
  return noGoZones.map((zone) => ({ ...zone, points: zone.points.map((point) => ({ ...point })) }));
}

export async function getRoutes(): Promise<CustomRoute[]> {
  await delay(50);
  return routes.map((route) => ({
    ...route,
    waypoints: route.waypoints.map((waypoint) => ({ ...waypoint })),
  }));
}

export function readRoutes(): CustomRoute[] {
  return routes.map((route) => ({
    ...route,
    waypoints: route.waypoints.map((waypoint) => ({ ...waypoint })),
  }));
}
