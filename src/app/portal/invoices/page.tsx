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
  Receipt,
  FileDown,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "My Invoices - Brightloop Portal",
  description: "View and download your billing invoices and receipts",
};

export default async function CustomerInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const customerId = session.user.id;
  const invoices = await portalService.getInvoices(customerId);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidTotal, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding, 0);
  const paidCount = invoices.filter((inv) => inv.status === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Invoices & Statements
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Download PDF copies for your accounting records and verify payment statuses.
          </p>
        </div>
      </div>

      {/* KPI Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>TOTAL BILLED</span>
            <Receipt className="w-4 h-4 text-[#6d5dfc]" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>{invoices.length} invoices generated</span>
            <span className="font-mono text-zinc-300">{paidCount} Paid</span>
          </div>
        </GlassCard>

        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>TOTAL SETTLED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Recorded receipts</span>
            <StatusPill status="PAID" size="sm" label="Settled" />
          </div>
        </GlassCard>

        <GlassCard hoverLift className="p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span>OUTSTANDING BALANCE</span>
            <CreditCard className="w-4 h-4 text-[#22d3ee]" />
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
              {totalOutstanding === 0 ? "Account settled" : "Due for payment"}
            </span>
            <StatusPill
              status={totalOutstanding === 0 ? "PAID" : "CONFIRMED"}
              size="sm"
              label={totalOutstanding === 0 ? "Zero Balance" : "Due"}
            />
          </div>
        </GlassCard>
      </div>

      {/* Invoices List Table */}
      <GlassCard className="p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Invoices History
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-zinc-300 font-mono">
              {invoices.length}
            </span>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">No Invoices Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              Your invoices will appear here once your subscriptions have been billed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Subscription</th>
                  <th className="pb-3">Issue Date</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 text-right">Total Amount</th>
                  <th className="pb-3 text-right">Paid</th>
                  <th className="pb-3 text-right">Outstanding</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {invoices.map((inv) => {
                  const issueFormatted = format(new Date(inv.issueDate), "MMM dd, yyyy");
                  const dueFormatted = format(new Date(inv.dueDate), "MMM dd, yyyy");

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 text-white font-bold">{inv.number}</td>
                      <td className="py-3.5 font-sans">
                        <Link
                          href={`/portal/subscriptions/${inv.subscriptionId}`}
                          className="text-[#22d3ee] hover:underline flex items-center gap-1"
                        >
                          {inv.subscription.number}
                        </Link>
                        <span className="text-[11px] text-zinc-400 block">
                          {inv.subscription.plan.name}
                        </span>
                      </td>
                      <td className="py-3.5 text-zinc-300">{issueFormatted}</td>
                      <td className="py-3.5 text-zinc-300">{dueFormatted}</td>
                      <td className="py-3.5 text-right text-white font-bold">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="py-3.5 text-right text-emerald-400">
                        {formatCurrency(inv.paidTotal)}
                      </td>
                      <td
                        className={`py-3.5 text-right font-bold ${
                          inv.outstanding > 0 ? "text-amber-400" : "text-zinc-400"
                        }`}
                      >
                        {formatCurrency(inv.outstanding)}
                      </td>
                      <td className="py-3.5 text-center font-sans">
                        <StatusPill status={inv.status} size="sm" label={inv.status} />
                      </td>
                      <td className="py-3.5 text-right font-sans">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors shadow-sm"
                          title="Download official PDF invoice"
                        >
                          <FileDown className="w-3.5 h-3.5 text-[#22d3ee]" />
                          Download PDF
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

