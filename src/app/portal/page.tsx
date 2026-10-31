import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { Package, Receipt, Calendar, CreditCard, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Customer Portal - Brightloop Billing",
  description: "View and manage your Brightloop subscriptions and invoices",
};

export default async function CustomerPortalPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Query customer's own subscriptions and invoices
  const [subscriptionsCount, invoicesCount] = await Promise.all([
    db.subscription.count({
      where: { customerId: userId },
    }),
    db.invoice.count({
      where: { customerId: userId },
    }),
  ]);

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
              Welcome back, {session?.user?.name || "Customer"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Manage your active subscriptions, download official invoices, and view payment histories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300">
              <span className="text-zinc-400">Account: </span>
              <span className="font-mono text-white">{session?.user?.email}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>MY SUBSCRIPTIONS</span>
            <Package className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{subscriptionsCount}</div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Active plan contracts</span>
            <StatusPill status="ACTIVE" size="sm" label={`${subscriptionsCount} Active`} />
          </div>
        </GlassCard>

        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>MY INVOICES</span>
            <Receipt className="w-4 h-4 text-[#6d5dfc]" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{invoicesCount}</div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Billed statements</span>
            <StatusPill status="PAID" size="sm" label={`${invoicesCount} Total`} />
          </div>
        </GlassCard>

        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>PAYMENT STATUS</span>
            <CreditCard className="w-4 h-4 text-[#34d399]" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">Good Standing</div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Zero overdue balance</span>
            <StatusPill status="ACTIVE" size="sm" label="Settled" />
          </div>
        </GlassCard>
      </div>

      {/* Empty State / Active Plans Placeholder */}
      <GlassCard className="p-8 text-center border border-white/5">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
          <Package className="w-6 h-6 text-[#22d3ee]" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          {subscriptionsCount === 0 ? "No Subscriptions Yet" : "Your Active Subscriptions"}
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
          {subscriptionsCount === 0
            ? "When Brightloop sales team activates your quote or subscription, it will appear here with complete billing schedule and invoices."
            : "Detailed line items, renewal terms, and payment records are kept up to date in real time."}
        </p>
      </GlassCard>
    </div>
  );
}

