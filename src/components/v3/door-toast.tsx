"use client";

import { X, DoorClosed } from "lucide-react";
import { useV3Robot } from "@/lib/v3/store";

// Door-blocked toast: shows the server-built message verbatim, deduped by
// event id, stays until dismissed. Only renders when an event fires at
// runtime (e.g. tapping Kitchen while its door is closed) — never on load.
export function V3DoorToast() {
  const { state, dismissDoorEvent } = useV3Robot();
  const event = state.doorEvent;

  if (!event) return null;

  return (
    <div
      key={event.id}
      className="v3-toast fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-3 rounded-xl border shadow-2xl max-w-md w-[calc(100%-2rem)]"
      style={{
        background: "rgba(30,31,69,0.97)",
        borderColor: "var(--v3-amber)",
      }}
      role="alert"
    >
      <DoorClosed className="w-5 h-5 shrink-0" style={{ color: "var(--v3-amber)" }} />
      <p className="flex-1 text-sm">{event.message}</p>
      <button
        onClick={dismissDoorEvent}
        aria-label="Dismiss"
        className="p-1.5 rounded-lg hover:opacity-70"
      >
        <X className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
      </button>
    </div>
  );
}
