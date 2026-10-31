"use client";

import React, { useState, useTransition } from "react";
import { GlassCard } from "@/components/glass/glass-card";
import {
  pauseSubscriptionAction,
  resumeSubscriptionAction,
  cancelSubscriptionAction,
} from "@/server/actions/portal";
import { ProrationPreviewDialog } from "@/components/portal/proration-preview-dialog";
import {
  Pause,
  Play,
  XCircle,
  Sparkles,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionActionsProps {
  subscription: {
    id: string;
    number: string;
    status: string;
    isPaused: boolean;
    plan: {
      id: string;
      name: string;
      price: number;
      period: string;
      pausable: boolean;
      closable: boolean;
    };
    lines: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      product: { name: string };
    }>;
  };
  availablePlans: any[];
}

export function SubscriptionActions({
  subscription,
  availablePlans,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showProrationDialog, setShowProrationDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isActive = subscription.status === "ACTIVE";
  const isPaused = subscription.isPaused;
  const isClosed = subscription.status === "CLOSED";

  const handlePause = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await pauseSubscriptionAction(subscription.id);
      if (res.ok) {
        router.refresh();
      } else {
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleResume = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await resumeSubscriptionAction(subscription.id);
      if (res.ok) {
        router.refresh();
      } else {
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleCancel = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await cancelSubscriptionAction(subscription.id);
      if (res.ok) {
        setConfirmCancel(false);
        router.refresh();
      } else {
        setErrorMessage(res.error.message);
      }
    });
  };

  if (isClosed) {
    return (
      <GlassCard className="p-5 border border-white/10">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Info className="w-4 h-4 text-zinc-400" />
          <span>This subscription has been closed and cannot be modified.</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Self-Service Controls
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            {isPaused ? "Paused" : isActive ? "Active" : subscription.status}
          </span>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pause / Resume Button */}
          {isPaused ? (
            <button
              type="button"
              onClick={handleResume}
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Resume Subscription
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={handlePause}
                disabled={isPending || !isActive || !subscription.plan.pausable}
                title={
                  !subscription.plan.pausable
                    ? "Plan does not permit pausing"
                    : "Temporarily pause recurring invoices"
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
                Pause Subscription
              </button>
              {!subscription.plan.pausable && (
                <span className="text-[10px] text-zinc-400 text-center">
                  Plan does not permit pausing
                </span>
              )}
            </div>
          )}

          {/* Change Plan / Quantity Button */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setShowProrationDialog(true)}
              disabled={isPending || !isActive}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6d5dfc]/20 hover:bg-[#6d5dfc]/30 border border-[#6d5dfc]/40 text-[#22d3ee] text-xs font-semibold shadow-sm shadow-[#6d5dfc]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
              Change Plan / Qty
            </button>
            <span className="text-[10px] text-zinc-400 text-center">
              Proration preview before confirming
            </span>
          </div>

          {/* Cancel Subscription Button */}
          <div className="flex flex-col gap-1">
            {confirmCancel ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirm Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="px-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                disabled={isPending || !isActive || !subscription.plan.closable}
                title={
                  !subscription.plan.closable
                    ? "Fixed-term commitment (non-cancellable)"
                    : "Cancel subscription early"
                }
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Early
              </button>
            )}
            {!subscription.plan.closable && (
              <span className="text-[10px] text-zinc-400 text-center">
                Fixed-term commitment
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Proration Preview Dialog */}
      <ProrationPreviewDialog
        isOpen={showProrationDialog}
        onClose={() => setShowProrationDialog(false)}
        subscriptionId={subscription.id}
        currentPlan={subscription.plan}
        currentLines={subscription.lines.map((l) => ({
          id: l.id,
          productId: l.productId,
          productName: l.product.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        }))}
        availablePlans={availablePlans}
      />
    </>
  );
}

