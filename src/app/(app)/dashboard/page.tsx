import React from "react";
import { requireRole } from "@/server/policies/permissions";
import { reportsService, DashboardFilterParams } from "@/server/services/reports";
import { db } from "@/lib/db";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardFilterParams>;
}) {
  // Authorization: Admin and Staff only (Customers use /portal)
  await requireRole(["ADMIN", "STAFF"]);

  const params = await searchParams;

  // Run aggregates and plan query in parallel
  const [summary, plans] = await Promise.all([
    reportsService.getDashboardSummary(params),
    db.plan.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <DashboardView initialSummary={summary} plans={plans} />;
}
