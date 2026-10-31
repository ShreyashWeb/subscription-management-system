"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordChecklistProps {
  password?: string;
  className?: string;
}

interface RuleItem {
  id: string;
  label: string;
  valid: boolean;
}

export function PasswordChecklist({ password = "", className }: PasswordChecklistProps) {
  const rules: RuleItem[] = [
    {
      id: "len",
      label: "More than 8 characters (at least 9)",
      valid: password.length > 8,
    },
    {
      id: "upper",
      label: "At least one uppercase letter (A-Z)",
      valid: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "At least one lowercase letter (a-z)",
      valid: /[a-z]/.test(password),
    },
    {
      id: "special",
      label: "At least one special character (!@#$%...)",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const totalMet = rules.filter((r) => r.valid).length;
  const isStarted = password.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl p-3 bg-white/[0.02] border border-white/5 space-y-2 text-xs",
        className
      )}
    >
      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
        <span>Password Requirements</span>
        {isStarted && (
          <span
            className={cn(
              "font-mono",
              totalMet === 4 ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {totalMet} / 4 met
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule) => {
          const satisfied = isStarted && rule.valid;
          return (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-2 py-0.5 px-1.5 rounded transition-colors text-[11px]",
                satisfied
                  ? "text-emerald-300"
                  : isStarted
                  ? "text-zinc-500"
                  : "text-zinc-400"
              )}
            >
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 transition-all",
                  satisfied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isStarted
                    ? "bg-white/5 text-zinc-500 border border-white/10"
                    : "bg-white/5 text-zinc-500"
                )}
              >
                {satisfied ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : isStarted ? (
                  <X className="w-2.5 h-2.5 stroke-[2]" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-zinc-500" />
                )}
              </span>
              <span className="leading-tight">{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

