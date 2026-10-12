"use client";

import Link from "next/link";
import {
  Map,
  Sparkles,
  Gamepad2,
  BatteryCharging,
  Brain,
  DoorClosed,
  ArrowRight,
  Box,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Live floor-plan mapping",
    detail: "Eight room zones, cleaning paths, door states and Stella's position — rendered live in SVG.",
  },
  {
    icon: Sparkles,
    title: "Room-by-room cleaning",
    detail: "Tap rooms to target them. Stella reroutes, updates her status, and gets to work.",
  },
  {
    icon: Gamepad2,
    title: "Manual drive",
    detail: "D-pad and speed control drive her around the map in real time.",
  },
  {
    icon: BatteryCharging,
    title: "Battery intelligence",
    detail: "Charge state, voltage, health, cycles and time-to-full — not just a percentage.",
  },
  {
    icon: Brain,
    title: "She learns",
    detail: "Run history feeds a learning layer that spots patterns — faster mornings, skipped kitchens.",
  },
  {
    icon: DoorClosed,
    title: "Door awareness",
    detail: "Closed doors block runs gracefully, with a toast that says exactly what happened.",
  },
];

const parts = [
  ["RPLIDAR C1", "maps the room"],
  ["Raspberry Pi 4", "the brain"],
  ["Pi Camera", "sees ahead"],
  ["Arduino Mega", "talks to the Roomba"],
  ["16×2 LCD", "status display"],
  ["DROK buck", "5.15 V for the Pi"],
  ["XH-M609", "low-battery cutoff"],
  ["Clear deck", "holds it all"],
  ["Roomba 694", "drives and docks"],
];

export default function LandingPage() {
  return (
    <div className="v3 v3-grid-bg min-h-screen flex flex-col">
      {/* Nav */}
      <header
        className="flex items-center justify-between px-4 md:px-8 h-16 border-b shrink-0"
        style={{ borderColor: "var(--v3-border-soft)", background: "var(--v3-bg)" }}
      >
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/brand/stella-paper-mark.svg"
            alt="Stella"
            width={36}
            height={36}
            className="w-9 h-9 rounded-[9px] border shrink-0"
            style={{ borderColor: "var(--v3-coral)" }}
          />
          <span className="text-lg font-bold tracking-[0.25em]">STELLA</span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4 text-sm">
          <Link href="/demo" className="px-3 py-1.5 hover:opacity-80" style={{ color: "var(--v3-muted)" }}>
            Demo
          </Link>
          <Link href="/3d" className="px-3 py-1.5 hover:opacity-80" style={{ color: "var(--v3-muted)" }}>
            3D model
          </Link>
          <a
            href="https://github.com/KingSharif1/stella"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-sm font-medium hover:opacity-80"
            style={{ color: "var(--v3-muted)" }}
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 md:px-8 pt-14 md:pt-20 pb-12 max-w-5xl mx-auto text-center">
          <img
            src="/brand/stella-paper.svg"
            alt="Stella — Paper minimal logo"
            width={120}
            height={120}
            className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-[22px] border v3-logo-clean"
            style={{
              borderColor: "var(--v3-coral)",
              boxShadow: "0 0 40px rgba(255,122,92,0.25)",
            }}
          />
          <h1 className="mt-8 text-4xl md:text-6xl font-bold tracking-tight">
            Meet <span style={{ color: "var(--v3-coral)" }}>Stella</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "var(--v3-muted)" }}>
            A $40 Roomba 694, rebuilt into a home robot with a Raspberry Pi 4,
            ROS&nbsp;2, lidar, a camera — and a dashboard that shows everything she sees.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/demo"
              className="v3-btn-coral px-7 py-3 text-base font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Open the live demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/3d"
              className="v3-btn-ghost px-7 py-3 text-base font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Box className="w-5 h-5" /> Explore the 3D model
            </Link>
          </div>
          <p className="mt-4 text-xs mono" style={{ color: "var(--v3-muted)" }}>
            midnight tokyo · v3 dashboard · no sign-up, just drive
          </p>
        </section>

        {/* Feature grid */}
        <section className="px-4 md:px-8 pb-12 max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: "var(--v3-muted)" }}>
            What she can do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="v3-panel p-5">
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: "rgba(255,122,92,0.1)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--v3-coral)" }} />
                  </span>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm mt-1.5" style={{ color: "var(--v3-muted)" }}>
                    {f.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stack */}
        <section className="px-4 md:px-8 pb-12 max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: "var(--v3-muted)" }}>
            Under the shell
          </h2>
          <div className="v3-panel p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
              {parts.map(([name, role]) => (
                <div key={name} className="flex items-baseline gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--v3-mint)" }} />
                  <span className="font-medium whitespace-nowrap">{name}</span>
                  <span style={{ color: "var(--v3-muted)" }}>{role}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t text-center" style={{ borderColor: "var(--v3-border-soft)" }}>
              <Link href="/3d" className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: "var(--v3-coral)" }}>
                <Box className="w-4 h-4" /> See the exploded 3D view
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 md:px-8 pb-16 max-w-5xl mx-auto">
          <div
            className="rounded-2xl border p-8 md:p-10 text-center"
            style={{
              borderColor: "var(--v3-border)",
              background: "linear-gradient(140deg, rgba(255,122,92,0.12), rgba(94,234,212,0.06))",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold">Take her for a spin</h2>
            <p className="mt-2 max-w-xl mx-auto" style={{ color: "var(--v3-muted)" }}>
              The demo is fully interactive — pick rooms, drive her around the map,
              check the battery, dismiss alerts. Everything clicks.
            </p>
            <Link
              href="/demo"
              className="v3-btn-coral px-7 py-3 text-base font-semibold inline-flex items-center gap-2 mt-6"
            >
              Launch the dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer
        className="px-4 md:px-8 py-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        style={{ borderColor: "var(--v3-border-soft)", color: "var(--v3-muted)" }}
      >
        <span className="mono">STELLA · v3 · built by K. Sharif</span>
        <div className="flex items-center gap-4">
          <Link href="/demo" className="hover:opacity-80">Demo</Link>
          <Link href="/3d" className="hover:opacity-80">3D model</Link>
          <a href="https://github.com/KingSharif1/stella" target="_blank" rel="noreferrer" className="hover:opacity-80">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
