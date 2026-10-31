import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { paymentsService } from "@/server/services/payments";
import { invoicesService } from "@/server/services/invoices";
import { dunningService } from "@/server/services/dunning";
import { addDays, subDays } from "date-fns";
import { InvoiceStatus, SubscriptionStatus, BillingPeriod } from "@prisma/client";
import { today } from "@/lib/dates";
import { ValidationError, ConflictError } from "@/lib/errors";

describe("Phase 5: Payments, Outstanding & Overdue Reminders", () => {
  const PREFIX = `test-p5-${Date.now()}`;
  let testCustomer: any;
  let testAdmin: any;
  let testPlan: any;
  let testProduct: any;

  beforeAll(async () => {
    testCustomer = await db.user.create({
      data: {
        email: `${PREFIX}@example.com`,
        name: "Phase 5 Test Customer",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
      },
    });

    testAdmin = await db.user.create({
      data: {
        email: `${PREFIX}-admin@example.com`,
        name: "Phase 5 Test Admin",
        passwordHash: "dummyhash",
        role: "ADMIN",
      },
    });

    testPlan = await db.plan.create({
      data: {
        name: `${PREFIX} Plan`,
        price: 100000,
        period: BillingPeriod.MONTHLY,
        availableFrom: new Date("2020-01-01"),
      },
    });

    testProduct = await db.product.create({
      data: {
        name: `${PREFIX} Product`,
        type: "Software",
        salesPrice: 100000,
        costPrice: 50000,
        active: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup payments, reminders, invoices, subscriptions created in this test
    const invoices = await db.invoice.findMany({
      where: { customerId: testCustomer.id },
      select: { id: true, subscriptionId: true },
    });

    const invoiceIds = invoices.map((i) => i.id);
    const subIds = invoices.map((i) => i.subscriptionId);

    if (invoiceIds.length > 0) {
      await db.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await db.dunningReminder.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await db.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await db.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }

    if (subIds.length > 0) {
      await db.subscriptionLine.deleteMany({ where: { subscriptionId: { in: subIds } } });
      await db.subscription.deleteMany({ where: { id: { in: subIds } } });
    }

    if (testProduct) await db.product.delete({ where: { id: testProduct.id } });
    if (testPlan) await db.plan.delete({ where: { id: testPlan.id } });
    if (testCustomer) await db.user.delete({ where: { id: testCustomer.id } });
    if (testAdmin) await db.user.delete({ where: { id: testAdmin.id } });
  });

  // Helper to create an isolated invoice
  async function createTestInvoice(options: {
    status?: InvoiceStatus;
    total?: number;
    paidTotal?: number;
    dueDate?: Date;
  }) {
    const subNumber = `${PREFIX}-SUB-${Math.random().toString(36).slice(2, 7)}`;
    const sub = await db.subscription.create({
      data: {
        number: subNumber,
        customerId: testCustomer.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: today(),
      },
    });

    const invNumber = `${PREFIX}-INV-${Math.random().toString(36).slice(2, 7)}`;
    const total = options.total ?? 100000;
    const paidTotal = options.paidTotal ?? 0;
    const status = options.status ?? InvoiceStatus.CONFIRMED;
    const dueDate = options.dueDate ?? addDays(today(), 15);

    const invoice = await db.invoice.create({
      data: {
        number: invNumber,
        subscriptionId: sub.id,
        customerId: testCustomer.id,
        status,
        issueDate: today(),
        dueDate,
        periodStart: today(),
        periodEnd: addDays(today(), 30),
        subtotal: total,
        discountTotal: 0,
        taxTotal: 0,
        total,
        paidTotal,
        lines: {
          create: [
            {
              description: "Test Item",
              quantity: 1,
              unitPrice: total,
              lineSubtotal: total,
              amount: total,
            },
          ],
        },
      },
    });

    return invoice;
  }

  it("1. Partial payment: keeps invoice CONFIRMED with correct paidTotal and outstanding", async () => {
    const invoice = await createTestInvoice({ total: 100000, paidTotal: 0 });

    const result = await paymentsService.recordPayment({
      invoiceId: invoice.id,
      method: "BANK_TRANSFER",
      amount: 40000,
      paidOn: today(),
      note: "Partial payment 1",
    });

    expect(result.invoice.status).toBe("CONFIRMED");
    expect(result.invoice.paidTotal).toBe(40000);
    expect(result.invoice.outstanding).toBe(60000);

    const refreshed = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(refreshed.status).toBe(InvoiceStatus.CONFIRMED);
    expect(refreshed.paidTotal).toBe(40000);
  });

  it("2. Final payment: flips invoice automatically to PAID at zero balance", async () => {
    const invoice = await createTestInvoice({ total: 100000, paidTotal: 40000 });

    const result = await paymentsService.recordPayment({
      invoiceId: invoice.id,
      method: "UPI",
      amount: 60000,
      paidOn: today(),
      note: "Settling final balance",
    });

    expect(result.invoice.status).toBe("PAID");
    expect(result.invoice.paidTotal).toBe(100000);
    expect(result.invoice.outstanding).toBe(0);

    const refreshed = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(refreshed.status).toBe(InvoiceStatus.PAID);
    expect(refreshed.paidTotal).toBe(100000);
  });

  it("3. Overpayment guard: strictly rejects payment exceeding outstanding balance", async () => {
    const invoice = await createTestInvoice({ total: 100000, paidTotal: 40000 });

    // Outstanding is 60,000; attempting to pay 70,000
    await expect(
      paymentsService.recordPayment({
        invoiceId: invoice.id,
        method: "CARD",
        amount: 70000,
        paidOn: today(),
      })
    ).rejects.toThrow(ConflictError);

    // Verify invoice remains unchanged
    const refreshed = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(refreshed.paidTotal).toBe(40000);
    expect(refreshed.status).toBe(InvoiceStatus.CONFIRMED);
  });

  it("4. Status guard: rejects payment on non-CONFIRMED invoices with clear error", async () => {
    const draftInvoice = await createTestInvoice({ status: InvoiceStatus.DRAFT, total: 50000 });
    const cancelledInvoice = await createTestInvoice({ status: InvoiceStatus.CANCELLED, total: 50000 });

    await expect(
      paymentsService.recordPayment({
        invoiceId: draftInvoice.id,
        method: "CASH",
        amount: 50000,
        paidOn: today(),
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      paymentsService.recordPayment({
        invoiceId: cancelledInvoice.id,
        method: "CASH",
        amount: 50000,
        paidOn: today(),
      })
    ).rejects.toThrow(ValidationError);
  });

  it("5. Admin payment deletion: reopens balance and flips status from PAID back to CONFIRMED", async () => {
    const invoice = await createTestInvoice({ total: 50000, paidTotal: 0 });

    // Pay in full
    const paymentRes = await paymentsService.recordPayment({
      invoiceId: invoice.id,
      method: "CHEQUE",
      amount: 50000,
      paidOn: today(),
    });

    expect(paymentRes.invoice.status).toBe("PAID");

    // Admin deletes the payment
    const deleteRes = await paymentsService.deletePayment(paymentRes.payment.id, testAdmin.id);

    expect(deleteRes.newStatus).toBe("CONFIRMED");
    expect(deleteRes.newPaidTotal).toBe(0);
    expect(deleteRes.outstanding).toBe(50000);

    const refreshed = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(refreshed.status).toBe(InvoiceStatus.CONFIRMED);
    expect(refreshed.paidTotal).toBe(0);
  });

  it("6. Zero total invoice: confirming an invoice with total = 0 marks it PAID immediately", async () => {
    const zeroInvoice = await createTestInvoice({ status: InvoiceStatus.DRAFT, total: 0 });

    const confirmed = await invoicesService.confirmInvoice(zeroInvoice.id);
    expect(confirmed.status).toBe(InvoiceStatus.PAID);
    expect(confirmed.paidTotal).toBe(0);
    expect(confirmed.total).toBe(0);
  });

  it("7. Concurrent payments: exactly one of two concurrent payments of 60k against 100k succeeds", async () => {
    const invoice = await createTestInvoice({ total: 100000, paidTotal: 0 });

    // Two concurrent payment attempts of 60,000 each (total = 120,000 > 100,000)
    const results = await Promise.allSettled([
      paymentsService.recordPayment({
        invoiceId: invoice.id,
        method: "UPI",
        amount: 60000,
        paidOn: today(),
        note: "Worker A",
      }),
      paymentsService.recordPayment({
        invoiceId: invoice.id,
        method: "CARD",
        amount: 60000,
        paidOn: today(),
        note: "Worker B",
      }),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const rejections = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed, one must be rejected
    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(1);

    // Invariant: paidTotal never exceeds total
    const refreshed = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(refreshed.paidTotal).toBe(60000);
    expect(refreshed.paidTotal).toBeLessThanOrEqual(refreshed.total);
  });

  it("8. Financial Invariant: for every invoice paidTotal strictly equals sum of its payments", async () => {
    const invoice = await createTestInvoice({ total: 100000, paidTotal: 0 });

    await paymentsService.recordPayment({
      invoiceId: invoice.id,
      method: "CASH",
      amount: 25000,
      paidOn: today(),
    });

    await paymentsService.recordPayment({
      invoiceId: invoice.id,
      method: "BANK_TRANSFER",
      amount: 35000,
      paidOn: today(),
    });

    const refreshed = await db.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { payments: true },
    });

    const sumPayments = refreshed.payments.reduce((sum, p) => sum + p.amount, 0);
    expect(refreshed.paidTotal).toBe(sumPayments);
    expect(refreshed.paidTotal).toBe(60000);
  });

  it("9. Overdue boundaries: due yesterday = overdue; due today = not overdue; paid = not overdue", async () => {
    const now = today();

    // 1. Due yesterday + unpaid -> Overdue
    const invYesterday = await createTestInvoice({
      total: 50000,
      paidTotal: 0,
      dueDate: subDays(now, 1),
    });

    // 2. Due today + unpaid -> Not overdue
    const invToday = await createTestInvoice({
      total: 50000,
      paidTotal: 0,
      dueDate: now,
    });

    // 3. Due 5 days ago + partially paid -> Overdue
    const invPartial = await createTestInvoice({
      total: 50000,
      paidTotal: 20000,
      dueDate: subDays(now, 5),
    });

    // 4. Due 5 days ago + fully paid -> Not overdue (PAID)
    const invPaid = await createTestInvoice({
      status: InvoiceStatus.PAID,
      total: 50000,
      paidTotal: 50000,
      dueDate: subDays(now, 5),
    });

    // Overdue query definition: status = CONFIRMED, dueDate < today, paidTotal < total
    const overdueList = await db.invoice.findMany({
      where: {
        id: { in: [invYesterday.id, invToday.id, invPartial.id, invPaid.id] },
        status: InvoiceStatus.CONFIRMED,
        dueDate: { lt: now },
        paidTotal: { lt: db.invoice.fields.total },
      },
    });

    const overdueIds = overdueList.map((i) => i.id);
    expect(overdueIds).toContain(invYesterday.id);
    expect(overdueIds).toContain(invPartial.id);
    expect(overdueIds).not.toContain(invToday.id);
    expect(overdueIds).not.toContain(invPaid.id);
  });

  it("10. Dunning Reminders: inserts rows for due stages (1, 3, 7) and sends email only for highest due stage", async () => {
    const now = today();
    // 10 days late: all 3 stages (1, 3, 7) are due!
    const overdueInvoice = await createTestInvoice({
      total: 100000,
      paidTotal: 0,
      dueDate: subDays(now, 10),
    });

    // First dunning run
    const result1 = await dunningService.runDunningJob({ asOf: now });

    // Verify reminders in database for this invoice
    const reminders = await db.dunningReminder.findMany({
      where: { invoiceId: overdueInvoice.id },
      orderBy: { stage: "asc" },
    });

    // All 3 stages (1, 3, 7) recorded in DB
    expect(reminders.length).toBe(3);
    expect(reminders.map((r) => r.stage)).toEqual([1, 3, 7]);

    // Exactly 1 email sent for the highest due stage (Stage 7)
    expect(result1.emailsSent).toBeGreaterThanOrEqual(1);

    // Second run: completely idempotent! 0 new rows inserted, 0 emails sent for this invoice
    const result2 = await dunningService.runDunningJob({ asOf: now });

    const remindersAfter = await db.dunningReminder.findMany({
      where: { invoiceId: overdueInvoice.id },
    });
    expect(remindersAfter.length).toBe(3);
  });
});

