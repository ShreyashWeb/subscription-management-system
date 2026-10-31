import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { portalService } from "@/server/services/portal";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatCurrency } from "@/lib/money";
import { format } from "date-fns";
import Link from "next/link";
import {
  Package,
  Receipt,
  Calendar,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "My Subscriptions - Brightloop Portal",
  description: "View and manage your active subscriptions",
};

export default async function CustomerPortalPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const customerId = session.user.id;

  const [subscriptions, invoices] = await Promise.all([
    portalService.getSubscriptions(customerId),
    portalService.getInvoices(customerId),
  ]);

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "ACTIVE" && !s.isPaused
  );
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <GlassCard className="p-8 border border-white/10" glow>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#6d5dfc]/20 border border-[#6d5dfc]/30 text-[#6d5dfc] text-[11px] font-semibold uppercase tracking-wider">
                Customer Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {session.user.name || "Customer"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Monitor active subscriptions, review billing schedules, download invoice receipts, or customize plan terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal/plans"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee] text-white text-xs font-semibold shadow-md shadow-[#6d5dfc]/30 hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Browse Plans
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>MY SUBSCRIPTIONS</span>
            <Package className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {subscriptions.length}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>{activeSubscriptions.length} currently active</span>
            <StatusPill status="ACTIVE" size="sm" label={`${activeSubscriptions.length} Active`} />
          </div>
        </GlassCard>

        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>TOTAL BILLED</span>
            <Receipt className="w-4 h-4 text-[#6d5dfc]" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Across {invoices.length} statements</span>
            <Link
              href="/portal/invoices"
              className="text-[#22d3ee] hover:underline flex items-center gap-1"
            >
              View Invoices <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </GlassCard>

        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>OUTSTANDING BALANCE</span>
            <CreditCard className="w-4 h-4 text-[#34d399]" />
          </div>
          <div
            className={`text-3xl font-bold font-mono ${
              totalOutstanding > 0 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>
              {totalOutstanding === 0 ? "Good standing (Zero balance)" : "Pending payment"}
            </span>
            <StatusPill
              status={totalOutstanding === 0 ? "PAID" : "CONFIRMED"}
              size="sm"
              label={totalOutstanding === 0 ? "Settled" : "Unpaid"}
            />
          </div>
        </GlassCard>
      </div>

      {/* Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              My Subscriptions
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-zinc-300 font-mono">
              {subscriptions.length}
            </span>
          </div>
          <span className="text-xs text-zinc-400">
            Click any subscription to view schedule & self-service controls
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <GlassCard className="p-12 text-center border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Package className="w-6 h-6 text-[#22d3ee]" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No Subscriptions Yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5">
              Explore available plans to start your subscription or reach out to your sales representative.
            </p>
            <Link
              href="/portal/plans"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee] text-white text-xs font-semibold shadow-md shadow-[#6d5dfc]/30 hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Browse Plans
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => {
              const status = sub.isPaused ? "PAUSED" : sub.status;
              const nextDateFormatted = sub.nextInvoiceDate
                ? format(new Date(sub.nextInvoiceDate), "MMM dd, yyyy")
                : null;
              const startDateFormatted = format(new Date(sub.startDate), "MMM dd, yyyy");

              return (
                <GlassCard
                  key={sub.id}
                  hoverLift
                  className="p-6 border border-white/10 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-mono text-[#22d3ee] font-semibold">
                          {sub.number}
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          {sub.plan.name}
                        </h3>
                      </div>
                      <StatusPill
                        status={status as any}
                        size="md"
                        label={status}
                      />
                    </div>

                    {/* Financial & Schedule Highlights */}
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                          Recurring Amount
                        </div>
                        <div className="text-lg font-bold text-white font-mono mt-0.5">
                          {formatCurrency(sub.recurringTotal)}{" "}
                          <span className="text-xs text-zinc-400 font-normal">
                            / {sub.plan.period.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                          Next Invoice
                        </div>
                        <div className="text-xs font-mono text-zinc-200 mt-0.5 flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3 text-[#22d3ee]" />
                          {nextDateFormatted || "None scheduled"}
                        </div>
                      </div>
                    </div>

                    {/* Included Line Items Preview */}
                    <div>
                      <div className="text-[11px] text-zinc-400 mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Included Services ({sub.lines.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sub.lines.map((l) => (
                          <span
                            key={l.id}
                            className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-zinc-300"
                          >
                            {l.quantity}× {l.product.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400">
                      Started: {startDateFormatted}
                    </span>
                    <Link
                      href={`/portal/subscriptions/${sub.id}`}
                      className="flex items-center gap-1 text-[#22d3ee] hover:text-white font-semibold transition-colors"
                    >
                      Manage & Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
