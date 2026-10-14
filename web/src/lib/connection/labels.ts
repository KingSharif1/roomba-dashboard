import type { ConnectionPhase } from "../types";

/** The exact strings the redesign should render. */
export function describeConnection(phase: ConnectionPhase, robotReady: boolean): string {
  switch (phase) {
    case "demo":
      return "Demo mode";
    case "connecting":
      return "Connecting…";
    case "reconnecting":
      return "Reconnecting…";
    case "offline":
      return "Robot offline";
    case "connected":
      return robotReady ? "Connected" : "Robot offline";
    default: {
      const exhaustive: never = phase;
      return exhaustive;
    }
  }
}
