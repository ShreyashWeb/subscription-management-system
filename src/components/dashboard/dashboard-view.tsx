"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BentoGrid, BentoItem } from "@/components/glass/bento-grid";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import { NumberTicker } from "@/components/glass/number-ticker";
import { Sparkline } from "@/components/glass/sparkline";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { RevenueAtRiskCard } from "@/components/dashboard/revenue-at-risk-card";
import { StatusBreakdownCard } from "@/components/dashboard/status-breakdown-card";
import { DashboardSummary } from "@/server/services/reports";
import { formatMoney } from "@/lib/money";
import {
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Download,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
}

interface DashboardViewProps {
  initialSummary: DashboardSummary;
  plans: PlanOption[];
}

export function DashboardView({ initialSummary, plans }: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";
  const currentCustomer = searchParams.get("customerId") || "";
  const currentPlan = searchParams.get("planId") || "";
  const currentStatus = searchParams.get("status") || "ALL";

  const [datePreset, setDatePreset] = useState<string>("ALL");

  function updateFilters(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val && val !== "ALL") {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  function handlePresetChange(preset: string) {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "ALL") {
      updateFilters({ from: undefined, to: undefined });
    } else if (preset === "30D") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      updateFilters({ from: d.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) });
    } else if (preset === "90D") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      updateFilters({ from: d.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) });
    } else if (preset === "YEAR") {
      const d = new Date(now.getFullYear(), 0, 1);
      updateFilters({ from: d.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) });
    }
  }

  const s = initialSummary;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Finance & Revenue Dashboard
            </h1>
            {/* Server Performance Timing Badge */}
            <div className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-[#22d3ee]" />
              <span>Loaded in</span>
              <span className="font-mono font-semibold text-white">
                {s.serverDurationMs} ms
              </span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time financial aggregates, cashflow tracking, and recurring subscription intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV Export Dropdown */}
          <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-1 backdrop-blur-md text-xs">
            <span className="px-2 text-zinc-400 font-medium">Export CSV:</span>
            <a
              href={`/api/export/invoices?${searchParams.toString()}`}
              download
              className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-zinc-200 transition-colors flex items-center gap-1 font-medium"
            >
              <Download className="w-3 h-3 text-[#22d3ee]" /> Invoices
            </a>
            <a
              href={`/api/export/subscriptions?${searchParams.toString()}`}
              download
              className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-zinc-200 transition-colors flex items-center gap-1 font-medium"
            >
              <Download className="w-3 h-3 text-emerald-400" /> Subs
            </a>
            <a
              href={`/api/export/payments?${searchParams.toString()}`}
              download
              className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-zinc-200 transition-colors flex items-center gap-1 font-medium"
            >
              <Download className="w-3 h-3 text-purple-400" /> Payments
            </a>
          </div>

          <Link href="/billing-run" className="btn-brutal px-3.5 py-2 text-xs">
            <Zap className="w-3.5 h-3.5 mr-1.5 fill-black" />
            Billing Run
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium px-1">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span>Filters:</span>
        </div>

        {/* Date Presets */}
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 text-xs">
          {[
            { id: "ALL", label: "All Time" },
            { id: "30D", label: "Last 30 Days" },
            { id: "90D", label: "Last 90 Days" },
            { id: "YEAR", label: "This Year" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                datePreset === preset.id
                  ? "bg-[#6d5dfc] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Searchable Customer Combobox */}
        <CustomerCombobox
          value={currentCustomer}
          onChange={(id) => updateFilters({ customerId: id })}
        />

        {/* Plan Filter */}
        <select
          value={currentPlan}
          onChange={(e) => updateFilters({ planId: e.target.value })}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-white/20 backdrop-blur-md"
        >
          <option value="ALL">All Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Subscription Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-white/20 backdrop-blur-md"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CLOSED">Closed</option>
          <option value="DRAFT">Draft</option>
          <option value="QUOTATION">Quotation</option>
        </select>

        {/* Reset Filter Button */}
        {(currentCustomer || currentPlan || currentStatus !== "ALL" || datePreset !== "ALL") && (
          <button
            onClick={() => {
              setDatePreset("ALL");
              router.push("/dashboard");
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {isPending && (
          <span className="text-xs text-[#22d3ee] animate-pulse font-mono ml-auto">
            Recalculating SQL aggregates...
          </span>
        )}
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
                <NumberTicker value={s.activeSubscriptions} />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                <span className="text-[#22d3ee] font-medium font-mono">
                  {s.pausedSubscriptions}
                </span>
                <span>paused</span>
              </div>
            </div>
            <Sparkline
              data={[s.activeSubscriptions * 0.8, s.activeSubscriptions * 0.85, s.activeSubscriptions * 0.9, s.activeSubscriptions * 0.95, s.activeSubscriptions]}
              color="#22d3ee"
              width={80}
              height={32}
            />
          </div>
        </BentoItem>

        {/* KPI: Invoiced Revenue */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>REVENUE INVOICED</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#6d5dfc]/25 text-[#22d3ee] border border-[#6d5dfc]/40 font-semibold shadow-[0_0_10px_rgba(109,93,252,0.4)]">
              Live
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                <Money amount={s.revenueInvoiced} animate />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Confirmed & Paid</span>
              </div>
            </div>
            <Sparkline
              data={[s.revenueInvoiced * 0.7, s.revenueInvoiced * 0.8, s.revenueInvoiced * 0.85, s.revenueInvoiced * 0.95, s.revenueInvoiced]}
              color="#6d5dfc"
              width={80}
              height={32}
            />
          </div>
        </BentoItem>

        {/* KPI: Cash Collected */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>PAYMENTS RECEIVED</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                <Money amount={s.paymentsReceived} animate />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                <span className="text-emerald-400 font-medium">
                  {s.revenueInvoiced > 0
                    ? `${Math.round((s.paymentsReceived / s.revenueInvoiced) * 100)}%`
                    : "100%"}
                </span>
                <span>collection rate</span>
              </div>
            </div>
            <Sparkline
              data={[s.paymentsReceived * 0.65, s.paymentsReceived * 0.75, s.paymentsReceived * 0.82, s.paymentsReceived * 0.92, s.paymentsReceived]}
              color="#34d399"
              width={80}
              height={32}
            />
          </div>
        </BentoItem>

        {/* KPI: Outstanding & Overdue */}
        <BentoItem colSpan={3} hoverLift>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>OUTSTANDING BALANCE</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-300">
                <Money amount={s.outstanding} animate />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-rose-400 font-mono font-medium">
                  {formatMoney(s.overdueAmount)}
                </span>
                <span className="text-xs text-zinc-400">({s.overdueCount} overdue)</span>
              </div>
            </div>
            <Sparkline
              data={[s.outstanding * 1.1, s.outstanding * 0.95, s.outstanding * 1.05, s.outstanding * 0.98, s.outstanding]}
              color="#f59e0b"
              width={80}
              height={32}
            />
          </div>
        </BentoItem>

        {/* Chart: Revenue Invoiced vs Cash Collected (Monthly Trend) */}
        <BentoItem colSpan={8} rowSpan={2} strong glow>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                Monthly Invoiced Revenue vs. Cash Collected
              </h3>
              <p className="text-xs text-zinc-400">
                Historical comparison of billing throughput against settled payments.
              </p>
            </div>
            <Link
              href="/reports"
              className="text-xs text-[#22d3ee] hover:underline flex items-center gap-1 font-medium group"
            >
              <span>View SaaS Reports & MRR</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <RevenueTrendChart data={s.monthlyTrends} />
        </BentoItem>

        {/* Revenue at Risk Card: Top 5 Late Customers */}
        <BentoItem colSpan={4} rowSpan={2} strong>
          <RevenueAtRiskCard
            totalOverdue={s.revenueAtRisk.totalOverdue}
            topLateCustomers={s.revenueAtRisk.topLateCustomers}
          />
        </BentoItem>

        {/* Recent Overdue List Preview */}
        <BentoItem colSpan={8} strong>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Overdue Invoices Requiring Follow-Up
              </h3>
              <p className="text-xs text-zinc-400">
                Latest confirmed invoices past due date without full settlement.
              </p>
            </div>
            <Link
              href="/invoices?status=OVERDUE"
              className="text-xs text-[#22d3ee] hover:underline flex items-center gap-1 font-medium group"
            >
              <span>View All ({s.overdueCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {s.recentOverdue.length === 0 ? (
            <div className="text-xs text-zinc-500 py-6 text-center">
              No overdue invoices detected.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-white/5 pb-2">
                    <th className="py-2 font-medium">Invoice</th>
                    <th className="py-2 font-medium">Customer</th>
                    <th className="py-2 font-medium">Due Date</th>
                    <th className="py-2 font-medium">Days Late</th>
                    <th className="py-2 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {s.recentOverdue.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-mono text-[#22d3ee] font-medium">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <div className="font-medium text-white truncate max-w-[140px]">
                          {inv.customerName}
                        </div>
                        {inv.company && (
                          <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                            {inv.company}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-zinc-400 font-mono">{inv.dueDate}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          {inv.daysLate}d late
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-zinc-400">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-rose-400">
                        {formatMoney(inv.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoItem>

        {/* Lifecycle Status Matrix */}
        <BentoItem colSpan={4} strong>
          <StatusBreakdownCard
            subscriptionStatuses={s.subscriptionStatuses}
            invoiceStatuses={s.invoiceStatuses}
          />
        </BentoItem>
      </BentoGrid>
    </div>
  );
}

