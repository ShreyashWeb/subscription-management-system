"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export function AuroraBackground({
  children,
  className,
  ...props
}: AuroraBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen w-full items-center justify-start overflow-hidden bg-transparent text-[#f5f5fa]",
        className
      )}
      {...props}
    >
      {/* Fixed Aurora glowing layer behind all content */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Blob 1: Violet Glow (Top Left) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: ["0%", "14%", "-8%", "0%"],
                  y: ["0%", "-12%", "10%", "0%"],
                  scale: [1, 1.18, 0.92, 1],
                }
          }
          transition={{
            duration: 24,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute -top-[10%] -left-[5%] w-[680px] h-[680px] rounded-full bg-[radial-gradient(circle,rgba(109,93,252,0.58)_0%,rgba(109,93,252,0.05)_65%,transparent_75%)] blur-[95px] will-change-transform"
        />

        {/* Blob 2: Cyan Glow (Top/Mid Right) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: ["0%", "-16%", "10%", "0%"],
                  y: ["0%", "15%", "-12%", "0%"],
                  scale: [1, 1.12, 0.95, 1],
                }
          }
          transition={{
            duration: 28,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="absolute top-[18%] -right-[8%] w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.50)_0%,rgba(34,211,238,0.05)_65%,transparent_75%)] blur-[105px] will-change-transform"
        />

        {/* Blob 3: Pink Glow (Bottom Left/Center) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: ["0%", "12%", "-14%", "0%"],
                  y: ["0%", "-10%", "14%", "0%"],
                  scale: [0.95, 1.15, 0.98, 0.95],
                }
          }
          transition={{
            duration: 32,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute -bottom-[15%] left-[25%] w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.48)_0%,rgba(244,114,182,0.04)_65%,transparent_75%)] blur-[110px] will-change-transform"
        />

        {/* Subtle noise grain texture overlay at 3.5% opacity */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 w-full flex-1 flex flex-col">{children}</div>
    </div>
  );
}
