"use client";

import { useV3Robot } from "@/lib/v3/store";

type CheckState = "checking" | "ok" | "off" | "demo";

function dotColor(s: CheckState): string {
  switch (s) {
    case "ok":
      return "var(--v3-mint)";
    case "checking":
      return "var(--v3-muted)";
    case "demo":
      return "var(--v3-amber)";
    default:
      return "#5a5d8f";
  }
}

function label(s: CheckState): string {
  switch (s) {
    case "ok":
      return "on";
    case "checking":
      return "…";
    case "demo":
      return "demo";
    default:
      return "off";
  }
}

/**
 * Slim connection strip above the mobile bottom nav.
 * Tailscale / Pi / link checks. The demo loads immediately underneath —
 * when the Pi connects, the store hot-swaps to live values with no refresh.
 */
export function V3ConnectionBar() {
  const { state } = useV3Robot();
  const { checks, connection } = state;

  const items: { name: string; state: CheckState }[] = [
    { name: "Tailscale", state: checks.tailscale },
    { name: "Pi", state: checks.pi },
    { name: "Link", state: checks.link },
  ];

  return (
    <div
      className="md:hidden fixed bottom-[57px] left-0 right-0 z-40 flex items-center justify-center gap-5 px-4 py-1.5 border-t"
      style={{
        borderColor: "var(--v3-border-soft)",
        background: "rgba(20,21,46,0.96)",
        backdropFilter: "blur(8px)",
      }}
      role="status"
      aria-label={connection === "live" ? "Connected to Stella" : "Demo mode"}
    >
      {items.map((it) => (
        <span key={it.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--v3-muted)" }}>
          <span
            className={`w-2 h-2 rounded-full ${it.state === "checking" ? "v3-pulse" : ""}`}
            style={{
              background: dotColor(it.state),
              boxShadow: it.state === "ok" ? "0 0 6px rgba(94,234,212,0.8)" : "none",
            }}
          />
          {it.name}
          <span className="mono" style={{ color: dotColor(it.state) }}>
            {label(it.state)}
          </span>
        </span>
      ))}
    </div>
  );
}
