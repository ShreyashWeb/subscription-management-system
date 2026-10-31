"use client";

import React, { useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, Bell, RotateCw } from "lucide-react";
import { runDunningAction } from "@/server/actions/dunning";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DunningReminderItem {
  id: string;
  stage: number;
  sentAt: Date | string;
}

interface DunningTimelineProps {
  invoiceId: string;
  daysLate: number;
  isOverdue: boolean;
  reminders: DunningReminderItem[];
  isStaffOrAdmin: boolean;
}

const DUNNING_STAGES = [
  { stage: 1, label: "Stage 1", trigger: "1 Day Overdue" },
  { stage: 3, label: "Stage 2", trigger: "3 Days Overdue" },
  { stage: 7, label: "Stage 3", trigger: "7 Days Overdue (Final Notice)" },
];

export function DunningTimeline({
  invoiceId,
  daysLate,
  isOverdue,
  reminders,
  isStaffOrAdmin,
}: DunningTimelineProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const handleRunDunning = async () => {
    setRunning(true);
    try {
      const res = await runDunningAction();
      if (res.ok) {
        toast.success(
          `Dunning check complete! Processed ${res.data.processedInvoices} overdue invoices, sent ${res.data.emailsSent} reminder(s).`
        );
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger dunning");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-rose-500/20 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Dunning Reminders Timeline</span>
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {daysLate} day{daysLate === 1 ? "" : "s"} late
                </span>
              )}
            </h4>
            <p className="text-[11px] text-zinc-400">
              Idempotent automated notices scheduled at 1, 3, and 7 days after the payment due date.
            </p>
          </div>
        </div>

        {isStaffOrAdmin && isOverdue && (
          <button
            onClick={handleRunDunning}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            <span>{running ? "Checking..." : "Trigger Dunning"}</span>
          </button>
        )}
      </div>

      {/* 3-Stage Progress Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DUNNING_STAGES.map((s) => {
          const reminder = reminders.find((r) => r.stage === s.stage);
          const isReached = daysLate >= s.stage;

          return (
            <div
              key={s.stage}
              className={`p-3.5 rounded-xl border transition-all ${
                reminder
                  ? "bg-rose-500/10 border-rose-500/30"
                  : isReached
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-white/[0.02] border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{s.label}</span>
                {reminder ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Sent
                  </span>
                ) : isReached ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                    <Clock className="w-3 h-3" />
                    Due Now
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-500">Upcoming</span>
                )}
              </div>

              <div className="text-xs font-medium text-zinc-300 mt-1">
                {s.trigger}
              </div>

              <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                {reminder
                  ? `Notice sent: ${new Date(reminder.sentAt).toLocaleDateString()}`
                  : `Triggers at >= ${s.stage} days late`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

