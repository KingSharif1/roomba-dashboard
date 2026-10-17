"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, House, Power, Rewind, FastForward, Play, RotateCcw, Asterisk,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Volume1, Volume2, VolumeX,
} from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";
import { FWindow } from "./f-window";

/** Roku-style TV remote. Keys go to the Pi (`POST /roku/key`), which presses them on the TV over the LAN. */
const APPS = [
  { id: "netflix", label: "Netflix", color: "#e50914" },
  { id: "youtube", label: "YouTube", color: "#ff0033" },
  { id: "spotify", label: "Spotify", color: "#1db954" },
  { id: "hulu", label: "Hulu", color: "#1ce783" },
  { id: "disney", label: "Disney+", color: "#1b4ad6" },
] as const;

/** The TVs Stella knows about. Only the first (Roku "75 Living") reports live status today. */
const TVS = ["75 Living", "ds twin", "sharif d ace"] as const;

type PiTv = { name: string; on: boolean; app?: string; player?: string };

const sameTv = (a: string, b: string) => { const x = a.toLowerCase(), y = b.toLowerCase(); return x === y || x.includes(y) || y.includes(x); };

export function FRemote({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useV3Robot();
  const { robotUrl, connection } = state;
  const live = connection === "live" && !!robotUrl;
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [tvs, setTvs] = useState<PiTv[] | null>(null);
  const [sel, setSel] = useState(0);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((text: string, bad = false) => {
    setNote({ text, bad });
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 1600);
  }, []);

  const post = useCallback(
    async (path: string, body: object, label: string) => {
      if (!live) return say("Connect to the tailnet to use the remote", true);
      try {
        if (typeof navigator !== "undefined") navigator.vibrate?.(8);
        const res = await fetch(`${robotUrl}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tv: TVS[sel], ...body }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) say(data.error || "TV didn't answer", true);
        else say(label);
      } catch {
        say("Couldn't reach Stella", true);
      }
    },
    [live, robotUrl, say, sel]
  );

  const key = useCallback((k: string, label = k) => post("/roku/key", { key: k }, label), [post]);
  const launch = useCallback((app: string, label: string) => post("/roku/launch", { app }, `Opening ${label}`), [post]);

  // What every TV is doing right now (Pi `/tvs`; older Pi code falls back to `/tv/status` for the first TV only)
  useEffect(() => {
    if (!open || !live) return;
    let stop = false;
    const poll = async () => {
      try {
        let rows: PiTv[] | null = null;
        const res = await fetch(`${robotUrl}/tvs`);
        if (res.ok) rows = (await res.json()).tvs ?? [];
        else {
          const r2 = await fetch(`${robotUrl}/tv/status`);
          const t = r2.ok ? (await r2.json()).tv : null;
          rows = t ? [{ name: TVS[0], on: !!t.power && t.power === "PowerOn", app: t.app_name || "Home", player: t.player || "" }] : null;
        }
        if (!stop) setTvs(rows);
      } catch {
        if (!stop) setTvs(null);
      }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [open, live, robotUrl]);

  const tvsNow = open && live ? tvs : null;      // never show a stale status after closing / disconnecting
  const statusOf = (i: number): { line: string; dot: string } => {
    if (!live) return { line: "Demo", dot: "var(--mute)" };
    if (!tvsNow) return { line: "…", dot: "var(--mute)" };
    const t = tvsNow.find((x) => sameTv(x.name, TVS[i])) ?? (tvsNow.length === 1 && i === 0 ? tvsNow[0] : undefined);
    if (!t) return { line: "Not found", dot: "var(--mute)" };
    if (!t.on) return { line: "Off", dot: "var(--mute)" };
    const playing = !!t.player && t.player !== "close";
    return { line: `${t.app || "On"}${playing ? " · " + t.player : ""}`, dot: "var(--ok)" };
  };

  return (
    <FWindow open={open} onClose={onClose} title="TV remote" subtitle={live ? "Connected" : "Demo mode — not connected"}>
      <div className="fr">
        <div className="fr-tvs" role="tablist" aria-label="TVs">
          {TVS.map((name, i) => {
            const st = statusOf(i);
            return (
              <button key={name} role="tab" aria-selected={sel === i} className="fr-tv" data-on={sel === i ? "1" : "0"} onClick={() => setSel(i)}>
                <span className="fr-tv-n"><i style={{ background: st.dot }} />{name}</span>
                <span className="fr-tv-s">{st.line}</span>
              </button>
            );
          })}
        </div>
        <div className="fr-note" data-bad={note?.bad ? "1" : "0"} aria-live="polite">{note?.text ?? " "}</div>
        <div className="fr-body" data-live={live ? "1" : "0"}>
          <div className="fr-row fr-small">
            <RBtn onTap={() => key("Back", "Back")} label="Back"><ArrowLeft /></RBtn>
            <RBtn onTap={() => key("Home", "Home")} label="Home"><House /></RBtn>
            <RBtn onTap={() => key("InstantReplay", "Replay")} label="Replay"><RotateCcw /></RBtn>
            <RBtn onTap={() => key("Info", "Options")} label="Options"><Asterisk /></RBtn>
            <RBtn onTap={() => key("Power", "Power")} className="fr-power" label="Power"><Power /></RBtn>
          </div>

          <div className="fr-dpad" role="group" aria-label="Directional pad">
            <RBtn hold onTap={() => key("Up")} className="u" label="Up"><ChevronUp /></RBtn>
            <RBtn hold onTap={() => key("Left")} className="l" label="Left"><ChevronLeft /></RBtn>
            <RBtn onTap={() => key("Select", "OK")} className="ok" label="OK">OK</RBtn>
            <RBtn hold onTap={() => key("Right")} className="r" label="Right"><ChevronRight /></RBtn>
            <RBtn hold onTap={() => key("Down")} className="d" label="Down"><ChevronDown /></RBtn>
          </div>

          <div className="fr-row">
            <RBtn hold onTap={() => key("Rev", "Rewind")} label="Rewind"><Rewind /></RBtn>
            <RBtn onTap={() => key("Play", "Play / pause")} className="fr-play" label="Play / pause"><Play /></RBtn>
            <RBtn hold onTap={() => key("Fwd", "Fast-forward")} label="Fast-forward"><FastForward /></RBtn>
          </div>
          <div className="fr-row fr-vol">
            <RBtn hold onTap={() => key("VolumeDown", "Volume −")} label="Volume down"><Volume1 /></RBtn>
            <RBtn onTap={() => key("VolumeMute", "Mute")} label="Mute"><VolumeX /></RBtn>
            <RBtn hold onTap={() => key("VolumeUp", "Volume +")} label="Volume up"><Volume2 /></RBtn>
          </div>

          <div className="fr-apps">
            {APPS.map((a) => (
              <button
                key={a.id}
                className="fr-app"
                style={{ ["--app" as string]: a.color }}
                onClick={() => launch(a.id, a.label)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FWindow>
  );
}

/** Round remote button. `hold` = keeps repeating while pressed (arrows, volume, seek). */
function RBtn({
  onTap, hold, className = "", label, children,
}: { onTap: () => void; hold?: boolean; className?: string; label: string; children: ReactNode }) {
  const timers = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});
  const stop = () => {
    if (timers.current.t) clearTimeout(timers.current.t);
    if (timers.current.i) clearInterval(timers.current.i);
    timers.current = {};
  };
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      className={`fr-btn ${className}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap();
        if (hold) {
          timers.current.t = setTimeout(() => { timers.current.i = setInterval(onTap, 160); }, 420);
        }
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); onTap(); }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
