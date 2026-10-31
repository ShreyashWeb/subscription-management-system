import React from "react";
import Link from "next/link";
import { requireRole } from "@/server/policies/permissions";
import { reportsService } from "@/server/services/reports";
import { MrrMovementChart } from "@/components/reports/mrr-movement-chart";
import { BentoGrid, BentoItem } from "@/components/glass/bento-grid";
import { Money } from "@/components/glass/money";
import { NumberTicker } from "@/components/glass/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { formatMoney } from "@/lib/money";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Repeat,
  Download,
  Clock,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(["ADMIN", "STAFF"]);

  const metrics = await reportsService.getSaaSMetrics(12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              SaaS Recurring Revenue & Cohorts
            </h1>
            <div className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-[#22d3ee]" />
              <span>Loaded in</span>
              <span className="font-mono font-semibold text-white">
                {metrics.serverDurationMs} ms
              </span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            MRR waterfall, annual run rate, churn rate, and net revenue retention (NRR) normalized to monthly equivalents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export/invoices"
            download
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-zinc-200 transition-colors flex items-center gap-1.5 font-medium backdrop-blur-md"
          >
            <Download className="w-3.5 h-3.5 text-[#22d3ee]" />
            <span>Export Invoices CSV</span>
          </a>
          <a
            href="/api/export/subscriptions"
            download
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-zinc-200 transition-colors flex items-center gap-1.5 font-medium backdrop-blur-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Subs CSV</span>
          </a>
        </div>
      </div>

      {/* Bento Grid KPI Row */}
      <BentoGrid>
        {/* KPI: Monthly Recurring Revenue (MRR) */}
        <BentoItem colSpan={3} hoverLift glow className="relative">
          <BorderBeam size={80} duration={6} colorFrom="var(--aurora-2)" colorTo="var(--aurora-1)" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>MONTHLY RECURRING REVENUE (MRR)</span>
            <RefreshCw className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white">
              <Money amount={metrics.mrr} animate />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <span className="text-[#22d3ee] font-medium">Active & Non-Paused</span>
              <span>normalized base</span>
            </div>
          </div>
        </BentoItem>

        {/* KPI: Annual Run Rate (ARR) */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>ANNUAL RUN RATE (ARR)</span>
            <Repeat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white">
              <Money amount={metrics.arr} animate />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>MRR × 12 Run Rate</span>
            </div>
          </div>
        </BentoItem>

        {/* KPI: Monthly Churn Rate */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>CHURN RATE</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-rose-400 num">
              <NumberTicker value={metrics.churnRate} decimals={1} suffix="%" />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <span>Closed MRR ÷ Start MRR</span>
            </div>
          </div>
        </BentoItem>

        {/* KPI: Net Revenue Retention (NRR) */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>NET REVENUE RETENTION (NRR)</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-purple-300 num">
              <NumberTicker value={metrics.nrr} decimals={1} suffix="%" />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <span className="text-purple-400 font-medium">Expansion adjusted</span>
              <span>retention</span>
            </div>
          </div>
        </BentoItem>

        {/* Main Chart: MRR Movement Waterfall & Trajectory */}
        <BentoItem colSpan={12} strong glow>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                Monthly MRR Movement (New, Expansion, Contraction, Churn)
              </h3>
              <p className="text-xs text-zinc-400">
                12-month cohort dynamics tracking organic recurring revenue expansion against churn.
              </p>
            </div>
          </div>

          <MrrMovementChart data={metrics.movementSeries} />
        </BentoItem>

        {/* Monthly Breakdown Cohort Table */}
        <BentoItem colSpan={12} strong>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Historical MRR Movement Ledger
            </h3>
            <span className="text-xs text-zinc-500 font-mono">12 MONTH SERIES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-white/5 pb-2">
                  <th className="py-2.5 font-medium">Month</th>
                  <th className="py-2.5 font-medium text-right text-cyan-400">+ New MRR</th>
                  <th className="py-2.5 font-medium text-right text-emerald-400">+ Expansion</th>
                  <th className="py-2.5 font-medium text-right text-amber-400">- Contraction</th>
                  <th className="py-2.5 font-medium text-right text-rose-400">- Churned</th>
                  <th className="py-2.5 font-medium text-right text-white font-semibold">Closing MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] font-mono">
                {metrics.movementSeries.slice().reverse().map((row) => (
                  <tr key={row.month} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-sans font-medium text-zinc-300">{row.month}</td>
                    <td className="py-2.5 text-right text-cyan-400">+{formatMoney(row.newMrr)}</td>
                    <td className="py-2.5 text-right text-emerald-400">+{formatMoney(row.expansionMrr)}</td>
                    <td className="py-2.5 text-right text-amber-400">
                      {row.contractionMrr > 0 ? `-${formatMoney(row.contractionMrr)}` : "₹0.00"}
                    </td>
                    <td className="py-2.5 text-right text-rose-400">
                      {row.churnedMrr > 0 ? `-${formatMoney(row.churnedMrr)}` : "₹0.00"}
                    </td>
                    <td className="py-2.5 text-right font-bold text-white">
                      {formatMoney(row.closingMrr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  );
}

