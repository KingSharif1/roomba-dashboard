"use client";

import { Suspense, useEffect } from "react";
import { DemoMarkPin } from "@/components/brand/mark-pin";
import { ToastViewport } from "@/components/connection/toast-viewport";
import { retainRobotSession, robotSession } from "@/lib/robot-session";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Starts the shared demo/live session and asks the server who is allowed
 * to drive the real robot.
 */
export function RobotProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const release = retainRobotSession();
    let cancelled = false;

    const loadAccess = () => {
      fetch("/api/access", { cache: "no-store" })
        .then((res) => res.json())
        .then((body) => {
          if (!cancelled) robotSession.applyAccess(body);
        })
        .catch(() => {
          if (!cancelled) robotSession.applyAccess({ role: "visitor", demo: true });
        });
    };
    loadAccess();

    const onVisible = () => {
      if (document.visibilityState === "visible") robotSession.resume();
    };
    window.addEventListener("online", robotSession.resume);
    window.addEventListener("offline", robotSession.noteOffline);
    document.addEventListener("visibilitychange", onVisible);

    let unsubscribeAuth = () => {};
    if (isSupabaseConfigured()) {
      const { data } = createClient().auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_OUT") return;
        loadAccess();
      });
      unsubscribeAuth = () => data.subscription.unsubscribe();
    }

    return () => {
      cancelled = true;
      unsubscribeAuth();
      window.removeEventListener("online", robotSession.resume);
      window.removeEventListener("offline", robotSession.noteOffline);
      document.removeEventListener("visibilitychange", onVisible);
      release();
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <DemoMarkPin />
      </Suspense>
      {children}
      <ToastViewport />
    </>
  );
}
