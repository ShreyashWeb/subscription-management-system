import React from "react";
import Link from "next/link";
import { BentoGrid, BentoItem } from "@/components/glass/bento-grid";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import {
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Finance & Revenue Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time subscription metrics, invoicing, and recurring cashflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 flex items-center gap-1.5">
            <span>Loaded in</span>
            <span className="text-[#22d3ee] font-mono font-medium">18ms</span>
          </div>

          <Link href="/billing-run" className="btn-brutal px-4 py-2 text-sm">
            <Zap className="w-4 h-4 mr-1.5 fill-black" />
            Run Billing Now
          </Link>
        </div>
      </div>

      {/* Bento Grid */}
      <BentoGrid>
        {/* KPI: Active Subscriptions */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>ACTIVE SUBSCRIPTIONS</span>
            <Users className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white num">1,420</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8.4% from last month</span>
            </div>
          </div>
        </BentoItem>

        {/* KPI: Monthly Recurring Revenue (MRR) */}
        <BentoItem colSpan={3} hoverLift glow>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>MRR</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#6d5dfc]/20 text-[#6d5dfc] border border-[#6d5dfc]/30">
              Live
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white">
              <Money amount={124500000} />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.1% net expansion</span>
            </div>
          </div>
        </BentoItem>

        {/* KPI: Invoiced Revenue */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>COLLECTED THIS MONTH</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white">
              <Money amount={98250000} />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <span>91% collection rate</span>
            </div>
          </div>
        </BentoItem>

        {/* KPI: Overdue at Risk */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>REVENUE AT RISK (OVERDUE)</span>
            <AlertTriangle className="w-4 h-4 text-[#fb7185]" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-[#fb7185]">
              <Money amount={1240000} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusPill status="OVERDUE" size="sm" />
              <span className="text-xs text-zinc-400">5 accounts</span>
            </div>
          </div>
        </BentoItem>

        {/* Hero Section: Invoicing & Billing Engine Overview */}
        <BentoItem colSpan={8} rowSpan={2} strong glow>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Automated Subscription Lifecycle & Billing Run
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Idempotent period billing with automatic tax and discount resolution
              </p>
            </div>
            <StatusPill status="ACTIVE" label="Engine Ready" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-xs text-zinc-400">Today's Due Invoices</span>
              <p className="text-2xl font-bold text-white num">42</p>
              <p className="text-[11px] text-zinc-500">Auto-catchup for missed periods</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-xs text-zinc-400">Active Discounts</span>
              <p className="text-2xl font-bold text-white num">3 Rules</p>
              <p className="text-[11px] text-zinc-500">Atomic usage tracking</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="text-xs text-zinc-400">Avg Invoice Turnaround</span>
              <p className="text-2xl font-bold text-white num">3.2 Days</p>
              <p className="text-[11px] text-zinc-500">From draft to confirmed</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Next automated cron run scheduled at 00:00 UTC</span>
            <Link
              href="/invoices"
              className="text-[#22d3ee] hover:underline flex items-center gap-1 font-medium"
            >
              View Invoices Queue <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </BentoItem>

        {/* Status Lifecycle Overview Card */}
        <BentoItem colSpan={4} rowSpan={2} strong>
          <h3 className="text-sm font-semibold text-white mb-1">
            Subscription & Invoice States
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            State verification & transition matrix
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-zinc-300">New Quotes</span>
              <StatusPill status="QUOTATION" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-zinc-300">Sales Confirmed</span>
              <StatusPill status="CONFIRMED" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-zinc-300">Active Subscriptions</span>
              <StatusPill status="ACTIVE" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-zinc-300">Settled Invoices</span>
              <StatusPill status="PAID" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-zinc-300">Dunning & Overdue</span>
              <StatusPill status="OVERDUE" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-zinc-300">Closed Lifecycle</span>
              <StatusPill status="CLOSED" size="sm" />
            </div>
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  );
}

