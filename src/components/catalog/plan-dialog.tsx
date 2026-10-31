"use client";

import React, { useState } from "react";
import { Layers, Plus, X, Loader2, AlertCircle, Calendar, ShieldCheck, Edit2 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { toMinorUnits, fromMinorUnits } from "@/lib/money";
import { createPlanAction, updatePlanAction } from "@/server/actions/catalog";

interface PlanDialogProps {
  plan?: {
    id: string;
    name: string;
    price: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    minQty: number;
    availableFrom: Date | string;
    availableTo?: Date | string | null;
    autoClose: boolean;
    closable: boolean;
    pausable: boolean;
    renewable: boolean;
    trialDays: number;
    active: boolean;
  };
  trigger?: React.ReactNode;
}

export function PlanDialog({ plan, trigger }: PlanDialogProps) {
  const isEdit = !!plan;
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(plan?.name || "");
  const [price, setPrice] = useState(plan ? fromMinorUnits(plan.price) : "4850.00");
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(
    plan?.period || "MONTHLY"
  );
  const [minQty, setMinQty] = useState(plan ? String(plan.minQty) : "1");
  const [trialDays, setTrialDays] = useState(plan ? String(plan.trialDays) : "0");

  const [availableFrom, setAvailableFrom] = useState(
    plan
      ? new Date(plan.availableFrom).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [availableTo, setAvailableTo] = useState(
    plan?.availableTo ? new Date(plan.availableTo).toISOString().split("T")[0] : ""
  );

  // User change 1: Correct flag definitions
  const [autoClose, setAutoClose] = useState(plan?.autoClose ?? false);
  const [closable, setClosable] = useState(plan?.closable ?? true);
  const [pausable, setPausable] = useState(plan?.pausable ?? false);
  const [renewable, setRenewable] = useState(plan?.renewable ?? true);
  const [active, setActive] = useState(plan?.active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        price: toMinorUnits(price),
        period,
        minQty: parseInt(minQty, 10) || 1,
        trialDays: parseInt(trialDays, 10) || 0,
        availableFrom,
        availableTo: availableTo || undefined,
        autoClose,
        closable,
        pausable,
        renewable,
        active,
      };

      const res = isEdit
        ? await updatePlanAction(plan.id, payload)
        : await createPlanAction(payload);

      if (!res.success) {
        setError(res.error || "Failed to save subscription plan");
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : isEdit ? (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Edit Subscription Plan"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 fill-black stroke-[3]" />
          <span>New Plan</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <GlassCard className="p-6 relative border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {isEdit ? "Edit Subscription Plan" : "Create Subscription Plan"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Billing interval, lifecycle constraints, and availability rules
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Professional Monthly"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Billing Period *
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee] transition-colors"
                    >
                      <option value="DAILY">DAILY (Daily recurring)</option>
                      <option value="WEEKLY">WEEKLY (7-day recurring)</option>
                      <option value="MONTHLY">MONTHLY (Calendar monthly)</option>
                      <option value="YEARLY">YEARLY (Annual recurring)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Price per Period *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-zinc-400 font-mono">₹</span>
                      <input
                        type="text"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="4850.00"
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Minimum Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={minQty}
                      onChange={(e) => setMinQty(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Free Trial Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={trialDays}
                      onChange={(e) => setTrialDays(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                    />
                  </div>
                </div>

                {/* Availability Window */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Available From *
                    </label>
                    <input
                      type="date"
                      required
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Available To (Optional)
                    </label>
                    <input
                      type="date"
                      value={availableTo}
                      onChange={(e) => setAvailableTo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                    />
                  </div>
                </div>

                {/* Lifecycle Policy Flags (User change 1: Exact definitions from docs/06-BILLING-LOGIC.md) */}
                <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs font-semibold text-white block mb-1">
                    Lifecycle Policy Flags
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pausable}
                        onChange={(e) => setPausable(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-[#22d3ee] mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-zinc-200 block">Pausable</span>
                        <span className="text-[11px] text-zinc-400">Allow Pause / Resume actions</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={renewable}
                        onChange={(e) => setRenewable(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-[#22d3ee] mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-zinc-200 block">Renewable</span>
                        <span className="text-[11px] text-zinc-400">Allow manual Renew action</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={closable}
                        onChange={(e) => setClosable(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-[#22d3ee] mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-zinc-200 block">Closable Early</span>
                        <span className="text-[11px] text-zinc-400">Allow closing before expiry</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoClose}
                        onChange={(e) => setAutoClose(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-[#22d3ee] mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-zinc-200 block">Auto-Close</span>
                        <span className="text-[11px] text-zinc-400">Closes after final billing cycle</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="planActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-[#22d3ee] focus:ring-0"
                  />
                  <label htmlFor="planActive" className="text-xs text-zinc-300 cursor-pointer">
                    Active in catalog (can be selected for new quotes)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEdit ? "Update Plan" : "Save Plan"}</span>
                    )}
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}

