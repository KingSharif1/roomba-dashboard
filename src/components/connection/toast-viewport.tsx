"use client";

import { useEffect, useRef } from "react";
import { useSyncExternalStore } from "react";
import {
  dismissToastById,
  expireToastStore,
  getServerToasts,
  getToasts,
  subscribeToasts,
} from "@/lib/toast-store";

/**
 * One toast stack for the whole dashboard.
 * Successes leave on their own. Errors stay until the cause clears or the visitor dismisses them.
 */
export function ToastViewport() {
  const state = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  const armed = useRef(new Map<number, number>());

  useEffect(() => {
    for (const item of state.items) {
      if (item.expiresAt == null || armed.current.has(item.id)) continue;
      const delay = Math.max(0, item.expiresAt - Date.now());
      const timer = window.setTimeout(() => {
        armed.current.delete(item.id);
        expireToastStore();
      }, delay);
      armed.current.set(item.id, timer);
    }
    for (const [id, timer] of armed.current) {
      if (!state.items.some((item) => item.id === id)) {
        window.clearTimeout(timer);
        armed.current.delete(id);
      }
    }
  }, [state]);

  useEffect(() => {
    const timers = armed.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
    };
  }, []);

  if (state.items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-16 left-0 right-0 z-[70] flex flex-col items-center gap-2 px-4">
      {state.items.map((item) => {
        const error = item.tone === "error";
        return (
          <div
            key={item.id}
            role={error ? "alert" : "status"}
            data-toast-key={item.key}
            data-toast-tone={item.tone}
            className={`pointer-events-auto flex items-center gap-3 max-w-full px-3 py-2 border rounded text-sm shadow-lg ${
              error
                ? "bg-danger/15 border-danger/50 text-danger"
                : "bg-accent/15 border-accent/50 text-accent"
            }`}
          >
            <span>{item.message}</span>
            {error && (
              <button
                type="button"
                aria-label="Dismiss"
                className="text-current/80 hover:text-current"
                onClick={() => dismissToastById(item.id)}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
