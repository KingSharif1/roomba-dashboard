"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic, Square, Play, House, Sun, Moon, Map as MapIcon, Camera,
  Activity, Settings, Gauge, Fan, Brush, Paintbrush, Pencil, Trash2, X,
  Volume2, Zap, Cpu, Phone, Tv,
} from "lucide-react";
import { V3RobotProvider, useV3Robot } from "@/lib/v3/store";
import { FDrivePanel } from "@/components/v3/drive-panel-f";
import { StellaMascot } from "@/components/v3/stella-mascot";
import { FRemote } from "@/components/f/f-remote";
import { FCall } from "@/components/f/f-call";
import "../design-f.css";
import "../f-windows.css";

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
  { id: "control", label: "Control", icon: Gauge },
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
  onRemote,
  onCall,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onTalk: () => void;
  onRemote: () => void;
  onCall: () => void;
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
        <button className="iconbtn" onClick={onRemote} aria-label="Open TV remote" title="TV remote">
          <Tv className="w-4 h-4" />
        </button>
        <button className="iconbtn" onClick={onCall} aria-label="Call Stella" title="Call Stella">
          <Phone className="w-4 h-4" />
        </button>
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

/* ── cutaway: F signature visual — hardware readouts + suction ── */
/* ── cutaway: suction card with map/status toggle ── */
function FCutaway({ intensity }: { intensity: Intensity }) {
  const { state, robotOnline } = useV3Robot();
  const { battery, connection, mode } = state;
  const isLive = connection === "live";
  const isDemo = connection === "demo";
  const [view, setView] = useState<"status" | "map">("status");

  // Part status: LiDAR is never connected (user doesn't have one)
  // Everything else uses live data from /status polling
  const parts = [
    { name: "Pi 4", detail: "ROS 2 Jazzy · brain", online: isLive },
    { name: "Arduino", detail: "Uno · 115200 · motor bridge", online: isLive && robotOnline },
    { name: "Roomba 694", detail: "brush + vac base", online: isLive && robotOnline },
    { name: "Battery", detail: isLive ? `${Math.round(battery)}%` : "—", online: isLive },
    { name: "LiDAR", detail: "not connected", online: false },
    { name: "Camera", detail: "imx219", online: isLive },
  ];

  return (
    <section id="cutaway">
      <div className="head">
        <div>
          <h1>Stella</h1>
          <div className="sm" style={{ fontSize: 14, marginTop: 2 }}>
            {isLive ? (robotOnline ? "Online · ready" : "Pi online · robot offline") : isDemo ? "Demo mode" : "Offline"}
          </div>
        </div>
        <div className="f-switch" role="tablist" aria-label="Status or map">
          <span
            className="thumb"
            style={{
              left: view === "status" ? 3 : "calc(50% + 1px)",
              width: "calc(50% - 4px)",
            }}
            aria-hidden
          />
          <button
            role="tab"
            aria-selected={view === "status"}
            className={view === "status" ? "on" : ""}
            onClick={() => setView("status")}
          >
            <Activity className="w-3.5 h-3.5" /> Status
          </button>
          <button
            role="tab"
            aria-selected={view === "map"}
            className={view === "map" ? "on" : ""}
            onClick={() => setView("map")}
          >
            <MapIcon className="w-3.5 h-3.5" /> Map
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isDemo && (
          <span className="f-pchip demo" style={{ position: "absolute", right: 14, top: 12, zIndex: 5 }}>
            <span className="dot" /> DEMO VALUES
          </span>
        )}
        {view === "status" ? (
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
              {parts.map((p) => (
                <div key={p.name} style={{ color: p.online ? "var(--fg)" : "var(--mute)" }}>
                  {p.name.toUpperCase()} · {p.detail.toUpperCase()}
                  <span style={{
                    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                    background: p.online ? "var(--ok)" : "var(--mute)", marginLeft: 8,
                  }} />
                </div>
              ))}
            </div>
            <div className="suction card mono">
              <div className="lbl">Suction · {intensity} mode</div>
              <div style={{ fontSize: 20 }}>{SUCTION[intensity]} <span className="sm">kPa</span></div>
              <div className="sm" style={{ marginTop: 8, lineHeight: 1.5 }}>
                Eco 1.4 · Normal 2.2 · Turbo 3.1 kPa<br />
                Mode: {mode.toUpperCase()} · {isLive ? "live" : "offline"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <FMapBody />
          </div>
        )}
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

/* ── control: actions + manual drive & cleaning tools in one card ── */
function FControl() {
  const { state, cleanMode, wakeRobot, cleaning, setCleaningMotors } = useV3Robot();
  const { connection, mode, battery } = state;
  const isLive = connection === "live";

  const displayMode = !isLive ? "OFFLINE" : mode === "cleaning" ? "ACTIVE" : mode === "docked" ? "CHARGING" : "STANDBY";
  const modeColor = displayMode === "ACTIVE" ? "var(--ok)" : displayMode === "CHARGING" ? "var(--warn)" : "var(--mute)";

  // Local state mirrors the store for instant visual feedback
  // Syncs back if the store changes externally
  const [localTools, setLocalTools] = useState({ vacuum: false, main_brush: false, side_brush: false });
  useEffect(() => {
    setLocalTools({ vacuum: cleaning.vacuum, main_brush: cleaning.main_brush, side_brush: cleaning.side_brush });
  }, [cleaning.vacuum, cleaning.main_brush, cleaning.side_brush]);

  const toggleTool = (key: "vacuum" | "main_brush" | "side_brush") => {
    const next = { ...localTools, [key]: !localTools[key] };
    setLocalTools(next); // instant UI update
    setCleaningMotors(next.vacuum, next.main_brush, next.side_brush);
  };

  const setAllTools = (on: boolean) => {
    const next = { vacuum: on, main_brush: on, side_brush: on };
    setLocalTools(next);
    setCleaningMotors(next.vacuum, next.main_brush, next.side_brush);
  };

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
          <div className="lbl" style={{ marginBottom: 10 }}>Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
            {actions.map((a) => (
              <button key={a.id} className={`btn ${a.cls}`} onClick={a.fn}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          {!isLive && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <button onClick={() => wakeRobot()} className="btn inv">
                <Zap className="w-4 h-4" /> Wake Stella
              </button>
              <div className="sm" style={{ textAlign: "center" }}>Not responding — press to reconnect</div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="f-dt">
            <div className="f-dt-drive">
              <div className="lbl" style={{ marginBottom: 10 }}>Manual drive</div>
              <FDrivePanel />
            </div>
            <div className="f-dt-tools">
              <div className="lbl" style={{ marginBottom: 4 }}>Cleaning tools</div>
              <ToolToggle icon={<Fan className="w-4 h-4" />} label="Vacuum" on={localTools.vacuum} disabled={!isLive} onToggle={() => toggleTool("vacuum")} />
              <ToolToggle icon={<Brush className="w-4 h-4" />} label="Main brush" on={localTools.main_brush} disabled={!isLive} onToggle={() => toggleTool("main_brush")} />
              <ToolToggle icon={<Paintbrush className="w-4 h-4" />} label="Side brush" on={localTools.side_brush} disabled={!isLive} onToggle={() => toggleTool("side_brush")} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn" disabled={!isLive} onClick={() => setAllTools(true)}>All on</button>
                <button className="btn" disabled={!isLive} onClick={() => setAllTools(false)}>All off</button>
              </div>
              {!isLive && (
                <div className="sm" style={{ marginTop: 10, color: "var(--warn)" }}>
                  Connect to Stella to control cleaning tools
                </div>
              )}
            </div>
          </div>
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

function FMapBody() {
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
    <>
      <div className="head">
        <div>
          <div className="sm">Draw a no-go zone right on the map</div>
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
    </>
  );
}

/* ── hardware: suction + cleaning tools + real part status ── */
type PStatus = "online" | "offline" | "checking" | "demo";

function PChip({ status }: { status: PStatus }) {
  const label = status === "online" ? "ONLINE" : status === "offline" ? "OFFLINE" : status === "checking" ? "CHECKING" : "DEMO";
  const cls = status === "online" ? "ok" : status === "offline" ? "bad" : status === "checking" ? "warn" : "demo";
  return (
    <span className={`f-pchip ${cls}`}>
      <span className="dot" /> {label}
    </span>
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

/* ── voice blob: Grok mock's animated blob, ported to React ── */
function VoiceBlob({
  phase,
  analyser,
}: {
  phase: "idle" | "listening" | "speaking";
  analyser: React.RefObject<AnalyserNode | null>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let raf = 0;
    let t = 0;
    let amp = 0;
    const dpr = window.devicePixelRatio || 1;
    const frame = () => {
      t += 0.016;
      const W = c.clientWidth || 300;
      c.width = W * dpr;
      c.height = W * dpr;
      const x = c.getContext("2d");
      if (!x) return;
      const an = analyser.current;
      let a: number;
      if (an) {
        const d = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(d);
        a = d.reduce((s, v) => s + v, 0) / d.length / 90;
      } else {
        const base: Record<"idle" | "listening" | "speaking", number> = {
          idle: 0.1,
          listening: 0.45 + 0.4 * Math.abs(Math.sin(t * 3.1) * Math.sin(t * 1.7 + 1)),
          speaking: 0.35 + 0.35 * Math.abs(Math.sin(t * 5) * Math.cos(t * 2.3)),
        };
        a = base[phaseRef.current];
      }
      amp += (a - amp) * 0.12;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, W);
      const cx = W / 2;
      const R = W * 0.26;
      const g = x.createRadialGradient(cx, cx, R * 0.2, cx, cx, R * 1.9);
      g.addColorStop(0, "rgba(255,90,31,.55)");
      g.addColorStop(1, "rgba(255,90,31,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, W, W);
      for (let L = 0; L < 3; L++) {
        x.beginPath();
        for (let i = 0; i <= 120; i++) {
          const th = (i / 120) * Math.PI * 2;
          const n =
            Math.sin(th * 3 + t * (1.5 + L)) * 0.5 +
            Math.sin(th * 5 - t * (2 + L * 0.7)) * 0.3 +
            Math.sin(th * 2 + t * 0.8) * 0.2;
          const r = R * (1 + amp * 0.28 * n) - L * 6;
          const px = cx + Math.cos(th) * r;
          const py = cx + Math.sin(th) * r;
          if (i) x.lineTo(px, py);
          else x.moveTo(px, py);
        }
        x.closePath();
        if (L === 0) {
          const fg = x.createLinearGradient(0, 0, W, W);
          fg.addColorStop(0, "#ff8a3d");
          fg.addColorStop(1, "#ff3d6e");
          x.fillStyle = fg;
          x.fill();
        } else {
          x.strokeStyle = `rgba(255,255,255,${0.5 - L * 0.15})`;
          x.lineWidth = 1.5;
          x.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return <canvas ref={ref} className="f-blob" aria-hidden />;
}

/* ── voice overlay: simple push-to-talk toggle ── */
function FVoiceOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, toggleListening, robotOnline } = useV3Robot();
  const { voice, voiceLine, connection } = state;
  const [tvOk, setTvOk] = useState<boolean | null>(null);

  const listening = voice === "listening";
  const speaking = voice === "speaking";
  const isLive = connection === "live";

  // Check if TV control is available on the Pi
  useEffect(() => {
    if (!open || !isLive) { setTvOk(null); return; }
    const check = async () => {
      try {
        const res = await fetch(`${state.robotUrl}/roku/list`);
        setTvOk(res.ok);
      } catch {
        setTvOk(false);
      }
    };
    check();
  }, [open, isLive]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  // Simple toggle: press to start, press again to stop
  const toggle = () => {
    toggleListening();
  };

  if (!open) return null;
  return (
    <div className="f-voice" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="f-vstate">
        {listening ? "Listening…" : speaking ? "Stella is speaking" : "Ready"}
      </div>

      {/* Big toggle button */}
      <button
        onClick={toggle}
        className="f-orb"
        data-state={listening ? "listening" : speaking ? "speaking" : "idle"}
        aria-label={listening ? "Stop listening" : "Start listening"}
        style={{ cursor: "pointer", border: "none", background: "none" }}
      >
        <span className="core">
          {listening ? (
            <span className="bars"><i /><i /><i /><i /><i /></span>
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </span>
      </button>

      <div className="f-vtext">
        {voiceLine || (listening ? "Talk now…" : "Tap the mic to talk")}
      </div>
      <div className="f-vsub">
        {listening ? "Tap again to stop" : "Esc to close"}
      </div>

      {/* Status indicators */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, fontSize: 12 }} className="mono">
        <span style={{ color: isLive && robotOnline ? "var(--ok)" : "var(--mute)" }}>
          ● Robot {isLive && robotOnline ? "online" : "offline"}
        </span>
        <span style={{ color: tvOk ? "var(--ok)" : tvOk === false ? "var(--warn)" : "var(--mute)" }}>
          ● TV {tvOk ? "ready" : tvOk === false ? "not set up" : "…"}
        </span>
      </div>

      <div className="f-vbtns" style={{ marginTop: 16 }}>
        <button className="btn" onClick={onClose}>Close</button>
      </div>

      <div className="sm" style={{ marginTop: 12, textAlign: "center", maxWidth: 300 }}>
        Try: "move forward" · "volume up" · "play Stranger Things" · "twerk"
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
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [active, setActive] = useState("control");

  const talk = () => {
    // pill click / space / voice card: open the overlay only.
    // Talking starts when the user holds the blob (hold-to-talk).
    setVoiceOpen(true);
  };
  const closeVoice = () => {
    setVoiceOpen(false);
    if (voice !== "idle") toggleListening();
  };

  // Space = open voice overlay (outside inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA") return;
      if (e.code === "Space" && !e.repeat && !voiceOpen && !remoteOpen && !callOpen) {
        e.preventDefault();
        talk();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [voiceOpen, remoteOpen, callOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const nav = NAV.filter((n) => !(isDemo && n.id === "settings"));

  return (
    <div className="f" data-theme={theme}>
      <FTop theme={theme} setTheme={setTheme} onTalk={talk} onRemote={() => setRemoteOpen(true)} onCall={() => setCallOpen(true)} />

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
        <FCutaway intensity={intensity} />
        <FControl />
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
      <FRemote open={remoteOpen} onClose={() => setRemoteOpen(false)} />
      <FCall open={callOpen} onClose={() => setCallOpen(false)} />
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
