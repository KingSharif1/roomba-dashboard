"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic, Square, Play, House, Sun, Moon, Map as MapIcon, Camera,
  Activity, Settings, Gauge, Fan, Brush, Paintbrush, Pencil, Trash2, X,
  Volume2, Zap,
} from "lucide-react";
import { V3RobotProvider, useV3Robot } from "@/lib/v3/store";
import { V3DrivePanel } from "@/components/v3/drive-panel";
import { StellaMascot } from "@/components/v3/stella-mascot";
import "../design-f.css";

/* ═══════════════ Design F — dark blueprint cutaway ═══════════════
   From the approved interactive mock (supervisor/stella-mockups).
   All robot logic still comes from the v3 store (voice, drive, cleaning,
   connection, demo fallback). This file is UI only. */

type Theme = "light" | "dark";
type Intensity = "Eco" | "Normal" | "Turbo";
const SUCTION: Record<Intensity, string> = { Eco: "1.4", Normal: "2.2", Turbo: "3.1" };

function useLocal<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = (v: T | ((p: T) => T)) =>
    setVal((p) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(p) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  return [val, set];
}

const NAV = [
  { id: "voice", label: "Voice", icon: Mic },
  { id: "control", label: "Control", icon: Gauge },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "camera", label: "Camera", icon: Camera },
  { id: "status", label: "Status", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── signal bars ── */
function SigBars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`f-sig ${className}`}>
      {[5, 8, 11, 14].map((h, i) => (
        <i key={i} style={{ height: `${h}px` }} className={i < n ? "on" : ""} />
      ))}
    </span>
  );
}

/* ── top bar: brand · voice strip · connection · theme ── */
function FTop({
  theme,
  setTheme,
  onTalk,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onTalk: () => void;
}) {
  const { state, wakeRobot, robotOnline } = useV3Robot();
  const { connection } = state;
  const [pop, setPop] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pop) return;
    const close = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setPop(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pop ]);

  const connLabel = connection === "live" ? "Live" : connection === "demo" ? "Demo" : "Connecting";
  const connClass = connection === "live" ? "c-live" : connection === "demo" ? "c-demo" : "c-connecting";
  const bars = connection === "live" ? 4 : connection === "demo" ? 3 : 1;

  return (
    <header className="f-top">
      <div className="f-brand">STELLA</div>
      <button className="f-vstrip" onClick={onTalk} aria-label="Talk to Stella">
        <span className="wave">
          <i /><i /><i /><i /><i />
        </span>
        <span className="vt">Tap or press Space · “clean the kitchen, then dock”</span>
        <span className="btn inv" style={{ padding: "6px 12px" }}>
          <Mic className="w-3.5 h-3.5" /> Talk
        </span>
      </button>
      <div className="f-topr">
        <div style={{ position: "relative" }}>
          <button className={`f-conn ${connClass}`} onClick={() => setPop((p) => !p)} aria-label="Connection details">
            <SigBars n={bars} />
            <b>{connLabel}</b>
            <span className="lat mono sm">{connection === "demo" ? "demo robot" : "tailnet"}</span>
          </button>
          {pop && (
            <div className="f-pop" ref={popRef}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`f-conn ${connClass}`} style={{ border: 0, padding: 0 }}>
                  <SigBars n={bars} />
                  <b>{connLabel}</b>
                </span>
                <button className="iconbtn" onClick={() => setPop(false)} aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mono" style={{ marginTop: 10 }}>
                <div className="row">
                  <span className="sm">Link</span>
                  <span>{connection === "demo" ? "Demo robot (in browser)" : "Tailscale · tailnet only"}</span>
                </div>
                <div className="row">
                  <span className="sm">Robot</span>
                  <span>{connection === "live" ? (robotOnline ? "Online" : "Offline") : "—"}</span>
                </div>
                <div className="row">
                  <span className="sm">Streams</span>
                  <span>{connection === "live" ? "status · lidar · camera" : "—"}</span>
                </div>
                <div className="row">
                  <span className="sm">Sign-in</span>
                  <span style={{ fontSize: 12 }}>Tailscale membership</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {connection !== "demo" && (
                  <button className="btn inv" onClick={() => { wakeRobot(); setPop(false); }}>
                    <Zap className="w-3.5 h-3.5" /> Wake Stella
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          className="f-iconbtn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Light / dark"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

/* ── voice section: animated voice mode orb + transcript ── */
function FVoice({ onTalk }: { onTalk: () => void }) {
  const { state } = useV3Robot();
  const { voice, voiceLine } = state;
  const vstate = voice === "listening" ? "listening" : voice === "speaking" ? "speaking" : "idle";

  return (
    <section id="voice">
      <div className="head">
        <div>
          <h1>Voice</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>Talk to Stella — she hears, she answers, she moves</div>
        </div>
      </div>
      <div className="card" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <button className="f-orb" data-state={vstate} onClick={onTalk} aria-label={voice === "listening" ? "Stop listening" : "Push to talk"}>
          <span className="core">
            {voice === "listening" ? (
              <span className="bars"><i /><i /><i /><i /><i /></span>
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </span>
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>
            {voice === "listening" ? "Listening" : voice === "speaking" ? "Speaking" : "Tap to talk"}
          </div>
          {voiceLine ? (
            <div className="mono" style={{ fontSize: 15 }}>{voiceLine}</div>
          ) : (
            <div className="sm">Try: “clean the kitchen, then dock” · “twerk” · “open Spotify” · “stop”</div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── cutaway: F signature visual — hardware readouts + suction ── */
function FCutaway({ intensity }: { intensity: Intensity }) {
  const { state } = useV3Robot();
  const { battery } = state;

  return (
    <section id="cutaway">
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="f-cut">
          <div className="rings">
            {[
              [0, 0, 360, "var(--cut-ring)", 0, "solid"],
              [0, 0, 360, "var(--cut-ring)", 50, "dashed"],
              [0, 0, 360, "var(--cut-ring)", 100, "solid"],
              [0, 0, 360, "var(--acc)", 150, "solid"],
              [120, 120, 120, "var(--fg)", 205, "solid"],
            ].map(([l, t, w, c, z, st], i) => (
              <i
                key={i}
                style={{
                  left: `${l}px`, top: `${t}px`, width: `${w}px`, height: `${w}px`,
                  borderColor: c as string, borderStyle: st as string,
                  transform: `translateZ(${z}px)`, animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
          <div className="labels mono">
            <div>LIDAR · RPLIDAR C1 · 10 Hz</div>
            <div style={{ color: "var(--acc)" }}>PI 4 · ROS 2 JAZZY</div>
            <div>ARDUINO MEGA · 115200</div>
            <div>BATTERY · {Math.round(battery)}% · 14.4 V</div>
            <div>ROOMBA 694 · BRUSH + VAC</div>
          </div>
          <div className="suction card mono">
            <div className="lbl">Suction · {intensity} mode</div>
            <div style={{ fontSize: 20 }}>{SUCTION[intensity]} <span className="sm">kPa</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── cleaning tool toggle ── */
function ToolToggle({
  icon,
  label,
  on,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="row">
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: on ? "var(--acc)" : "var(--mute)", display: "inline-flex" }}>{icon}</span>
        {label}
      </span>
      <button
        className={`toggle ${on ? "on" : ""}`}
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        style={{ opacity: disabled ? 0.4 : 1 }}
      />
    </div>
  );
}

/* ── control: Mode + Clean + Drive merged into one section ── */
function FControl({
  intensity,
  setIntensity,
}: {
  intensity: Intensity;
  setIntensity: (i: Intensity) => void;
}) {
  const { state, cleanMode, cleaning, setCleaningMotors, wakeRobot } = useV3Robot();
  const { connection, mode, battery } = state;
  const isLive = connection === "live";

  const displayMode = !isLive ? "OFFLINE" : mode === "cleaning" ? "ACTIVE" : mode === "docked" ? "CHARGING" : "STANDBY";
  const modeColor = displayMode === "ACTIVE" ? "var(--ok)" : displayMode === "CHARGING" ? "var(--warn)" : "var(--mute)";

  const toggleTool = (key: "vacuum" | "main_brush" | "side_brush") =>
    setCleaningMotors(
      key === "vacuum" ? !cleaning.vacuum : cleaning.vacuum,
      key === "main_brush" ? !cleaning.main_brush : cleaning.main_brush,
      key === "side_brush" ? !cleaning.side_brush : cleaning.side_brush
    );

  const actions = [
    { id: "clean", label: "Clean", icon: <Play className="w-4 h-4" />, cls: "pri", fn: () => cleanMode("all") },
    { id: "stop", label: "Stop", icon: <Square className="w-4 h-4" />, cls: "danger", fn: () => cleanMode("stop") },
    { id: "dock", label: "Dock", icon: <House className="w-4 h-4" />, cls: "", fn: () => cleanMode("dock") },
  ];

  return (
    <section id="control">
      <div className="head">
        <div>
          <h1>Control</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>
            <span className="dot" style={{ background: modeColor, marginRight: 8 }} />
            {displayMode} · Battery {isLive ? `${Math.round(battery)}%` : "—"}
          </div>
        </div>
      </div>
      <div className="grid two">
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Suction mode</div>
          <div className="seg" style={{ marginBottom: 16 }}>
            {(["Eco", "Normal", "Turbo"] as Intensity[]).map((m) => (
              <button key={m} className={intensity === m ? "on" : ""} onClick={() => setIntensity(m)}>
                {m} · {SUCTION[m]} kPa
              </button>
            ))}
          </div>
          <div className="lbl" style={{ marginBottom: 10 }}>Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {actions.map((a) => (
              <button key={a.id} className={`btn ${a.cls}`} onClick={a.fn}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          <div className="lbl" style={{ marginBottom: 10 }}>Manual drive</div>
          {!isLive && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={() => wakeRobot()} className="btn inv">
                <Zap className="w-4 h-4" /> Wake Stella
              </button>
              <div className="sm" style={{ textAlign: "center" }}>Not responding — press to reconnect</div>
            </div>
          )}
          <V3DrivePanel />
        </div>
        <div className="card">
          <div className="lbl" style={{ marginBottom: 4 }}>Cleaning tools</div>
          <ToolToggle icon={<Fan className="w-4 h-4" />} label="Vacuum" on={cleaning.vacuum} disabled={!isLive} onToggle={() => toggleTool("vacuum")} />
          <ToolToggle icon={<Brush className="w-4 h-4" />} label="Main brush" on={cleaning.main_brush} disabled={!isLive} onToggle={() => toggleTool("main_brush")} />
          <ToolToggle icon={<Paintbrush className="w-4 h-4" />} label="Side brush" on={cleaning.side_brush} disabled={!isLive} onToggle={() => toggleTool("side_brush")} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" disabled={!isLive} onClick={() => setCleaningMotors(true, true, true)}>All on</button>
            <button className="btn" disabled={!isLive} onClick={() => setCleaningMotors(false, false, false)}>All off</button>
          </div>
          {!isLive && (
            <div className="sm" style={{ marginTop: 10, color: "var(--warn)" }}>
              Connect to Stella to control cleaning tools
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── editable map: rooms + no-go zones ── */
interface Zone { x: number; y: number; w: number; h: number; n: string }
const PLAN_ROOMS = [
  { id: "living-room", x: 0, y: 0, w: 520, h: 360, area: "12.6 m²" },
  { id: "bedroom", x: 520, y: 0, w: 380, h: 260, area: "9.1 m²" },
  { id: "kitchen", x: 520, y: 260, w: 380, h: 360, area: "5.8 m²" },
  { id: "hallway", x: 0, y: 360, w: 520, h: 260, area: "4.0 m²" },
];
const DEFAULT_ZONES: Zone[] = [
  { x: 330, y: 40, w: 150, h: 56, n: "TV CABLES" },
  { x: 380, y: 470, w: 110, h: 110, n: "BATH MAT" },
];
const roomAt = (x: number, y: number, names: Record<string, string>) => {
  const r = PLAN_ROOMS.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  return r ? names[r.id] ?? r.id : "—";
};

function FMap() {
  const { state, selectRoom } = useV3Robot();
  const { location, connection } = state;
  const [names, setNames] = useLocal<Record<string, string>>("stella-room-names", {});
  const [zones, setZones] = useLocal<Zone[]>("stella-zones", DEFAULT_ZONES);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Zone | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const roomName = (id: string) =>
    names[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const toSVG = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = new DOMPoint(e.clientX, e.clientY);
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.round(p.x), y: Math.round(p.y) };
  };

  const onDown = (e: React.PointerEvent) => {
    if (!drawing) return;
    const p = toSVG(e);
    startRef.current = p;
    setDraft({ x: p.x, y: p.y, w: 0, h: 0, n: "" });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing || !startRef.current) return;
    const p = toSVG(e);
    const s = startRef.current;
    setDraft({
      x: Math.min(s.x, p.x), y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y), n: "",
    });
  };
  const onUp = () => {
    if (!drawing) return;
    if (draft && draft.w > 15 && draft.h > 15) {
      const z = { ...draft, n: `ZONE ${zones.length + 1}` };
      setZones((zs) => [...zs, z]);
    }
    startRef.current = null;
    setDraft(null);
    setDrawing(false);
  };

  const cur = PLAN_ROOMS.find((r) => r.id === (location.roomId ?? "living-room")) ?? PLAN_ROOMS[0];

  return (
    <section id="map">
      <div className="head">
        <div>
          <h1>Map</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>Apartment · lidar map · tap a room to clean it</div>
        </div>
        <div className="tools">
          <button className={`btn ${drawing ? "pri" : ""}`} onClick={() => setDrawing((d) => !d)}>
            {drawing ? "Drawing — drag on map" : "+ Draw no-go zone"}
          </button>
        </div>
      </div>
      <div className="grid two">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className={`f-map ${drawing ? "drawing" : ""}`}>
            <svg
              ref={svgRef}
              viewBox="-14 -14 928 648"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
            >
              <defs>
                <pattern id="fgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" fill="none" stroke="var(--grid)" strokeWidth="1" />
                </pattern>
                <pattern id="fng" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="12" fill="rgba(214,51,31,.32)" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="900" height="620" fill="var(--floor)" />
              <rect x="0" y="0" width="900" height="620" fill="url(#fgrid)" />
              {PLAN_ROOMS.map((r) => {
                const active = r.id === cur.id;
                return (
                  <g key={r.id} onClick={() => !drawing && selectRoom(r.id)} style={{ cursor: drawing ? "crosshair" : "pointer" }}>
                    <rect
                      x={r.x} y={r.y} width={r.w} height={r.h}
                      fill={active ? "rgba(255,90,31,.10)" : "none"}
                      stroke={active ? "var(--acc)" : "var(--room)"}
                      strokeWidth={active ? 3 : 2}
                    />
                    <text className="rl" x={r.x + 18} y={r.y + 36}>{roomName(r.id).toUpperCase()}</text>
                    <text className="rl" x={r.x + 18} y={r.y + 62} style={{ fontSize: 13, fontWeight: 400 }}>{r.area}</text>
                  </g>
                );
              })}
              {zones.map((z, i) => (
                <g key={i}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} fill="url(#fng)" stroke="var(--bad)" strokeWidth={2} />
                  <text x={z.x} y={z.y + z.h + 20} style={{ font: "700 14px ui-monospace,monospace", fill: "var(--bad)" }}>
                    NO-GO · {z.n}
                  </text>
                </g>
              ))}
              {draft && draft.w > 0 && (
                <rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="url(#fng)" stroke="var(--bad)" strokeWidth={2} />
              )}
              {/* dock */}
              <rect x="44" y="575" width="52" height="30" rx="4" fill="var(--inv)" />
              <text x="104" y="597" style={{ font: "700 14px ui-monospace,monospace", fill: "var(--mute)" }}>DOCK</text>
              {/* bot marker */}
              <g transform={`translate(${cur.x + cur.w / 2} ${cur.y + cur.h / 2})`} style={{ transition: "transform .35s" }}>
                <circle r="58" fill="rgba(255,90,31,.08)" />
                <circle r="38" fill="rgba(255,90,31,.18)" />
                <circle r="30" fill="#f4f4f4" stroke="#8e939b" strokeWidth="2" />
                <circle cy="-19" r="6" fill="var(--acc)" />
              </g>
            </svg>
            <div className="tag card mono">
              <div className="lbl">Stella</div>
              <b>{roomName(cur.id)}</b>
              <br />
              <span>{connection === "live" ? "live" : "demo"}</span>
            </div>
            <div className="legend mono">
              <span><b style={{ color: "var(--acc)" }}>▮</b> Room</span>
              <span><b style={{ color: "var(--bad)" }}>▨</b> No-go</span>
              <span>N ↑</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="lbl" style={{ marginBottom: 4 }}>Rooms</div>
            {PLAN_ROOMS.map((r) => (
              <div className="row" key={r.id}>
                <span style={{ minWidth: 0 }}>
                  {editing === r.id ? (
                    <input
                      className="input"
                      autoFocus
                      defaultValue={roomName(r.id)}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) setNames((n) => ({ ...n, [r.id]: v }));
                        setEditing(null);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      style={{ padding: "4px 8px" }}
                    />
                  ) : (
                    <b>{roomName(r.id)}</b>
                  )}
                  <br />
                  <span className="sm">{r.area}</span>
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button className="iconbtn" onClick={() => setEditing(editing === r.id ? null : r.id)} aria-label="Rename room">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button className="btn" style={{ padding: "6px 12px" }} onClick={() => selectRoom(r.id)}>
                    Clean
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lbl">No-go zones</span>
              <span className="sm">{zones.length}</span>
            </div>
            {zones.length === 0 && <div className="sm" style={{ marginTop: 8 }}>None yet — draw one on the map.</div>}
            {zones.map((z, i) => (
              <div className="row" key={i}>
                <span>
                  {z.n[0] + z.n.slice(1).toLowerCase()} · {roomAt(z.x + z.w / 2, z.y + z.h / 2, names)}
                </span>
                <button
                  className="iconbtn"
                  onClick={() => setZones((zs) => zs.filter((_, j) => j !== i))}
                  aria-label="Remove zone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── camera ── */
function FCamera() {
  const { state } = useV3Robot();
  const { connection, robotUrl } = state;
  const isLive = connection === "live";
  const [streamOk, setStreamOk] = useState(true);

  return (
    <section id="camera">
      <div className="head">
        <div>
          <h1>Camera</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>Pi camera · front</div>
        </div>
      </div>
      <div className="card" style={{ padding: 12 }}>
        <div className="f-cam">
          <div className="scan" />
          <div className="hud">
            <span>
              <span style={{ color: isLive ? "#3ecf8e" : "#ff5a1f" }}>●</span>{" "}
              {isLive ? "LIVE · MJPEG" : "NO SIGNAL · DEMO"}
            </span>
            <span>PI CAMERA · FRONT</span>
          </div>
          {isLive && robotUrl && streamOk ? (
            <img
              key={String(isLive)}
              src={`${robotUrl}/camera/stream`}
              alt="Stella camera feed"
              onError={() => setStreamOk(false)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="nosignal">
              <Camera className="w-8 h-8" />
              <span>{isLive ? "STREAM UNAVAILABLE" : "DEMO MODE — NO CAMERA"}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── status / telemetry ── */
function FStatus({ intensity }: { intensity: Intensity }) {
  const { state, robotOnline } = useV3Robot();
  const { battery, mode, connection, location } = state;
  const isLive = connection === "live";
  const displayMode = !isLive ? "OFFLINE" : mode === "cleaning" ? "ACTIVE" : mode === "docked" ? "CHARGING" : "STANDBY";

  return (
    <section id="status">
      <div className="head">
        <div>
          <h1>Status</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>Live system readouts</div>
        </div>
      </div>
      <div className="grid three">
        <div className="card">
          <div className="lbl" style={{ marginBottom: 4 }}>System</div>
          <div className="row">
            <span>Battery</span>
            <b className="mono" style={{ fontSize: 16 }}>{isLive ? `${Math.round(battery)}%` : "—"}</b>
          </div>
          <div className="row">
            <span>Mode</span>
            <b className="mono" style={{ fontSize: 16 }}>{displayMode}</b>
          </div>
          <div className="row">
            <span>Suction</span>
            <b className="mono" style={{ fontSize: 16 }}>{SUCTION[intensity]} kPa</b>
          </div>
          <div className="row">
            <span>Position</span>
            <span className="sm">{location.label || "No SLAM"}</span>
          </div>
        </div>
        <div className="card">
          <div className="lbl" style={{ marginBottom: 4 }}>Link</div>
          <div className="row">
            <span>Connection</span>
            <b className="mono" style={{ fontSize: 16 }}>{connection.toUpperCase()}</b>
          </div>
          <div className="row">
            <span>Robot hardware</span>
            <b className="mono" style={{ fontSize: 16 }}>{isLive ? (robotOnline ? "ONLINE" : "OFFLINE") : "—"}</b>
          </div>
          <div className="row">
            <span>Sign-in</span>
            <span className="sm">Tailscale</span>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StellaMascot compact />
        </div>
      </div>
    </section>
  );
}

/* ── TTS voice picker (used in settings) ── */
function VoicePicker() {
  const { setVoicePreference, speak, availableVoices, ttsVoiceURI } = useV3Robot();
  const english = availableVoices.filter((v) => v.lang.startsWith("en"));
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 6 }}>Stella&apos;s voice</div>
      <select
        className="input"
        value={ttsVoiceURI || ""}
        onChange={(e) => setVoicePreference(e.target.value)}
      >
        <option value="">Auto (best available)</option>
        {english.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <button className="btn" onClick={() => speak("Hello, I'm Stella. How do I sound?")}>
          <Volume2 className="w-4 h-4" /> Test
        </button>
      </div>
    </div>
  );
}

/* ── settings — hidden entirely in demo mode ── */
function FSettings({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const { wakeRobot } = useV3Robot();
  return (
    <section id="settings">
      <div className="head">
        <div>
          <h1>Settings</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>Live-only controls · changes save instantly</div>
        </div>
      </div>
      <div className="grid three">
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Appearance</h2>
          <div className="lbl" style={{ marginBottom: 6 }}>Theme</div>
          <div className="seg">
            {(["Light", "Dark"] as const).map((t) => (
              <button
                key={t}
                className={(theme === "dark") === (t === "Dark") ? "on" : ""}
                onClick={() => setTheme(t.toLowerCase() as Theme)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Voice</h2>
          <VoicePicker />
          <div className="row" style={{ marginTop: 8 }}>
            <span>Wake word on Pi mic</span>
            <b>“Stella”</b>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Safety</h2>
          <div className="row">
            <span>“Stop” always wins</span>
            <span className="sm">Locked on</span>
          </div>
          <div className="row">
            <span>Not responding?</span>
            <button className="btn" style={{ padding: "6px 12px" }} onClick={() => wakeRobot()}>
              <Zap className="w-3.5 h-3.5" /> Wake
            </button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 6 }}>Hardware</h2>
          {[
            ["Base", "Roomba 694"],
            ["Brain", "Raspberry Pi 4 · ROS 2 Jazzy"],
            ["Bridge", "Arduino Mega 2560"],
            ["Lidar", "RPLIDAR C1"],
            ["Camera", "Pi camera module"],
          ].map(([a, b]) => (
            <div className="row" key={a}>
              <span>{a}</span>
              <span className="sm">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── voice overlay: animated voice mode ── */
function FVoiceOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useV3Robot();
  const { voice, voiceLine } = state;
  const vstate = voice === "listening" ? "listening" : voice === "speaking" ? "speaking" : "idle";

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="f-voice" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button
        className="f-orb"
        data-state={vstate}
        style={{ width: 200, height: 200 }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Voice state"
      >
        <span className="core" style={{ width: 84, height: 84 }}>
          {voice === "listening" ? (
            <span className="bars"><i /><i /><i /><i /><i /></span>
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </span>
      </button>
      <div className="f-vstate">
        {voice === "listening" ? "Listening" : voice === "speaking" ? "Stella" : "Ready"}
      </div>
      <div className="f-vtext">{voiceLine || "Say a command"}</div>
      <div className="f-vsub">Tap outside to cancel · Esc to close</div>
      <div className="f-vbtns">
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ── dashboard shell ── */
function DashboardInner({
  theme,
  setTheme,
  intensity,
  setIntensity,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  intensity: Intensity;
  setIntensity: (i: Intensity) => void;
}) {
  const { state, toggleListening } = useV3Robot();
  const { connection, voice } = state;
  const isDemo = connection === "demo";
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [active, setActive] = useState("voice");

  const talk = () => {
    setVoiceOpen(true);
    if (voice === "idle") toggleListening();
  };
  const closeVoice = () => {
    setVoiceOpen(false);
    if (voice !== "idle") toggleListening();
  };

  // Space = talk (outside inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA") return;
      if (e.code === "Space" && !voiceOpen) {
        e.preventDefault();
        talk();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [voiceOpen, voice]); // eslint-disable-line react-hooks/exhaustive-deps

  const nav = NAV.filter((n) => !(isDemo && n.id === "settings"));

  return (
    <div className="f" data-theme={theme}>
      <FTop theme={theme} setTheme={setTheme} onTalk={talk} />

      <nav className="f-side" aria-label="Sections">
        {nav.map((n) => (
          <button
            key={n.id}
            className={active === n.id ? "on" : ""}
            onClick={() => { setActive(n.id); scrollTo(n.id); }}
          >
            <n.icon /> {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto" }} className="sm mono">
          Unit 01 · Roomba 694<br />
          Pi 4 · ROS 2 Jazzy
        </div>
      </nav>

      <main className="f-main" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <FVoice onTalk={talk} />
        <FCutaway intensity={intensity} />
        <FControl intensity={intensity} setIntensity={setIntensity} />
        <FMap />
        <FCamera />
        <FStatus intensity={intensity} />
        {!isDemo && <FSettings theme={theme} setTheme={setTheme} />}

        <div className="sm mono" style={{ textAlign: "center", paddingTop: 12, letterSpacing: "0.2em" }}>
          STELLA UNIT-01 // DESIGN F
        </div>
      </main>

      <nav className="f-tabs" aria-label="Sections">
        {nav.map((n) => (
          <button
            key={n.id}
            className={active === n.id ? "on" : ""}
            onClick={() => { setActive(n.id); scrollTo(n.id); }}
          >
            <n.icon /> {n.id === "status" ? "Status" : n.label}
          </button>
        ))}
      </nav>

      <FVoiceOverlay open={voiceOpen} onClose={closeVoice} />
    </div>
  );
}

export default function EngDashboard() {
  const [theme, setTheme] = useLocal<Theme>("stella-theme", "dark");
  const [intensity, setIntensity] = useLocal<Intensity>("stella-intensity", "Normal");
  return (
    <V3RobotProvider>
      <DashboardInner theme={theme} setTheme={setTheme} intensity={intensity} setIntensity={setIntensity} />
    </V3RobotProvider>
  );
}
