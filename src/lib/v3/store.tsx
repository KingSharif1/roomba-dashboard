"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DoorBlockedEvent, RobotLocation, RobotMode } from "./types";
import { demoDoors, demoLocation, demoRobot, demoRooms } from "./demo";

export interface V3RobotState {
  mode: RobotMode;
  battery: number;
  batteryMinutesLeft: number;
  location: RobotLocation;
  runMinutes: number;
  heading: string;
  speed: number;
  targetRooms: string[];
  /** manual-drive marker offset in SVG units */
  dx: number;
  dy: number;
  doorEvent: DoorBlockedEvent | null;
  timelineHidden: Set<string>;
}

interface V3RobotApi {
  state: V3RobotState;
  selectRoom: (id: string) => void;
  cleanMode: (m: "all" | "stop" | "dock") => void;
  drive: (dir: "up" | "down" | "left" | "right" | "stop") => void;
  setSpeed: (s: number) => void;
  dismissDoorEvent: () => void;
  dismissTimeline: (id: string) => void;
}

const V3RobotContext = createContext<V3RobotApi | null>(null);

const DRIVE_STEP = 14;
const DRIVE_CLAMP = 48;

const HEADINGS: Record<string, string> = {
  up: "N",
  down: "S",
  left: "W",
  right: "E",
};

const roomName = (id: string) => demoRooms.find((r) => r.id === id)?.name ?? id;
const roomLabel = (id: string) =>
  id === "living-room" ? "Living room" : roomName(id);

export function V3RobotProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<RobotMode>(demoRobot.mode);
  const [battery] = useState(demoRobot.battery);
  const [batteryMinutesLeft] = useState(demoRobot.batteryMinutesLeft);
  const [location, setLocation] = useState(demoLocation);
  const [runMinutes] = useState(demoRobot.runMinutes);
  const [heading, setHeading] = useState(demoRobot.heading);
  const [speed, setSpeedState] = useState(demoRobot.speed);
  const [targetRooms, setTargetRooms] = useState<string[]>(["living-room"]);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [doorEvent, setDoorEvent] = useState<DoorBlockedEvent | null>(null);
  const [timelineHidden, setTimelineHidden] = useState<Set<string>>(new Set());

  const clamp = (v: number) => Math.max(-DRIVE_CLAMP, Math.min(DRIVE_CLAMP, v));

  const selectRoom = useCallback((id: string) => {
    setTargetRooms((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return next;
    });
    // Move Stella's reported location to the tapped room and mark cleaning.
    setLocation({ roomId: id, label: roomLabel(id) });
    setMode("cleaning");
    setDx(0);
    setDy(0);
    // Kitchen door is closed in demo data — tapping Kitchen raises a real
    // door-blocked event (this is the ONLY path that shows the toast).
    const door = demoDoors.find((d) => d.id === "kitchen-door");
    if (id === "kitchen" && door?.state === "closed") {
      setDoorEvent({
        type: "door_blocked",
        id: `evt-kitchen-door-${Date.now()}`,
        doorId: "kitchen-door",
        roomId: "kitchen",
        message: "Kitchen door closed, couldn't enter",
        at: new Date().toISOString(),
      });
    }
  }, []);

  const cleanMode = useCallback((m: "all" | "stop" | "dock") => {
    if (m === "stop") {
      setMode("idle");
    } else if (m === "dock") {
      setMode("docked");
      setLocation({ roomId: "living-room", label: "Dock · Living room" });
    } else {
      setMode("cleaning");
      setTargetRooms(demoRooms.map((r) => r.id));
    }
  }, []);

  const drive = useCallback((dir: "up" | "down" | "left" | "right" | "stop") => {
    if (dir === "stop") {
      setMode("idle");
      return;
    }
    setMode("cleaning");
    setHeading(HEADINGS[dir]);
    if (dir === "up") setDy((v) => clamp(v - DRIVE_STEP));
    if (dir === "down") setDy((v) => clamp(v + DRIVE_STEP));
    if (dir === "left") setDx((v) => clamp(v - DRIVE_STEP));
    if (dir === "right") setDx((v) => clamp(v + DRIVE_STEP));
  }, []);

  const setSpeed = useCallback((s: number) => setSpeedState(s), []);

  const dismissDoorEvent = useCallback(() => setDoorEvent(null), []);

  const dismissTimeline = useCallback(
    (id: string) => setTimelineHidden((s) => new Set(s).add(id)),
    []
  );

  const api = useMemo<V3RobotApi>(
    () => ({
      state: {
        mode,
        battery,
        batteryMinutesLeft,
        location,
        runMinutes,
        heading,
        speed,
        targetRooms,
        dx,
        dy,
        doorEvent,
        timelineHidden,
      },
      selectRoom,
      cleanMode,
      drive,
      setSpeed,
      dismissDoorEvent,
      dismissTimeline,
    }),
    [
      mode, battery, batteryMinutesLeft, location, runMinutes, heading, speed,
      targetRooms, dx, dy, doorEvent, timelineHidden,
      selectRoom, cleanMode, drive, setSpeed, dismissDoorEvent, dismissTimeline,
    ]
  );

  return <V3RobotContext.Provider value={api}>{children}</V3RobotContext.Provider>;
}

export function useV3Robot(): V3RobotApi {
  const ctx = useContext(V3RobotContext);
  if (!ctx) throw new Error("useV3Robot must be used inside V3RobotProvider");
  return ctx;
}

export function modeLabel(mode: RobotMode): string {
  switch (mode) {
    case "cleaning":
      return "Cleaning";
    case "docked":
      return "Docked · charging";
    case "returning":
      return "Returning";
    default:
      return "Idle";
  }
}
