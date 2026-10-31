"use server";

import { requireRole } from "@/server/policies/permissions";
import { reportsService, DashboardFilterParams, DashboardSummary, SaaSMetrics } from "@/server/services/reports";

/**
 * Server action to fetch dashboard summary with SQL aggregations and caching.
 * Authorized for Admin and Staff.
 */
export async function getDashboardSummaryAction(
  params: DashboardFilterParams = {}
): Promise<DashboardSummary> {
  await requireRole(["ADMIN", "STAFF"]);
  return reportsService.getDashboardSummary(params);
}

/**
 * Server action to fetch SaaS metrics (MRR, ARR, Churn, NRR, Movement).
 * Authorized for Admin and Staff.
 */
export async function getSaaSMetricsAction(months: number = 12): Promise<SaaSMetrics> {
  await requireRole(["ADMIN", "STAFF"]);
  return reportsService.getSaaSMetrics(months);
}

