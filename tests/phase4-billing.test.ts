import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
const prisma = db;
import { billingService } from "@/server/services/billing";
import { invoicesService } from "@/server/services/invoices";
import { generateInvoicePdfBuffer } from "@/server/services/invoice-pdf";
import { addDays, addMonths, subMonths, subDays } from "date-fns";
import { BillingPeriod, SubscriptionStatus, InvoiceStatus, DiscountScope, DiscountType } from "@prisma/client";
import { today } from "@/lib/dates";

describe("Phase 4: Billing Engine, Invoicing, Discounts & Taxes", () => {
  const PREFIX = `test-p4-${Date.now()}`;
  let testCustomer: any;
  let testPlan: any;
  let testTax: any;
  let testProduct: any;

  beforeAll(async () => {
    // 1. Create dedicated isolated test customer
    testCustomer = await prisma.user.create({
      data: {
        email: `${PREFIX}@example.com`,
        name: "Phase 4 Test Customer",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
      },
    });

    // 2. Create isolated plan
    testPlan = await prisma.plan.create({
      data: {
        name: `${PREFIX} Monthly Plan`,
        price: 99900,
        period: BillingPeriod.MONTHLY,
        availableFrom: new Date("2020-01-01"),
        renewable: true,
        closable: true,
        pausable: true,
        autoClose: false,
      },
    });

    // 3. Create isolated tax (18.00% = 1800 bps)
    testTax = await prisma.tax.create({
      data: {
        name: `${PREFIX} GST 18%`,
        rateBps: 1800,
        active: true,
      },
    });

    // 4. Create isolated product (salesPrice: ₹1,000.00 = 100000 minor units)
    testProduct = await prisma.product.create({
      data: {
        name: `${PREFIX} Cloud Engine`,
        type: "Software",
        salesPrice: 100000,
        costPrice: 50000,
        active: true,
      },
    });
  });

  afterAll(async () => {
    // Isolated cleanup: delete all records created by this test suite
    const subIds = (
      await prisma.subscription.findMany({
        where: { customerId: testCustomer.id },
        select: { id: true },
      })
    ).map((s) => s.id);

    if (subIds.length > 0) {
      await prisma.invoiceLine.deleteMany({
        where: { invoice: { subscriptionId: { in: subIds } } },
      });
      await prisma.invoice.deleteMany({
        where: { subscriptionId: { in: subIds } },
      });
      await prisma.subscriptionLine.deleteMany({
        where: { subscriptionId: { in: subIds } },
      });
      await prisma.subscription.deleteMany({
        where: { id: { in: subIds } },
      });
    }

    await prisma.discountTarget.deleteMany({
      where: { discount: { name: { startsWith: PREFIX } } },
    });
    await prisma.discount.deleteMany({
      where: { name: { startsWith: PREFIX } },
    });

    if (testProduct) {
      await prisma.product.delete({ where: { id: testProduct.id } });
    }
    if (testTax) {
      await prisma.tax.delete({ where: { id: testTax.id } });
    }
    if (testPlan) {
      await prisma.plan.delete({ where: { id: testPlan.id } });
    }
    if (testCustomer) {
      await prisma.user.delete({ where: { id: testCustomer.id } });
    }
  });

  it("1. Idempotency: Running billing twice for the same date creates zero invoices on second run", async () => {
    const startDate = addDays(subMonths(today(), 1), 1);
    const subNumber = `${PREFIX}-SUB-01`;

    const sub = await prisma.subscription.create({
      data: {
        number: subNumber,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        nextInvoiceDate: startDate,
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 1,
              unitPrice: 100000,
              taxId: testTax.id,
            },
          ],
        },
      },
    });

    const runDate = today();

    // First billing run
    const res1 = await billingService.runBatch({ asOf: runDate });
    expect(res1.batchSummary.created).toBeGreaterThanOrEqual(1);

    // Verify invoice exists for this subscription
    const invoices = await prisma.invoice.findMany({
      where: { subscriptionId: sub.id },
    });
    expect(invoices.length).toBeGreaterThanOrEqual(1);

    // Second billing run for the exact same date
    const res2 = await billingService.runBatch({ asOf: runDate });
    const subInvoicesAfter = await prisma.invoice.findMany({
      where: { subscriptionId: sub.id },
    });

    // Zero new invoices created for this subscription
    expect(subInvoicesAfter.length).toBe(invoices.length);
  });

  it("2. Catch-up: A subscription 3 periods behind gets 3 invoices with continuous period ranges", async () => {
    // Exactly 3 periods behind (next period starts tomorrow)
    const startDate = addDays(subMonths(today(), 3), 1);
    const subNumber = `${PREFIX}-SUB-02`;

    const sub = await prisma.subscription.create({
      data: {
        number: subNumber,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        nextInvoiceDate: startDate,
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 2,
              unitPrice: 50000,
              taxId: testTax.id,
            },
          ],
        },
      },
    });

    const runDate = today();
    await billingService.runBatch({ asOf: runDate });

    const invoices = await prisma.invoice.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { periodStart: "asc" },
    });

    // Exactly 3 periods caught up
    expect(invoices.length).toBe(3);

    // Verify continuous period ranges: period 2 starts right after period 1 ends
    for (let i = 0; i < invoices.length - 1; i++) {
      const currentEnd = new Date(invoices[i].periodEnd);
      const nextStart = new Date(invoices[i + 1].periodStart);
      const diffDays = Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(1);
    }
  });

  it("3. Pause & Resume: Paused subscription is skipped, then caught up upon resume", async () => {
    const startDate = addDays(subMonths(today(), 1), 1);
    const subNumber = `${PREFIX}-SUB-03`;

    const sub = await prisma.subscription.create({
      data: {
        number: subNumber,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        nextInvoiceDate: startDate,
        isPaused: true,
        pausedAt: new Date(),
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

    // Billing run while paused
    const run1 = await billingService.runBatch({ asOf: today() });
    expect(run1.batchSummary.skippedPaused).toBeGreaterThanOrEqual(1);

    const invoicesPaused = await prisma.invoice.findMany({
      where: { subscriptionId: sub.id },
    });
    expect(invoicesPaused.length).toBe(0);

    // Resume subscription
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { isPaused: false, pausedAt: null },
    });

    // Re-run billing after resume: catches up!
    await billingService.runBatch({ asOf: today() });

    const invoicesResumed = await prisma.invoice.findMany({
      where: { subscriptionId: sub.id },
    });
    expect(invoicesResumed.length).toBe(1);
  });

  it("4. Discounts: usageLimit=2 applies to exactly 2 invoices then stops; expired discount never applies", async () => {
    // Create discount with usageLimit = 2 (Fixed ₹200.00 = 20000 minor units)
    const limitedDiscount = await prisma.discount.create({
      data: {
        name: `${PREFIX} Limit-2 Discount`,
        type: DiscountType.FIXED,
        value: 20000,
        usageLimit: 2,
        usedCount: 0,
        scope: DiscountScope.PRODUCT,
        startDate: new Date("2020-01-01"),
        active: true,
        targets: {
          create: [{ productId: testProduct.id }],
        },
      },
    });

    // Create expired discount (ended yesterday)
    const expiredDiscount = await prisma.discount.create({
      data: {
        name: `${PREFIX} Expired Discount`,
        type: DiscountType.PERCENT,
        value: 5000, // 50%
        scope: DiscountScope.PRODUCT,
        startDate: new Date("2020-01-01"),
        endDate: subDays(today(), 1),
        active: true,
        targets: {
          create: [{ productId: testProduct.id }],
        },
      },
    });

    const pastDate = addDays(subMonths(today(), 1), 1);

    // Create 3 separate subscriptions
    const sub1 = await prisma.subscription.create({
      data: {
        number: `${PREFIX}-DISC-SUB1`,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: pastDate,
        nextInvoiceDate: pastDate,
        lines: { create: [{ productId: testProduct.id, quantity: 1, unitPrice: 100000 }] },
      },
    });

    const sub2 = await prisma.subscription.create({
      data: {
        number: `${PREFIX}-DISC-SUB2`,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: pastDate,
        nextInvoiceDate: pastDate,
        lines: { create: [{ productId: testProduct.id, quantity: 1, unitPrice: 100000 }] },
      },
    });

    const sub3 = await prisma.subscription.create({
      data: {
        number: `${PREFIX}-DISC-SUB3`,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: pastDate,
        nextInvoiceDate: pastDate,
        lines: { create: [{ productId: testProduct.id, quantity: 1, unitPrice: 100000 }] },
      },
    });

    // Run billing
    await billingService.runBatch({ asOf: today() });

    const inv1 = await prisma.invoice.findFirst({
      where: { subscriptionId: sub1.id },
      include: { lines: true },
    });
    const inv2 = await prisma.invoice.findFirst({
      where: { subscriptionId: sub2.id },
      include: { lines: true },
    });
    const inv3 = await prisma.invoice.findFirst({
      where: { subscriptionId: sub3.id },
      include: { lines: true },
    });

    const discAmounts = [
      inv1?.discountTotal ?? 0,
      inv2?.discountTotal ?? 0,
      inv3?.discountTotal ?? 0,
    ];

    // Exactly 2 of the 3 received the 20000 discount
    const withDiscount = discAmounts.filter((amt) => amt === 20000);
    const withoutDiscount = discAmounts.filter((amt) => amt === 0);

    expect(withDiscount.length).toBe(2);
    expect(withoutDiscount.length).toBe(1);

    // Verify discount usedCount in DB is exactly 2
    const refreshedDiscount = await prisma.discount.findUniqueOrThrow({
      where: { id: limitedDiscount.id },
    });
    expect(refreshedDiscount.usedCount).toBe(2);

    // Verify expired discount was never used
    const refreshedExpired = await prisma.discount.findUniqueOrThrow({
      where: { id: expiredDiscount.id },
    });
    expect(refreshedExpired.usedCount).toBe(0);
  });

  it("5. Mathematical Totals: subtotal - discount + tax = total, per line and overall", async () => {
    const subNumber = `${PREFIX}-SUB-MATH`;
    const pastDate = subMonths(today(), 1);

    const sub = await prisma.subscription.create({
      data: {
        number: subNumber,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: pastDate,
        nextInvoiceDate: pastDate,
        lines: {
          create: [
            {
              productId: testProduct.id,
              quantity: 3,
              unitPrice: 33333,
              taxId: testTax.id,
            },
          ],
        },
      },
    });

    await billingService.runBatch({ asOf: today() });

    const invoice = await prisma.invoice.findFirstOrThrow({
      where: { subscriptionId: sub.id },
      include: { lines: true },
    });

    // Test invoice-level identity: total = subtotal - discountTotal + taxTotal
    expect(invoice.total).toBe(
      invoice.subtotal - invoice.discountTotal + invoice.taxTotal
    );

    // Test line-level integrity
    let calculatedLineTotal = 0;
    for (const line of invoice.lines) {
      expect(line.lineSubtotal).toBe(line.quantity * line.unitPrice);
      expect(line.amount).toBe(
        line.lineSubtotal - line.discountAmount + line.taxAmount
      );
      calculatedLineTotal += line.amount;
    }

    // Sum of lines strictly matches invoice total
    expect(calculatedLineTotal).toBe(invoice.total);
  });

  it("6. Invoice Lifecycle & PDF: Confirm, cancel, and PDF generation work", async () => {
    const subNumber = `${PREFIX}-SUB-LIFECYCLE`;
    const pastDate = subMonths(today(), 1);

    const sub = await prisma.subscription.create({
      data: {
        number: subNumber,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: pastDate,
        nextInvoiceDate: pastDate,
        lines: {
          create: [{ productId: testProduct.id, quantity: 1, unitPrice: 50000 }],
        },
      },
    });

    await billingService.runBatch({ asOf: today() });

    const invoice = await prisma.invoice.findFirstOrThrow({
      where: { subscriptionId: sub.id },
    });

    expect(invoice.status).toBe(InvoiceStatus.DRAFT);

    // Confirm action
    const confirmed = await invoicesService.confirmInvoice(invoice.id);
    expect(confirmed.status).toBe(InvoiceStatus.CONFIRMED);

    // Cancel action (allowed since paidTotal = 0)
    const cancelled = await invoicesService.cancelInvoice(invoice.id);
    expect(cancelled.status).toBe(InvoiceStatus.CANCELLED);

    // PDF generation
    const fullInvoice = await invoicesService.getInvoice(invoice.id);
    expect(fullInvoice).not.toBeNull();

    const pdfBuffer = await generateInvoicePdfBuffer(fullInvoice as any);
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF magic bytes %PDF-
    const headerStr = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(headerStr).toBe("%PDF-");
  });
});
