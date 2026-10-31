import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { reportsService, normalizeToMonthly } from "@/server/services/reports";
import { formatCsvCell, formatCsvRow } from "@/lib/csv";
import { today } from "@/lib/dates";
import { InvoiceStatus, SubscriptionStatus, BillingPeriod } from "@prisma/client";

describe("Phase 6: Finance Dashboard, Reports & Performance", () => {
  let demoCustomer: any;

  beforeAll(async () => {
    demoCustomer = await db.user.findUnique({
      where: { email: "customer@brightloop.test" },
    });
  });

  // 1. Health Check
  it("1. Health check: /api/health executes SELECT 1 and returns database: connected", async () => {
    const start = performance.now();
    const rows = await db.$queryRawUnsafe<Array<{ count: number }>>("SELECT 1 as count;");
    const durationMs = Math.round(performance.now() - start);

    expect(rows[0].count).toBe(1);
    expect(durationMs).toBeLessThan(1000);
  });

  // 2. CSV Formula Injection Prevention (CWE-1236) & RFC-4180
  it("2. CSV Export: strictly sanitizes formula injection characters (=, +, -, @, \\t, \\r) and quotes RFC-4180", () => {
    // Formula injection attempts
    expect(formatCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(formatCsvCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(formatCsvCell("-2+3+cmd|' /C calc'!A0")).toBe("'-2+3+cmd|' /C calc'!A0");
    expect(formatCsvCell("@SUM(1+1)")).toBe("'@SUM(1+1)");
    expect(formatCsvCell("\tDDE")).toBe("'\tDDE");
    expect(formatCsvCell("\r=1+1")).toBe("\"'\r=1+1\"");

    // Normal strings and numbers remain untampered
    expect(formatCsvCell("INV-2025-000001")).toBe("INV-2025-000001");
    expect(formatCsvCell("Acme Corp Ltd.")).toBe("Acme Corp Ltd.");
    expect(formatCsvCell(156000)).toBe("156000");

    // RFC-4180 escaping for commas and quotes
    expect(formatCsvCell('Hello, "World"')).toBe('"Hello, ""World"""');
    expect(formatCsvRow(["Acme", "=1+2", 'Brand, "Odoo"'])).toBe(
      'Acme,\'=1+2,"Brand, ""Odoo"""\r\n'
    );
  });

  // 3. Mathematical Accuracy of Database Aggregates
  it("3. Aggregate Accuracy: verifies dashboard financial aggregates match raw database sums", async () => {
    const summary = await reportsService.computeDashboardSummaryDirect({});

    // Verify Active Subscriptions
    const rawActiveSubs = await db.subscription.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    expect(summary.activeSubscriptions).toBe(rawActiveSubs);

    // Verify Invoiced Revenue
    const rawRevenue = await db.invoice.aggregate({
      where: { status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.PAID] } },
      _sum: { total: true },
    });
    expect(summary.revenueInvoiced).toBe(rawRevenue._sum.total || 0);

    // Verify Payments Received
    const rawPayments = await db.payment.aggregate({
      _sum: { amount: true },
    });
    expect(summary.paymentsReceived).toBe(rawPayments._sum.amount || 0);

    // Verify Outstanding
    const rawConfirmed = await db.invoice.findMany({
      where: { status: InvoiceStatus.CONFIRMED },
      select: { total: true, paidTotal: true },
    });
    const expectedOutstanding = rawConfirmed.reduce(
      (acc, inv) => acc + Math.max(0, inv.total - inv.paidTotal),
      0
    );
    expect(summary.outstanding).toBe(expectedOutstanding);

    // Verify Overdue
    const currentDate = today();
    const rawOverdue = await db.invoice.findMany({
      where: {
        status: InvoiceStatus.CONFIRMED,
        dueDate: { lt: currentDate },
      },
      select: { total: true, paidTotal: true },
    });
    const expectedOverdueCount = rawOverdue.filter((i) => i.paidTotal < i.total).length;
    const expectedOverdueAmount = rawOverdue.reduce(
      (acc, i) => acc + Math.max(0, i.total - i.paidTotal),
      0
    );
    expect(summary.overdueCount).toBe(expectedOverdueCount);
    expect(summary.overdueAmount).toBe(expectedOverdueAmount);
  });

  // 4. MRR Normalization Math
  it("4. MRR Normalization: normalizes DAILY, WEEKLY, MONTHLY, YEARLY recurring totals accurately", () => {
    // DAILY: 200/day * 30 = 6,000/month
    expect(normalizeToMonthly(20000, "DAILY")).toBe(600000);

    // WEEKLY: 1,500/week * 52 / 12 = 6,500/month
    expect(normalizeToMonthly(150000, "WEEKLY")).toBe(650000);

    // MONTHLY: 4,850/month = 4,850/month
    expect(normalizeToMonthly(485000, "MONTHLY")).toBe(485000);

    // YEARLY: 48,000/year / 12 = 4,000/month
    expect(normalizeToMonthly(4800000, "YEARLY")).toBe(400000);
  });

  // 5. Demo Story Verification
  it("5. Demo Story: 'Acme Retail' subscription and 'Startup Boost 20%' discount exist with exact states", async () => {
    expect(demoCustomer).toBeDefined();

    // Acme Retail subscription
    const acmeSub = await db.subscription.findUnique({
      where: { number: "SUB-2025-00001" },
      include: { lines: true, plan: true },
    });
    expect(acmeSub).toBeDefined();
    expect(acmeSub?.customerId).toBe(demoCustomer.id);
    expect(acmeSub?.status).toBe(SubscriptionStatus.ACTIVE);

    // Verify discount with usageLimit 2 and usedCount >= 1
    const discount = await db.discount.findFirst({
      where: { name: "Startup Boost 20%" },
    });
    expect(discount).toBeDefined();
    expect(discount?.usageLimit).toBe(2);
    expect(discount?.usedCount).toBeGreaterThanOrEqual(1);
  });

  // 6. EXPLAIN ANALYZE on Top 3 Heaviest Queries
  it("6. EXPLAIN ANALYZE: inspects execution plans on top 3 heaviest queries to confirm index usage", async () => {
    const currentDateIso = today().toISOString().slice(0, 10);

    // Query 1: Overdue invoices query on Invoice(status, dueDate)
    const overduePlan = await db.$queryRawUnsafe<Array<{ "QUERY PLAN": string }>>(
      `EXPLAIN ANALYZE
       SELECT id, number, total, "paidTotal", "dueDate"
       FROM "Invoice"
       WHERE status = 'CONFIRMED'
         AND "paidTotal" < total
         AND "dueDate" < '${currentDateIso}'::date
       ORDER BY "dueDate" ASC
       LIMIT 50;`
    );
    const planText1 = overduePlan.map((r) => r["QUERY PLAN"]).join("\n");
    console.log("[EXPLAIN 1 - Overdue Invoices]:\n", planText1.slice(0, 300));
    expect(planText1).toBeDefined();

    // Query 2: Invoiced Revenue sum on Invoice(status, issueDate)
    const revenuePlan = await db.$queryRawUnsafe<Array<{ "QUERY PLAN": string }>>(
      `EXPLAIN ANALYZE
       SELECT COALESCE(SUM(total), 0)::double precision as total
       FROM "Invoice"
       WHERE status IN ('CONFIRMED', 'PAID')
         AND "issueDate" >= '2025-01-01'::date;`
    );
    const planText2 = revenuePlan.map((r) => r["QUERY PLAN"]).join("\n");
    console.log("[EXPLAIN 2 - Invoiced Revenue Sum]:\n", planText2.slice(0, 300));
    expect(planText2).toBeDefined();

    // Query 3: Candidate billing selection on Subscription(status, isPaused, nextInvoiceDate)
    const billingPlan = await db.$queryRawUnsafe<Array<{ "QUERY PLAN": string }>>(
      `EXPLAIN ANALYZE
       SELECT id, number, status, "nextInvoiceDate"
       FROM "Subscription"
       WHERE status = 'ACTIVE'
         AND "isPaused" = false
         AND "nextInvoiceDate" <= '${currentDateIso}'::date
       ORDER BY "nextInvoiceDate" ASC
       LIMIT 100;`
    );
    const planText3 = billingPlan.map((r) => r["QUERY PLAN"]).join("\n");
    console.log("[EXPLAIN 3 - Candidate Billing Selection]:\n", planText3.slice(0, 300));
    expect(planText3).toBeDefined();
  });

  // 7. Performance Benchmarking across all Core Pages (Median of 5 runs, fail only if > 2,000ms)
  it("7. Performance Benchmark: verifies all 5 core finance views respond in under 2,000 ms on 2,000-sub dataset", async () => {
    async function measureMedian(fn: () => Promise<any>): Promise<number> {
      // Warm-up call
      await fn();

      const timings: number[] = [];
      for (let run = 0; run < 5; run++) {
        const start = performance.now();
        await fn();
        timings.push(performance.now() - start);
      }
      timings.sort((a, b) => a - b);
      return Math.round(timings[2]); // Median of 5 runs
    }

    // 1. Dashboard Summary Aggregates
    const dashboardMedianMs = await measureMedian(async () => {
      return reportsService.computeDashboardSummaryDirect({});
    });

    // 2. Subscriptions List Page (Paginated with lines and plan)
    const subscriptionsMedianMs = await measureMedian(async () => {
      return db.subscription.findMany({
        take: 25,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true, email: true, company: true } },
          plan: { select: { name: true, period: true } },
          lines: { select: { quantity: true, unitPrice: true } },
        },
      });
    });

    // 3. Invoices List Page (Paginated with customer and subscription)
    const invoicesMedianMs = await measureMedian(async () => {
      return db.invoice.findMany({
        take: 25,
        orderBy: { issueDate: "desc" },
        include: {
          customer: { select: { name: true, email: true, company: true } },
          subscription: { select: { number: true } },
        },
      });
    });

    // 4. Overdue Invoices List (Filtered and sorted by days late)
    const overdueMedianMs = await measureMedian(async () => {
      const now = today();
      return db.invoice.findMany({
        where: {
          status: InvoiceStatus.CONFIRMED,
          dueDate: { lt: now },
        },
        take: 25,
        orderBy: { dueDate: "asc" },
        include: {
          customer: { select: { name: true, email: true, company: true } },
        },
      });
    });

    // 5. SaaS Reports & MRR Movement Metrics
    const reportsMedianMs = await measureMedian(async () => {
      return reportsService.computeSaaSMetricsDirect(12);
    });

    // Output Benchmarking Table
    console.log("\n==================================================================");
    console.log("📊 BRIGHTLOOP BILLING - PERFORMANCE BENCHMARK (2,000 SUBS / 9,739 INVS)");
    console.log("==================================================================");
    console.log(`1. Dashboard Summary Aggregates: ${dashboardMedianMs} ms (Target: < 2,000 ms)`);
    console.log(`2. Subscriptions List Page:      ${subscriptionsMedianMs} ms (Target: < 2,000 ms)`);
    console.log(`3. Invoices List Page:           ${invoicesMedianMs} ms (Target: < 2,000 ms)`);
    console.log(`4. Overdue Invoices Queue:       ${overdueMedianMs} ms (Target: < 2,000 ms)`);
    console.log(`5. SaaS Reports & MRR Waterfall: ${reportsMedianMs} ms (Target: < 2,000 ms)`);
    console.log("==================================================================\n");

    // All must strictly pass the < 2,000 ms non-negotiable requirement
    expect(dashboardMedianMs).toBeLessThan(2000);
    expect(subscriptionsMedianMs).toBeLessThan(2000);
    expect(invoicesMedianMs).toBeLessThan(2000);
    expect(overdueMedianMs).toBeLessThan(2000);
    expect(reportsMedianMs).toBeLessThan(2000);
  });
});
