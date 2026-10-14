// Cleaning sessions, learning notes, no-go zones, and saved routes.
// Moved out of the dashboard simulator. Rooms and doors live in demo.ts.
// Raw sensor recordings and video stay off git.

import type {
  CleaningSession,
  CustomRoute,
  LearningItem,
  NoGoZone,
} from "../web/src/lib/types";

export const sessions: CleaningSession[] = [
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

export const learningItems: LearningItem[] = [
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

export const noGoZones: NoGoZone[] = [
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

export const routes: CustomRoute[] = [
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
