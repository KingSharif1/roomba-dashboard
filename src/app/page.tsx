"use client";

import { V3TopBar } from "@/components/v3/top-bar";
import { V3SideNav } from "@/components/v3/side-nav";
import { V3FloorMap } from "@/components/v3/floor-map";
import { V3CleanPanel } from "@/components/v3/clean-panel";
import { V3DrivePanel } from "@/components/v3/drive-panel";
import { V3BatteryPanel } from "@/components/v3/battery-panel";
import { V3TimelinePanel } from "@/components/v3/timeline-panel";
import { V3StatusBar } from "@/components/v3/status-bar";
import { V3DoorToast } from "@/components/v3/door-toast";
import { demoRobot, demoDoorBlockedEvent } from "@/lib/v3/demo";

export default function StellaV3Dashboard() {
  return (
    <div className="v3 v3-grid-bg min-h-screen flex flex-col">
      <V3TopBar robot={demoRobot} />
      <V3DoorToast event={demoDoorBlockedEvent} />

      <div className="flex flex-1 min-h-0">
        <V3SideNav active="home" />

        <main className="flex-1 min-w-0 p-3 md:p-4 pb-20 md:pb-4 overflow-y-auto">
          {/* Map */}
          <V3FloorMap robot={demoRobot} />

          {/* Bottom panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
            <V3CleanPanel />
            <V3DrivePanel />
            <V3BatteryPanel battery={demoRobot.battery} minutesLeft={demoRobot.batteryMinutesLeft} />
            <V3TimelinePanel />
          </div>
        </main>
      </div>

      <V3StatusBar />
    </div>
  );
}
