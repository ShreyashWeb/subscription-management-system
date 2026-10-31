import React from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { portalService } from "@/server/services/portal";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatCurrency } from "@/lib/money";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Receipt,
  FileDown,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { SubscriptionActions } from "@/components/portal/subscription-actions";

export const metadata = {
  title: "Subscription Details - Brightloop Portal",
  description: "View details, line items, and manage your subscription contract",
};

export default async function CustomerSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const customerId = session.user.id;

  let subscription: any;
  let availablePlans: any[] = [];

  try {
    [subscription, availablePlans] = await Promise.all([
      portalService.getSubscription(customerId, id),
      portalService.getAvailablePlans(),
    ]);
  } catch (err: any) {
    // 404 security requirement: return 404 if record not found or owned by another customer
    notFound();
  }

  const startDateFormatted = format(new Date(subscription.startDate), "MMM dd, yyyy");
  const nextInvoiceFormatted = subscription.nextInvoiceDate
    ? format(new Date(subscription.nextInvoiceDate), "MMM dd, yyyy")
    : "None scheduled";
  const expiryFormatted = subscription.expiryDate
    ? format(new Date(subscription.expiryDate), "MMM dd, yyyy")
    : "Continuous (Auto-renewing)";

  const steps = [
    { key: "DRAFT", label: "Draft" },
    { key: "QUOTATION", label: "Quotation" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "ACTIVE", label: "Active" },
    { key: "CLOSED", label: "Closed" },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === subscription.status);

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to My Subscriptions
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {subscription.number}
            </h1>
            <StatusPill
              status={subscription.displayStatus as any}
              size="md"
              label={subscription.displayStatus}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Contract started on {startDateFormatted} • Plan: {subscription.plan.name}
          </p>
        </div>
      </div>

      {/* Status Stepper Progression */}
      <GlassCard className="p-6 border border-white/10">
        <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Lifecycle Progression
        </div>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-white/10 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee] -z-0 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%`,
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx && subscription.status !== "CLOSED";
            const isCurrent = step.key === subscription.status;

            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center gap-1.5 bg-zinc-950 px-2"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-[#22d3ee] text-black shadow-md shadow-[#22d3ee]/40 ring-4 ring-[#22d3ee]/20"
                      : isCompleted
                      ? "bg-[#6d5dfc] text-white"
                      : "bg-white/10 text-zinc-400 border border-white/10"
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isCurrent
                      ? "text-[#22d3ee] font-bold"
                      : isCompleted
                      ? "text-zinc-200"
                      : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Self-Service Controls (Pause, Resume, Cancel, Change Plan) */}
      <SubscriptionActions
        subscription={subscription}
        availablePlans={availablePlans}
      />

      {/* Grid: Plan Specifications and Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Terms */}
        <GlassCard className="p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22d3ee]" />
              Contract Terms & Policy
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {subscription.plan.period}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Billing Interval:</span>
              <span className="font-semibold text-white capitalize">
                {subscription.plan.period.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Next Scheduled Invoice:</span>
              <span className="font-mono text-white">{nextInvoiceFormatted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Contract Expiry:</span>
              <span className="font-mono text-zinc-300">{expiryFormatted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Trial Period:</span>
              <span className="font-mono text-zinc-300">
                {subscription.plan.trialDays > 0
                  ? `${subscription.plan.trialDays} days`
                  : "None"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Pausable:</span>
              <span
                className={`font-semibold ${
                  subscription.plan.pausable ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {subscription.plan.pausable ? "Permitted" : "Not Permitted"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Cancellation Policy:</span>
              <span
                className={`font-semibold ${
                  subscription.plan.closable ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {subscription.plan.closable ? "Cancel Anytime" : "Fixed-Term Contract"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Financial Breakdown */}
        <GlassCard className="p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#6d5dfc]" />
              Recurring Billing Rate
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Per {subscription.plan.period.toLowerCase()}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Subtotal (Pre-Tax):</span>
              <span className="font-mono text-white">
                {formatCurrency(subscription.recurringTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Estimated Taxes:</span>
              <span className="font-mono text-zinc-300">
                {formatCurrency(subscription.recurringTax)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm font-bold">
              <span className="text-white">Total Recurring:</span>
              <span className="font-mono text-base text-[#22d3ee]">
                {formatCurrency(subscription.totalWithTax)}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Included Services / Subscription Lines */}
      <GlassCard className="p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#22d3ee]" />
            Included Services & Line Items ({subscription.lines.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-semibold">
                <th className="pb-3">Product / Service</th>
                <th className="pb-3">Variant</th>
                <th className="pb-3 text-right">Quantity</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Tax Rate</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {subscription.lines.map((line: any) => (
                <tr key={line.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-sans font-medium text-white">
                    {line.product.name}
                  </td>
                  <td className="py-3 text-zinc-400">
                    {line.variant
                      ? `${line.variant.attribute}: ${line.variant.value}`
                      : "—"}
                  </td>
                  <td className="py-3 text-right text-zinc-300">{line.quantity}</td>
                  <td className="py-3 text-right text-zinc-300">
                    {formatCurrency(line.unitPrice)}
                  </td>
                  <td className="py-3 text-right text-zinc-400">
                    {line.tax ? `${(line.tax.rateBps / 100).toFixed(1)}%` : "0%"}
                  </td>
                  <td className="py-3 text-right text-white font-semibold">
                    {formatCurrency(line.totalWithTax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Recent Invoices for this Subscription */}
      <GlassCard className="p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#6d5dfc]" />
            Billed Invoices History
          </h3>
          <Link
            href="/portal/invoices"
            className="text-xs text-[#22d3ee] hover:underline"
          >
            View All Invoices →
          </Link>
        </div>

        {subscription.invoices.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-400">
            No invoices generated yet for this subscription.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Issue Date</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Paid</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {subscription.invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-white font-semibold">{inv.number}</td>
                    <td className="py-3 text-zinc-400">
                      {format(new Date(inv.issueDate), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 text-zinc-400">
                      {format(new Date(inv.dueDate), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 text-right text-white font-bold">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3 text-right text-emerald-400">
                      {formatCurrency(inv.paidTotal)}
                    </td>
                    <td className="py-3 text-center font-sans">
                      <StatusPill status={inv.status} size="sm" label={inv.status} />
                    </td>
                    <td className="py-3 text-right font-sans">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                      >
                        <FileDown className="w-3 h-3 text-[#22d3ee]" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

