"use client";

import Link from "next/link";
import { LiveMark, type RobotStatusLike } from "@/components/brand/live-mark";
import { useRobot } from "@/hooks/use-robot";

/**
 * Logo placement lives in this file so it can move without touching data wiring.
 * Header: 24px mark + Stella wordmark. Status hero: 120px beside the battery.
 * Login: 120px, idle.
 */

export function StellaLockup() {
  const { status } = useRobot();
  return (
    <Link href="/" className="flex items-center gap-2">
      <LiveMark status={status} size={24} />
      <span className="font-display font-bold tracking-[-0.03em] text-lg">Stella</span>
    </Link>
  );
}

export function StellaHero({ status }: { status?: RobotStatusLike | null }) {
  return <LiveMark status={status} size={120} className="stella-hero" />;
}

export function StellaLoginMark() {
  return (
    <div className="flex flex-col items-center gap-4">
      <LiveMark state="idle" size={120} />
      <h1 className="font-display font-bold tracking-[-0.03em] text-3xl">Stella</h1>
    </div>
  );
}
