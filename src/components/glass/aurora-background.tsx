"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen w-full items-center justify-start overflow-hidden bg-[#07070d] text-[#f5f5fa]",
        className
      )}
      {...props}
    >
      {/* Aurora glowing layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0.25 }}
          animate={{
            x: ["0%", "8%", "-6%", "0%"],
            y: ["0%", "-10%", "6%", "0%"],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(circle,rgba(109,93,252,0.32)_0%,rgba(109,93,252,0)_70%)] blur-[90px]"
        />

        <motion.div
          initial={{ opacity: 0.28 }}
          animate={{
            x: ["0%", "-12%", "8%", "0%"],
            y: ["0%", "8%", "-10%", "0%"],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-[25%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28)_0%,rgba(34,211,238,0)_70%)] blur-[100px]"
        />

        <motion.div
          initial={{ opacity: 0.22 }}
          animate={{
            x: ["0%", "10%", "-8%", "0%"],
            y: ["0%", "12%", "-6%", "0%"],
            scale: [0.95, 1.1, 1, 0.95],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.22)_0%,rgba(244,114,182,0)_70%)] blur-[110px]"
        />

        {/* Faint subtle grid/noise texture overlay to prevent color banding */}
        {showRadialGradient && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,13,0.75)_100%)] pointer-events-none" />
        )}
      </div>

      {/* Foreground content */}
      <div className="relative z-10 w-full flex-1 flex flex-col">{children}</div>
    </div>
  );
}

