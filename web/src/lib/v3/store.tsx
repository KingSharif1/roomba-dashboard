"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DoorBlockedEvent, RobotLocation, RobotMode, VoiceState } from "./types";
import { demoDoors, demoLocation, demoRobot, demoRooms, demoTimeline, type TimelineEvent } from "./demo";
import { logTelemetry } from "./telemetry";

/** Connection to the physical robot. Tailscale membership IS the auth:
 *  no login, no sessions. If the Pi is reachable on the tailnet → LIVE,
 *  otherwise the dashboard runs on demo data. */
export type V3Connection = "connecting" | "live" | "demo";

/** Dashboard settings — persisted to localStorage, each one affects demo behavior. */
export interface V3Settings {
  autoSchedule: boolean;
  quietHours: boolean;
  doorAlerts: boolean;
  learning: boolean;
  soundTrigger: boolean;
}

const SETTINGS_KEY = "stella-v3-settings";

const DEFAULT_SETTINGS: V3Settings = {
  autoSchedule: true,
  quietHours: false,
  doorAlerts: true,
  learning: true,
  soundTrigger: false,
};

function loadSettings(): V3Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* private mode etc. — fall through to defaults */
  }
  return DEFAULT_SETTINGS;
}

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
  /** animated marker position along the cleaning path (SVG units) */
  mx: number;
  my: number;
  doorEvent: DoorBlockedEvent | null;
  timelineHidden: Set<string>;
  /** timeline with live-appended demo events */
  timeline: TimelineEvent[];
  voice: VoiceState;
  voiceLine: string | null;
  /** sound-triggered recording (UI only; default OFF for privacy) */
  soundTrigger: boolean;
  /** persisted dashboard settings (all five toggles) */
  settings: V3Settings;
  connection: V3Connection;
  /** resolved robot base URL (https), or null when unconfigured */
  robotUrl: string | null;
  /** true when a background re-probe found the Pi reachable while in demo */
  liveAvailable: boolean;
  /** show the "switch to live data?" toast */
  liveToast: boolean;
  /** per-check status for the mobile connection bar */
  checks: {
    tailscale: "checking" | "ok" | "off";
    pi: "checking" | "ok" | "off";
    link: "checking" | "ok" | "demo";
  };
}

interface V3RobotApi {
  state: V3RobotState;
  selectRoom: (id: string) => void;
  cleanMode: (m: "all" | "stop" | "dock") => void;
  drive: (dir: "up" | "down" | "left" | "right" | "stop") => void;
  setSpeed: (s: number) => void;
  dismissDoorEvent: () => void;
  dismissTimeline: (id: string) => void;
  /** Voice (UI-only demo). Real pipeline hooks:
   *  startListening → open mic stream → STT;
   *  onTranscript → intent router → speak() → TTS → speaking. */
  toggleListening: () => void;
  setSoundTrigger: (v: boolean) => void;
  setSetting: (k: keyof V3Settings, v: boolean) => void;
  /** drive with a raw vector (joystick): dx/dy in SVG units, clamped ±48 */
  driveVector: (dx: number, dy: number) => void;
  /** background re-probe found the Pi — user taps to switch */
  acceptLive: () => void;
  dismissLiveToast: () => void;
  /** Send a command to the live robot. No-op in demo mode.
   *  Real wiring: JSON over the WebSocket opened by the probe below. */
  sendRobotCommand: (cmd: { type: string; [k: string]: unknown }) => void;
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
  const [battery, setBattery] = useState(demoRobot.battery);
  const [batteryMinutesLeft, setBatteryMinutesLeft] = useState(demoRobot.batteryMinutesLeft);
  const [location, setLocation] = useState(demoLocation);
  const [runMinutes, setRunMinutes] = useState(demoRobot.runMinutes);
  const [heading, setHeading] = useState(demoRobot.heading);
  const [speed, setSpeedState] = useState(demoRobot.speed);
  const [targetRooms, setTargetRooms] = useState<string[]>(["living-room"]);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [doorEvent, setDoorEvent] = useState<DoorBlockedEvent | null>(null);
  const [timelineHidden, setTimelineHidden] = useState<Set<string>>(new Set());
  const [timeline, setTimeline] = useState<TimelineEvent[]>(demoTimeline);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [voiceLine, setVoiceLine] = useState<string | null>(null);
  // All five dashboard toggles live here and persist to localStorage.
  const [settings, setSettings] = useState<V3Settings>(loadSettings);
  const settingsRef = useRef(settings);
  const voiceTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [connection, setConnection] = useState<V3Connection>("connecting");
  const connectionRef = useRef(connection);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [liveToast, setLiveToast] = useState(false);
  const liveAvailableRef = useRef(false);

  // Keep refs + localStorage in sync with settings.
  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);
  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);
  const [robotUrl] = useState<string | null>(
    () => process.env.NEXT_PUBLIC_ROBOT_URL?.replace(/\/$/, "") || null
  );
  const wsRef = useRef<WebSocket | null>(null);

  // ---- Demo liveness: marker glides along the cleaning path ----
  // Waypoints (SVG units) tracing the dotted cleaning path in the living room.
  const PATH: [number, number][] = useMemo(
    () => [
      [237, 178], [265, 185], [280, 160], [260, 148], [225, 155],
      [215, 185], [235, 205], [240, 240], [235, 275], [255, 288], [270, 272],
    ],
    []
  );
  const [pathT, setPathT] = useState(0);
  const seg = Math.min(PATH.length - 2, Math.floor(pathT * (PATH.length - 1)));
  const frac = pathT * (PATH.length - 1) - seg;
  const mx = PATH[seg][0] + (PATH[seg + 1][0] - PATH[seg][0]) * frac;
  const my = PATH[seg][1] + (PATH[seg + 1][1] - PATH[seg][1]) * frac;

  useEffect(() => {
    // Marker glide (only while cleaning — idle/docked parks the marker)
    const glide = setInterval(() => {
      setPathT((t) => (mode === "cleaning" ? (t + 0.04) % 1 : t));
    }, 700);
    // Battery slow drain in demo
    const drain = setInterval(() => {
      setBattery((b) => {
        if (mode !== "cleaning" || connection === "live") return b;
        const nb = Math.max(5, b - 1);
        setBatteryMinutesLeft(Math.round((nb / 100) * 85));
        return nb;
      });
    }, 45000);
    return () => {
      clearInterval(glide);
      clearInterval(drain);
    };
  }, [mode, connection]);

  // Ambient timeline events so the feed feels alive
  const ambientIdx = useRef(0);
  const AMBIENT: Omit<TimelineEvent, "id">[] = useMemo(
    () => [
      { title: "Edge pass · Dining", kind: "run", detail: "just now · 6 min" },
      { title: "Dust bin 70% full", kind: "alert" },
      { title: "Spot clean · Hallway", kind: "run", detail: "just now · 4 min" },
      { title: "Cliff sensor check OK", kind: "run", detail: "self-test passed" },
    ],
    []
  );
  useEffect(() => {
    const id = setInterval(() => {
      if (mode !== "cleaning") return;
      const tpl = AMBIENT[ambientIdx.current % AMBIENT.length];
      ambientIdx.current += 1;
      const ev: TimelineEvent = { ...tpl, id: `tl-ambient-${Date.now()}` };
      setTimeline((t) => [ev, ...t].slice(0, 8));
      setTimelineHidden((h) => {
        const n = new Set(h);
        return n;
      });
    }, 75000);
    return () => clearInterval(id);
  }, [mode, AMBIENT]);

  const clearVoiceTimers = () => {
    voiceTimers.current.forEach(clearTimeout);
    voiceTimers.current = [];
  };

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
    setPathT(0);
    logTelemetry("room_select", { roomId: id });
    logTelemetry("run_start", { rooms: [id] });
    // Kitchen door is closed in demo data — tapping Kitchen raises a real
    // door-blocked event (this is the ONLY path that shows the toast),
    // unless the user turned door-blocked alerts off in Settings.
    const door = demoDoors.find((d) => d.id === "kitchen-door");
    if (id === "kitchen" && door?.state === "closed" && settingsRef.current.doorAlerts) {
      setDoorEvent({
        type: "door_blocked",
        id: `evt-kitchen-door-${Date.now()}`,
        doorId: "kitchen-door",
        roomId: "kitchen",
        message: "Kitchen door closed, couldn't enter",
        at: new Date().toISOString(),
      });
      logTelemetry("door_blocked", { doorId: "kitchen-door", roomId: "kitchen" });
    }
  }, []);

  const cleanMode = useCallback((m: "all" | "stop" | "dock") => {
    if (m === "stop") {
      setMode("idle");
      logTelemetry("run_stop", {});
    } else if (m === "dock") {
      setMode("docked");
      setLocation({ roomId: "living-room", label: "Dock · Living room" });
      logTelemetry("dock", {});
    } else {
      setMode("cleaning");
      setTargetRooms(demoRooms.map((r) => r.id));
      logTelemetry("run_start", { rooms: "all" });
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
    logTelemetry("drive", { dir });
  }, []);

  const setSpeed = useCallback((s: number) => {
    // Quiet hours caps the speed at 40%.
    const cap = settingsRef.current.quietHours ? 40 : 100;
    setSpeedState(Math.max(0, Math.min(cap, s)));
  }, []);

  /** Joystick drag: raw vector in SVG units. Moves Stella on the map. */
  const driveVector = useCallback((dxv: number, dyv: number) => {
    setMode("cleaning");
    const cx = clamp(dxv);
    const cy = clamp(dyv);
    setDx(cx);
    setDy(cy);
    if (cx !== 0 || cy !== 0) {
      if (Math.abs(cx) >= Math.abs(cy)) setHeading(cx >= 0 ? "E" : "W");
      else setHeading(cy >= 0 ? "S" : "N");
    }
    logTelemetry("drive", { dx: cx, dy: cy });
  }, []);

  const dismissDoorEvent = useCallback(() => setDoorEvent(null), []);

  const dismissTimeline = useCallback(
    (id: string) => {
      setTimelineHidden((s) => new Set(s).add(id));
      logTelemetry("timeline_dismiss", { id });
    },
    []
  );

  // Demo voice loop: listening 2.5s → speaking 3s → idle.
  // Real wiring: replace timers with mic/STT callbacks; keep the same
  // state transitions so the UI doesn't change when the Pi arrives.
  const toggleListening = useCallback(() => {
    clearVoiceTimers();
    setVoice((v) => {
      if (v !== "idle") {
        setVoiceLine(null);
        return "idle";
      }
      setVoiceLine(null);
      logTelemetry("voice_listen", {});
      voiceTimers.current.push(
        setTimeout(() => {
          setVoice("speaking");
          setVoiceLine("“On it — finishing the living room, then the kitchen.”");
          logTelemetry("voice_speak", {});
          voiceTimers.current.push(
            setTimeout(() => {
              setVoice("idle");
              setVoiceLine(null);
            }, 3200)
          );
        }, 2500)
      );
      return "listening";
    });
  }, []);

  const setSoundTrigger = useCallback(
    (v: boolean) => setSettings((s) => ({ ...s, soundTrigger: v })),
    []
  );

  const setSetting = useCallback((k: keyof V3Settings, v: boolean) => {
    setSettings((s) => ({ ...s, [k]: v }));
    logTelemetry("setting", { key: k, value: v });
  }, []);

  // Full connect: open the Pi WebSocket and hot-swap to live state.
  // Used on mount and when the user taps "Go live".
  const connectLive = useCallback(() => {
    const url = robotUrl;
    if (!url) {
      setConnection("demo");
      return () => {};
    }
    let cancelled = false;
    let ws: WebSocket | null = null;
    const wsPath = process.env.NEXT_PUBLIC_ROBOT_WS_PATH || "/ws";
    const wsUrl = url.replace(/^http/, "ws") + wsPath;
    const timer = setTimeout(() => {
      if (!cancelled && ws?.readyState !== WebSocket.OPEN) {
        try { ws?.close(); } catch { /* noop */ }
        setConnection("demo");
      }
    }, 5000);
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        if (cancelled) return;
        clearTimeout(timer);
        setConnection("live");
        liveAvailableRef.current = false;
        setLiveAvailable(false);
        setLiveToast(false);
      };
      ws.onerror = () => {
        if (cancelled) return;
        clearTimeout(timer);
        setConnection("demo");
      };
      ws.onclose = () => {
        if (cancelled) return;
        setConnection((c) => (c === "live" ? "demo" : c));
        // Dropped back to demo — allow a future re-probe to re-offer live.
        liveAvailableRef.current = false;
        setLiveAvailable(false);
      };
      // Pi → dashboard state patches. Hot-swaps the UI to live values
      // WITHOUT a page refresh — state updates re-render everything.
      ws.onmessage = (msg) => {
        if (cancelled) return;
        try {
          const p = JSON.parse(msg.data) as {
            type?: string;
            battery?: number;
            batteryMinutesLeft?: number;
            mode?: RobotMode;
            heading?: string;
            speed?: number;
            runMinutes?: number;
            location?: RobotLocation;
            message?: string;
            doorId?: string;
            roomId?: string;
            id?: string;
          };
          if (p.type === "state") {
            if (typeof p.battery === "number") setBattery(p.battery);
            if (typeof p.batteryMinutesLeft === "number") setBatteryMinutesLeft(p.batteryMinutesLeft);
            if (p.mode) setMode(p.mode);
            if (p.heading) setHeading(p.heading);
            if (typeof p.speed === "number") setSpeedState(p.speed);
            if (typeof p.runMinutes === "number") setRunMinutes(p.runMinutes);
            if (p.location) setLocation(p.location);
          } else if (p.type === "door_blocked" && p.message) {
            setDoorEvent({
              type: "door_blocked",
              id: p.id || `evt-${Date.now()}`,
              doorId: p.doorId || "",
              roomId: p.roomId || "",
              message: p.message,
              at: new Date().toISOString(),
            });
          }
        } catch {
          // ignore malformed frames
        }
      };
    } catch {
      clearTimeout(timer);
      setConnection("demo");
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      try { ws?.close(); } catch { /* noop */ }
      wsRef.current = null;
    };
  }, [robotUrl]);

  // Tailscale probe: try the Pi's WebSocket; 5s to prove we're on the
  // tailnet. No credentials — reachability IS the authentication.
  // Pi side: `tailscale serve https` so the browser gets valid HTTPS/WSS
  // (see docs/TAILSCALE.md).
  useEffect(() => connectLive(), [connectLive]);

  // Background re-probe: every 30s, if we're still in demo mode, do a
  // LIGHT reachability check (open + immediately close). If the Pi answers,
  // offer the "switch to live data?" toast — never auto-switch.
  useEffect(() => {
    if (!robotUrl) return;
    const id = setInterval(() => {
      if (connectionRef.current !== "demo") return;
      let ws: WebSocket | null = null;
      const wsPath = process.env.NEXT_PUBLIC_ROBOT_WS_PATH || "/ws";
      const wsUrl = robotUrl.replace(/^http/, "ws") + wsPath;
      const timer = setTimeout(() => {
        try { ws?.close(); } catch { /* noop */ }
      }, 5000);
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          clearTimeout(timer);
          try { ws?.close(); } catch { /* noop */ }
          // Still in demo and not already offered? Offer live — once per
          // availability window (dismissing keeps liveAvailable true).
          if (connectionRef.current === "demo" && !liveAvailableRef.current) {
            liveAvailableRef.current = true;
            setLiveAvailable(true);
            setLiveToast(true);
          }
        };
        ws.onerror = () => {
          clearTimeout(timer);
          try { ws?.close(); } catch { /* noop */ }
        };
      } catch {
        clearTimeout(timer);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [robotUrl]);

  /** User tapped "Go live" — run the full connect now. */
  const acceptLive = useCallback(() => {
    setLiveToast(false);
    liveAvailableRef.current = false;
    setLiveAvailable(false);
    connectLive();
  }, [connectLive]);

  const dismissLiveToast = useCallback(() => {
    // Stay in demo. Keep liveAvailable so we don't nag again this window;
    // it resets if the connection drops back from live later.
    setLiveToast(false);
  }, []);

  // Auto-return to dock: battery ≤ 15% while cleaning in demo → the robot
  // heads home by itself (only when Auto schedule is on).
  useEffect(() => {
    if (mode === "cleaning" && connection === "demo" && battery <= 15 && settings.autoSchedule) {
      setMode("returning");
      logTelemetry("auto_return", { battery });
      const t = setTimeout(() => {
        setMode("docked");
        setLocation({ roomId: "living-room", label: "Dock · Living room" });
        logTelemetry("dock", { reason: "low_battery" });
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [battery, mode, connection, settings.autoSchedule]);

  const sendRobotCommand = useCallback((cmd: { type: string; [k: string]: unknown }) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(cmd));
    // demo mode: no-op (local state already updated by the action callers)
  }, []);

  // Per-check status for the mobile connection bar. Demo loads immediately;
  // when the Pi connects, `connection` flips to live and the UI hot-swaps.
  const checks = useMemo(
    () => ({
      tailscale:
        connection === "live" ? ("ok" as const) : connection === "connecting" ? ("checking" as const) : ("off" as const),
      pi: connection === "live" ? ("ok" as const) : connection === "connecting" ? ("checking" as const) : ("off" as const),
      link: connection === "live" ? ("ok" as const) : connection === "connecting" ? ("checking" as const) : ("demo" as const),
    }),
    [connection]
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
        mx,
        my,
        doorEvent,
        timelineHidden,
        timeline,
        voice,
        voiceLine,
        soundTrigger: settings.soundTrigger,
        settings,
        connection,
        robotUrl,
        liveAvailable,
        liveToast,
        checks,
      },
      selectRoom,
      cleanMode,
      drive,
      driveVector,
      setSpeed,
      dismissDoorEvent,
      dismissTimeline,
      toggleListening,
      setSoundTrigger,
      setSetting,
      acceptLive,
      dismissLiveToast,
      sendRobotCommand,
    }),
    [
      mode, battery, batteryMinutesLeft, location, runMinutes, heading, speed,
      targetRooms, dx, dy, mx, my, doorEvent, timelineHidden, timeline,
      voice, voiceLine, settings, connection, robotUrl, liveAvailable, liveToast, checks,
      selectRoom, cleanMode, drive, driveVector, setSpeed, dismissDoorEvent, dismissTimeline,
      toggleListening, setSoundTrigger, setSetting, acceptLive, dismissLiveToast, sendRobotCommand,
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
