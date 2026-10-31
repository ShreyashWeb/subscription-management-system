import { db } from "@/lib/db";
import { today, evaluatePlanAvailability } from "@/lib/dates";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { SubscriptionStatus } from "@prisma/client";

export const portalService = {
  /**
   * Get all subscriptions for the logged-in customer.
   */
  async getSubscriptions(customerId: string) {
    const subscriptions = await db.subscription.findMany({
      where: { customerId },
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
            tax: true,
          },
        },
        invoices: {
          select: { id: true, number: true, status: true, total: true, paidTotal: true },
          orderBy: { issueDate: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions.map((sub) => {
      const recurringTotal = sub.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0
      );

      return {
        ...sub,
        recurringTotal,
        displayStatus: sub.isPaused ? "PAUSED" : sub.status,
      };
    });
  },

  /**
   * Get single subscription detail for customer.
   * STRICT SECURITY: Throws NotFoundError (404) if the subscription belongs to another customer.
   */
  async getSubscription(customerId: string, subscriptionId: string) {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        lines: {
          include: {
            product: {
              include: { variants: true },
            },
            variant: true,
            tax: true,
          },
        },
        invoices: {
          select: {
            id: true,
            number: true,
            status: true,
            issueDate: true,
            dueDate: true,
            total: true,
            paidTotal: true,
            periodStart: true,
            periodEnd: true,
          },
          orderBy: { issueDate: "desc" },
          take: 12,
        },
      },
    });

    // 404 security requirement: never leak existence of records owned by other customers
    if (!subscription || subscription.customerId !== customerId) {
      throw new NotFoundError("Subscription not found");
    }

    const lineSubtotals = subscription.lines.map((line) => {
      const lineTotal = line.quantity * line.unitPrice;
      const taxBps = line.tax?.rateBps || 0;
      const taxAmount = Math.round((lineTotal * taxBps) / 10000);
      return {
        ...line,
        lineTotal,
        taxAmount,
        totalWithTax: lineTotal + taxAmount,
      };
    });

    const recurringTotal = lineSubtotals.reduce((sum, l) => sum + l.lineTotal, 0);
    const recurringTax = lineSubtotals.reduce((sum, l) => sum + l.taxAmount, 0);

    return {
      ...subscription,
      lines: lineSubtotals,
      recurringTotal,
      recurringTax,
      totalWithTax: recurringTotal + recurringTax,
      displayStatus: subscription.isPaused ? "PAUSED" : subscription.status,
    };
  },

  /**
   * Get all invoices for the logged-in customer.
   */
  async getInvoices(customerId: string) {
    const invoices = await db.invoice.findMany({
      where: { customerId },
      include: {
        subscription: {
          select: {
            id: true,
            number: true,
            plan: { select: { name: true } },
          },
        },
        payments: {
          select: { id: true, amount: true, paidOn: true, method: true },
          orderBy: { paidOn: "desc" },
        },
      },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    });

    return invoices.map((inv) => ({
      ...inv,
      outstanding: Math.max(0, inv.total - inv.paidTotal),
    }));
  },

  /**
   * Get single invoice detail for customer.
   * STRICT SECURITY: Throws NotFoundError (404) if invoice belongs to another customer.
   */
  async getInvoice(customerId: string, invoiceId: string) {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true },
        },
        subscription: {
          include: { plan: true },
        },
        lines: {
          include: { discount: true },
          orderBy: { id: "asc" },
        },
        payments: {
          orderBy: { paidOn: "desc" },
        },
      },
    });

    if (!invoice || invoice.customerId !== customerId) {
      throw new NotFoundError("Invoice not found");
    }

    return {
      ...invoice,
      outstanding: Math.max(0, invoice.total - invoice.paidTotal),
    };
  },

  /**
   * Get available plans for comparison and upgrading.
   */
  async getAvailablePlans() {
    const now = today();
    const plans = await db.plan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });

    return plans.filter((p) => evaluatePlanAvailability(p, now).isAvailable);
  },

  /**
   * Self-service pause: customer pauses their own ACTIVE subscription.
   * Enforces plan.pausable.
   */
  async pauseSubscription(customerId: string, subscriptionId: string) {
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub || sub.customerId !== customerId) {
      throw new NotFoundError("Subscription not found");
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new ValidationError("Only ACTIVE subscriptions can be paused.");
    }

    if (!sub.plan.pausable) {
      throw new ForbiddenError(`Plan "${sub.plan.name}" does not permit pausing.`);
    }

    if (sub.isPaused) {
      throw new ValidationError("Subscription is already paused.");
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          isPaused: true,
          pausedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          entity: "subscription",
          entityId: subscriptionId,
          action: "PAUSED",
          detail: "Customer self-service paused the subscription.",
          actorId: customerId,
        },
      });

      return updated;
    });
  },

  /**
   * Self-service resume: customer resumes their paused subscription.
   */
  async resumeSubscription(customerId: string, subscriptionId: string) {
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub || sub.customerId !== customerId) {
      throw new NotFoundError("Subscription not found");
    }

    if (sub.status !== SubscriptionStatus.ACTIVE || !sub.isPaused) {
      throw new ValidationError("Subscription is not currently paused.");
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          isPaused: false,
          pausedAt: null,
        },
      });

      await tx.activityLog.create({
        data: {
          entity: "subscription",
          entityId: subscriptionId,
          action: "RESUMED",
          detail: "Customer self-service resumed the subscription.",
          actorId: customerId,
        },
      });

      return updated;
    });
  },

  /**
   * Self-service cancel / early close: customer cancels their ACTIVE subscription.
   * Enforces plan.closable.
   */
  async cancelSubscription(customerId: string, subscriptionId: string) {
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub || sub.customerId !== customerId) {
      throw new NotFoundError("Subscription not found");
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new ValidationError("Only ACTIVE subscriptions can be cancelled.");
    }

    if (!sub.plan.closable) {
      throw new ForbiddenError(
        `Plan "${sub.plan.name}" has a fixed commitment and does not permit early cancellation.`
      );
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CLOSED,
          closedAt: new Date(),
          nextInvoiceDate: null,
        },
      });

      await tx.activityLog.create({
        data: {
          entity: "subscription",
          entityId: subscriptionId,
          action: "CANCELLED_BY_CUSTOMER",
          detail: "Customer self-service cancelled the subscription early.",
          actorId: customerId,
        },
      });

      return updated;
    });
  },
};

