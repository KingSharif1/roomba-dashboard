"use client";

import { useState } from "react";
import { X, DoorClosed } from "lucide-react";
import type { DoorBlockedEvent } from "@/lib/v3/types";

// Door-blocked toast: shows the server-built message verbatim, deduped by
// event id, stays until dismissed.
export function V3DoorToast({ event }: { event: DoorBlockedEvent | null }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!event || dismissed.has(event.id)) return null;

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
        onClick={() => setDismissed((s) => new Set(s).add(event.id))}
        aria-label="Dismiss"
        className="p-1.5 rounded-lg hover:opacity-70"
      >
        <X className="w-4 h-4" style={{ color: "var(--v3-muted)" }} />
      </button>
    </div>
  );
}
