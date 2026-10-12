"use client";

import { Home, Clock, Lightbulb, Settings } from "lucide-react";

const items = [
  { id: "home", label: "Home", icon: Home, badge: 0 },
  { id: "history", label: "History", icon: Clock, badge: 0 },
  { id: "learning", label: "Learning", icon: Lightbulb, badge: 2 },
  { id: "settings", label: "Settings", icon: Settings, badge: 0 },
];

export function V3SideNav({ active = "home" }: { active?: string }) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col items-center gap-1 py-4 w-16 shrink-0 border-r"
        style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              className="relative w-12 h-14 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px]"
              style={{
                color: isActive ? "var(--v3-coral)" : "var(--v3-muted)",
                background: isActive ? "rgba(255,122,92,0.08)" : "transparent",
                border: isActive ? "1px solid var(--v3-border)" : "1px solid transparent",
              }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {item.badge > 0 && (
                <span
                  className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                  style={{ background: "var(--v3-coral)", color: "#1a0f0a" }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 border-t z-40"
        style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1 text-[10px]"
              style={{ color: isActive ? "var(--v3-coral)" : "var(--v3-muted)" }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {item.badge > 0 && (
                <span
                  className="absolute top-0 right-2 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                  style={{ background: "var(--v3-coral)", color: "#1a0f0a" }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
