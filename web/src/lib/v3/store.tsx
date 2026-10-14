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
import type { DoorBlockedEvent, RobotLocation, RobotMode, VoiceState } from "../../../../data/types";
import { demoDoors, demoLocation, demoRobot, demoRooms, demoTimeline, type TimelineEvent } from "../../../../data/demo";
import { logTelemetry } from "./telemetry";

/** Connection to the physical robot. Tailscale membership IS the auth:
 *  no login, no sessions. If the Pi is reachable on the tailnet → LIVE,
 *  otherwise the dashboard runs on demo data. */
export type V3Connection = "connecting" | "live" | "demo";

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
  connection: V3Connection;
  /** resolved robot base URL (https), or null when unconfigured */
  robotUrl: string | null;
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
  twerk: () => void;
  wakeRobot: () => void;
  speak: (text: string) => void;
  setSpeed: (s: number) => void;
  dismissDoorEvent: () => void;
  dismissTimeline: (id: string) => void;
  /** Voice (UI-only demo). Real pipeline hooks:
   *  startListening → open mic stream → STT;
   *  onTranscript → intent router → speak() → TTS → speaking. */
  toggleListening: () => void;
  setSoundTrigger: (v: boolean) => void;
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
  const [soundTrigger, setSoundTriggerState] = useState(false);
  const voiceTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [connection, setConnection] = useState<V3Connection>("connecting");
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
    // Marker glide (only while cleaning in DEMO — never animate when live,
    // there's no real position data from the Pi yet)
    const glide = setInterval(() => {
      setPathT((t) => (mode === "cleaning" && connection !== "live" ? (t + 0.04) % 1 : t));
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
      if (mode !== "cleaning" || connection === "live") return;
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
  }, [mode, connection, AMBIENT]);

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
      logTelemetry("door_blocked", { doorId: "kitchen-door", roomId: "kitchen" });
    }
  }, []);

  const cleanMode = useCallback((m: "all" | "stop" | "dock") => {
    if (m === "stop") {
      setMode("idle");
      logTelemetry("run_stop", {});
      if (robotUrl && connection === "live") {
        fetch(`${robotUrl}/control/stop`, { method: "POST" }).catch(() => {});
      }
    } else if (m === "dock") {
      setMode("docked");
      setLocation({ roomId: "living-room", label: "Dock · Living room" });
      logTelemetry("dock", {});
      if (robotUrl && connection === "live") {
        fetch(`${robotUrl}/control/dock`, { method: "POST" }).catch(() => {});
      }
    } else {
      setMode("cleaning");
      setTargetRooms(demoRooms.map((r) => r.id));
      logTelemetry("run_start", { rooms: "all" });
    }
  }, [robotUrl, connection]);

  // Speak a response out loud (talk back)
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9; // Slightly lower for a more "robot" feel
    // Prefer a good voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google US English")) ||
                      voices.find(v => v.lang.startsWith("en") && v.name.includes("Male")) ||
                      voices.find(v => v.lang.startsWith("en-US"));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => {
      setVoice("speaking");
      setVoiceLine(`"${text}"`);
    };
    utterance.onend = () => {
      setVoice("idle");
      voiceTimers.current.push(setTimeout(() => setVoiceLine(null), 2000));
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // Wake Stella: restarts the ROS2 driver to reconnect to the robot
  const wakeRobot = useCallback(async () => {
    if (!robotUrl) return;
    logTelemetry("wake", {});
    setVoiceLine("\u201cWaking Stella...\u201d");
    setVoice("speaking");
    try {
      const res = await fetch(`${robotUrl}/wake`, { method: "POST" });
      const data = await res.json();
      setVoiceLine(data.success ? "\u201cStella is waking up.\u201d" : `"Wake failed: ${data.error}"`);
    } catch {
      setVoiceLine("\u201cCould not reach Stella.\u201d");
    }
    voiceTimers.current.push(setTimeout(() => { setVoice("idle"); setVoiceLine(null); }, 3000));
  }, [robotUrl]);

  const drive = useCallback((dir: "up" | "down" | "left" | "right" | "stop") => {
    if (dir === "stop") {
      setMode("idle");
      // Send stop to Pi if live
      if (robotUrl && connection === "live") {
        fetch(`${robotUrl}/control/stop`, { method: "POST" }).catch(() => {});
      }
      return;
    }
    setMode("cleaning");
    setHeading(HEADINGS[dir]);
    if (dir === "up") setDy((v) => clamp(v - DRIVE_STEP));
    if (dir === "down") setDy((v) => clamp(v + DRIVE_STEP));
    if (dir === "left") setDx((v) => clamp(v - DRIVE_STEP));
    if (dir === "right") setDx((v) => clamp(v + DRIVE_STEP));
    logTelemetry("drive", { dir });
    // Send drive command to Pi if live
    console.log("[drive]", dir, { robotUrl, connection });
    if (robotUrl && connection === "live") {
      const cmd = {
        up: { linear: 0.2, angular: 0 },
        down: { linear: -0.2, angular: 0 },
        left: { linear: 0, angular: 0.5 },
        right: { linear: 0, angular: -0.5 },
      }[dir];
      console.log("[drive] sending", cmd, "to", `${robotUrl}/drive`);
      fetch(`${robotUrl}/drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      }).then(r => console.log("[drive] response", r.status)).catch(e => console.error("[drive] failed", e));
    } else {
      console.warn("[drive] blocked: robotUrl=", robotUrl, "connection=", connection);
    }
  }, [robotUrl, connection]);

  // Dance party: twerk + Spotify simultaneously
  const danceParty = useCallback(async (query: string, target?: string) => {
    logTelemetry("dance_party", { query });
    setVoiceLine(`"Dance party — opening Spotify on TV."`);
    setVoice("speaking");
    // First: launch Spotify on the Roku TV
    if (robotUrl && connection === "live") {
      try {
        await fetch(`${robotUrl}/roku/launch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: "spotify" }),
        });
        // Wait for Spotify app to load and register as a device
        await new Promise((r) => setTimeout(r, 4000));
      } catch {}
    }
    setVoiceLine(`"Dance party — playing ${query}."`);
    // Start music and dance at the same time
    const musicPromise = fetch("/api/spotify/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, target }),
    }).then((r) => r.json());
    // Start twerk immediately (don't wait for music)
    twerk(true); // true = party mode (repeat 3x, no beep at end)
    const result = await musicPromise;
    if (result.success) {
      setVoiceLine(`"Now playing ${result.track} — Stella's dancing."`);
    } else {
      setVoiceLine(`"Dancing anyway — Spotify issue: ${result.error}"`);
    }
    voiceTimers.current.push(setTimeout(() => { setVoice("idle"); setVoiceLine(null); }, 3000));
  }, []);

  // Twerk dance: back/forth + left/right sequence, then beep.
  // Browser beep via Web Audio (Pi has no beep endpoint yet).
  const twerk = useCallback((partyMode = false) => {
    // Twerk shake: rapid alternating moves for that booty-shake effect
    // ~50 moves at 450ms each = ~22 seconds
    const twerkShake = [
      // Warm up: forward/back
      "up", "down", "up", "down",
      // Shake: rapid left/right (the twerk)
      "left", "right", "left", "right", "left", "right", "left", "right",
      // Bounce: up/down quick
      "up", "down", "up", "down", "up", "down",
      // Big shake: alternating with spins
      "left", "left", "right", "right", "left", "right",
      "down", "up", "down", "up",
      // Intense shake section
      "left", "right", "left", "right", "left", "right",
      "up", "down", "left", "right",
      "down", "down", "up", "up",
      "left", "right", "left", "right", "left", "right", "left", "right",
      // Finale: bounce out
      "up", "down", "up", "down",
    ] as Array<"up" | "down" | "left" | "right">;
    const single = [
      "up", "down", "up", "down",
      "left", "right", "left", "right",
      "up", "down",
    ] as Array<"up" | "down" | "left" | "right">;
    // Party mode / twerk: use the long shake (~22 sec)
    const moves = partyMode ? twerkShake : single;
    logTelemetry("twerk", {});
    setVoiceLine("“Watch this.”");
    setVoice("speaking");
    let i = 0;
    const step = () => {
      if (i >= moves.length) {
        // Dance done — beep (unless party mode, music is the soundtrack)
        if (!partyMode) try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const play = (freq: number, t: number, dur: number) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.3, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + dur);
            o.start(t); o.stop(t + dur);
          };
          const now = ctx.currentTime;
          play(880, now, 0.15); play(1174, now + 0.18, 0.15); play(1568, now + 0.36, 0.3);
        } catch {}
        drive("stop");
        voiceTimers.current.push(setTimeout(() => { setVoice("idle"); setVoiceLine(null); }, 1500));
        return;
      }
      drive(moves[i]);
      i++;
      voiceTimers.current.push(setTimeout(step, 450));
    };
    step();
  }, [drive]);

  const setSpeed = useCallback((s: number) => setSpeedState(s), []);

  const dismissDoorEvent = useCallback(() => setDoorEvent(null), []);

  const dismissTimeline = useCallback(
    (id: string) => {
      setTimelineHidden((s) => new Set(s).add(id));
      logTelemetry("timeline_dismiss", { id });
    },
    []
  );

  // Execute a structured command from Claude
  const executeClaudeCommand = useCallback(async (cmd: any) => {
    if (!cmd?.action) return;
    const { action } = cmd;
    if (action === "drive") {
      const dirMap: Record<string, string> = { forward: "up", back: "down", left: "left", right: "right", stop: "stop" };
      drive((dirMap[cmd.direction] || "stop") as "up" | "down" | "left" | "right" | "stop");
    }
    else if (action === "twerk") twerk();
    else if (action === "dance_party") await danceParty(cmd.song || "", cmd.room);
    else if (action === "roku" && robotUrl && connection === "live") {
      fetch(`${robotUrl}/roku/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: cmd.app }),
      }).catch(() => {});
    }
    else if (action === "spotify") {
      const res = await fetch("/api/spotify/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cmd.song, target: cmd.room }),
      }).then(r => r.json()).catch(() => ({}));
      if (!res.success) setVoiceLine(`"Spotify issue: ${res.error || "unknown"}"`);
    }
    else if (action === "dock") cleanMode("dock");
    else if (action === "status") {
      speak(`Battery at ${Math.round(battery)} percent. ${connection === "live" ? "Connected." : "Offline."}`);
    }
  }, [drive, twerk, danceParty, robotUrl, connection, cleanMode, speak, battery]);

  // Voice commands via Web Speech API. Basic intents for now:
  // stop, forward/back/left/right, dock. 10s max per utterance.
  const toggleListening = useCallback(() => {
    clearVoiceTimers();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceLine("Voice not supported in this browser.");
      voiceTimers.current.push(setTimeout(() => setVoiceLine(null), 2500));
      return;
    }
    setVoice((v) => {
      if (v !== "idle") {
        setVoiceLine(null);
        return "idle";
      }
      setVoiceLine(null);
      logTelemetry("voice_listen", {});
      try {
        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        voiceTimers.current.push(setTimeout(() => { try { rec.stop(); } catch {} }, 10000));
        rec.onresult = async (e: any) => {
          const heard = (e.results[0][0].transcript || "").trim();
          logTelemetry("voice_heard", { heard });
          setVoice("speaking");
          setVoiceLine(`"Heard: ${heard}"`);

          // Send to Claude for smart parsing
          try {
            const res = await fetch("/api/stella/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: heard }),
            });
            const data = await res.json();

            if (data.error && !data.reply) {
              setVoiceLine(`"Claude not configured."`);
              // Fall through to pattern matching
            } else {
              // Speak the reply out loud
              if (data.reply) speak(data.reply);
              // Execute commands
              for (const cmd of (data.commands || [])) {
                await executeClaudeCommand(cmd);
              }
              return;
            }
          } catch (err) {
            setVoiceLine(`"Brain offline, using basic commands."`);
          }

          // Fallback: pattern matching
          const text = heard.toLowerCase();
          let action: string | null = null;
          let rokuApp: string | null = null;
          let playQuery: string | null = null;
          const playMatch = text.match(/\bplay\s+(.+)/);
          const openMatch = text.match(/\bopen\s+(spotify|youtube|netflix|hulu|disney)/);
          // Twerk with auto Sexy Red: "twerk" alone plays Sexy Red + dances
          const twerkAlone = /\btwerk\b/.test(text) && !playMatch;
          if (twerkAlone) {
            setVoice("speaking");
            // Auto dance party with Sexy Red
            danceParty("sexy red", undefined);
            return;
          }
          if (playMatch) { action = "spotify_play"; playQuery = playMatch[1].trim(); }
          else if (openMatch) { action = "roku"; rokuApp = openMatch[1]; }
          else if (/\btwerk\b/.test(text)) action = "twerk";
          else if (/\bstop\b/.test(text)) action = "stop";
          else if (/\bdock\b|\bgo home\b|\bcharge\b/.test(text)) action = "dock";
          else if (/\bforward\b|\bahead\b|\bgo\b/.test(text)) action = "up";
          else if (/\bback\b|\breverse\b/.test(text)) action = "down";
          else if (/\bleft\b/.test(text)) action = "left";
          else if (/\bright\b/.test(text)) action = "right";
          setVoice("speaking");
          if (action === "spotify_play" && playQuery) {
            setVoiceLine(`“Playing ${playQuery} on Spotify.”`);
            fetch("/api/spotify/play", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: playQuery }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.success) setVoiceLine(`“Now playing ${d.track} by ${d.artist}.”`);
                else setVoiceLine(`“Couldn't play that: ${d.error}”`);
              })
              .catch(() => setVoiceLine("“Spotify isn't connected. Visit /api/spotify/login first.”"));
          }
          else if (action === "roku" && rokuApp) {
            setVoiceLine(`“Opening ${rokuApp}.”`);
            if (robotUrl && connection === "live") {
              fetch(`${robotUrl}/roku/launch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ app: rokuApp }),
              }).catch(() => {});
            }
          }
          else if (action === "twerk") { twerk(); }
          else if (action === "stop") { drive("stop"); setVoiceLine(`“Stopping.”`); }
          else if (action === "dock") { cleanMode("dock"); setVoiceLine(`“Docking.”`); }
          else if (action) { drive(action as any); setVoiceLine(`“On it — ${heard}.”`); }
          else { setVoiceLine(`“Didn't catch that — try stop, forward, back, left, right, dock, twerk, or open spotify.”`); }
          logTelemetry("voice_speak", { heard: text, action });
          voiceTimers.current.push(setTimeout(() => { setVoice("idle"); setVoiceLine(null); }, 2800));
        };
        rec.onerror = () => { setVoice("idle"); setVoiceLine(null); };
        rec.onend = () => { setVoice((vv) => vv === "listening" ? "idle" : vv); };
        rec.start();
      } catch {
        setVoice("idle");
      }
      return "listening";
    });
  }, [drive, cleanMode, twerk]);

  const setSoundTrigger = useCallback((v: boolean) => setSoundTriggerState(v), []);

  // Listen for commands from the text assistant
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.action) return;
      const { action, app, dir } = detail;
      if (action === "twerk") twerk();
      else if (action === "stop") drive("stop");
      else if (action === "dock") cleanMode("dock");
      else if (action === "drive" && dir) drive(dir);
      else if (action === "roku" && app && robotUrl && connection === "live") {
        fetch(`${robotUrl}/roku/launch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app }),
        }).catch(() => {});
      }
    };
    window.addEventListener("stella-cmd", handler);
    return () => window.removeEventListener("stella-cmd", handler);
  }, [twerk, drive, cleanMode, robotUrl, connection]);

  // Tailscale probe: try the Pi's WebSocket; 5s to prove we're on the
  // tailnet. No credentials — reachability IS the authentication.
  // Pi side: `tailscale serve https` so the browser gets valid HTTPS/WSS
  // (see docs/TAILSCALE.md).
  useEffect(() => {
    if (!robotUrl) {
      setConnection("demo");
      return;
    }
    let cancelled = false;
    let ws: WebSocket | null = null;
    const wsPath = process.env.NEXT_PUBLIC_ROBOT_WS_PATH || "/ws";
    const wsUrl = robotUrl.replace(/^http/, "ws") + wsPath;
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
      };
      ws.onerror = () => {
        if (cancelled) return;
        clearTimeout(timer);
        setConnection("demo");
      };
      ws.onclose = () => {
        if (cancelled) return;
        setConnection((c) => (c === "live" ? "demo" : c));
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
        soundTrigger,
        connection,
        robotUrl,
        checks,
      },
      selectRoom,
      cleanMode,
      drive,
      twerk,
      wakeRobot,
      speak,
      setSpeed,
      dismissDoorEvent,
      dismissTimeline,
      toggleListening,
      setSoundTrigger,
      sendRobotCommand,
    }),
    [
      mode, battery, batteryMinutesLeft, location, runMinutes, heading, speed,
      targetRooms, dx, dy, mx, my, doorEvent, timelineHidden, timeline,
      voice, voiceLine, soundTrigger, connection, robotUrl, checks,
      selectRoom, cleanMode, drive, twerk, setSpeed, dismissDoorEvent, dismissTimeline,
      toggleListening, setSoundTrigger, sendRobotCommand,
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
