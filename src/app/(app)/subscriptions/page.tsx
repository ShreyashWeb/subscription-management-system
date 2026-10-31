import React from "react";
import { auth } from "@/lib/auth";
import { listSubscriptions } from "@/server/services/subscriptions";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import { SubscriptionDialog } from "@/components/subscriptions/subscription-dialog";
import {
  Repeat,
  Search,
  ArrowUpRight,
  User,
  Calendar,
  Layers,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";

export const metadata = {
  title: "Subscriptions - Brightloop Billing",
  description: "Subscription contracts, statuses, lines, and lifecycle transitions",
};

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  const isAdminOrStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const status = resolvedParams.status || "ALL";
  const page = parseInt(resolvedParams.page || "1", 10);

  const [subscriptionsRes, customers, plans, products, taxes, templates] =
    await Promise.all([
      listSubscriptions({
        search: q,
        status: status as any,
        page,
        pageSize: 20,
      }),
      db.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true, name: true, email: true },
      }),
      db.plan.findMany({ where: { active: true } }),
      db.product.findMany({
        where: { active: true },
        include: { variants: true },
      }),
      db.tax.findMany({ where: { active: true } }),
      db.quotationTemplate.findMany({
        select: { id: true, name: true, planId: true, validityDays: true },
      }),
    ]);

  const { items, total, totalPages } = subscriptionsRes;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Repeat className="w-6 h-6 text-[#22d3ee]" />
            Subscriptions
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Active customer contracts, quotation lifecycles, and period billing dates.
          </p>
        </div>

        {isAdminOrStaff && (
          <SubscriptionDialog
            customers={customers}
            plans={plans}
            products={products}
            taxes={taxes}
            templates={templates}
          />
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {[
          { label: "All Subscriptions", value: "ALL" },
          { label: "Draft", value: "DRAFT" },
          { label: "Quotation", value: "QUOTATION" },
          { label: "Confirmed", value: "CONFIRMED" },
          { label: "Active", value: "ACTIVE" },
          { label: "Paused", value: "PAUSED" },
          { label: "Closed", value: "CLOSED" },
        ].map((tab) => {
          const isActive = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/subscriptions?status=${tab.value}&q=${q}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#6d5dfc]/25 border border-[#6d5dfc]/50 text-white shadow-[0_0_15px_rgba(109,93,252,0.3)]"
                  : "bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Subscriptions Table */}
      <GlassCard className="p-0 overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <form method="GET" className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by SUB number, customer, email, plan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
            />
            <input type="hidden" name="status" value={status} />
          </form>

          <span className="text-[11px] text-zinc-400 font-mono">
            SHOWING {items.length} OF {total}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No subscriptions found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-400">
                <tr>
                  <th className="py-3 px-6 font-medium">Subscription #</th>
                  <th className="py-3 px-6 font-medium">Customer</th>
                  <th className="py-3 px-6 font-medium">Plan & Period</th>
                  <th className="py-3 px-6 font-medium">Recurring Total</th>
                  <th className="py-3 px-6 font-medium">Next Invoice</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold text-white">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="hover:text-[#22d3ee] transition-colors"
                      >
                        {sub.number}
                      </Link>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="font-medium text-white">{sub.customer.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {sub.customer.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="text-zinc-200 font-medium">{sub.plan.name}</div>
                      <span className="px-1.5 py-0.2 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">
                        {sub.plan.period}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 font-mono font-semibold text-white">
                      <Money amount={sub.totalAmount} />
                    </td>

                    <td className="py-3.5 px-6 font-mono text-zinc-400 text-xs">
                      {sub.nextInvoiceDate
                        ? format(new Date(sub.nextInvoiceDate), "MMM d, yyyy")
                        : "—"}
                    </td>

                    <td className="py-3.5 px-6">
                      <StatusPill
                        status={sub.status}
                        label={
                          sub.isPaused && sub.status === "ACTIVE"
                            ? "PAUSED"
                            : undefined
                        }
                      />
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/subscriptions/${sub.id}`}
                        className="inline-flex items-center gap-1 text-[#22d3ee] hover:underline font-medium"
                      >
                        <span>Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/subscriptions?page=${page - 1}&q=${q}&status=${status}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/subscriptions?page=${page + 1}&q=${q}&status=${status}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

