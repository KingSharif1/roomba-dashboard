import {
  applyToastOps,
  dismissToast,
  emptyToasts,
  expireToasts,
  type ToastOp,
  type ToastState,
} from "./toasts";

const SERVER_TOASTS: ToastState = emptyToasts();

let state: ToastState = SERVER_TOASTS;
let voluntaryUntil = 0;
const listeners = new Set<() => void>();

function publish(next: ToastState): void {
  if (next === state) return;
  state = next;
  for (const listener of listeners) listener();
}

export function getToasts(): ToastState {
  return state;
}

export function getServerToasts(): ToastState {
  return SERVER_TOASTS;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToastOps(ops: readonly ToastOp[], now = Date.now()): void {
  if (ops.length === 0) return;
  publish(applyToastOps(state, ops, now));
}

export function dismissToastById(id: number): void {
  publish(dismissToast(state, id));
}

export function expireToastStore(now = Date.now()): void {
  publish(expireToasts(state, now));
}

/** Logout the user asked for. Suppresses the session-expired toast for a few seconds. */
export function noteVoluntarySignOut(now = Date.now(), windowMs = 4_000): void {
  voluntaryUntil = now + windowMs;
}

export function voluntarySignOutActive(now = Date.now()): boolean {
  return now < voluntaryUntil;
}

export function resetToastStore(): void {
  state = emptyToasts();
  voluntaryUntil = 0;
  for (const listener of listeners) listener();
}
