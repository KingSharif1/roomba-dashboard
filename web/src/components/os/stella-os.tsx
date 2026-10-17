"use client";

import { useMemo } from "react";
import { useV3Robot } from "@/lib/v3/store";
import { StellaOSImpl } from "./stella-os-impl";

/** Connects the Stella OS UI to the live robot store (drive, clean, dock, wake, tools, TV, voice). */
export function StellaOS() {
  const api = useV3Robot();
  const { state, robotOnline, cleanMode, wakeRobot, setCleaningMotors, runCommand, speak } = api;
  const live = useMemo(
    () => ({
      connection: state.connection,
      robotUrl: state.robotUrl,
      mode: state.mode,
      battery: state.battery,
      robotOnline,
      cleanMode,
      wakeRobot,
      setCleaningMotors,
      runCommand,
      speak,
    }),
    [state.connection, state.robotUrl, state.mode, state.battery, robotOnline, cleanMode, wakeRobot, setCleaningMotors, runCommand, speak]
  );
  return <StellaOSImpl live={live} />;
}
