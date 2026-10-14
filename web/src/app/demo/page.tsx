"use client";

import { useState } from "react";
import { Map as MapIcon, ChevronDown } from "lucide-react";
import { V3TopBar } from "@/components/v3/top-bar";
import { V3SideNav, type V3View } from "@/components/v3/side-nav";
import { V3FloorMap } from "@/components/v3/floor-map";
import { V3CleanPanel } from "@/components/v3/clean-panel";
import { V3DrivePanel } from "@/components/v3/drive-panel";
import { V3BatteryPanel } from "@/components/v3/battery-panel";
import { V3TimelinePanel } from "@/components/v3/timeline-panel";
import { V3StatusBar } from "@/components/v3/status-bar";
import { V3DoorToast } from "@/components/v3/door-toast";
import { V3ConnectionBar } from "@/components/v3/connection-bar";
import { V3HistoryView } from "@/components/v3/views/history-view";
import { V3LearningView } from "@/components/v3/views/learning-view";
import { V3SettingsView } from "@/components/v3/views/settings-view";
import { V3RobotProvider } from "@/lib/v3/store";

function MapSection() {
  const [open, setOpen] = useState(true);
  return (
    <section className="relative">
      {/* collapsible map header — mobile only (desktop map is always open) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="md:hidden v3-panel w-full flex items-center gap-2.5 px-4 py-3 text-left mb-3"
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,122,92,0.1)", color: "var(--v3-coral)" }}
        >
          <MapIcon className="w-4 h-4" />
        </span>
        <span className="v3-panel-title flex-1">Floor plan</span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color: "var(--v3-muted)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>
      <div className={`${open ? "block" : "hidden"} md:block`}>
        {/* Mobile: map dominates — ~80% of the viewport. Desktop: natural height. */}
        <div className="h-[80dvh] md:h-auto">
          <V3FloorMap />
        </div>
      </div>
    </section>
  );
}

function HomeView() {
  return (
    <>
      <MapSection />

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

        <main className="flex-1 min-w-0 p-3 md:p-4 pb-28 md:pb-4 overflow-y-auto">
          {view === "home" && <HomeView />}
          {view === "history" && <V3HistoryView />}
          {view === "learning" && <V3LearningView />}
          {view === "settings" && <V3SettingsView />}
        </main>
      </div>

      <V3ConnectionBar />
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
