"use client";

import React, { useState, useEffect, useTransition } from "react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatCurrency } from "@/lib/money";
import {
  previewProrationAction,
  applyProrationAction,
} from "@/server/actions/portal";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanOption {
  id: string;
  name: string;
  price: number;
  period: string;
  minQty: number;
  trialDays: number;
  closable: boolean;
  pausable: boolean;
}

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ProrationPreviewDialogProps {
  subscriptionId: string;
  currentPlan: {
    id: string;
    name: string;
    price: number;
    period: string;
  };
  currentLines: LineItem[];
  availablePlans: PlanOption[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProrationPreviewDialog({
  subscriptionId,
  currentPlan,
  currentLines,
  availablePlans,
  isOpen,
  onClose,
}: ProrationPreviewDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlan.id);
  const [lineQuantities, setLineQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    currentLines.forEach((l) => {
      initial[l.productId] = l.quantity;
    });
    return initial;
  });

  const [preview, setPreview] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recalculate preview when plan or quantities change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsCalculating(true);
    setErrorMessage(null);

    const timer = setTimeout(async () => {
      const newLines = currentLines.map((l) => ({
        productId: l.productId,
        quantity: lineQuantities[l.productId] ?? l.quantity,
      }));

      const res = await previewProrationAction(subscriptionId, {
        newPlanId: selectedPlanId,
        newLines,
      });

      if (!isMounted) return;
      setIsCalculating(false);

      if (res.ok) {
        setPreview(res.data);
      } else {
        setErrorMessage(res.error.message);
        setPreview(null);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, subscriptionId, selectedPlanId, lineQuantities, currentLines]);

  if (!isOpen) return null;

  const handleQuantityChange = (productId: string, val: number) => {
    setLineQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, val),
    }));
  };

  const handleConfirmChange = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const newLines = currentLines.map((l) => ({
        productId: l.productId,
        quantity: lineQuantities[l.productId] ?? l.quantity,
      }));

      const res = await applyProrationAction(subscriptionId, {
        newPlanId: selectedPlanId,
        newLines,
      });

      if (res.ok) {
        setSuccessMessage("Plan updated successfully! Proration adjustment applied.");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1200);
      } else {
        setErrorMessage(res.error.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl glass border border-white/15 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Change Plan & Proration Preview
              </h2>
              <p className="text-xs text-zinc-400">
                Prorated rates are calculated to the exact calendar day.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Plan Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Select Subscription Plan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availablePlans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#6d5dfc]/15 border-[#6d5dfc] shadow-sm shadow-[#6d5dfc]/20"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3ee]" />
                      )}
                    </div>
                    <div className="text-xs text-[#22d3ee] font-mono font-semibold mt-1">
                      {formatCurrency(p.price)}{" "}
                      <span className="text-[10px] text-zinc-400 font-normal">
                        / {p.period.toLowerCase()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Line Quantities */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Seats / Quantities
            </label>
            <div className="space-y-2">
              {currentLines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/10"
                >
                  <div>
                    <div className="text-xs font-medium text-white">{line.productName}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Rate: {formatCurrency(line.unitPrice)} per unit
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          line.productId,
                          (lineQuantities[line.productId] || line.quantity) - 1
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-white">
                      {lineQuantities[line.productId] ?? line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          line.productId,
                          (lineQuantities[line.productId] || line.quantity) + 1
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Proration Breakdown Card */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Current Cycle
              </span>
              {isCalculating ? (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                </span>
              ) : preview ? (
                <span className="text-zinc-300 font-mono text-[11px]">
                  {preview.remainingDays} of {preview.periodDays} days remaining
                </span>
              ) : null}
            </div>

            {preview && (
              <>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <div className="text-[11px] text-zinc-400">Old Recurring Total</div>
                    <div className="font-mono text-zinc-300">
                      {formatCurrency(preview.oldRecurringTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400">New Recurring Total</div>
                    <div className="font-mono text-white font-semibold">
                      {formatCurrency(preview.newRecurringTotal)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Unused Time Credit:</span>
                    <span className="font-mono text-emerald-400">
                      -{formatCurrency(preview.credit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Prorated New Plan Charge:</span>
                    <span className="font-mono text-zinc-200">
                      +{formatCurrency(preview.charge)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      {preview.adjustment > 0 ? (
                        <TrendingUp className="w-4 h-4 text-[#22d3ee]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      )}
                      Net Adjustment Due:
                    </span>
                    <span
                      className={`font-mono text-base ${
                        preview.adjustment > 0
                          ? "text-[#22d3ee]"
                          : preview.adjustment < 0
                          ? "text-emerald-400"
                          : "text-zinc-300"
                      }`}
                    >
                      {formatCurrency(preview.adjustment)}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/5 text-[11px] text-zinc-400">
                  {preview.adjustment > 0 ? (
                    <p>
                      An immediate proration invoice for{" "}
                      <strong className="text-white">
                        {formatCurrency(preview.adjustment)}
                      </strong>{" "}
                      will be generated for the remaining {preview.remainingDays} days.
                    </p>
                  ) : preview.adjustment < 0 ? (
                    <p>
                      A credit of{" "}
                      <strong className="text-emerald-400">
                        {formatCurrency(Math.abs(preview.adjustment))}
                      </strong>{" "}
                      will be applied to your account.
                    </p>
                  ) : (
                    <p>No balance change required for this billing cycle.</p>
                  )}
                </div>
              </>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmChange}
            disabled={isPending || isCalculating || !preview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee] text-white text-xs font-semibold shadow-md shadow-[#6d5dfc]/30 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Applying Change...
              </>
            ) : (
              <>
                Confirm & Apply
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

