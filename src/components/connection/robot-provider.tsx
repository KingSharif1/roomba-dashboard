"use client";

import { useEffect } from "react";
import { retainRobotSession, robotSession } from "@/lib/robot-session";

/**
 * Starts the shared demo/live session and asks the server who is allowed
 * to drive the real robot. Renders no extra DOM.
 */
export function RobotProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const release = retainRobotSession();
    let cancelled = false;

    fetch("/api/access", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) robotSession.applyAccess(body);
      })
      .catch(() => {
        if (!cancelled) robotSession.applyAccess({ role: "visitor", demo: true });
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") robotSession.resume();
    };
    window.addEventListener("online", robotSession.resume);
    window.addEventListener("offline", robotSession.noteOffline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("online", robotSession.resume);
      window.removeEventListener("offline", robotSession.noteOffline);
      document.removeEventListener("visibilitychange", onVisible);
      release();
    };
  }, []);

  return children;
}
