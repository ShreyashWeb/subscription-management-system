import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { searchService } from "@/server/services/search";
import { calculateProrationMath } from "@/server/services/proration";
import { BillingPeriod } from "@prisma/client";
import fs from "fs";
import path from "path";

describe("Phase 8: Standout Extras, Command Palette & Polish", () => {
  it("1. Pricing Plans: Seeded plans exist with correct multi-period intervals", async () => {
    const plans = await db.plan.findMany({
      where: {
        name: {
          in: [
            "Daily Developer Sandbox",
            "Weekly Growth Sprint",
            "Professional Monthly",
            "Enterprise Annual Plan",
          ],
        },
      },
    });

    expect(plans.length).toBeGreaterThanOrEqual(4);

    const daily = plans.find((p) => p.name === "Daily Developer Sandbox");
    const weekly = plans.find((p) => p.name === "Weekly Growth Sprint");
    const monthly = plans.find((p) => p.name === "Professional Monthly");
    const yearly = plans.find((p) => p.name === "Enterprise Annual Plan");

    expect(daily?.period).toBe(BillingPeriod.DAILY);
    expect(daily?.price).toBe(20000);

    expect(weekly?.period).toBe(BillingPeriod.WEEKLY);
    expect(weekly?.price).toBe(150000);
    expect(weekly?.trialDays).toBe(3);

    expect(monthly?.period).toBe(BillingPeriod.MONTHLY);
    expect(monthly?.price).toBe(485000);
    expect(monthly?.trialDays).toBe(14);

    expect(yearly?.period).toBe(BillingPeriod.YEARLY);
    expect(yearly?.price).toBe(4800000);
    expect(yearly?.trialDays).toBe(30);
  });

  it("2. Command Palette Global Search handles queries and empty strings safely", async () => {
    const resEmpty = await searchService.searchGlobal({ query: "" });
    expect(resEmpty).toEqual({ subscriptions: [], invoices: [], customers: [] });

    const resSpaces = await searchService.searchGlobal({ query: "   " });
    expect(resSpaces).toEqual({ subscriptions: [], invoices: [], customers: [] });

    // Search by SUB prefix
    const resSubs = await searchService.searchGlobal({ query: "SUB-", isInternal: true });
    expect(resSubs.subscriptions.length).toBeGreaterThan(0);
    expect(resSubs.subscriptions[0].number).toContain("SUB-");

    // Search by INV prefix
    const resInvs = await searchService.searchGlobal({ query: "INV-", isInternal: true });
    expect(resInvs.invoices.length).toBeGreaterThan(0);
    expect(resInvs.invoices[0].number).toContain("INV-");
  });

  it("3. Reduced Motion: globals.css contains prefers-reduced-motion overrides", () => {
    const cssPath = path.join(process.cwd(), "src/styles/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssContent).toContain("animation-duration: 0.01ms !important");
    expect(cssContent).toContain("animation: none !important");
  });

  it("4. Proration Preview calculation produces valid mathematical models", () => {
    const math = calculateProrationMath({
      oldRecurringTotal: 485000,
      newRecurringTotal: 4800000,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      changeDate: new Date("2026-01-16"),
    });

    expect(math.periodDays).toBe(31);
    expect(math.remainingDays).toBe(16);
    expect(math.isUpgrade).toBe(true);
    expect(math.adjustment).toBeGreaterThan(0);
  });
});
