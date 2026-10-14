"use client";

import { useState, useRef, useEffect } from "react";
import { useV3Robot } from "@/lib/v3/store";

/* Stella Assistant — text-based command interface.
   Same command parser as voice, but typed. */

interface Msg {
  role: "user" | "stella";
  text: string;
}

export function EngAssistant() {
  const { state } = useV3Robot();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "stella", text: "STELLA ONLINE. Type a command or 'help'." },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const execute = async (cmd: string) => {
    const lower = cmd.toLowerCase().trim();
    setMsgs((m) => [...m, { role: "user", text: cmd }]);

    const reply = (text: string) =>
      setMsgs((m) => [...m, { role: "stella", text }]);

    if (lower === "help") {
      reply(
        "COMMANDS:\n• forward / back / left / right / stop\n• dock\n• twerk\n• open [spotify|youtube|netflix]\n• play [song name]\n• status\n• Chain with 'and': open spotify and play youngboy"
      );
      return;
    }

    if (lower === "status") {
      const { battery, mode, connection } = state;
      reply(
        `BATT: ${Math.round(battery)}% | MODE: ${mode.toUpperCase()} | LINK: ${connection.toUpperCase()}`
      );
      return;
    }

    // Multi-command split
    const parts = lower.split(/\s+\b(?:and|then)\b\s+/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      await runSingle(part, reply);
      if (i < parts.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }
  };

  const runSingle = async (
    text: string,
    reply: (t: string) => void
  ) => {
    // This duplicates the voice command logic — in production,
    // refactor to share a single command parser.
    if (/\btwerk\b/.test(text)) {
      reply("Executing twerk sequence...");
      // Trigger via custom event that the store listens to
      window.dispatchEvent(new CustomEvent("stella-cmd", { detail: { action: "twerk" } }));
      return;
    }

    const playMatch = text.match(/\bplay\s+(.+)/);
    if (playMatch) {
      const query = playMatch[1].trim();
      reply(`Searching Spotify for "${query}"...`);
      try {
        const res = await fetch("/api/spotify/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const d = await res.json();
        reply(d.success ? `Now playing: ${d.track} — ${d.artist}` : `Error: ${d.error}`);
      } catch {
        reply("Spotify not connected. Visit /api/spotify/login");
      }
      return;
    }

    const openMatch = text.match(/\bopen\s+(spotify|youtube|netflix|hulu|disney)/);
    if (openMatch) {
      const app = openMatch[1];
      reply(`Opening ${app} on TV...`);
      window.dispatchEvent(new CustomEvent("stella-cmd", { detail: { action: "roku", app } }));
      return;
    }

    if (/\bstop\b/.test(text)) {
      window.dispatchEvent(new CustomEvent("stella-cmd", { detail: { action: "stop" } }));
      reply("Stopping.");
      return;
    }

    if (/\bdock\b/.test(text)) {
      window.dispatchEvent(new CustomEvent("stella-cmd", { detail: { action: "dock" } }));
      reply("Docking.");
      return;
    }

    const dirMatch = text.match(/\b(forward|back|left|right)\b/);
    if (dirMatch) {
      const dirMap: Record<string, string> = {
        forward: "up", back: "down", left: "left", right: "right",
      };
      window.dispatchEvent(new CustomEvent("stella-cmd", { detail: { action: "drive", dir: dirMap[dirMatch[1]] } }));
      reply(`Moving ${dirMatch[1]}.`);
      return;
    }

    reply(`Unknown command: "${text}". Type 'help'.`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    execute(input);
    setInput("");
  };

  return (
    <div className="eng-panel">
      <div className="eng-panel-header">
        <span className="eng-panel-title">Stella Assistant</span>
        <span className="eng-led eng-led-green" />
      </div>
      <div
        className="p-3 space-y-2 overflow-y-auto"
        style={{ maxHeight: "280px", minHeight: "180px" }}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "text-right" : ""
            }`}
          >
            <span
              className="inline-block px-2 py-1"
              style={{
                background: m.role === "user" ? "var(--eng-panel-2)" : "transparent",
                border: m.role === "user" ? "1px solid var(--eng-border)" : "none",
                color: m.role === "user" ? "var(--eng-text)" : "var(--eng-cyan)",
                maxWidth: "90%",
                textAlign: "left",
              }}
            >
              {m.role === "stella" && <span style={{ color: "var(--eng-muted)" }}>▸ </span>}
              {m.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="p-3 flex gap-2" style={{ borderTop: "1px solid var(--eng-border)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type command..."
          className="flex-1 px-3 py-2 text-sm"
          style={{
            background: "var(--eng-bg-deep)",
            border: "1px solid var(--eng-border)",
            color: "var(--eng-text)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button type="submit" className="eng-btn eng-btn-primary px-4">
          SEND
        </button>
      </form>
    </div>
  );
}
