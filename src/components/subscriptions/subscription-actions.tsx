"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import {
  transitionSubscriptionAction,
  pauseSubscriptionAction,
  resumeSubscriptionAction,
  renewSubscriptionAction,
  closeSubscriptionAction,
} from "@/server/actions/subscriptions";
import { ProrationPreviewDialog } from "@/components/portal/proration-preview-dialog";
import {
  Send,
  CheckCircle,
  Zap,
  Pause,
  Play,
  RotateCw,
  XCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface SubscriptionActionsProps {
  subscription: {
    id: string;
    number: string;
    status: SubscriptionStatus;
    isPaused: boolean;
    expiryDate?: Date | string | null;
    quotationValidUntil?: Date | string | null;
    plan: {
      id: string;
      name: string;
      price: number;
      pausable: boolean;
      renewable: boolean;
      closable: boolean;
      autoClose: boolean;
      period: string;
    };
    lines?: any[];
  };
  isAdminOrStaff: boolean;
  availablePlans?: any[];
}

export function SubscriptionActions({
  subscription,
  isAdminOrStaff,
  availablePlans = [],
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProrationDialog, setShowProrationDialog] = useState(false);

  if (!isAdminOrStaff) return null;

  const { id, status, isPaused, expiryDate, quotationValidUntil, plan, lines = [] } = subscription;

  const handleAction = async (actionKey: string, actionFn: () => Promise<any>) => {
    setError(null);
    setLoading(actionKey);

    try {
      const res = await actionFn();
      if (!res.success) {
        setError(res.error || "Action could not be executed");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {/* DRAFT ACTIONS */}
          {status === SubscriptionStatus.DRAFT && (
            <>
              <button
                onClick={() =>
                  handleAction("quote", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.QUOTATION)
                  )
                }
                disabled={!!loading}
                className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading === "quote" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 fill-black" />
                )}
                <span>Send Quotation</span>
              </button>

              <button
                onClick={() =>
                  handleAction("confirm", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.CONFIRMED)
                  )
                }
                disabled={!!loading}
                className="px-3.5 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {loading === "confirm" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>Confirm Order</span>
              </button>

              <button
                onClick={() =>
                  handleAction("close", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.CLOSED)
                  )
                }
                disabled={!!loading}
                className="px-3 py-2 text-xs rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {/* QUOTATION ACTIONS */}
          {status === SubscriptionStatus.QUOTATION && (
            <>
              <button
                onClick={() =>
                  handleAction("confirm", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.CONFIRMED)
                  )
                }
                disabled={!!loading}
                className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading === "confirm" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 fill-black" />
                )}
                <span>Confirm Order</span>
              </button>

              <button
                onClick={() =>
                  handleAction("draft", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.DRAFT)
                  )
                }
                disabled={!!loading}
                className="px-3 py-2 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Revise to Draft</span>
              </button>

              <button
                onClick={() =>
                  handleAction("close", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.CLOSED)
                  )
                }
                disabled={!!loading}
                className="px-3 py-2 text-xs rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {/* CONFIRMED ACTIONS */}
          {status === SubscriptionStatus.CONFIRMED && (
            <>
              <button
                onClick={() =>
                  handleAction("activate", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.ACTIVE)
                  )
                }
                disabled={!!loading}
                className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading === "activate" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-black" />
                )}
                <span>Activate Subscription</span>
              </button>

              <button
                onClick={() =>
                  handleAction("close", () =>
                    transitionSubscriptionAction(id, SubscriptionStatus.CLOSED)
                  )
                }
                disabled={!!loading}
                className="px-3 py-2 text-xs rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {/* ACTIVE ACTIONS */}
          {status === SubscriptionStatus.ACTIVE && (
            <>
              {/* Pause / Resume */}
              {isPaused ? (
                <button
                  onClick={() => handleAction("resume", () => resumeSubscriptionAction(id))}
                  disabled={!!loading}
                  className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading === "resume" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-black" />
                  )}
                  <span>Resume Subscription</span>
                </button>
              ) : (
                plan.pausable && (
                  <button
                    onClick={() => handleAction("pause", () => pauseSubscriptionAction(id))}
                    disabled={!!loading}
                    className="px-3.5 py-2 text-xs rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading === "pause" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                    <span>Pause</span>
                  </button>
                )
              )}

              {/* Proration Plan & Quantity Change Preview */}
              {availablePlans.length > 0 && (
                <button
                  onClick={() => setShowProrationDialog(true)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-[#6d5dfc]/20 hover:bg-[#6d5dfc]/30 text-[#22d3ee] border border-[#6d5dfc]/40 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
                  <span>Proration Preview &amp; Change</span>
                </button>
              )}

              {/* Renew */}
              {plan.renewable && expiryDate && (
                <button
                  onClick={() => handleAction("renew", () => renewSubscriptionAction(id))}
                  disabled={!!loading}
                  className="px-3.5 py-2 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {loading === "renew" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="w-3.5 h-3.5 text-[#22d3ee]" />
                  )}
                  <span>Renew Term (+1 {plan.period.toLowerCase()})</span>
                </button>
              )}

              {/* Close Subscription (if plan.closable) */}
              {plan.closable && (
                <button
                  onClick={() => handleAction("close", () => closeSubscriptionAction(id))}
                  disabled={!!loading}
                  className="px-3.5 py-2 text-xs rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {loading === "close" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Close Subscription</span>
                </button>
              )}
            </>
          )}

          {/* CLOSED STATE */}
          {status === SubscriptionStatus.CLOSED && (
            <span className="text-xs text-zinc-500 font-mono italic">
              This subscription lifecycle is closed.
            </span>
          )}
        </div>
      </div>

      {/* Proration Preview Dialog for Admin */}
      {status === SubscriptionStatus.ACTIVE && showProrationDialog && (
        <ProrationPreviewDialog
          isOpen={showProrationDialog}
          onClose={() => setShowProrationDialog(false)}
          subscriptionId={subscription.id}
          currentPlan={subscription.plan}
          currentLines={lines.map((l: any) => ({
            id: l.id,
            productId: l.productId,
            productName: l.product?.name || "Product",
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          }))}
          availablePlans={availablePlans}
        />
      )}
    </>
  );
}
