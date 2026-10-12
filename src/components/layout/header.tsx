"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StellaLockup } from "@/components/brand/stella-lockup";
import { cn } from "@/lib/utils";
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
}

export function Header({ onLogout }: HeaderProps) {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <StellaLockup />
          
          {/* Navigation */}
          <nav className="flex items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 md:px-3 rounded text-sm transition-all",
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
                className="flex items-center gap-2 px-2 py-2 md:px-3 rounded text-sm text-muted hover:text-danger hover:bg-danger/10 transition-all"
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
