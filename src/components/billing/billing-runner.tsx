"use client";

import React, { useState } from "react";
import {
  Zap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  RotateCw,
  PauseCircle,
  ShieldAlert,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { confirmAllDraftsAction } from "@/server/actions/invoices";

interface BillingSummaryData {
  activated: number;
  created: number;
  skippedPaused: number;
  skippedInProgress: number;
  alreadyBilled: number;
  failed: Array<{ subscriptionId: string; number: string; error: string }>;
  durationMs: number;
  invoiceIds: string[];
}

export function BillingRunner({ initialDueCount }: { initialDueCount: number }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(todayStr);
  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processedTotal, setProcessedTotal] = useState(0);
  const [summary, setSummary] = useState<BillingSummaryData | null>(null);
  const [showFutureWarning, setShowFutureWarning] = useState(false);
  const [confirmingDrafts, setConfirmingDrafts] = useState(false);

  const isFuture = asOfDate > todayStr;

  const handleDatePreset = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const val = d.toISOString().slice(0, 10);
    setAsOfDate(val);
  };

  const handleTriggerRun = () => {
    if (isFuture && !showFutureWarning) {
      setShowFutureWarning(true);
      return;
    }
    setShowFutureWarning(false);
    startBillingRun();
  };

  const startBillingRun = async () => {
    setIsRunning(true);
    setProgressPercent(5);
    setSummary(null);

    const startTime = Date.now();
    const aggregated: BillingSummaryData = {
      activated: 0,
      created: 0,
      skippedPaused: 0,
      skippedInProgress: 0,
      alreadyBilled: 0,
      failed: [],
      durationMs: 0,
      invoiceIds: [],
    };

    let totalProcessedSoFar = 0;
    let initialRemaining: number | null = null;
    let remaining = 1;

    try {
      while (remaining > 0) {
        const res = await fetch("/api/billing/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asOf: asOfDate, batchSize: 100 }),
        });

        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Billing run request failed");
        }

        const data = json.data;
        const batch = data.batchSummary;

        if (initialRemaining === null) {
          initialRemaining = data.processed + data.remaining;
        }

        totalProcessedSoFar += data.processed;
        remaining = data.remaining;
        setProcessedTotal(totalProcessedSoFar);

        // Aggregate results
        aggregated.activated += batch.activated;
        aggregated.created += batch.created;
        aggregated.skippedPaused += batch.skippedPaused;
        aggregated.skippedInProgress += batch.skippedInProgress;
        aggregated.alreadyBilled += batch.alreadyBilled;
        aggregated.failed.push(...batch.failed);
        aggregated.invoiceIds.push(...batch.invoiceIds);

        // Progress bar calculation
        if (initialRemaining && initialRemaining > 0) {
          const pct = Math.min(
            95,
            Math.round((totalProcessedSoFar / initialRemaining) * 100)
          );
          setProgressPercent(pct);
        } else {
          setProgressPercent(remaining === 0 ? 100 : 50);
        }

        if (data.processed === 0 && remaining === 0) {
          break;
        }
      }

      aggregated.durationMs = Date.now() - startTime;
      setProgressPercent(100);
      setSummary(aggregated);
      toast.success(
        `Billing run complete! Created ${aggregated.created} invoice(s).`
      );
    } catch (err: any) {
      toast.error(err.message || "Billing run encountered an error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleBulkConfirmDrafts = async () => {
    setConfirmingDrafts(true);
    try {
      const res = await confirmAllDraftsAction();
      if (res.ok) {
        toast.success(`Successfully confirmed ${res.data.count} draft invoice(s)!`);
      } else {
        toast.error(res.error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm drafts");
    } finally {
      setConfirmingDrafts(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Time-Travel Simulator Card */}
      <div className="glass-card p-6 rounded-2xl border border-white/16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">
              <Calendar className="w-4 h-4" />
              <span>Time-Travel Simulator</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Execute Period Billing Engine
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Runs the idempotent billing engine up to the chosen target date. Catches up missed periods, applies eligible discounts via atomic guards, computes taxes per-line, and auto-closes expired plans.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Target Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              disabled={isRunning}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/16 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
        </div>

        {/* Date presets & Status indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Quick Presets:</span>
            <button
              onClick={() => handleDatePreset(0)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                asOfDate === todayStr
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDatePreset(7)}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-all"
            >
              +7 Days (Next Week)
            </button>
            <button
              onClick={() => handleDatePreset(30)}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-all"
            >
              +1 Month
            </button>
            <button
              onClick={() => handleDatePreset(90)}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-all"
            >
              +1 Quarter
            </button>
          </div>

          <div className="text-xs text-zinc-400">
            Due subscriptions as of today:{" "}
            <span className="font-mono font-bold text-white">{initialDueCount}</span>
          </div>
        </div>
      </div>

      {/* Future Time-Travel Warning Dialog / Alert */}
      {showFutureWarning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 animate-in fade-in flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">
              Future Time-Travel Warning
            </h4>
            <p className="text-xs text-amber-300/90 mt-0.5">
              You selected a future date (<strong>{asOfDate}</strong>). Running billing with a future date will bill upcoming subscription periods ahead of schedule and advance their billing cycles. Are you sure you want to proceed?
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={startBillingRun}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Yes, Execute Run As-Of {asOfDate}
              </button>
              <button
                onClick={() => setShowFutureWarning(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-zinc-300 text-xs hover:bg-white/15 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brutalist Run Button & Progress Bar */}
      <div className="glass-card p-8 rounded-2xl border border-white/16 shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
        <button
          onClick={handleTriggerRun}
          disabled={isRunning}
          className={`relative group px-10 py-5 rounded-2xl font-black text-lg tracking-wider uppercase transition-all duration-300 shadow-2xl ${
            isRunning
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/10"
              : "bg-gradient-to-r from-[#6d5dfc] via-[#4f46e5] to-[#22d3ee] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[#6d5dfc]/40 ring-1 ring-white/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <Zap
              className={`w-6 h-6 ${
                isRunning ? "animate-spin text-zinc-500" : "text-amber-300 fill-amber-300"
              }`}
            />
            <span>{isRunning ? "Billing Run in Progress..." : "Run Billing Now"}</span>
          </div>
        </button>

        {isRunning && (
          <div className="w-full max-w-lg space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Processing batches in transactions...
              </span>
              <span className="font-mono text-white">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 font-mono text-right">
              Processed {processedTotal} subscriptions
            </div>
          </div>
        )}
      </div>

      {/* Result Summary Dialog / Card */}
      {summary && (
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Billing Run Completed</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Duration: {summary.durationMs}ms
                  </span>
                  <span>•</span>
                  <span>As of: {asOfDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkConfirmDrafts}
                disabled={confirmingDrafts}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{confirmingDrafts ? "Confirming..." : "Confirm All Drafts"}</span>
              </button>

              <Link
                href="/invoices?status=DRAFT"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Invoices Created
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {summary.created}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Subscriptions Activated
              </div>
              <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
                {summary.activated}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Skipped (Paused)
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {summary.skippedPaused}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Already Billed
              </div>
              <div className="text-2xl font-black text-zinc-400 font-mono mt-1">
                {summary.alreadyBilled}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Failed / Concurrent
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono mt-1">
                {summary.failed.length}
              </div>
            </div>
          </div>

          {/* Failed list if any */}
          {summary.failed.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Failed Subscriptions ({summary.failed.length})</span>
              </div>
              <ul className="text-xs space-y-1 font-mono">
                {summary.failed.map((f, i) => (
                  <li key={i}>
                    {f.number}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
