import React from "react";
import { cn } from "@/lib/utils";

export type EntityStatus =
  | "DRAFT"
  | "QUOTATION"
  | "CONFIRMED"
  | "ACTIVE"
  | "PAID"
  | "OVERDUE"
  | "CLOSED"
  | "CANCELLED"
  | string;

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  pulse?: boolean;
}

const statusConfigs: Record<string, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-white/[0.04] text-zinc-400 border-white/10",
    dotClass: "bg-zinc-400 shadow-[0_0_6px_rgba(161,161,170,0.5)]",
  },
  QUOTATION: {
    label: "Quotation",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    dotClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]",
  },
  CONFIRMED: {
    label: "Confirmed",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
    dotClass: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]",
  },
  ACTIVE: {
    label: "Active",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]",
  },
  PAID: {
    label: "Paid",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]",
  },
  OVERDUE: {
    label: "Overdue",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/35",
    dotClass: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]",
    pulse: true,
  },
  CLOSED: {
    label: "Closed",
    badgeClass: "bg-white/[0.02] text-zinc-500 border-white/5",
    dotClass: "bg-zinc-600",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-white/[0.02] text-zinc-500 border-white/5",
    dotClass: "bg-zinc-600",
  },
};

interface StatusPillProps {
  status: EntityStatus;
  size?: "sm" | "md";
  showDot?: boolean;
  label?: string;
  className?: string;
}

export function StatusPill({
  status,
  size = "md",
  showDot = true,
  label,
  className,
}: StatusPillProps) {
  const normalizedKey = (status || "").toUpperCase();
  const config = statusConfigs[normalizedKey] || {
    label: status,
    badgeClass: "bg-white/5 text-zinc-300 border-white/10",
    dotClass: "bg-zinc-400 shadow-[0_0_6px_rgba(161,161,170,0.5)]",
  };

  const displayText = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-all duration-200 backdrop-blur-sm",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {config.pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                config.dotClass
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5",
              config.dotClass
            )}
          />
        </span>
      )}
      <span className="truncate">{displayText}</span>
    </span>
  );
}
