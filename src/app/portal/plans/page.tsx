import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { portalService } from "@/server/services/portal";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatCurrency } from "@/lib/money";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Available Plans - Brightloop Portal",
  description: "Compare Brightloop subscription tiers and upgrade your plan",
};

export default async function CustomerPlansPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const customerId = session.user.id;
  const [plans, subscriptions] = await Promise.all([
    portalService.getAvailablePlans(),
    portalService.getSubscriptions(customerId),
  ]);

  const activeSub = subscriptions.find((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6d5dfc]/20 border border-[#6d5dfc]/30 text-[#6d5dfc] text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Plan Directory
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Flexible Plans for Every Stage
        </h1>
        <p className="text-xs text-zinc-400">
          Switch plans anytime with seamless, transparent day-by-day proration adjustments.
        </p>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = activeSub && activeSub.planId === plan.id;

          return (
            <GlassCard
              key={plan.id}
              hoverLift
              glow={isCurrentPlan}
              className={`p-6 border flex flex-col justify-between ${
                isCurrentPlan
                  ? "border-[#22d3ee]/50 shadow-lg shadow-[#22d3ee]/10"
                  : "border-white/10"
              }`}
            >
              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      {plan.period} billing
                    </span>
                  </div>
                  {isCurrentPlan && (
                    <StatusPill status="ACTIVE" size="sm" label="Current Plan" />
                  )}
                </div>

                {/* Price */}
                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-xs text-zinc-400 font-sans">
                      / {plan.period.toLowerCase()}
                    </span>
                  </div>
                  {plan.trialDays > 0 ? (
                    <div className="text-[11px] text-[#22d3ee] font-medium mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Includes {plan.trialDays} days free trial
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Immediate period activation
                    </div>
                  )}
                </div>

                {/* Features & Policies */}
                <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Minimum seats: <strong>{plan.minQty}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-300">
                    {plan.pausable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                    <span className={plan.pausable ? "text-zinc-200" : "text-zinc-400"}>
                      {plan.pausable ? "Pausable at any time" : "Non-pausable contract"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-300">
                    {plan.closable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                    <span className={plan.closable ? "text-zinc-200" : "text-zinc-400"}>
                      {plan.closable ? "Cancel anytime" : "Fixed-term commitment"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-300">
                    {plan.renewable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                    <span className={plan.renewable ? "text-zinc-200" : "text-zinc-400"}>
                      {plan.renewable ? "Auto-renewing terms" : "One-off period"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-6 mt-6 border-t border-white/10">
                {isCurrentPlan ? (
                  <Link
                    href={`/portal/subscriptions/${activeSub.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
                  >
                    Manage Active Plan
                  </Link>
                ) : activeSub ? (
                  <Link
                    href={`/portal/subscriptions/${activeSub.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee] text-white text-xs font-semibold shadow-md shadow-[#6d5dfc]/25 hover:opacity-90 transition-opacity"
                  >
                    Switch to this Plan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/portal"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
                  >
                    View Subscriptions
                  </Link>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

