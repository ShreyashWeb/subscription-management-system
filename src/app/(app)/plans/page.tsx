import React from "react";
import { auth } from "@/lib/auth";
import { listPlans } from "@/server/services/plans";
import { togglePlanActiveAction } from "@/server/actions/catalog";
import { GlassCard } from "@/components/glass/glass-card";
import { Money } from "@/components/glass/money";
import { PlanDialog } from "@/components/catalog/plan-dialog";
import { ActiveToggle } from "@/components/catalog/active-toggle";
import {
  Layers,
  Calendar,
  Clock,
  RotateCw,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Filter,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { BillingPeriod } from "@prisma/client";

export const metadata = {
  title: "Subscription Plans - Brightloop Billing",
  description: "Recurring subscription plans, billing periods, and lifecycle policy flags",
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; page?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const resolvedParams = await searchParams;
  const period = resolvedParams.period || "ALL";
  const page = parseInt(resolvedParams.page || "1", 10);

  const { items, total, totalPages } = await listPlans({
    period: period as any,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#22d3ee]" />
            Subscription Plans
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Billing intervals, minimum quantities, free trials, and lifecycle policy constraints.
          </p>
        </div>

        {isAdmin && <PlanDialog />}
      </div>

      {/* Period Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {[
          { label: "All Intervals", value: "ALL" },
          { label: "Monthly", value: "MONTHLY" },
          { label: "Yearly", value: "YEARLY" },
          { label: "Weekly", value: "WEEKLY" },
          { label: "Daily", value: "DAILY" },
        ].map((tab) => {
          const isActive = period === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/plans?period=${tab.value}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#6d5dfc]/25 border border-[#6d5dfc]/50 text-white shadow-[0_0_15px_rgba(109,93,252,0.3)]"
                  : "bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((plan) => {
          const availability = plan.availability;

          return (
            <GlassCard key={plan.id} hoverLift className="p-6 flex flex-col justify-between">
              <div>
                {/* Header: Name, Period, Availability Pill */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/25 font-mono text-[10px] font-semibold">
                        {plan.period}
                      </span>
                      {plan.trialDays > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono text-[10px]">
                          {plan.trialDays}d Trial
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      availability.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : availability.status === "UPCOMING"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {availability.label}
                  </span>
                </div>

                {/* Price Display */}
                <div className="my-4">
                  <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
                    <Money amount={plan.price} />
                    <span className="text-xs text-zinc-400 font-normal font-sans">
                      / {plan.period.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Min order: <span className="font-mono text-zinc-200">{plan.minQty} unit(s)</span>
                  </p>
                </div>

                {/* Availability Window Dates */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] space-y-1 mb-4">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" /> Available From:
                    </span>
                    <span className="font-mono text-zinc-300">
                      {format(new Date(plan.availableFrom), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" /> Available To:
                    </span>
                    <span className="font-mono text-zinc-300">
                      {plan.availableTo
                        ? format(new Date(plan.availableTo), "MMM d, yyyy")
                        : "Indefinite"}
                    </span>
                  </div>
                </div>

                {/* Lifecycle Flags Matrix (User change 1) */}
                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">
                    Lifecycle Policy Flags
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      {plan.pausable ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span>Pausable</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-300">
                      {plan.renewable ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span>Renewable</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-300">
                      {plan.closable ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span>Closable Early</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-300">
                      {plan.autoClose ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22d3ee]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span>Auto-Close</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Status & Edit */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                <ActiveToggle
                  id={plan.id}
                  initialActive={plan.active}
                  onToggle={togglePlanActiveAction}
                  disabled={!isAdmin}
                />

                {isAdmin && <PlanDialog plan={plan} />}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

