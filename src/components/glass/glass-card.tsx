"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  hoverLift?: boolean;
  glow?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, strong = false, hoverLift = false, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          strong ? "glass-strong" : "glass",
          "p-6 transition-all duration-200 relative overflow-hidden",
          hoverLift && "hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
          glow && "before:absolute before:-top-px before:left-1/4 before:right-1/4 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#6d5dfc] before:to-transparent",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

