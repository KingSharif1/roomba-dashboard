"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 rounded border",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-accent/50",
          {
            "bg-accent text-background border-accent hover:bg-accent-dim hover:border-accent-dim":
              variant === "primary",
            "bg-surface-light text-foreground border-border hover:border-accent/50 hover:text-accent":
              variant === "secondary",
            "bg-danger/10 text-danger border-danger/30 hover:bg-danger/20 hover:border-danger/50":
              variant === "danger",
            "bg-transparent text-muted border-transparent hover:text-foreground hover:bg-surface-light":
              variant === "ghost",
          },
          {
            "text-xs px-2 py-1": size === "sm",
            "text-sm px-4 py-2": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
