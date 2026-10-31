"use client";

import React from "react";
import { StatusPill } from "@/components/glass/status-pill";

interface StatusBreakdownCardProps {
  subscriptionStatuses: Record<string, number>;
  invoiceStatuses: Record<string, number>;
}

export function StatusBreakdownCard({
  subscriptionStatuses,
  invoiceStatuses,
}: StatusBreakdownCardProps) {
  const subTotal = Object.values(subscriptionStatuses).reduce((a, b) => a + b, 0);
  const invTotal = Object.values(invoiceStatuses).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
            Subscriptions ({subTotal.toLocaleString()})
          </span>
        </div>
        <div className="space-y-2">
          {["ACTIVE", "CONFIRMED", "CLOSED", "DRAFT", "QUOTATION"].map((st) => {
            const count = subscriptionStatuses[st] || 0;
            const pct = subTotal > 0 ? Math.round((count / subTotal) * 100) : 0;
            return (
              <div
                key={st}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <StatusPill status={st as any} size="sm" />
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-white font-medium">{count.toLocaleString()}</span>
                  <span className="text-zinc-500 text-[10px] w-8 text-right">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
            Invoices ({invTotal.toLocaleString()})
          </span>
        </div>
        <div className="space-y-2">
          {["PAID", "CONFIRMED", "DRAFT", "CANCELLED"].map((st) => {
            const count = invoiceStatuses[st] || 0;
            const pct = invTotal > 0 ? Math.round((count / invTotal) * 100) : 0;
            return (
              <div
                key={st}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <StatusPill status={st as any} size="sm" />
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-white font-medium">{count.toLocaleString()}</span>
                  <span className="text-zinc-500 text-[10px] w-8 text-right">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

