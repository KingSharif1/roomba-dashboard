"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Send, Volume2 } from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";
import { FWindow } from "./f-window";
import { voiceOut, setVoiceOut, nextVoiceOut, VOICE_OUT_LABEL, type VoiceOut } from "@/lib/stella-prefs";

/**
 * Voice call with Stella — hands-free, back-and-forth like a phone call.
 * listen → think (Claude via /api/stella/chat, with the last few turns) → speak → listen again.
 * Tap the orb to interrupt her. Say "bye" / "hang up" or press the red button to end.
 * Uses the browser's speech recognition + speech synthesis (Safari / Chrome). Typed fallback if unsupported.
 */
type Phase = "idle" | "listening" | "thinking" | "speaking";

/** The slice of the browser SpeechRecognition API we use. */
interface Rec {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void; abort(): void;
}
type RecCtor = new () => Rec;
type Msg = { role: "user" | "assistant"; text: string };

const END_RE = /^\s*(bye|goodbye|good night|hang up|end (the )?call|that'?s all)\b/i;

export function FCall({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { runCommand, ttsVoiceURI, availableVoices, state: robotState } = useV3Robot();
  const { connection, robotUrl } = robotState;
  const [phase, setPhase] = useState<Phase>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [interim, setInterim] = useState("");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [typed, setTyped] = useState("");

  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const recRef = useRef<Rec | null>(null);
  const histRef = useRef<Msg[]>([]);
  const endAfterRef = useRef(false);
  const voicesRef = useRef(availableVoices);
  const voiceUriRef = useRef(ttsVoiceURI);
  const runRef = useRef(runCommand);
  const closeRef = useRef(onClose);
  useEffect(() => {          // keep "latest value" refs fresh without touching refs during render
    voicesRef.current = availableVoices;
    voiceUriRef.current = ttsVoiceURI;
    runRef.current = runCommand;
    closeRef.current = onClose;
  });
  const logRef = useRef<HTMLDivElement>(null);

  const SR: RecCtor | null =
    typeof window !== "undefined"
      ? ((window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor }).SpeechRecognition ||
         (window as unknown as { webkitSpeechRecognition?: RecCtor }).webkitSpeechRecognition ||
         null)
      : null;

  const setP = useCallback((p: Phase) => { phaseRef.current = p; setPhase(p); }, []);
  const addMsg = useCallback((m: Msg) => {
    histRef.current = [...histRef.current, m].slice(-12);
    setMsgs((x) => [...x, m].slice(-30));
  }, []);

  const stopListening = useCallback(() => {
    try { recRef.current?.abort(); } catch { /* noop */ }
    recRef.current = null;
  }, []);

  const listenRef = useRef<() => void>(() => {});
  const [vout, setVout] = useState<VoiceOut>("Device");
  useEffect(() => { if (open) setVout(voiceOut()); }, [open]);
  const cycleVout = () => { const n = nextVoiceOut(voiceOut()); setVoiceOut(n); setVout(n); };
  const handleUserRef = useRef<(t: string) => void>(() => {});

  const speak = useCallback((text: string, after?: () => void) => {
    // Voice output: this device (default), the Pi's own speaker, or both. Set in Settings → "Voice plays on".
    const out = voiceOut();
    const toPi = out !== "Device" && connection === "live" && !!robotUrl;
    if (toPi) {
      fetch(`${robotUrl}/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {});
      if (out === "Pi") {                      // nothing plays here: wait about as long as she talks, then listen again
        setP("speaking");
        window.setTimeout(() => after?.(), Math.min(15000, 900 + text.length * 70));
        return;
      }
    }
    if (typeof window === "undefined" || !window.speechSynthesis) { after?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    const uri = voiceUriRef.current;
    const pick =
      (uri && (voices.find((v) => v.voiceURI === uri) || voices.find((v) => v.name === uri))) ||
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.name.includes("Samantha")) ||
      voices.find((v) => v.name.includes("Zira")) ||
      voices.find((v) => v.lang === "en-US" && v.localService) ||
      voices.find((v) => v.lang.startsWith("en-US"));
    if (pick) u.voice = pick;
    u.rate = 1.03;
    let done = false;
    const finish = () => { if (done) return; done = true; after?.(); };
    u.onend = finish;
    u.onerror = finish;
    setP("speaking");
    window.speechSynthesis.speak(u);
  }, [setP, connection, robotUrl]);

  const resume = useCallback(() => {
    if (!activeRef.current) return;
    if (endAfterRef.current) { closeRef.current(); return; }
    setP("idle");
    listenRef.current();
  }, [setP]);

  const handleUser = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || !activeRef.current) return;
    stopListening();
    setInterim("");
    addMsg({ role: "user", text: clean });
    if (END_RE.test(clean)) {
      endAfterRef.current = true;
      addMsg({ role: "assistant", text: "Okay, talk soon!" });
      speak("Okay, talk soon!", resume);
      return;
    }
    setP("thinking");
    let reply = "";
    let commands: unknown[] = [];
    try {
      const res = await fetch("/api/stella/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, mode: "call", history: histRef.current.slice(0, -1).slice(-8) }),
      });
      const data = await res.json();
      reply = data.reply || "";
      commands = data.commands || [];
      if (data.error && !reply) reply = "My brain isn't reachable right now.";
    } catch {
      reply = "I lost my connection for a second. Say that again?";
    }
    if (!activeRef.current) return;
    if (!reply) reply = "Done.";
    addMsg({ role: "assistant", text: reply });
    // do the actions while she talks
    void (async () => { for (const c of commands) { try { await runRef.current(c); } catch { /* noop */ } } })();
    speak(reply, resume);
  }, [addMsg, resume, setP, speak, stopListening]);
  useEffect(() => { handleUserRef.current = handleUser; });

  const listen = useCallback(() => {
    if (!activeRef.current || mutedRef.current || !SR) return;
    if (phaseRef.current === "speaking" || phaseRef.current === "thinking") return;
    stopListening();
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    rec.onstart = () => setP("listening");
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(finalText || live);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        mutedRef.current = true; setMuted(true); setP("idle");
        setError("Microphone is blocked — allow it in your browser settings, or type below.");
      }
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;           // we aborted it ourselves
      recRef.current = null;
      if (finalText.trim()) handleUserRef.current(finalText);
      else if (activeRef.current && !mutedRef.current && phaseRef.current === "listening") setTimeout(() => listenRef.current(), 150);
    };
    try { rec.start(); } catch { setTimeout(() => listenRef.current(), 400); }
  }, [SR, setP, stopListening]);
  useEffect(() => { listenRef.current = listen; });

  // call lifecycle
  useEffect(() => {
    if (!open) return;
    activeRef.current = true;
    endAfterRef.current = false;
    mutedRef.current = false;
    histRef.current = [];
    const greet = "Hey King Sharif, I'm here. What's up?";
    const g = setTimeout(() => {                    // next tick: starts the call after the window has rendered
      addMsg({ role: "assistant", text: greet });
      speak(greet, resume);
    }, 0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      activeRef.current = false;
      clearTimeout(g);
      clearInterval(t);
      stopListening();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      setP("idle");
      setMsgs([]); setInterim(""); setMuted(false); setError(null); setSecs(0);   // fresh call next time
    };
  }, [open, addMsg, resume, setP, speak, stopListening]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, interim]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) { stopListening(); if (phaseRef.current === "listening") setP("idle"); }
    else listen();
  };
  const tapOrb = () => {
    if (phaseRef.current === "speaking") { window.speechSynthesis?.cancel(); }   // interrupt → resume() runs via onend
    else if (!SR) return;
    else if (phaseRef.current === "idle") listen();
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const label = muted ? "Muted" : phase === "listening" ? "Listening" : phase === "thinking" ? "Thinking" : phase === "speaking" ? "Stella is talking" : "Connecting";

  return (
    <FWindow open={open} onClose={onClose} title="Call with Stella" subtitle={`${mm}:${ss}`} tone="call">
      <div className="fc">
        <button className="fc-orb" data-phase={muted ? "muted" : phase} onClick={tapOrb} aria-label="Tap to interrupt">
          <span className="fc-core"><i /><i /><i /><i /><i /></span>
        </button>
        <div className="fc-state">{label}</div>
        <div className="fc-state" style={{ fontSize: 10, opacity: 0.7 }}>Voice on: {VOICE_OUT_LABEL[vout]}</div>
        {error && <div className="fc-err">{error}</div>}
        {!SR && <div className="fc-err">Voice input isn&apos;t supported in this browser — type below, she&apos;ll still talk back.</div>}

        <div className="fc-log" ref={logRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`fc-msg ${m.role}`}>{m.text}</div>
          ))}
          {interim && <div className="fc-msg user live">{interim}</div>}
        </div>

        <form
          className="fc-type"
          onSubmit={(e) => { e.preventDefault(); const t = typed; setTyped(""); void handleUser(t); }}
        >
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type to Stella…" aria-label="Type a message" />
          <button type="submit" aria-label="Send" disabled={!typed.trim()}><Send className="w-4 h-4" /></button>
        </form>

        <div className="fc-bar">
          <button className="fc-round" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} data-on={muted ? "1" : "0"}>
            {muted ? <MicOff /> : <Mic />}
          </button>
          <button className="fc-round" onClick={cycleVout} aria-label={`Voice plays on: ${VOICE_OUT_LABEL[vout]} (tap to change)`} title={VOICE_OUT_LABEL[vout]} data-on={vout === "Device" ? "0" : "1"}>
            <Volume2 />
          </button>
          <button className="fc-round fc-end" onClick={onClose} aria-label="End call"><PhoneOff /></button>
        </div>
      </div>
    </FWindow>
  );
}
