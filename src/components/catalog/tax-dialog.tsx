"use client";

import React, { useState } from "react";
import { Percent, Plus, X, Loader2, AlertCircle, Edit2 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { createTaxAction, updateTaxAction } from "@/server/actions/catalog";

interface TaxDialogProps {
  tax?: {
    id: string;
    name: string;
    rateBps: number;
    active: boolean;
  };
  trigger?: React.ReactNode;
}

export function TaxDialog({ tax, trigger }: TaxDialogProps) {
  const isEdit = !!tax;
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(tax?.name || "");
  const [ratePercent, setRatePercent] = useState(
    tax ? (tax.rateBps / 100).toFixed(2) : "18.00"
  );
  const [active, setActive] = useState(tax?.active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bps = Math.round((parseFloat(ratePercent) || 0) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        ratePercent: parseFloat(ratePercent) || 0,
        active,
      };

      const res = isEdit
        ? await updateTaxAction(tax.id, payload)
        : await createTaxAction(payload);

      if (!res.success) {
        setError(res.error || "Failed to save tax rate");
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
          title="Edit Tax Rate"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 fill-black stroke-[3]" />
          <span>New Tax Rate</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md">
            <GlassCard className="p-6 relative border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {isEdit ? "Edit Tax Rule" : "Create Tax Rule"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Basis points financial rate applied to invoice lines
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
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Tax Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. GST 18%"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Tax Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={ratePercent}
                      onChange={(e) => setRatePercent(e.target.value)}
                      placeholder="18.00"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                    />
                    <span className="absolute right-3 top-2 text-xs text-zinc-400 font-mono">%</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>Precision Basis Points:</span>
                    <span className="font-mono text-[#22d3ee] font-semibold">{bps} bps</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="taxActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-[#22d3ee] focus:ring-0"
                  />
                  <label htmlFor="taxActive" className="text-xs text-zinc-300 cursor-pointer">
                    Active tax rule (available for selection on subscription lines)
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
                      <span>{isEdit ? "Update Tax" : "Save Tax"}</span>
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

