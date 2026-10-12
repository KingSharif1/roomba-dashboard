"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * StellaLogo — theme-aware Paper minimal logo.
 *
 * variant "light": cream tile + ink line-art → for DARK backgrounds
 *   (midnight Tokyo dashboard, landing hero)
 * variant "dark": dark tile + light line-art → for LIGHT/paper backgrounds
 *   (engineering-paper pages)
 */
export function StellaLogo({
  variant = "light",
  size = 40,
  className,
  rounded = true,
  style,
}: {
  variant?: "light" | "dark";
  size?: number;
  className?: string;
  rounded?: boolean;
  style?: CSSProperties;
}) {
  const src =
    variant === "light" ? "/brand/stella-paper.svg" : "/brand/stella-paper-dark.svg";
  return (
    <img
      src={src}
      alt="Stella"
      width={size}
      height={size}
      className={cn(rounded && "rounded-[10px]", "shrink-0", className)}
      style={{ width: size, height: size, ...style }}
    />
  );
}

/** Small mark-only variant (icon tile). Same theme rule applies. */
export function StellaMark({
  variant = "light",
  size = 40,
  className,
}: {
  variant?: "light" | "dark";
  size?: number;
  className?: string;
}) {
  // The mark svg is a cream tile; on paper backgrounds prefer the dark full logo.
  const src =
    variant === "light" ? "/brand/stella-paper-mark.svg" : "/brand/stella-paper-dark.svg";
  return (
    <img
      src={src}
      alt="Stella"
      width={size}
      height={size}
      className={cn("rounded-[10px]", "shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
