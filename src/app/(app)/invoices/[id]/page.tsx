import React from "react";
import { requireUser } from "@/server/policies/permissions";
import { invoicesService } from "@/server/services/invoices";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { StatusPill } from "@/components/glass/status-pill";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { DunningTimeline } from "@/components/invoices/dunning-timeline";
import { DeletePaymentButton } from "@/components/payments/delete-payment-button";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  User,
  Repeat,
  Tag,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const invoice = await invoicesService.getInvoice(id);

  if (!invoice) {
    notFound();
  }

  // Ownership check: Customer can only view own invoices; 404 otherwise
  if (user.role === "CUSTOMER" && invoice.customerId !== user.id) {
    notFound();
  }

  const isStaffOrAdmin = user.role === "ADMIN" || user.role === "STAFF";
  const isAdmin = user.role === "ADMIN";
  const outstanding = Math.max(0, invoice.total - invoice.paidTotal);
  const diffTime = new Date().getTime() - new Date(invoice.dueDate).getTime();
  const daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue =
    invoice.status === "CONFIRMED" &&
    daysLate >= 1 &&
    outstanding > 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/invoices"
              className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Invoices</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white font-mono">
              {invoice.number}
            </h1>
            <StatusPill
              status={isOverdue ? "OVERDUE" : invoice.status}
              size="md"
            />
          </div>
        </div>

        <InvoiceActions
          invoice={{
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            total: invoice.total,
            paidTotal: invoice.paidTotal,
            sentAt: invoice.sentAt,
          }}
          isStaffOrAdmin={isStaffOrAdmin}
        />
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Invoiced
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {formatMoney(invoice.total)}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Amount Paid
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatMoney(invoice.paidTotal)}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
            Outstanding Due
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {formatMoney(outstanding)}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
            Billing Period
          </div>
          <div className="text-xs font-mono text-zinc-300 mt-2">
            {new Date(invoice.periodStart).toISOString().slice(0, 10)} →{" "}
            {new Date(invoice.periodEnd).toISOString().slice(0, 10)}
          </div>
        </div>
      </div>

      {/* Parties & Dates Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>Customer Details</span>
          </div>
          <div>
            <div className="font-bold text-white text-base">
              {invoice.customer.name}
            </div>
            {invoice.customer.company && (
              <div className="text-xs text-zinc-300 font-medium">
                {invoice.customer.company}
              </div>
            )}
            <div className="text-xs text-zinc-400 mt-0.5">
              {invoice.customer.email}
            </div>
            {invoice.customer.address && (
              <div className="text-xs text-zinc-500 mt-1">
                {invoice.customer.address}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Repeat className="w-4 h-4" />
            <span>Subscription</span>
          </div>
          <div>
            <Link
              href={`/subscriptions/${invoice.subscription.id}`}
              className="font-mono font-bold text-indigo-400 hover:underline text-base"
            >
              {invoice.subscription.number}
            </Link>
            <div className="text-xs text-zinc-300 mt-0.5 font-medium">
              Plan: {invoice.subscription.plan.name}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Payment Terms: {invoice.subscription.paymentTermsDays} days
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Key Dates</span>
          </div>
          <div className="text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Issue Date:</span>
              <span className="text-white">
                {new Date(invoice.issueDate).toISOString().slice(0, 10)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Due Date:</span>
              <span className={isOverdue ? "text-rose-400 font-bold" : "text-white"}>
                {new Date(invoice.dueDate).toISOString().slice(0, 10)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Email Sent:</span>
              <span className="text-zinc-400">
                {invoice.sentAt ? new Date(invoice.sentAt).toLocaleDateString() : "Not sent yet"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Lines Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Billed Line Items</span>
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {invoice.lines.length} item{invoice.lines.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {invoice.lines.map((line) => (
                <tr key={line.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 font-sans text-sm font-medium text-white">
                    {line.description}
                  </td>
                  <td className="py-3.5 px-4 text-right">{line.quantity}</td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatMoney(line.lineSubtotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {line.discountAmount > 0 ? (
                      <div className="text-emerald-400 font-semibold">
                        -{formatMoney(line.discountAmount)}
                        {line.discount && (
                          <div className="text-[10px] text-zinc-500 font-sans">
                            {line.discount.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">
                    {formatMoney(line.taxAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                    {formatMoney(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="p-6 bg-white/[0.02] border-t border-white/10 flex flex-col items-end">
          <div className="w-full max-w-xs space-y-2 text-xs font-mono">
            <div className="flex justify-between text-zinc-400">
              <span>Lines Subtotal:</span>
              <span className="text-white">{formatMoney(invoice.subtotal)}</span>
            </div>

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Total Discounts:</span>
                <span>-{formatMoney(invoice.discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-zinc-400">
              <span>Tax Total:</span>
              <span className="text-white">{formatMoney(invoice.taxTotal)}</span>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
              <span>Grand Total:</span>
              <span className="text-indigo-400 text-base">
                {formatMoney(invoice.total)}
              </span>
            </div>

            {invoice.paidTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Amount Paid:</span>
                <span>{formatMoney(invoice.paidTotal)}</span>
              </div>
            )}

            <div className="pt-1 flex justify-between text-xs font-bold text-rose-400">
              <span>Outstanding Balance:</span>
              <span>{formatMoney(outstanding)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dunning Reminder Stages Timeline */}
      {(isOverdue || invoice.reminders.length > 0) && (
        <DunningTimeline
          invoiceId={invoice.id}
          daysLate={daysLate}
          isOverdue={isOverdue}
          reminders={invoice.reminders}
          isStaffOrAdmin={isStaffOrAdmin}
        />
      )}

      {/* Recorded Payments Section */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Recorded Payments History</span>
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {invoice.payments.length} payment{invoice.payments.length === 1 ? "" : "s"}
          </span>
        </div>

        {invoice.payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No payments recorded against this invoice yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Note / Reference</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 text-zinc-300">
                      {new Date(p.paidOn).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-zinc-400">
                      {p.note || "—"}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <DeletePaymentButton
                          paymentId={p.id}
                          amountFormatted={formatMoney(p.amount)}
                          invoiceNumber={invoice.number}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Audit Activity Timeline</span>
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {invoice.activities.length === 0 ? (
            <p className="text-zinc-500 font-sans text-xs">No audit logs recorded.</p>
          ) : (
            invoice.activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="font-bold text-zinc-300">{act.action}</span>
                    <span>{new Date(act.at).toLocaleString()}</span>
                  </div>
                  {act.detail && (
                    <p className="text-zinc-400 mt-0.5 font-sans">{act.detail}</p>
                  )}
                  {act.actor && (
                    <span className="text-[10px] text-zinc-500">
                      By {act.actor.name} ({act.actor.role})
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

