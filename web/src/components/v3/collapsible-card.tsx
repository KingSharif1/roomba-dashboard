"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Collapsible panel card. Collapsed = icon + title + one-line summary.
 * Tap the header to expand/collapse. All dashboard cards use this.
 */
export function V3Collapsible({
  icon,
  title,
  summary,
  children,
  defaultOpen = true,
}: {
  icon: ReactNode;
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`v3-panel flex flex-col overflow-hidden ${open ? "" : "v3-panel-collapsed"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2.5 text-left w-full hover:opacity-90 ${open ? "px-4 py-3" : "px-3 py-2"}`}
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,122,92,0.1)", color: "var(--v3-coral)" }}
        >
          {icon}
        </span>
        <span className="v3-panel-title flex-1">{title}</span>
        {!open && summary && (
          <span className="text-sm mono font-semibold truncate max-w-[45%]">{summary}</span>
        )}
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color: "var(--v3-muted)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>
      {open && <div className="px-3 pb-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
}
