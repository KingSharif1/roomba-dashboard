import type { RobotStatus, CleaningSession, RobotState, LearningItem, NoGoZone, CustomRoute } from "./types";

let mockStatus: RobotStatus = {
  battery: 78,
  state: "docked",
  connected: true,
  lastSeen: new Date().toISOString(),
  pose: { x: 0.5, y: 0.8, heading: 0 },
};

let cleaningStartTime: Date | null = null;
let cleaningStartBattery: number = 0;

const mockSessions: CleaningSession[] = [
  {
    id: "session-1",
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    durationSeconds: 3600,
    coveragePercent: 94,
    batteryUsedPercent: 32,
  },
  {
    id: "session-2",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 86400000 + 2700000).toISOString(),
    durationSeconds: 2700,
    coveragePercent: 87,
    batteryUsedPercent: 28,
  },
  {
    id: "session-3",
    startedAt: new Date(Date.now() - 43200000).toISOString(),
    endedAt: new Date(Date.now() - 43200000 + 4200000).toISOString(),
    durationSeconds: 4200,
    coveragePercent: 98,
    batteryUsedPercent: 41,
  },
  {
    id: "session-4",
    startedAt: new Date(Date.now() - 21600000).toISOString(),
    endedAt: new Date(Date.now() - 21600000 + 1800000).toISOString(),
    durationSeconds: 1800,
    coveragePercent: 45,
    batteryUsedPercent: 15,
  },
  {
    id: "session-5",
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    endedAt: new Date(Date.now() - 7200000 + 3000000).toISOString(),
    durationSeconds: 3000,
    coveragePercent: 82,
    batteryUsedPercent: 26,
  },
];

const mockLearningItems: LearningItem[] = [
  {
    id: "learn-1",
    imageUrl: "/mock/object-1.jpg",
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
    location: { x: 0.3, y: 0.4 },
    suggestedLabel: "Cable",
    userLabel: null,
    status: "pending",
  },
  {
    id: "learn-2",
    imageUrl: "/mock/object-2.jpg",
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
    location: { x: 0.7, y: 0.2 },
    suggestedLabel: "Shoe",
    userLabel: null,
    status: "pending",
  },
  {
    id: "learn-3",
    imageUrl: "/mock/object-3.jpg",
    detectedAt: new Date(Date.now() - 10800000).toISOString(),
    location: { x: 0.5, y: 0.6 },
    suggestedLabel: null,
    userLabel: "Dog toy",
    status: "verified",
  },
];

const mockNoGoZones: NoGoZone[] = [
  {
    id: "zone-1",
    name: "Under desk cables",
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.3, y: 0.1 },
      { x: 0.3, y: 0.2 },
      { x: 0.1, y: 0.2 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "zone-2",
    name: "Pet area",
    points: [
      { x: 0.7, y: 0.7 },
      { x: 0.9, y: 0.7 },
      { x: 0.9, y: 0.9 },
      { x: 0.7, y: 0.9 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const mockRoutes: CustomRoute[] = [
  {
    id: "route-1",
    name: "Kitchen to Living Room",
    waypoints: [
      { id: "wp-1", x: 0.2, y: 0.3, order: 0 },
      { id: "wp-2", x: 0.4, y: 0.3, order: 1 },
      { id: "wp-3", x: 0.6, y: 0.5, order: 2 },
      { id: "wp-4", x: 0.8, y: 0.5, order: 3 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

function jitterPose() {
  if (mockStatus.pose && mockStatus.state === "cleaning") {
    const speed = 0.02;
    const angle = mockStatus.pose.heading + (Math.random() - 0.5) * 0.3;
    mockStatus.pose = {
      x: Math.max(0, Math.min(1, mockStatus.pose.x + Math.cos(angle) * speed)),
      y: Math.max(0, Math.min(1, mockStatus.pose.y + Math.sin(angle) * speed)),
      heading: angle,
    };
  }
}

function updateBattery() {
  if (mockStatus.state === "cleaning") {
    mockStatus.battery = Math.max(5, mockStatus.battery - 0.1);
    if (mockStatus.battery <= 15) {
      mockStatus.state = "returning";
    }
  } else if (mockStatus.state === "returning") {
    mockStatus.battery = Math.max(5, mockStatus.battery - 0.05);
    if (mockStatus.pose) {
      mockStatus.pose.x += (0.5 - mockStatus.pose.x) * 0.1;
      mockStatus.pose.y += (0.8 - mockStatus.pose.y) * 0.1;
      if (Math.abs(mockStatus.pose.x - 0.5) < 0.05 && Math.abs(mockStatus.pose.y - 0.8) < 0.05) {
        mockStatus.state = "docked";
        mockStatus.pose = { x: 0.5, y: 0.8, heading: 0 };
      }
    }
  } else if (mockStatus.state === "docked") {
    mockStatus.battery = Math.min(100, mockStatus.battery + 0.2);
  }
}

let updateInterval: ReturnType<typeof setInterval> | null = null;

export function startMockUpdates(onUpdate: (status: RobotStatus) => void) {
  if (updateInterval) return;
  
  updateInterval = setInterval(() => {
    mockStatus.lastSeen = new Date().toISOString();
    jitterPose();
    updateBattery();
    onUpdate({ ...mockStatus });
  }, 1000);
  
  return () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };
}

export function stopMockUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

export async function getStatus(): Promise<RobotStatus> {
  await delay(50);
  return { ...mockStatus };
}

export async function startCleaning(): Promise<{ success: boolean }> {
  await delay(100);
  if (mockStatus.state === "docked" || mockStatus.state === "idle") {
    mockStatus.state = "cleaning";
    cleaningStartTime = new Date();
    cleaningStartBattery = mockStatus.battery;
    return { success: true };
  }
  return { success: false };
}

export async function stopCleaning(): Promise<{ success: boolean }> {
  await delay(100);
  if (mockStatus.state === "cleaning") {
    mockStatus.state = "idle";
    if (cleaningStartTime) {
      const duration = Math.floor((Date.now() - cleaningStartTime.getTime()) / 1000);
      const batteryUsed = cleaningStartBattery - mockStatus.battery;
      mockSessions.unshift({
        id: `session-${Date.now()}`,
        startedAt: cleaningStartTime.toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: duration,
        coveragePercent: Math.floor(Math.random() * 30) + 60,
        batteryUsedPercent: Math.round(batteryUsed),
      });
      cleaningStartTime = null;
    }
    return { success: true };
  }
  return { success: false };
}

export async function returnToDock(): Promise<{ success: boolean }> {
  await delay(100);
  if (mockStatus.state !== "docked") {
    mockStatus.state = "returning";
    return { success: true };
  }
  return { success: false };
}

export async function getSessions(): Promise<CleaningSession[]> {
  await delay(50);
  return [...mockSessions];
}

export async function getLearningItems(): Promise<LearningItem[]> {
  await delay(50);
  return [...mockLearningItems];
}

export async function verifyLearningItem(id: string, label: string): Promise<{ success: boolean }> {
  await delay(100);
  const item = mockLearningItems.find(i => i.id === id);
  if (item) {
    item.userLabel = label;
    item.status = "verified";
    return { success: true };
  }
  return { success: false };
}

export async function dismissLearningItem(id: string): Promise<{ success: boolean }> {
  await delay(100);
  const item = mockLearningItems.find(i => i.id === id);
  if (item) {
    item.status = "dismissed";
    return { success: true };
  }
  return { success: false };
}

export async function getNoGoZones(): Promise<NoGoZone[]> {
  await delay(50);
  return [...mockNoGoZones];
}

export async function getRoutes(): Promise<CustomRoute[]> {
  await delay(50);
  return [...mockRoutes];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
