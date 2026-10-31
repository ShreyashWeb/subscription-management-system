import React from "react";
import { requireRole } from "@/server/policies/permissions";
import { discountsService } from "@/server/services/discounts";
import { prisma } from "@/lib/db";
import { DiscountDialog } from "@/components/discounts/discount-dialog";
import { formatMoney } from "@/lib/money";
import { Tag, CheckCircle2, AlertTriangle, XCircle, PowerOff } from "lucide-react";
import { deactivateDiscountAction } from "@/server/actions/discounts";
import { today } from "@/lib/dates";

export default async function DiscountsPage() {
  await requireRole(["ADMIN"]);

  const [discounts, products, subscriptions] = await Promise.all([
    discountsService.listDiscounts(),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subscription.findMany({
      select: {
        id: true,
        number: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const now = today();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-indigo-400" />
            <span>Discount Rules</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Admin rules automatically applied by the billing run. Supports fixed or percent, usage limits, and targets.
          </p>
        </div>

        <DiscountDialog
          products={products}
          subscriptions={subscriptions.map((s) => ({
            id: s.id,
            number: s.number,
            customerName: s.customer.name,
          }))}
        />
      </div>

      {/* Discounts Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Discount Name</th>
                <th className="py-3.5 px-4">Benefit</th>
                <th className="py-3.5 px-4">Scope</th>
                <th className="py-3.5 px-4">Usage Count</th>
                <th className="py-3.5 px-4">Validity Window</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No discount rules configured yet. Click "New Discount" to create one.
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => {
                  const isExpired =
                    discount.endDate && new Date(discount.endDate) < now;
                  const isExhausted =
                    discount.usageLimit !== null &&
                    discount.usedCount >= discount.usageLimit;

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  );

                  if (!discount.active) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        <PowerOff className="w-3 h-3" />
                        Inactive
                      </span>
                    );
                  } else if (isExhausted) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Exhausted
                      </span>
                    );
                  } else if (isExpired) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        Expired
                      </span>
                    );
                  }

                  const benefitLabel =
                    discount.type === "PERCENT"
                      ? `${(discount.value / 100).toFixed(2)}% OFF`
                      : `${formatMoney(discount.value)} OFF`;

                  const targetsCount = discount.targets.length;
                  const scopeLabel =
                    discount.scope === "PRODUCT"
                      ? `Product (${targetsCount} target${targetsCount === 1 ? "" : "s"})`
                      : targetsCount > 0
                      ? `Subscription (${targetsCount} target${targetsCount === 1 ? "" : "s"})`
                      : "Subscription (All)";

                  return (
                    <tr
                      key={discount.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {discount.name}
                        {discount.minPurchase > 0 && (
                          <div className="text-[11px] text-zinc-400 font-normal">
                            Min purchase: {formatMoney(discount.minPurchase)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-300">
                        {benefitLabel}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        {scopeLabel}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="text-white font-semibold">
                          {discount.usedCount}
                        </span>
                        <span className="text-zinc-500">
                          {" "}
                          / {discount.usageLimit ?? "∞"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        {new Date(discount.startDate).toISOString().slice(0, 10)}
                        {discount.endDate ? (
                          <span>
                            {" "}
                            → {new Date(discount.endDate).toISOString().slice(0, 10)}
                          </span>
                        ) : (
                          <span className="text-zinc-500"> (No expiry)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{statusBadge}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DiscountDialog
                            discount={discount as any}
                            products={products}
                            subscriptions={subscriptions.map((s) => ({
                              id: s.id,
                              number: s.number,
                              customerName: s.customer.name,
                            }))}
                          />

                          {discount.active && (
                            <form
                              action={async () => {
                                "use server";
                                await deactivateDiscountAction(discount.id);
                              }}
                            >
                              <button
                                type="submit"
                                title="Deactivate discount"
                                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <PowerOff className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
