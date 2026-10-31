"use client";

import React from "react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import { NumberTicker } from "@/components/glass/number-ticker";
import { Sparkline } from "@/components/glass/sparkline";
import {
  TrendingUp,
  Receipt,
  Package,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export function DashboardPreviewMock() {
  return (
    <div className="w-full my-12 relative">
      {/* Specular backdrop glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#6d5dfc]/20 via-[#22d3ee]/20 to-[#f472b6]/20 blur-3xl -z-10 rounded-full opacity-60" />

      <GlassCard className="p-6 md:p-8 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {/* Mock Topbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-300">
              Live Database: <strong>2,000 Subscriptions</strong> &bull; <strong>9,739 Invoices</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20 text-[11px] font-mono text-[#22d3ee]">
              Loaded in 436 ms &bull; SLA &lt; 2s
            </span>
            <Link
              href="/dashboard"
              className="text-xs text-white hover:text-[#22d3ee] flex items-center gap-1 font-semibold transition-colors"
            >
              Open Live Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mock KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>ACTIVE SUBS</span>
              <Package className="w-3.5 h-3.5 text-[#22d3ee]" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              <NumberTicker value={1999} />
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5 font-medium">
              <TrendingUp className="w-3 h-3" /> +12.4% this month
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>INVOICED REVENUE</span>
              <Receipt className="w-3.5 h-3.5 text-[#6d5dfc]" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              <Money amount={585420000} />
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">CONFIRMED &amp; PAID</div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>PAYMENTS SETTLED</span>
              <CreditCard className="w-3.5 h-3.5 text-[#34d399]" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              <Money amount={573020000} />
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">97.8% collection rate</div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>OVERDUE BALANCE</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              <Money amount={12400000} />
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">3 Dunning stages active</div>
          </div>
        </div>

        {/* Mock Sparkline & Activity Preview */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Sparkline
              data={[340000, 390000, 430000, 480000, 520000, 585420]}
              color="#22d3ee"
              width={160}
              height={44}
            />
            <div>
              <div className="text-xs font-semibold text-white">Monthly MRR Growth Run Rate</div>
              <div className="text-[11px] text-zinc-400">Continuous expansion derived from activity audit logs</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill status="ACTIVE" size="sm" label="Zero Double Billing" />
            <StatusPill status="PAID" size="sm" label="Automatic Dunning" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

