"use client";

import { useState } from "react";
import { V3TopBar } from "@/components/v3/top-bar";
import { V3SideNav, type V3View } from "@/components/v3/side-nav";
import { V3FloorMap } from "@/components/v3/floor-map";
import { V3CleanPanel } from "@/components/v3/clean-panel";
import { V3DrivePanel } from "@/components/v3/drive-panel";
import { V3BatteryPanel } from "@/components/v3/battery-panel";
import { V3TimelinePanel } from "@/components/v3/timeline-panel";
import { V3StatusBar } from "@/components/v3/status-bar";
import { V3DoorToast } from "@/components/v3/door-toast";
import { V3HistoryView } from "@/components/v3/views/history-view";
import { V3LearningView } from "@/components/v3/views/learning-view";
import { V3SettingsView } from "@/components/v3/views/settings-view";
import { V3RobotProvider } from "@/lib/v3/store";

function HomeView() {
  return (
    <>
      {/* Map */}
      <V3FloorMap />

      {/* Bottom panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
        <V3CleanPanel />
        <V3DrivePanel />
        <V3BatteryPanel />
        <V3TimelinePanel />
      </div>
    </>
  );
}

function StellaV3DashboardInner() {
  const [view, setView] = useState<V3View>("home");

  return (
    <div className="v3 v3-grid-bg min-h-screen flex flex-col">
      <V3TopBar onSettings={() => setView("settings")} />
      <V3DoorToast />

      <div className="flex flex-1 min-h-0">
        <V3SideNav active={view} onNavigate={setView} />

        <main className="flex-1 min-w-0 p-3 md:p-4 pb-20 md:pb-4 overflow-y-auto">
          {view === "home" && <HomeView />}
          {view === "history" && <V3HistoryView />}
          {view === "learning" && <V3LearningView />}
          {view === "settings" && <V3SettingsView />}
        </main>
      </div>

      <V3StatusBar />
    </div>
  );
}

export default function StellaV3Dashboard() {
  return (
    <V3RobotProvider>
      <StellaV3DashboardInner />
    </V3RobotProvider>
  );
}
