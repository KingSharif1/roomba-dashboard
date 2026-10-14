"use client";

import { useV3Robot } from "@/lib/v3/store";

/* Animated Roomba mascot — reflects Stella's current state */

export function StellaMascot({ compact = false }: { compact?: boolean }) {
  const { state } = useV3Robot();
  const { connection, mode, battery } = state;
  const isLive = connection === "live";

  const displayMode = !isLive ? "offline"
    : mode === "cleaning" ? "active"
    : mode === "docked" ? "charging"
    : "standby";

  return (
    <div className={`flex flex-col items-center ${compact ? "py-2" : "py-4"}`}>

      <div className={`stella-mascot stella-mascot-${displayMode}`}>
        <svg viewBox="0 0 120 120" className={compact ? "w-16 h-16" : "w-24 h-24"}>
          {/* Shadow */}
          <ellipse cx="60" cy="105" rx="35" ry="8" fill="rgba(0,0,0,0.3)" className="mascot-shadow" />

          {/* Body */}
          <circle cx="60" cy="60" r="42" fill="var(--eng-panel-2)" stroke="var(--eng-cyan)" strokeWidth="2" className="mascot-body" />

          {/* Top button */}
          <circle cx="60" cy="60" r="12" fill="var(--eng-panel)" stroke="var(--eng-border-hi)" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="5" fill="var(--eng-cyan)" className="mascot-btn" />

          {/* Eyes */}
          <g className="mascot-eyes">
            {displayMode === "offline" ? (
              <>
                <line x1="42" y1="38" x2="50" y2="46" stroke="var(--eng-muted)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="38" x2="42" y2="46" stroke="var(--eng-muted)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="70" y1="38" x2="78" y2="46" stroke="var(--eng-muted)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="78" y1="38" x2="70" y2="46" stroke="var(--eng-muted)" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : displayMode === "charging" ? (
              <>
                <path d="M 42 42 Q 46 38 50 42" stroke="var(--eng-amber)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 70 42 Q 74 38 78 42" stroke="var(--eng-amber)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="46" cy="42" r="4" fill="var(--eng-cyan)" className="mascot-eye" />
                <circle cx="74" cy="42" r="4" fill="var(--eng-cyan)" className="mascot-eye" />
                <circle cx="47.5" cy="40.5" r="1.5" fill="white" opacity="0.8" />
                <circle cx="75.5" cy="40.5" r="1.5" fill="white" opacity="0.8" />
              </>
            )}
          </g>

          {/* Mouth */}
          {displayMode === "active" && (
            <path d="M 50 75 Q 60 82 70 75" stroke="var(--eng-green)" strokeWidth="2.5" fill="none" strokeLinecap="round" className="mascot-mouth" />
          )}
          {displayMode === "charging" && (
            <g className="mascot-zzz">
              <text x="88" y="30" fontSize="12" fill="var(--eng-amber)" className="mascot-z">z</text>
              <text x="96" y="22" fontSize="10" fill="var(--eng-amber)" opacity="0.7" className="mascot-z" style={{ animationDelay: "0.5s" }}>z</text>
              <text x="102" y="15" fontSize="8" fill="var(--eng-amber)" opacity="0.4" className="mascot-z" style={{ animationDelay: "1s" }}>z</text>
            </g>
          )}

          {/* Charging bolt */}
          {displayMode === "charging" && (
            <text x="52" y="70" fontSize="16" className="mascot-bolt">⚡</text>
          )}

          {/* Motion lines when active */}
          {displayMode === "active" && (
            <g className="mascot-motion" stroke="var(--eng-green)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
              <line x1="10" y1="50" x2="20" y2="50" />
              <line x1="10" y1="65" x2="22" y2="65" />
              <line x1="10" y1="80" x2="20" y2="80" />
            </g>
          )}
        </svg>
      </div>
      <div className="mt-2 text-[10px] tracking-widest font-bold" style={{ color: "var(--eng-muted)" }}>
        {displayMode === "offline" && "STELLA OFFLINE"}
        {displayMode === "active" && "STELLA ACTIVE"}
        {displayMode === "charging" && `CHARGING · ${Math.round(battery)}%`}
        {displayMode === "standby" && "STELLA STANDBY"}
      </div>
    </div>
  );
}
