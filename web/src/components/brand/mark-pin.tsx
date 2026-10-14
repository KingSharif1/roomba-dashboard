"use client";

import { useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { isMarkPreview } from "@/lib/demo/showcase";
import { setDemoMarkPin } from "@/lib/mockRobot";
import { robotSession } from "@/lib/robot-session";

/** Demo-only `?mark=charging` (and the other logo states) so a page can hold one mark. */
export function DemoMarkPin() {
  const mark = useSearchParams().get("mark");

  useLayoutEffect(() => {
    setDemoMarkPin(isMarkPreview(mark) ? mark : null);
    robotSession.noteDemoMutation();
    return () => {
      setDemoMarkPin(null);
      robotSession.noteDemoMutation();
    };
  }, [mark]);

  return null;
}
