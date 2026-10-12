"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LiveMark, robotStatusToLike } from "@/components/brand/live-mark";
import type { RobotStatus } from "@/lib/types";
import * as robot from "@/lib/robot";
import {
  LayoutDashboard,
  Map,
  Video,
  History,
  Settings,
  Brain,
  LogOut
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Map", icon: Map },
  { href: "/camera", label: "Camera", icon: Video },
  { href: "/history", label: "History", icon: History },
  { href: "/learning", label: "Learning", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface HeaderProps {
  onLogout?: () => void;
  /** Live robot status. When omitted, the header fetches its own. */
  status?: RobotStatus | null;
}

export function Header({ onLogout, status: statusProp }: HeaderProps) {
  const pathname = usePathname();
  const [ownStatus, setOwnStatus] = useState<RobotStatus | null>(null);

  useEffect(() => {
    if (statusProp !== undefined) return; // parent drives it
    let cancelled = false;
    robot.getStatus().then((s) => {
      if (!cancelled) setOwnStatus(s);
    }).catch(() => {});
    const cleanup = robot.startLiveUpdates(
      (s) => { if (!cancelled) setOwnStatus(s); },
      () => { if (!cancelled) setOwnStatus((c) => (c ? { ...c, connected: false } : c)); }
    );
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [statusProp]);

  const status = statusProp !== undefined ? statusProp : ownStatus;

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo — living mark + Stella wordmark */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Stella home">
            <LiveMark status={status ? robotStatusToLike(status) : null} size={24} />
            <span className="font-bold tracking-[-0.03em] text-lg text-foreground group-hover:text-accent transition-colors">
              Stella
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded text-sm transition-all",
                    isActive
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "text-muted hover:text-foreground hover:bg-surface-light"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-muted hover:text-danger hover:bg-danger/10 transition-all ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
