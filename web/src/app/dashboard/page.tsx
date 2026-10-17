"use client";

import dynamic from "next/dynamic";
import { V3RobotProvider } from "@/lib/v3/store";

// The OS renders clocks, LiDAR scans and live timers, so it is client-only (no SSR → no hydration mismatch).
const StellaOS = dynamic(() => import("@/components/os/stella-os").then((m) => m.StellaOS), {
  ssr: false,
  loading: () => <div style={{ minHeight: "100vh", background: "#0b0b0c" }} />,
});

export default function DemoPage() {
  return (
    <V3RobotProvider>
      <StellaOS />
    </V3RobotProvider>
  );
}
