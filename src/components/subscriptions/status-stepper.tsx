"use client";

import React from "react";
import { SubscriptionStatus } from "@prisma/client";
import { Check, PauseCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusStepperProps {
  status: SubscriptionStatus;
  isPaused?: boolean;
  className?: string;
}

const STAGES: { key: SubscriptionStatus; label: string }[] = [
  { key: SubscriptionStatus.DRAFT, label: "Draft" },
  { key: SubscriptionStatus.QUOTATION, label: "Quotation" },
  { key: SubscriptionStatus.CONFIRMED, label: "Confirmed" },
  { key: SubscriptionStatus.ACTIVE, label: "Active" },
  { key: SubscriptionStatus.CLOSED, label: "Closed" },
];

export function StatusStepper({
  status,
  isPaused = false,
  className,
}: StatusStepperProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === status);
  const isClosed = status === SubscriptionStatus.CLOSED;

  return (
    <div className={cn("w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5", className)}>
      <div className="flex items-center justify-between relative">
        {/* Connecting Progress Track */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 z-0">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isClosed
                ? "bg-zinc-600"
                : isPaused
                ? "bg-amber-400"
                : "bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee]"
            )}
            style={{
              width: `${(Math.max(0, currentIndex) / (STAGES.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Stage Nodes */}
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={stage.key}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  isCompleted
                    ? "bg-[#6d5dfc] text-white shadow-[0_0_12px_rgba(109,93,252,0.5)] ring-2 ring-white/10"
                    : isCurrent
                    ? isPaused
                      ? "bg-amber-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.6)] ring-4 ring-amber-500/30"
                      : isClosed
                      ? "bg-zinc-700 text-zinc-300 ring-2 ring-zinc-600"
                      : "bg-[#22d3ee] text-black shadow-[0_0_18px_rgba(34,211,238,0.7)] ring-4 ring-[#22d3ee]/30 font-bold"
                    : "bg-zinc-900 border border-white/10 text-zinc-500"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent && isPaused ? (
                  <PauseCircle className="w-4 h-4 stroke-[2.5]" />
                ) : isCurrent && isClosed ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <span
                className={cn(
                  "mt-2 text-xs font-medium tracking-tight",
                  isCurrent
                    ? isPaused
                      ? "text-amber-400 font-bold"
                      : "text-white font-bold"
                    : isCompleted
                    ? "text-zinc-300"
                    : "text-zinc-500"
                )}
              >
                {stage.label}
                {isCurrent && isPaused && " (Paused)"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

