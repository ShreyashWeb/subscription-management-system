"use client";

import React from "react";
import Link from "next/link";
import { LateCustomer } from "@/server/services/reports";
import { formatMoney } from "@/lib/money";
import { AlertTriangle, ArrowUpRight, ShieldAlert } from "lucide-react";

interface RevenueAtRiskCardProps {
  totalOverdue: number;
  topLateCustomers: LateCustomer[];
}

export function RevenueAtRiskCard({ totalOverdue, topLateCustomers }: RevenueAtRiskCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>REVENUE AT RISK</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatMoney(totalOverdue)}
          </div>
        </div>
        <Link
          href="/invoices?status=OVERDUE"
          className="text-xs text-[#22d3ee] hover:underline flex items-center gap-1 font-medium group"
        >
          <span>View All Overdue</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="border-t border-white/10 pt-3">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Top Delinquent Accounts
        </span>

        {topLateCustomers.length === 0 ? (
          <div className="text-xs text-zinc-500 py-6 text-center">
            No delinquent customer accounts. All confirmed invoices are current!
          </div>
        ) : (
          <div className="mt-2.5 divide-y divide-white/5 space-y-2">
            {topLateCustomers.map((cust) => (
              <div
                key={cust.customerId}
                className="pt-2 flex items-center justify-between text-xs hover:bg-white/[0.02] -mx-2 px-2 py-1.5 rounded-lg transition-colors"
              >
                <div className="truncate max-w-[170px]">
                  <div className="font-medium text-white truncate">{cust.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {cust.company ?? "Individual Customer"} • {cust.overdueInvoicesCount} overdue
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-medium text-rose-400">
                    {formatMoney(cust.overdueAmount)}
                  </div>
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {cust.maxDaysLate}d late
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

