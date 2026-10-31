import React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
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
  className,
  children,
  ...props
}: BentoItemProps) {
  return (
    <GlassCard
      strong={strong}
      hoverLift={hoverLift}
      glow={glow}
      className={cn(
        colSpanClasses[colSpan] || "col-span-12",
        rowSpanClasses[rowSpan] || "row-span-1",
        "flex flex-col justify-between",
        className
      )}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

