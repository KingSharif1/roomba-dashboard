"use client";

import { useRobot } from "@/hooks/use-robot";

type ConnectionStatusProps = {
  /** Demo-only control so a drop can be shown without waiting for the timer. */
  showSimulateDrop?: boolean;
};

const PHASE_CLASS: Record<string, string> = {
  demo: "bg-warning/10 border-warning/30 text-warning",
  connecting: "bg-warning/10 border-warning/30 text-warning",
  reconnecting: "bg-warning/10 border-warning/30 text-warning",
  connected: "bg-accent/10 border-accent/30 text-accent",
  offline: "bg-danger/10 border-danger/30 text-danger",
};

/** Plain-language link state. The redesign can restyle this or read `useRobot().connection`. */
export function ConnectionStatus({ showSimulateDrop = false }: ConnectionStatusProps) {
  const { connection, simulateDrop } = useRobot();
  const tone = PHASE_CLASS[connection.phase] ?? PHASE_CLASS.demo;

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
