"use client";

import { useRobot } from "@/hooks/use-robot";

type ConnectionStatusProps = {
  /** Demo-only control so a drop can be shown without waiting for the timer. */
  showSimulateDrop?: boolean;
};

const PHASE_CLASS: Record<string, string> = {
  demo: "bg-surface-light border-border text-muted",
  connecting: "bg-warning/10 border-warning/30 text-warning",
  reconnecting: "bg-warning/10 border-warning/30 text-warning",
  connected: "bg-accent/10 border-accent/30 text-accent",
  offline: "bg-surface-light border-border text-muted",
};

/** Plain-language link state. The redesign can restyle this or read `useRobot().connection`. */
export function ConnectionStatus({ showSimulateDrop = false }: ConnectionStatusProps) {
  const { connection, simulateDrop } = useRobot();
  const phase = connection.phase === "connected" && !connection.robotReady ? "offline" : connection.phase;
  const tone = PHASE_CLASS[phase] ?? PHASE_CLASS.demo;

  return (
    <div
      className={`mb-4 px-3 py-2 border rounded text-xs flex items-center justify-between gap-3 ${tone}`}
      role="status"
      aria-live="polite"
      data-connection-phase={connection.phase}
    >
      <span>{connection.label}</span>
      {showSimulateDrop && connection.demo && (
        <button
          type="button"
          className="underline underline-offset-2 hover:opacity-80"
          onClick={() => simulateDrop()}
        >
          Simulate drop
        </button>
      )}
    </div>
  );
}
