"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  hoverLift?: boolean;
  glow?: boolean;
  spotlight?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      strong = false,
      hoverLift = false,
      glow = false,
      spotlight = true,
      children,
      onMouseMove,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Merge forwarded ref and local ref
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (cardRef.current && spotlight) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty("--mx", `${x}px`);
        cardRef.current.style.setProperty("--my", `${y}px`);
      }
      onMouseMove?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    };

    return (
      <div
        ref={setRefs}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          strong ? "glass-strong" : "glass",
          hoverLift && "glass-interactive cursor-pointer group",
          glow && "shadow-[0_0_30px_-5px_rgba(109,93,252,0.35)] border-[#6d5dfc]/40",
          "p-6 relative overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Dynamic mouse spotlight highlight */}
        {spotlight && (
          <div
            className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-0"
            style={{
              opacity: isHovered ? 1 : 0,
              background:
                "radial-gradient(350px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.08), transparent 75%)",
            }}
          />
        )}

        {/* Foreground content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
