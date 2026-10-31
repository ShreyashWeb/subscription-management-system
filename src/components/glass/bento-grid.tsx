"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animate?: boolean;
}

export const bentoContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const bentoItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function BentoGrid({
  className,
  children,
  animate = true,
  ...props
}: BentoGridProps) {
  const shouldReduceMotion = useReducedMotion();

  if (animate && !shouldReduceMotion) {
    return (
      <motion.div
        variants={bentoContainerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 w-full",
          className
        )}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 3 | 4 | 6 | 8 | 9 | 12;
  rowSpan?: 1 | 2 | 3;
  strong?: boolean;
  hoverLift?: boolean;
  glow?: boolean;
  spotlight?: boolean;
  children: React.ReactNode;
}

const colSpanClasses: Record<number, string> = {
  3: "col-span-1 md:col-span-3 lg:col-span-3",
  4: "col-span-1 md:col-span-3 lg:col-span-4",
  6: "col-span-1 md:col-span-6 lg:col-span-6",
  8: "col-span-1 md:col-span-6 lg:col-span-8",
  9: "col-span-1 md:col-span-6 lg:col-span-9",
  12: "col-span-1 md:col-span-6 lg:col-span-12",
};

const rowSpanClasses: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
};

export function BentoItem({
  colSpan = 4,
  rowSpan = 1,
  strong = false,
  hoverLift = true,
  glow = false,
  spotlight = true,
  className,
  children,
  ...props
}: BentoItemProps) {
  const shouldReduceMotion = useReducedMotion();

  const content = (
    <GlassCard
      strong={strong}
      hoverLift={hoverLift}
      glow={glow}
      spotlight={spotlight}
      className={cn(
        "w-full h-full flex flex-col justify-between",
        className
      )}
      {...props}
    >
      {children}
    </GlassCard>
  );

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : bentoItemVariants}
      className={cn(
        colSpanClasses[colSpan] || "col-span-12",
        rowSpanClasses[rowSpan] || "row-span-1",
        "h-full"
      )}
    >
      {content}
    </motion.div>
  );
}
