"use client";

import { Wifi, X } from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";

// Offered when a background re-probe finds the Pi reachable while in demo
// mode. Never auto-switches — the user taps "Go live" to connect.
export function V3GoLiveToast() {
  const { state, acceptLive, dismissLiveToast } = useV3Robot();

  if (!state.liveToast) return null;

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-3 rounded-xl border shadow-2xl max-w-md w-[calc(100%-2rem)]"
      style={{
        background: "rgba(30,31,69,0.97)",
        borderColor: "var(--v3-mint)",
      }}
      role="alert"
    >
      <Wifi className="w-5 h-5 shrink-0" style={{ color: "var(--v3-mint)" }} />
      <p className="flex-1 text-sm">Stella is reachable — switch to live data?</p>
      <button
        onClick={acceptLive}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg v3-btn-coral shrink-0"
      >
        Go live
      </button>
      <button
        onClick={dismissLiveToast}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg v3-btn-ghost shrink-0"
      >
        Stay in demo
      </button>
      <button
        onClick={dismissLiveToast}
        aria-label="Dismiss"
        className="p-1.5 rounded-lg hover:opacity-70"
      >
        <X className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
      </button>
    </div>
  );
}
