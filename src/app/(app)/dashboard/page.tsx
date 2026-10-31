"use client";

import React from "react";
import Link from "next/link";
import { BentoGrid, BentoItem } from "@/components/glass/bento-grid";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import { NumberTicker } from "@/components/glass/number-ticker";
import { Sparkline } from "@/components/glass/sparkline";
import { BillingPipelineChart } from "@/components/glass/billing-pipeline-chart";
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
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Finance & Revenue Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time subscription metrics, invoicing throughput, and recurring cashflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 flex items-center gap-1.5 backdrop-blur-md">
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
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white num">
                <NumberTicker value={1420} />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+8.4% this cycle</span>
              </div>
            </div>
            <Sparkline
              data={[1180, 1220, 1250, 1310, 1360, 1390, 1420]}
              color="#22d3ee"
              width={90}
              height={36}
            />
          </div>
        </BentoItem>

        {/* KPI: Monthly Recurring Revenue (MRR) - Border Beam Hero Tile */}
        <BentoItem colSpan={3} hoverLift glow>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>MRR</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#6d5dfc]/25 text-[#22d3ee] border border-[#6d5dfc]/40 font-semibold shadow-[0_0_10px_rgba(109,93,252,0.4)]">
              Live
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                <Money amount={124500000} animate />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.1% net expansion</span>
              </div>
            </div>
            <Sparkline
              data={[820000, 890000, 940000, 1050000, 1140000, 1245000]}
              color="#6d5dfc"
              width={90}
              height={36}
            />
          </div>
        </BentoItem>

        {/* KPI: Invoiced Revenue */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>COLLECTED THIS MONTH</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                <Money amount={98250000} animate />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                <span className="text-emerald-400 font-medium">91%</span>
                <span>collection rate</span>
              </div>
            </div>
            <Sparkline
              data={[650000, 710000, 740000, 810000, 890000, 982500]}
              color="#34d399"
              width={90}
              height={36}
            />
          </div>
        </BentoItem>

        {/* KPI: Overdue at Risk */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>REVENUE AT RISK (OVERDUE)</span>
            <AlertTriangle className="w-4 h-4 text-[#fb7185]" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-[#fb7185]">
                <Money amount={1240000} animate />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StatusPill status="OVERDUE" size="sm" />
                <span className="text-xs text-zinc-400">5 accounts</span>
              </div>
            </div>
            <Sparkline
              data={[18000, 22000, 15000, 24000, 19000, 12400]}
              color="#fb7185"
              width={90}
              height={36}
            />
          </div>
        </BentoItem>

        {/* Hero Section: Invoicing & Billing Engine Overview with Area Chart */}
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

          {/* Interactive Volume & Pipeline Chart */}
          <BillingPipelineChart />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400">Today's Due Invoices</span>
              <p className="text-2xl font-bold text-white num">
                <NumberTicker value={42} />
              </p>
              <p className="text-[11px] text-zinc-500">Auto-catchup for missed periods</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400">Active Discounts</span>
              <p className="text-2xl font-bold text-white num">
                <NumberTicker value={3} suffix=" Rules" />
              </p>
              <p className="text-[11px] text-zinc-500">Atomic usage tracking</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400">Avg Invoice Turnaround</span>
              <p className="text-2xl font-bold text-white num">
                <NumberTicker value={3.2} decimals={1} suffix=" Days" />
              </p>
              <p className="text-[11px] text-zinc-500">From draft to confirmed</p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Next automated cron run scheduled at 00:00 UTC</span>
            <Link
              href="/invoices"
              className="text-[#22d3ee] hover:underline flex items-center gap-1 font-medium group"
            >
              <span>View Invoices Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </BentoItem>

        {/* Status Lifecycle Overview Card */}
        <BentoItem colSpan={4} rowSpan={2} strong>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white">
              Subscription & Invoice States
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">LIFECYCLE</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            State verification & transition matrix
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs text-zinc-300">New Quotes</span>
              <StatusPill status="QUOTATION" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs text-zinc-300">Sales Confirmed</span>
              <StatusPill status="CONFIRMED" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs text-zinc-300">Active Subscriptions</span>
              <StatusPill status="ACTIVE" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs text-zinc-300">Settled Invoices</span>
              <StatusPill status="PAID" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs text-zinc-300">Dunning & Overdue</span>
              <StatusPill status="OVERDUE" size="sm" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs text-zinc-300">Closed Lifecycle</span>
              <StatusPill status="CLOSED" size="sm" />
            </div>
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
