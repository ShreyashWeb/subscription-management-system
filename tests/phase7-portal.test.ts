import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { portalService } from "@/server/services/portal";
import { prorationService, calculateProrationMath } from "@/server/services/proration";
import { BillingPeriod, SubscriptionStatus, InvoiceStatus } from "@prisma/client";
import { today } from "@/lib/dates";
import { addDays, subDays } from "date-fns";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";

describe("Phase 7: Customer Portal, Proration Engine & Security", () => {
  const PREFIX = `test-p7-${Date.now()}`;
  let customerA: any;
  let customerB: any;
  let pausablePlan: any;
  let nonPausablePlan: any;
  let nonClosablePlan: any;
  let testProduct: any;

  let subA: any;
  let subB: any;
  let subNonPausable: any;
  let subNonClosable: any;
  let invA: any;
  let invB: any;

  beforeAll(async () => {
    // 1. Create two isolated test customers
    customerA = await db.user.create({
      data: {
        email: `${PREFIX}-customerA@example.com`,
        name: "Portal Customer A",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
      },
    });

    customerB = await db.user.create({
      data: {
        email: `${PREFIX}-customerB@example.com`,
        name: "Portal Customer B",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
      },
    });

    // 2. Create Plans with various flags
    pausablePlan = await db.plan.create({
      data: {
        name: `${PREFIX} Pausable Plan`,
        price: 100000, // 1,000.00
        period: BillingPeriod.MONTHLY,
        availableFrom: new Date("2020-01-01"),
        pausable: true,
        closable: true,
        renewable: true,
        active: true,
      },
    });

    nonPausablePlan = await db.plan.create({
      data: {
        name: `${PREFIX} Non-Pausable Plan`,
        price: 150000,
        period: BillingPeriod.MONTHLY,
        availableFrom: new Date("2020-01-01"),
        pausable: false,
        closable: true,
        renewable: true,
        active: true,
      },
    });

    nonClosablePlan = await db.plan.create({
      data: {
        name: `${PREFIX} Non-Closable Plan`,
        price: 200000,
        period: BillingPeriod.MONTHLY,
        availableFrom: new Date("2020-01-01"),
        pausable: true,
        closable: false,
        renewable: false,
        active: true,
      },
    });

    testProduct = await db.product.create({
      data: {
        name: `${PREFIX} Core Service`,
        type: "Software",
        salesPrice: 100000,
        costPrice: 40000,
        active: true,
      },
    });

    // 3. Create Subscriptions for Customer A and B
    subA = await db.subscription.create({
      data: {
        number: `SUB-${PREFIX}-001`,
        customerId: customerA.id,
        planId: pausablePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subDays(today(), 15),
        nextInvoiceDate: addDays(today(), 15),
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 1,
              unitPrice: 100000,
            },
          ],
        },
      },
    });

    subB = await db.subscription.create({
      data: {
        number: `SUB-${PREFIX}-002`,
        customerId: customerB.id,
        planId: pausablePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subDays(today(), 10),
        nextInvoiceDate: addDays(today(), 20),
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 2,
              unitPrice: 100000,
            },
          ],
        },
      },
    });

    subNonPausable = await db.subscription.create({
      data: {
        number: `SUB-${PREFIX}-003`,
        customerId: customerA.id,
        planId: nonPausablePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subDays(today(), 5),
        nextInvoiceDate: addDays(today(), 25),
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 1,
              unitPrice: 150000,
            },
          ],
        },
      },
    });

    subNonClosable = await db.subscription.create({
      data: {
        number: `SUB-${PREFIX}-004`,
        customerId: customerA.id,
        planId: nonClosablePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subDays(today(), 5),
        nextInvoiceDate: addDays(today(), 25),
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 1,
              unitPrice: 200000,
            },
          ],
        },
      },
    });

    // 4. Create Invoices for Customer A and B
    invA = await db.invoice.create({
      data: {
        number: `INV-${PREFIX}-001`,
        customerId: customerA.id,
        subscriptionId: subA.id,
        status: InvoiceStatus.CONFIRMED,
        issueDate: subDays(today(), 15),
        dueDate: today(),
        periodStart: subDays(today(), 15),
        periodEnd: addDays(today(), 15),
        subtotal: 100000,
        taxTotal: 0,
        total: 100000,
        paidTotal: 50000,
      },
    });

    invB = await db.invoice.create({
      data: {
        number: `INV-${PREFIX}-002`,
        customerId: customerB.id,
        subscriptionId: subB.id,
        status: InvoiceStatus.CONFIRMED,
        issueDate: subDays(today(), 10),
        dueDate: today(),
        periodStart: subDays(today(), 10),
        periodEnd: addDays(today(), 20),
        subtotal: 200000,
        taxTotal: 0,
        total: 200000,
        paidTotal: 0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup all created records
    await db.invoiceLine.deleteMany({
      where: {
        invoice: {
          OR: [{ customerId: customerA?.id }, { customerId: customerB?.id }],
        },
      },
    });

    await db.invoice.deleteMany({
      where: {
        OR: [{ customerId: customerA?.id }, { customerId: customerB?.id }],
      },
    });

    await db.subscriptionLine.deleteMany({
      where: {
        subscription: {
          OR: [{ customerId: customerA?.id }, { customerId: customerB?.id }],
        },
      },
    });

    await db.subscription.deleteMany({
      where: {
        OR: [{ customerId: customerA?.id }, { customerId: customerB?.id }],
      },
    });

    await db.product.deleteMany({
      where: { name: { startsWith: PREFIX } },
    });

    await db.plan.deleteMany({
      where: { name: { startsWith: PREFIX } },
    });

    await db.user.deleteMany({
      where: { id: { in: [customerA?.id, customerB?.id] } },
    });
  });

  describe("1. Proration Math Engine", () => {
    it("computes exact day difference and proration adjustment for mid-cycle upgrade", () => {
      // 31-day period from Jan 1 to Jan 31
      const periodStart = new Date("2026-01-01");
      const periodEnd = new Date("2026-01-31");
      // Change on Jan 16: remaining days = 31 - 16 + 1 = 16 days
      const changeDate = new Date("2026-01-16");

      const oldRecurringTotal = 100000; // 1,000.00
      const newRecurringTotal = 200000; // 2,000.00

      const result = calculateProrationMath({
        oldRecurringTotal,
        newRecurringTotal,
        periodStart,
        periodEnd,
        changeDate,
      });

      expect(result.periodDays).toBe(31);
      expect(result.remainingDays).toBe(16);
      // credit = round(100,000 * 16 / 31) = round(51612.9) = 51613
      expect(result.credit).toBe(51613);
      // charge = round(200,000 * 16 / 31) = round(103225.8) = 103226
      expect(result.charge).toBe(103226);
      // adjustment = 103226 - 51613 = +51613
      expect(result.adjustment).toBe(51613);
      expect(result.isUpgrade).toBe(true);
    });

    it("computes credit adjustment for mid-cycle downgrade", () => {
      const periodStart = new Date("2026-01-01");
      const periodEnd = new Date("2026-01-31");
      const changeDate = new Date("2026-01-16");

      const oldRecurringTotal = 200000;
      const newRecurringTotal = 100000;

      const result = calculateProrationMath({
        oldRecurringTotal,
        newRecurringTotal,
        periodStart,
        periodEnd,
        changeDate,
      });

      expect(result.credit).toBe(103226);
      expect(result.charge).toBe(51613);
      expect(result.adjustment).toBe(-51613);
    });
  });

  describe("2. Customer Scoping (POR-1)", () => {
    it("customer only sees their own subscriptions", async () => {
      const subsA = await portalService.getSubscriptions(customerA.id);
      const subIdsA = subsA.map((s) => s.id);

      expect(subIdsA).toContain(subA.id);
      expect(subIdsA).toContain(subNonPausable.id);
      expect(subIdsA).toContain(subNonClosable.id);
      // Sub B must NOT be visible to Customer A
      expect(subIdsA).not.toContain(subB.id);
    });

    it("customer only sees their own invoices", async () => {
      const invoicesA = await portalService.getInvoices(customerA.id);
      const invIdsA = invoicesA.map((i) => i.id);

      expect(invIdsA).toContain(invA.id);
      // Invoice B must NOT be visible to Customer A
      expect(invIdsA).not.toContain(invB.id);
    });
  });

  describe("3. Security 404 on Foreign Records", () => {
    it("returns NotFoundError (404) when customer requests another customer's subscription ID", async () => {
      // Customer A requesting Customer B's subscription must throw NotFoundError (404)
      await expect(
        portalService.getSubscription(customerA.id, subB.id)
      ).rejects.toThrowError(NotFoundError);
    });

    it("returns NotFoundError (404) when customer requests another customer's invoice ID", async () => {
      // Customer A requesting Customer B's invoice must throw NotFoundError (404)
      await expect(
        portalService.getInvoice(customerA.id, invB.id)
      ).rejects.toThrowError(NotFoundError);
    });

    it("returns valid details when accessing own records", async () => {
      const ownSub = await portalService.getSubscription(customerA.id, subA.id);
      expect(ownSub.id).toBe(subA.id);
      expect(ownSub.recurringTotal).toBe(100000);

      const ownInv = await portalService.getInvoice(customerA.id, invA.id);
      expect(ownInv.id).toBe(invA.id);
      expect(ownInv.outstanding).toBe(50000);
    });
  });

  describe("4. Plan Flag Restrictions (Pause & Cancel)", () => {
    it("rejects pause when plan has pausable = false", async () => {
      await expect(
        portalService.pauseSubscription(customerA.id, subNonPausable.id)
      ).rejects.toThrowError(/does not permit pausing/);
    });

    it("rejects early cancellation when plan has closable = false", async () => {
      await expect(
        portalService.cancelSubscription(customerA.id, subNonClosable.id)
      ).rejects.toThrowError(/does not permit early cancellation/);
    });

    it("successfully pauses and resumes a pausable subscription", async () => {
      // Pause
      const paused = await portalService.pauseSubscription(customerA.id, subA.id);
      expect(paused.isPaused).toBe(true);

      const detailPaused = await portalService.getSubscription(customerA.id, subA.id);
      expect(detailPaused.displayStatus).toBe("PAUSED");

      // Resume
      const resumed = await portalService.resumeSubscription(customerA.id, subA.id);
      expect(resumed.isPaused).toBe(false);

      const detailResumed = await portalService.getSubscription(customerA.id, subA.id);
      expect(detailResumed.displayStatus).toBe("ACTIVE");
    });
  });

  describe("5. Available Plans Listing", () => {
    it("returns available active plans", async () => {
      const plans = await portalService.getAvailablePlans();
      const planNames = plans.map((p) => p.name);

      expect(planNames).toContain(pausablePlan.name);
      expect(planNames).toContain(nonPausablePlan.name);
      expect(planNames).toContain(nonClosablePlan.name);
    });
  });

  describe("6. Proration Service Application & Adjustment Invoice", () => {
    it("previews and applies mid-cycle upgrade, creating proration invoice and activity log", async () => {
      // 1. Preview quantity increase from 1 to 2 seats
      const preview = await prorationService.previewChange({
        subscriptionId: subA.id,
        customerId: customerA.id,
        newLines: [
          {
            productId: testProduct.id,
            quantity: 2,
            unitPrice: 100000,
          },
        ],
      });

      expect(preview.isUpgrade).toBe(true);
      expect(preview.newRecurringTotal).toBe(200000);
      expect(preview.oldRecurringTotal).toBe(100000);
      expect(preview.adjustment).toBeGreaterThan(0);

      // 2. Apply change
      const result = await prorationService.applyChange({
        subscriptionId: subA.id,
        customerId: customerA.id,
        newLines: [
          {
            productId: testProduct.id,
            quantity: 2,
            unitPrice: 100000,
          },
        ],
        actorId: customerA.id,
      });

      expect(result.invoiceId).toBeDefined();

      // 3. Verify proration invoice in database
      const prorationInvoice = await db.invoice.findUnique({
        where: { id: result.invoiceId },
        include: { lines: true },
      });

      expect(prorationInvoice).not.toBeNull();
      expect(prorationInvoice?.status).toBe(InvoiceStatus.CONFIRMED);
      expect(prorationInvoice?.total).toBe(preview.adjustment);
      expect(prorationInvoice?.lines[0].description).toContain("Proration Adjustment");

      // 4. Verify subscription lines updated going forward
      const updatedSub = await db.subscription.findUnique({
        where: { id: subA.id },
        include: { lines: true },
      });
      expect(updatedSub?.lines[0].quantity).toBe(2);

      // 5. Verify EXPANSION logged in ActivityLog
      const activity = await db.activityLog.findFirst({
        where: {
          entity: "subscription",
          entityId: subA.id,
          action: "EXPANSION",
        },
      });
      expect(activity).not.toBeNull();
      expect(activity?.detail).toContain("Net Adjustment");
    });

    it("rejects application when requested by unauthorized customer", async () => {
      await expect(
        prorationService.applyChange({
          subscriptionId: subA.id,
          customerId: customerB.id, // Customer B attempting to alter Customer A's subscription
          newLines: [
            {
              productId: testProduct.id,
              quantity: 3,
            },
          ],
        })
      ).rejects.toThrowError(NotFoundError);
    });
  });
});

