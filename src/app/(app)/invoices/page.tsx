import React from "react";
import { requireUser } from "@/server/policies/permissions";
import { invoicesService } from "@/server/services/invoices";
import { formatMoney } from "@/lib/money";
import { StatusPill } from "@/components/glass/status-pill";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Download,
  AlertCircle,
  Clock,
  ArrowRight,
  CreditCard,
  Plus,
} from "lucide-react";
import { confirmAllDraftsAction } from "@/server/actions/invoices";
import { revalidatePath } from "next/cache";

interface InvoicesPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const currentStatus = params.status || "ALL";
  const searchQuery = params.q || "";
  const currentPage = parseInt(params.page || "1", 10);

  const { items, total, totalPages, totalAmount, totalOutstanding } =
    await invoicesService.listInvoices({
      status: currentStatus as any,
      search: searchQuery,
      customerId: user.role === "CUSTOMER" ? user.id : undefined,
      page: currentPage,
      pageSize: 20,
    });

  const isStaffOrAdmin = user.role === "ADMIN" || user.role === "STAFF";

  const statusTabs = [
    { label: "All", value: "ALL" },
    { label: "Draft", value: "DRAFT" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Paid", value: "PAID" },
    { label: "Overdue", value: "OVERDUE" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Invoices</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isStaffOrAdmin
              ? "All generated invoices with status tracking, discounts, taxes, and PDF exports."
              : "View and download your billing statements and payment receipts."}
          </p>
        </div>

        {isStaffOrAdmin && (
          <div className="flex items-center gap-3">
            <form
              action={async () => {
                "use server";
                await confirmAllDraftsAction();
                revalidatePath("/invoices");
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirm All Drafts</span>
              </button>
            </form>

            <Link
              href="/billing-run"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all"
            >
              <span>Run Billing Engine</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Total Invoiced
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {formatMoney(totalAmount)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Across {total} matching invoice(s)
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Collected Payments
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatMoney(totalAmount - totalOutstanding)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Recorded to date</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Outstanding Balance
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {formatMoney(totalOutstanding)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Pending settlement</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
          {statusTabs.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/invoices?status=${tab.value}${searchQuery ? `&q=${searchQuery}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-500 text-white shadow"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" className="relative min-w-[260px]">
          <input type="hidden" name="status" value={currentStatus} />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search invoice, customer, sub..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </form>
      </div>

      {/* Invoices Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                {isStaffOrAdmin && <th className="py-3.5 px-4">Customer</th>}
                <th className="py-3.5 px-4">Subscription</th>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={isStaffOrAdmin ? 9 : 8}
                    className="py-12 text-center text-zinc-500"
                  >
                    No invoices match your current filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((inv) => {
                  const outstanding = Math.max(0, inv.total - inv.paidTotal);
                  const isOverdue =
                    inv.status === "CONFIRMED" &&
                    new Date(inv.dueDate) < new Date() &&
                    outstanding > 0;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{inv.number}</span>
                        </Link>
                      </td>

                      {isStaffOrAdmin && (
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white">
                            {inv.customer.name}
                          </div>
                          {inv.customer.company && (
                            <div className="text-[11px] text-zinc-400">
                              {inv.customer.company}
                            </div>
                          )}
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-xs font-mono">
                        <Link
                          href={`/subscriptions/${inv.subscription.id}`}
                          className="text-indigo-400 hover:underline"
                        >
                          {inv.subscription.number}
                        </Link>
                        <div className="text-[11px] text-zinc-500 font-sans">
                          {inv.subscription.plan.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                        {new Date(inv.periodStart).toISOString().slice(0, 10)} →{" "}
                        {new Date(inv.periodEnd).toISOString().slice(0, 10)}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono">
                        <span className={isOverdue ? "text-rose-400 font-bold" : "text-zinc-400"}>
                          {new Date(inv.dueDate).toISOString().slice(0, 10)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusPill
                          status={isOverdue ? "OVERDUE" : inv.status}
                          size="sm"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                        {formatMoney(inv.total)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs">
                        {outstanding > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            {formatMoney(outstanding)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Paid</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page {currentPage} of {totalPages} ({total} invoices)
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/invoices?status=${currentStatus}&page=${Math.max(
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
                href={`/invoices?status=${currentStatus}&page=${Math.min(
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

