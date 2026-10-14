"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square } from "lucide-react";
import type { RobotStatus } from "@/lib/types";
import * as robot from "@/lib/robot";
import { useRobotMode } from "@/hooks/use-robot-mode";
import { emitToastOps } from "@/lib/toast-store";

type Dir = "up" | "down" | "left" | "right";

const TURN_RAD_S = 1.0;       // spin speed
const SEND_EVERY_MS = 100;    // robot auto-stops ~0.2 s after the last command

const KEYS: Record<string, Dir> = {
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
};

interface DrivePadProps {
  status: RobotStatus;
}

export function DrivePad({ status }: DrivePadProps) {
  const [speed, setSpeed] = useState(0.15); // m/s
  const [active, setActive] = useState<Dir | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const demo = useRobotMode();
  // Quietly disabled in demo mode — no scary copy, just a toast on keypress.
  const enabled = status.connected && !demo;

  const velocity = useCallback(
    (d: Dir): [number, number] => {
      switch (d) {
        case "up": return [speed, 0];
        case "down": return [-speed, 0];
        case "left": return [0, TURN_RAD_S];
        case "right": return [0, -TURN_RAD_S];
      }
    },
    [speed]
  );

  const clearHold = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setActive(null);
  }, []);

  const halt = useCallback(() => {
    clearHold();
    robot.drive(0, 0).catch(() => {});
  }, [clearHold]);

  const emergency = useCallback(() => {
    clearHold();
    robot.emergencyStop().catch(() => {});
  }, [clearHold]);

  const go = useCallback(
    (d: Dir) => {
      if (!enabled) return;
      if (timer.current) clearInterval(timer.current);
      setActive(d);
      const [lin, ang] = velocity(d);
      const send = () => robot.drive(lin, ang).catch(() => {});
      send();
      timer.current = setInterval(send, SEND_EVERY_MS);
    },
    [enabled, velocity]
  );

  // Keyboard: arrows / WASD to drive while held, space = stop.
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") {
        e.preventDefault();
        emergency();
        return;
      }
      const d = KEYS[e.key];
      if (d && !e.repeat) {
        e.preventDefault();
        if (demo) {
          emitToastOps([{ type: "push", key: "drive:demo", tone: "info", message: "Demo mode — connect the real robot to drive" }]);
          return;
        }
        go(d);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (KEYS[e.key]) halt();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", emergency);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", emergency);
    };
  }, [demo, emergency, go, halt]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: stop an active drive when the robot disconnects
    if (!enabled && active !== null) halt();
  }, [active, enabled, halt]);

  // Always stop when leaving the page.
  useEffect(() => emergency, [emergency]);

  const holdProps = (d: Dir) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.preventDefault();
      go(d);
    },
    onPointerUp: halt,
    onPointerLeave: () => active === d && halt(),
    onPointerCancel: halt,
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    disabled: !enabled,
    className: `h-14 touch-none select-none ${active === d ? "ring-2 ring-accent" : ""}`,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
          <div />
          <Button variant="secondary" aria-label="Forward" {...holdProps("up")}>
            <ArrowUp className="w-6 h-6" />
          </Button>
          <div />
          <Button variant="secondary" aria-label="Turn left" {...holdProps("left")}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="danger"
            aria-label="Stop"
            className="h-14"
            onClick={emergency}
          >
            <Square className="w-6 h-6" />
          </Button>
          <Button variant="secondary" aria-label="Turn right" {...holdProps("right")}>
            <ArrowRight className="w-6 h-6" />
          </Button>
          <div />
          <Button variant="secondary" aria-label="Back" {...holdProps("down")}>
            <ArrowDown className="w-6 h-6" />
          </Button>
          <div />
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>SPEED</span>
            <span className="mono">{speed.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.3}
            step={0.05}
            value={speed}
            disabled={!enabled}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-accent,currentColor)]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
