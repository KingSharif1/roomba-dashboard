"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const STAR_PATH =
  "M256 176 l24 52 56 6 -41 39 11 55 -50 -28 -50 28 11 -55 -41 -39 56 -6 z";

/**
 * StellaLogo — inline vector Paper minimal logo.
 *
 * No more <img>: the tile and ink follow CSS vars (--logo-tile / --logo-ink),
 * so light/dark theming is trivial. Defaults suit the midnight Tokyo
 * dashboard (cream tile, dark ink); override the vars for paper backgrounds.
 */
export function StellaLogo({
  size = 40,
  className,
  rounded = true,
  style,
}: {
  size?: number;
  className?: string;
  rounded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="Stella"
      className={cn(rounded && "rounded-[10px]", "shrink-0", className)}
      style={{ width: size, height: size, ...style }}
    >
      <rect width="512" height="512" rx="112" style={{ fill: "var(--logo-tile)" }} />
      <g fill="none" strokeWidth={14} strokeLinecap="round" style={{ stroke: "var(--logo-ink)" }}>
        <circle cx="256" cy="256" r="150" />
        <circle cx="256" cy="256" r="104" strokeWidth={8} opacity={0.45} />
        <path d={STAR_PATH} style={{ fill: "var(--logo-ink)", stroke: "none" }} />
      </g>
      <text
        x="256"
        y="452"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="44"
        letterSpacing="10"
        style={{ fill: "var(--logo-ink)" }}
      >
        STELLA
      </text>
    </svg>
  );
}

/** Small mark-only variant (icon tile, no wordmark). Same CSS-var theming. */
export function StellaMark({
  size = 40,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="Stella"
      className={cn("rounded-[10px]", "shrink-0", className)}
      style={{ width: size, height: size, ...style }}
    >
      <rect width="512" height="512" rx="112" style={{ fill: "var(--logo-tile)" }} />
      <g fill="none" strokeWidth={14} strokeLinecap="round" style={{ stroke: "var(--logo-ink)" }}>
        <circle cx="256" cy="256" r="150" />
        <circle cx="256" cy="256" r="104" strokeWidth={8} opacity={0.45} />
        <path d={STAR_PATH} style={{ fill: "var(--logo-ink)", stroke: "none" }} />
      </g>
    </svg>
  );
}
