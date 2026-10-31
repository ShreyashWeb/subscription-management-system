import React from "react";
import { requireRole } from "@/server/policies/permissions";
import { prisma } from "@/lib/db";
import { BillingRunner } from "@/components/billing/billing-runner";
import { today } from "@/lib/dates";

export default async function BillingRunPage() {
  await requireRole(["ADMIN", "STAFF"]);

  const now = today();
  const initialDueCount = await prisma.subscription.count({
    where: {
      status: "ACTIVE",
      nextInvoiceDate: { lte: now },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>Billing Run Engine</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Automated transactional billing runner with row locks, period catch-up, atomic discounts, and zero double billing.
        </p>
      </div>

      <BillingRunner initialDueCount={initialDueCount} />
    </div>
  );
}
