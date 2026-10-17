"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * FWindow — one pop-up "window" for any dashboard part (remote, voice call, logs, LiDAR…).
 * Phone: full screen. Desktop: centered panel. Closes with ✕, Esc, tapping the dim area, or the
 * phone's Back button (so Back never kicks you out of the dashboard). Must render inside `.f`.
 */
export function FWindow({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  tone = "sheet",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: "sheet" | "call";
}) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    let closedByBack = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    const onPop = () => {
      closedByBack = true;
      closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    window.history.pushState({ fwindow: title }, "");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      // closed with ✕/Esc: drop the history entry we added so Back still works normally
      if (!closedByBack && window.history.state?.fwindow === title) window.history.back();
    };
  }, [open, title]);

  if (!open) return null;
  return (
    <div
      className="fw"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`fw-panel fw-${tone}`}>
        <header className="fw-head">
          <div>
            <div className="fw-title">{title}</div>
            {subtitle && <div className="fw-sub">{subtitle}</div>}
          </div>
          <div className="fw-actions">
            {actions}
            <button className="fw-x" onClick={onClose} aria-label={`Close ${title}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="fw-body">{children}</div>
      </div>
    </div>
  );
}
