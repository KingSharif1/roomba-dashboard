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
import { V3RobotProvider, useV3Robot, modeLabel } from "@/lib/v3/store";

function MapSection() {
  // Start collapsed on mobile (map is 80% of viewport when open);
  // desktop map is always open via md:block.
  const [open, setOpen] = useState(false);
  const { state } = useV3Robot();
  const { location, mode } = state;
  return (
    <section className="relative">
      {/* collapsible map header — mobile only (desktop map is always open) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="v3-floor-map"
        className="md:hidden v3-panel w-full flex items-center gap-2.5 px-4 py-3.5 text-left mb-3 active:scale-[0.99] transition-transform"
      >
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,122,92,0.12)", color: "var(--v3-coral)" }}
        >
          <MapIcon className="w-4.5 h-4.5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="v3-panel-title block">Floor plan</span>
          {!open && (
            <span className="text-xs truncate block mt-0.5" style={{ color: "var(--v3-muted)" }}>
              {location.label} · {modeLabel(mode)}
            </span>
          )}
        </span>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: open ? "rgba(255,122,92,0.12)" : "rgba(94,234,212,0.12)",
            color: open ? "var(--v3-coral)" : "var(--v3-mint)",
          }}
        >
          {open ? "Hide" : "Show"}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{
            color: "var(--v3-muted)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>
      <div id="v3-floor-map" className={`${open ? "block" : "hidden"} md:block`}>
        {/* Mobile: map takes ~65% of viewport when open. Desktop: natural height. */}
        <div className="h-[65dvh] md:h-auto">
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
