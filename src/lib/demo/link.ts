import type { ConnectionPhase } from "../types";

export const DEMO_DROP_FOR_MS = 2_200;
export const DEMO_DROP_EVERY_MS = 45_000;
export const DEMO_FIRST_DROP_DELAY_MS = 12_000;
/** A simulated drop shows "Reconnecting…" first, then "Robot offline". */
export const DEMO_OFFLINE_AFTER_MS = 1_000;

export type DemoLinkState = {
  dropStarted: number | null;
  dropUntil: number;
  nextDropAt: number;
};

export type DemoLinkPhase = Extract<ConnectionPhase, "demo" | "reconnecting" | "offline">;

export function initialDemoLink(now: number): DemoLinkState {
  return {
    dropStarted: null,
    dropUntil: 0,
    nextDropAt: now + DEMO_FIRST_DROP_DELAY_MS,
  };
}

export function demoLinkPhase(link: DemoLinkState, now: number): DemoLinkPhase {
  if (link.dropStarted == null || now >= link.dropUntil) return "demo";
  if (now - link.dropStarted >= DEMO_OFFLINE_AFTER_MS) return "offline";
  return "reconnecting";
}

export function stepDemoLink(link: DemoLinkState, now: number): DemoLinkState {
  if (now < link.nextDropAt || now < link.dropUntil) return link;
  return {
    dropStarted: now,
    dropUntil: now + DEMO_DROP_FOR_MS,
    nextDropAt: now + DEMO_DROP_FOR_MS + DEMO_DROP_EVERY_MS,
  };
}

export function forceDemoDrop(link: DemoLinkState, now: number, durationMs = DEMO_DROP_FOR_MS): DemoLinkState {
  return {
    dropStarted: now,
    dropUntil: now + durationMs,
    nextDropAt: Math.max(link.nextDropAt, now + durationMs + DEMO_DROP_EVERY_MS),
  };
}
