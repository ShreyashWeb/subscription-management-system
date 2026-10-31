import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSubscription } from "@/server/services/subscriptions";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import { StatusStepper } from "@/components/subscriptions/status-stepper";
import { SubscriptionActions } from "@/components/subscriptions/subscription-actions";
import {
  Repeat,
  Calendar,
  Clock,
  User,
  Layers,
  ArrowLeft,
  Receipt,
  Activity,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Subscription Details - Brightloop Billing",
  description: "Subscription contract lifecycle, line items, and audit trail",
};

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const isAdminOrStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  const { id } = await params;

  let subscription: any;
  let availablePlans: any[] = [];
  try {
    [subscription, availablePlans] = await Promise.all([
      getSubscription(id),
      db.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } }),
    ]);
  } catch {
    notFound();
  }

  const {
    number,
    status,
    isPaused,
    customer,
    plan,
    startDate,
    expiryDate,
    nextInvoiceDate,
    quotationValidUntil,
    paymentTermsDays,
    lines,
    subtotal,
    totalTax,
    totalRecurring,
    activities,
  } = subscription;

  return (
    <div className="space-y-6">
      {/* Top Back Link & Header */}
      <div>
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Subscriptions</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white shadow-lg shadow-[#6d5dfc]/30">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">
                  {number}
                </h1>
                <StatusPill
                  status={status}
                  label={isPaused && status === "ACTIVE" ? "PAUSED" : undefined}
                />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Contract for <span className="text-zinc-200 font-medium">{customer.name}</span> ({customer.email})
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <SubscriptionActions
            subscription={subscription as any}
            isAdminOrStaff={isAdminOrStaff}
            availablePlans={availablePlans}
          />
        </div>
      </div>

      {/* Visual Lifecycle Stepper */}
      <StatusStepper status={status} isPaused={isPaused} />

      {/* Main Grid: Details + Lines + Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lines Table & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Lines Table */}
          <GlassCard className="p-0 overflow-hidden border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">
                Contract Line Items ({lines.length})
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">RECURRING BASIS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-400">
                  <tr>
                    <th className="py-3 px-6 font-medium">Product & Variant</th>
                    <th className="py-3 px-6 font-medium text-right">Quantity</th>
                    <th className="py-3 px-6 font-medium text-right">Unit Price</th>
                    <th className="py-3 px-6 font-medium text-right">Tax</th>
                    <th className="py-3 px-6 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lines.map((l: any) => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{l.product.name}</div>
                        {l.variant && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {l.variant.attribute}: {l.variant.value}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right font-mono text-zinc-200 font-semibold">
                        {l.quantity}
                      </td>

                      <td className="py-4 px-6 text-right font-mono text-zinc-300">
                        <Money amount={l.unitPrice} />
                      </td>

                      <td className="py-4 px-6 text-right font-mono text-zinc-400">
                        {l.tax ? (
                          <span>
                            {l.tax.name} ({l.tax.rateBps / 100}%)
                          </span>
                        ) : (
                          "0%"
                        )}
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-white">
                        <Money amount={l.lineTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Footer (Decision D9) */}
            <div className="p-6 bg-white/[0.015] border-t border-white/10 flex flex-col items-end gap-2 text-xs">
              <div className="flex items-center justify-between w-64 text-zinc-400">
                <span>Subtotal (Lines):</span>
                <span className="font-mono text-white font-medium">
                  <Money amount={subtotal} />
                </span>
              </div>

              <div className="flex items-center justify-between w-64 text-zinc-400">
                <span>Taxes:</span>
                <span className="font-mono text-zinc-300">
                  <Money amount={totalTax} />
                </span>
              </div>

              <div className="flex items-center justify-between w-64 pt-2 border-t border-white/10 text-sm font-bold text-white">
                <span>Recurring / {plan.period.toLowerCase()}:</span>
                <span className="font-mono text-[#22d3ee] text-base">
                  <Money amount={totalRecurring} />
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Activity Audit Timeline */}
          <GlassCard className="p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#22d3ee]" />
              <h3 className="text-sm font-semibold text-white">
                Subscription Lifecycle Audit Trail
              </h3>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-zinc-500">No activity logged yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#6d5dfc] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{act.action}</span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {format(new Date(act.at), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-zinc-400 mt-0.5">{act.detail}</p>
                      {act.actor && (
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                          By: {act.actor.name} ({act.actor.role})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right 1 Col: Contract Parameters & Schedule */}
        <div className="space-y-6">
          {/* Plan & Cycle Parameters */}
          <GlassCard className="p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Layers className="w-4 h-4 text-[#6d5dfc]" />
              <h3 className="text-sm font-semibold text-white">Plan & Term Rules</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Plan Name:</span>
                <span className="font-semibold text-white">{plan.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Billing Period:</span>
                <span className="px-2 py-0.5 rounded bg-[#22d3ee]/15 text-[#22d3ee] font-mono text-[10px] font-semibold">
                  {plan.period}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Payment Terms:</span>
                <span className="font-mono text-zinc-200">
                  {paymentTermsDays === 0 ? "Immediate Due" : `Net ${paymentTermsDays} Days`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Trial Period:</span>
                <span className="font-mono text-zinc-200">
                  {plan.trialDays > 0 ? `${plan.trialDays} Days` : "None"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Pausable:</span>
                <span className={plan.pausable ? "text-emerald-400" : "text-zinc-500"}>
                  {plan.pausable ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Renewable:</span>
                <span className={plan.renewable ? "text-emerald-400" : "text-zinc-500"}>
                  {plan.renewable ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Closable Early:</span>
                <span className={plan.closable ? "text-emerald-400" : "text-zinc-500"}>
                  {plan.closable ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Schedule Dates */}
          <GlassCard className="p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Calendar className="w-4 h-4 text-[#22d3ee]" />
              <h3 className="text-sm font-semibold text-white">Billing Schedule</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Start Date:</span>
                <span className="font-mono text-white font-medium">
                  {format(new Date(startDate), "MMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Contract Expiry:</span>
                <span className="font-mono text-zinc-300">
                  {expiryDate ? format(new Date(expiryDate), "MMM d, yyyy") : "Open-ended"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Next Invoicing Run:</span>
                <span className="font-mono font-bold text-[#22d3ee]">
                  {nextInvoiceDate
                    ? format(new Date(nextInvoiceDate), "MMM d, yyyy")
                    : "Not scheduled (Inactive)"}
                </span>
              </div>

              {quotationValidUntil && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Quote Valid Until:</span>
                  <span className="font-mono text-zinc-300">
                    {format(new Date(quotationValidUntil), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

