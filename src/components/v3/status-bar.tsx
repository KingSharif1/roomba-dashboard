"use client";

export function V3StatusBar() {
  return (
    <footer
      className="flex items-center justify-between px-4 md:px-6 h-10 text-[11px] shrink-0 border-t"
      style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)", color: "var(--v3-muted)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-sm border border-dashed flex items-center justify-center"
          style={{ borderColor: "var(--v3-border)" }}
        />
        <span className="mono">
          Stella · v3 <span className="mx-1" style={{ color: "var(--v3-mint)" }}>●</span> Pi online · lidar 10 Hz · cam 15 fps
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="mono hidden sm:inline">last sync 2 s</span>
        <span className="mono hidden lg:inline">Built by King and the gng (Claude, Grok, Muse)</span>
        <svg className="v3-sig" width="72" height="26" viewBox="0 0 120 40" role="img" aria-label="Stella — signed">
          <text x="6" y="30" fontSize="30">Stella</text>
        </svg>
      </div>
    </footer>
  );
}
