import React from "react";
import { requireUser } from "@/server/policies/permissions";
import { paymentsService, PaymentMethod } from "@/server/services/payments";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import {
  CreditCard,
  Search,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { DeletePaymentButton } from "@/components/payments/delete-payment-button";

interface PaymentsPageProps {
  searchParams: Promise<{
    method?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const currentMethod = params.method || "ALL";
  const searchQuery = params.q || "";
  const currentPage = parseInt(params.page || "1", 10);

  const isStaffOrAdmin = user.role === "ADMIN" || user.role === "STAFF";
  const isAdmin = user.role === "ADMIN";

  const { items, total, totalPages, totalAmount } = await paymentsService.listPayments({
    method: currentMethod as any,
    search: searchQuery,
    customerId: user.role === "CUSTOMER" ? user.id : undefined,
    page: currentPage,
    pageSize: 20,
  });

  const methodTabs: { label: string; value: string }[] = [
    { label: "All Methods", value: "ALL" },
    { label: "Bank Transfer", value: "BANK_TRANSFER" },
    { label: "UPI", value: "UPI" },
    { label: "Card", value: "CARD" },
    { label: "Cash", value: "CASH" },
    { label: "Cheque", value: "CHEQUE" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>Payments</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isStaffOrAdmin
              ? "All recorded payments with transactional locks, overpayment guards, and balance tracking."
              : "View receipts of all settled payments on your account."}
          </p>
        </div>

        <Link
          href="/invoices"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
        >
          <span>View Invoices</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Total Payments Collected
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {formatMoney(totalAmount)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Across {total} successful transaction{total === 1 ? "" : "s"}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Total Transactions
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {total}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Reconciled to invoices
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
          {methodTabs.map((tab) => {
            const isActive = currentMethod === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/payments?method=${tab.value}${searchQuery ? `&q=${searchQuery}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" className="relative min-w-[260px]">
          <input type="hidden" name="method" value={currentMethod} />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search note, invoice, customer..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
          />
        </form>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Invoice #</th>
                {isStaffOrAdmin && <th className="py-3.5 px-4">Customer</th>}
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Reference Note</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={isStaffOrAdmin ? (isAdmin ? 7 : 6) : 5}
                    className="py-12 text-center text-zinc-500"
                  >
                    No payments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                        {new Date(p.paidOn).toISOString().slice(0, 10)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <Link
                          href={`/invoices/${p.invoice.id}`}
                          className="text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>{p.invoice.number}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>

                      {isStaffOrAdmin && (
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-white">
                            {p.invoice.customer.name}
                          </div>
                          {p.invoice.customer.company && (
                            <div className="text-[11px] text-zinc-500">
                              {p.invoice.customer.company}
                            </div>
                          )}
                        </td>
                      )}

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {p.method}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatMoney(p.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-xs truncate">
                        {p.note || <span className="text-zinc-600">—</span>}
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <DeletePaymentButton
                            paymentId={p.id}
                            amountFormatted={formatMoney(p.amount)}
                            invoiceNumber={p.invoice.number}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page {currentPage} of {totalPages} ({total} payments)
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/payments?method=${currentMethod}&page=${Math.max(
                  1,
                  currentPage - 1
                )}${searchQuery ? `&q=${searchQuery}` : ""}`}
                className={`px-3 py-1.5 rounded-lg border border-white/10 ${
                  currentPage <= 1
                    ? "opacity-50 pointer-events-none"
                    : "hover:bg-white/5"
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/payments?method=${currentMethod}&page=${Math.min(
                  totalPages,
                  currentPage + 1
                )}${searchQuery ? `&q=${searchQuery}` : ""}`}
                className={`px-3 py-1.5 rounded-lg border border-white/10 ${
                  currentPage >= totalPages
                    ? "opacity-50 pointer-events-none"
                    : "hover:bg-white/5"
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

