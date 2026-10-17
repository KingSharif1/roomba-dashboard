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

type TvStatus = { power?: string | null; app_name?: string | null; player?: string | null } | null;

export function FRemote({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useV3Robot();
  const { robotUrl, connection } = state;
  const live = connection === "live" && !!robotUrl;
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [tv, setTv] = useState<TvStatus>(null);
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
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) say(data.error || "TV didn't answer", true);
        else say(label);
      } catch {
        say("Couldn't reach Stella", true);
      }
    },
    [live, robotUrl, say]
  );

  const key = useCallback((k: string, label = k) => post("/roku/key", { key: k }, label), [post]);
  const launch = useCallback((app: string, label: string) => post("/roku/launch", { app }, `Opening ${label}`), [post]);

  // What the TV is doing right now (needs the Pi's /tv/status; stays hidden on older Pi code)
  useEffect(() => {
    if (!open || !live) return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`${robotUrl}/tv/status`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        if (!stop) setTv(d.tv ?? null);
      } catch {
        if (!stop) setTv(null);
      }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [open, live, robotUrl]);

  const tvNow = open && live ? tv : null;      // never show a stale status after closing / disconnecting
  const tvLine = !tvNow
    ? null
    : tvNow.power && tvNow.power !== "PowerOn"
      ? "TV is off"
      : `${tvNow.app_name || "Home"}${tvNow.player && tvNow.player !== "close" ? " · " + tvNow.player : ""}`;

  return (
    <FWindow open={open} onClose={onClose} title="TV remote" subtitle={tvLine ?? (live ? "75 Living" : "Demo mode — not connected")}>
      <div className="fr">
        <div className="fr-note" data-bad={note?.bad ? "1" : "0"} aria-live="polite">{note?.text ?? " "}</div>
        <div className="fr-body" data-live={live ? "1" : "0"}>
          <div className="fr-row fr-top">
            <RBtn onTap={() => key("Power", "Power")} className="fr-power" label="Power"><Power /></RBtn>
          </div>
          <div className="fr-row">
            <RBtn onTap={() => key("Back", "Back")} label="Back"><ArrowLeft /></RBtn>
            <RBtn onTap={() => key("Home", "Home")} label="Home"><House /></RBtn>
          </div>

          <div className="fr-dpad" role="group" aria-label="Directional pad">
            <RBtn hold onTap={() => key("Up")} className="u" label="Up"><ChevronUp /></RBtn>
            <RBtn hold onTap={() => key("Left")} className="l" label="Left"><ChevronLeft /></RBtn>
            <RBtn onTap={() => key("Select", "OK")} className="ok" label="OK">OK</RBtn>
            <RBtn hold onTap={() => key("Right")} className="r" label="Right"><ChevronRight /></RBtn>
            <RBtn hold onTap={() => key("Down")} className="d" label="Down"><ChevronDown /></RBtn>
          </div>

          <div className="fr-row">
            <RBtn onTap={() => key("InstantReplay", "Replay")} label="Replay"><RotateCcw /></RBtn>
            <RBtn onTap={() => key("Info", "Options")} label="Options"><Asterisk /></RBtn>
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
