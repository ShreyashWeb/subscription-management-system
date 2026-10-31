import { Prisma, SubscriptionStatus, BillingPeriod } from "@prisma/client";
import { db } from "@/lib/db";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  createFromTemplateSchema,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
  type CreateFromTemplateInput,
} from "@/lib/validators/subscription";
import {
  requireUser,
  requireRole,
  requireCustomerOwnership,
  NotFoundError,
  ForbiddenError,
} from "@/server/policies/permissions";
import { today, evaluatePlanAvailability } from "@/lib/dates";
import { toMinorUnits, calculateEffectivePrice } from "@/lib/money";
import { getNextSequenceNumber } from "@/lib/numbering";
import { addPeriod } from "@/lib/period";
import {
  validateSubscriptionTransition,
  type SubscriptionTransitionContext,
} from "@/server/transitions";
import { addDays } from "date-fns";

export interface ListSubscriptionsParams {
  status?: SubscriptionStatus | "ALL" | "PAUSED";
  customerId?: string;
  planId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * List subscriptions with server pagination, search, and filters.
 * Admin and Staff see all; Customers see only their own.
 */
export async function listSubscriptions(params: ListSubscriptionsParams = {}) {
  const actor = await requireUser();
  const { status, customerId, planId, search, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.SubscriptionWhereInput = {};

  // Customer ownership scoping
  if (actor.role === "CUSTOMER") {
    where.customerId = actor.id;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (planId && planId !== "ALL") {
    where.planId = planId;
  }

  if (status && status !== "ALL") {
    if (status === ("PAUSED" as any)) {
      where.isPaused = true;
      where.status = SubscriptionStatus.ACTIVE;
    } else {
      where.status = status as SubscriptionStatus;
    }
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { plan: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, items] = await Promise.all([
    db.subscription.count({ where }),
    db.subscription.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true },
        },
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
            tax: true,
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  // Compute recurring total for each subscription: sum(quantity * unitPrice) per Decision D9
  const enrichedItems = items.map((sub) => {
    const totalAmount = sub.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0
    );
    return {
      ...sub,
      totalAmount,
    };
  });

  return {
    items: enrichedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get detailed subscription by ID.
 * Customers are strictly restricted to their own subscriptions (returns 404 if unauthorized).
 */
export async function getSubscription(id: string) {
  const actor = await requireUser();

  const subscription = await db.subscription.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, email: true, company: true, phone: true },
      },
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
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!subscription) {
    throw new NotFoundError("Subscription not found");
  }

  // Enforce customer ownership (returns 404 so IDs cannot be probed)
  if (actor.role === "CUSTOMER" && subscription.customerId !== actor.id) {
    throw new NotFoundError("Subscription not found");
  }

  // Fetch audit activity logs
  const activities = await db.activityLog.findMany({
    where: {
      entity: "subscription",
      entityId: id,
    },
    include: {
      actor: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { at: "desc" },
  });

  // Calculate financial totals (Decision D9)
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

  const subtotal = lineSubtotals.reduce((sum, l) => sum + l.lineTotal, 0);
  const totalTax = lineSubtotals.reduce((sum, l) => sum + l.taxAmount, 0);
  const totalRecurring = subtotal + totalTax;

  return {
    ...subscription,
    lines: lineSubtotals,
    subtotal,
    totalTax,
    totalRecurring,
    activities,
  };
}

/**
 * Create a new subscription from scratch.
 * Admin and Staff only.
 * Enforces atomic numbering (SUB-YYYY-NNNNN), plan minQty, and availability window.
 */
export async function createSubscription(input: CreateSubscriptionInput) {
  const actor = await requireRole(["ADMIN", "STAFF"]);
  const parsed = createSubscriptionSchema.parse(input);

  const startDate = new Date(parsed.startDate);
  const expiryDate = parsed.expiryDate ? new Date(parsed.expiryDate) : null;
  const currentDate = today();

  // 1. Look up plan and validate availability & minQty (User change 6)
  const plan = await db.plan.findUnique({ where: { id: parsed.planId } });
  if (!plan) throw new NotFoundError("Subscription plan not found");

  const availability = evaluatePlanAvailability(plan, currentDate);
  if (!availability.isAvailable) {
    throw new Error(
      `Plan "${plan.name}" is currently outside its availability window (${availability.label}).`
    );
  }

  const totalQty = parsed.lines.reduce((sum, l) => sum + l.quantity, 0);
  if (totalQty < plan.minQty) {
    throw new Error(
      `Total quantity (${totalQty}) is below the minimum required quantity (${plan.minQty}) for plan "${plan.name}".`
    );
  }

  // 2. Validate customer existence
  const customer = await db.user.findUnique({ where: { id: parsed.customerId } });
  if (!customer) throw new NotFoundError("Customer not found");

  // Quotation validity default
  const quotationValidUntil = addDays(currentDate, parsed.validityDays);

  // 3. Resolve line unit prices defaulting to salesPrice + extraPrice (Decision D9)
  const resolvedLines = await Promise.all(
    parsed.lines.map(async (line) => {
      let unitPrice = line.unitPrice ? toMinorUnits(line.unitPrice) : null;

      if (unitPrice === null || unitPrice === undefined) {
        const prod = await db.product.findUnique({
          where: { id: line.productId },
          include: { variants: true },
        });
        if (!prod) throw new NotFoundError(`Product ${line.productId} not found`);

        let extraPrice = 0;
        if (line.variantId) {
          const v = prod.variants.find((variant) => variant.id === line.variantId);
          if (v) extraPrice = v.extraPrice;
        }

        unitPrice = calculateEffectivePrice(prod.salesPrice, extraPrice);
      }

      return {
        productId: line.productId,
        variantId: line.variantId || null,
        taxId: line.taxId || null,
        quantity: line.quantity,
        unitPrice,
      };
    })
  );

  // 4. Atomic creation with PostgreSQL raw SQL sequence generator inside transaction
  return db.$transaction(async (tx) => {
    const number = await getNextSequenceNumber(tx, "SUB", startDate);

    const subscription = await tx.subscription.create({
      data: {
        number,
        customerId: parsed.customerId,
        planId: parsed.planId,
        status: SubscriptionStatus.DRAFT,
        startDate,
        expiryDate,
        paymentTermsDays: parsed.paymentTermsDays,
        quotationValidUntil,
        lines: {
          create: resolvedLines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            taxId: l.taxId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
      include: {
        customer: true,
        plan: true,
        lines: true,
      },
    });

    // Log creation activity
    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: subscription.id,
        action: "CREATED",
        detail: `Subscription ${number} created in DRAFT state.`,
        actorId: actor.id,
      },
    });

    return subscription;
  });
}

/**
 * Create subscription from Quotation Template.
 * Pre-fills plan, lines, unit prices, and validity.
 */
export async function createSubscriptionFromTemplate(input: CreateFromTemplateInput) {
  const actor = await requireRole(["ADMIN", "STAFF"]);
  const parsed = createFromTemplateSchema.parse(input);

  const template = await db.quotationTemplate.findUnique({
    where: { id: parsed.templateId },
    include: {
      plan: true,
      lines: {
        include: {
          product: { include: { variants: true } },
          variant: true,
        },
      },
    },
  });

  if (!template) throw new NotFoundError("Quotation template not found");

  const currentDate = today();
  const startDate = new Date(parsed.startDate);

  // Check plan availability and minQty
  const availability = evaluatePlanAvailability(template.plan, currentDate);
  if (!availability.isAvailable) {
    throw new Error(
      `Plan "${template.plan.name}" is currently outside its availability window (${availability.label}).`
    );
  }

  const totalQty = template.lines.reduce((sum, l) => sum + l.quantity, 0);
  if (totalQty < template.plan.minQty) {
    throw new Error(
      `Template total quantity (${totalQty}) is below the required plan minimum (${template.plan.minQty}).`
    );
  }

  // Default quotation validity from template
  const quotationValidUntil = addDays(currentDate, template.validityDays);

  return db.$transaction(async (tx) => {
    const number = await getNextSequenceNumber(tx, "SUB", startDate);

    const subscription = await tx.subscription.create({
      data: {
        number,
        customerId: parsed.customerId,
        planId: template.planId,
        status: SubscriptionStatus.QUOTATION, // Pre-filled from template creates ready Quotation
        startDate,
        quotationValidUntil,
        paymentTermsDays: 15,
        lines: {
          create: template.lines.map((l) => {
            const extra = l.variant ? l.variant.extraPrice : 0;
            const unitPrice = calculateEffectivePrice(l.product.salesPrice, extra);
            return {
              productId: l.productId,
              variantId: l.variantId,
              quantity: l.quantity,
              unitPrice,
            };
          }),
        },
      },
      include: {
        customer: true,
        plan: true,
        lines: true,
      },
    });

    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: subscription.id,
        action: "CREATED_FROM_TEMPLATE",
        detail: `Created from quotation template "${template.name}" as QUOTATION.`,
        actorId: actor.id,
      },
    });

    return subscription;
  });
}

/**
 * Update an existing subscription. Allowed only while in DRAFT or QUOTATION.
 */
export async function updateSubscription(id: string, input: UpdateSubscriptionInput) {
  const actor = await requireRole(["ADMIN", "STAFF"]);
  const parsed = updateSubscriptionSchema.parse(input);

  const existing = await db.subscription.findUnique({
    where: { id },
    include: { plan: true, lines: true },
  });

  if (!existing) throw new NotFoundError("Subscription not found");

  if (
    existing.status !== SubscriptionStatus.DRAFT &&
    existing.status !== SubscriptionStatus.QUOTATION
  ) {
    throw new ForbiddenError(
      `Cannot modify subscription details while in ${existing.status} status. Only DRAFT or QUOTATION can be edited.`
    );
  }

  const planId = parsed.planId || existing.planId;
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan not found");

  // Validate availability window (User change 6)
  const availability = evaluatePlanAvailability(plan, today());
  if (!availability.isAvailable) {
    throw new Error(
      `Plan "${plan.name}" is currently outside its availability window (${availability.label}).`
    );
  }

  // Validate minQty if lines are updated (User change 6)
  if (parsed.lines) {
    const totalQty = parsed.lines.reduce((sum, l) => sum + l.quantity, 0);
    if (totalQty < plan.minQty) {
      throw new Error(
        `Total quantity (${totalQty}) is below the required plan minimum (${plan.minQty}).`
      );
    }
  }

  return db.$transaction(async (tx) => {
    // 1. Update main fields
    await tx.subscription.update({
      where: { id },
      data: {
        planId,
        startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
        expiryDate: parsed.expiryDate !== undefined ? (parsed.expiryDate ? new Date(parsed.expiryDate) : null) : undefined,
        paymentTermsDays: parsed.paymentTermsDays,
        quotationValidUntil: parsed.validityDays ? addDays(today(), parsed.validityDays) : undefined,
      },
    });

    // 2. Update lines if provided
    if (parsed.lines) {
      await tx.subscriptionLine.deleteMany({ where: { subscriptionId: id } });

      for (const line of parsed.lines) {
        let unitPrice = line.unitPrice ? toMinorUnits(line.unitPrice) : null;
        if (unitPrice === null || unitPrice === undefined) {
          const prod = await tx.product.findUnique({
            where: { id: line.productId },
            include: { variants: true },
          });
          if (!prod) throw new NotFoundError(`Product ${line.productId} not found`);
          const extra = line.variantId ? prod.variants.find((v) => v.id === line.variantId)?.extraPrice || 0 : 0;
          unitPrice = calculateEffectivePrice(prod.salesPrice, extra);
        }

        await tx.subscriptionLine.create({
          data: {
            subscriptionId: id,
            productId: line.productId,
            variantId: line.variantId || null,
            taxId: line.taxId || null,
            quantity: line.quantity,
            unitPrice,
          },
        });
      }
    }

    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: id,
        action: "UPDATED",
        detail: "Subscription parameters and line items updated.",
        actorId: actor.id,
      },
    });

    return tx.subscription.findUnique({
      where: { id },
      include: { lines: true, plan: true },
    });
  });
}

/**
 * Execute a status transition via transitions state machine.
 */
export async function transitionSubscription(id: string, targetStatus: SubscriptionStatus) {
  const actor = await requireRole(["ADMIN", "STAFF"]);

  const subscription = await db.subscription.findUnique({
    where: { id },
    include: { plan: true, lines: true },
  });

  if (!subscription) throw new NotFoundError("Subscription not found");

  // Transition validation
  const context: SubscriptionTransitionContext = {
    status: subscription.status,
    quotationValidUntil: subscription.quotationValidUntil,
    startDate: subscription.startDate,
    expiryDate: subscription.expiryDate,
    plan: subscription.plan,
  };

  validateSubscriptionTransition(context, targetStatus);

  // If confirming, also enforce plan minQty and availability
  if (targetStatus === SubscriptionStatus.CONFIRMED) {
    const totalQty = subscription.lines.reduce((sum, l) => sum + l.quantity, 0);
    if (totalQty < subscription.plan.minQty) {
      throw new Error(
        `Cannot confirm: total quantity (${totalQty}) is below required plan minimum (${subscription.plan.minQty}).`
      );
    }
  }

  // Compute nextInvoiceDate on activation
  let nextInvoiceDate = subscription.nextInvoiceDate;
  let closedAt = subscription.closedAt;

  if (targetStatus === SubscriptionStatus.ACTIVE) {
    const trialDays = subscription.plan.trialDays || 0;
    nextInvoiceDate = addDays(subscription.startDate, trialDays);
  } else if (targetStatus === SubscriptionStatus.CLOSED) {
    closedAt = new Date();
    nextInvoiceDate = null;
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: targetStatus,
        nextInvoiceDate,
        closedAt,
      },
    });

    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: id,
        action: "STATUS_CHANGE",
        detail: `Status changed from ${subscription.status} to ${targetStatus}.`,
        actorId: actor.id,
      },
    });

    return updated;
  });
}

/**
 * Pause an ACTIVE subscription.
 */
export async function pauseSubscription(id: string) {
  const actor = await requireRole(["ADMIN", "STAFF"]);

  const subscription = await db.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) throw new NotFoundError("Subscription not found");

  if (subscription.status !== SubscriptionStatus.ACTIVE) {
    throw new ForbiddenError("Only ACTIVE subscriptions can be paused.");
  }

  if (!subscription.plan.pausable) {
    throw new ForbiddenError(
      `Plan "${subscription.plan.name}" does not permit pausing subscriptions.`
    );
  }

  if (subscription.isPaused) {
    throw new Error("Subscription is already paused.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        isPaused: true,
        pausedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: id,
        action: "PAUSED",
        detail: "Subscription was temporarily paused. Billing runs will skip invoices until resumed.",
        actorId: actor.id,
      },
    });

    return updated;
  });
}

/**
 * Resume a paused ACTIVE subscription.
 */
export async function resumeSubscription(id: string) {
  const actor = await requireRole(["ADMIN", "STAFF"]);

  const subscription = await db.subscription.findUnique({
    where: { id },
  });

  if (!subscription) throw new NotFoundError("Subscription not found");

  if (subscription.status !== SubscriptionStatus.ACTIVE || !subscription.isPaused) {
    throw new Error("Subscription is not currently paused.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        isPaused: false,
        pausedAt: null,
      },
    });

    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: id,
        action: "RESUMED",
        detail: "Subscription resumed. Next billing run will catch up any missed billing periods.",
        actorId: actor.id,
      },
    });

    return updated;
  });
}

/**
 * Renew an ACTIVE subscription with an expiry date.
 * User change 4: "Renew: only for ACTIVE subscriptions that have an expiryDate; otherwise reject with a clear message."
 */
export async function renewSubscription(id: string) {
  const actor = await requireRole(["ADMIN", "STAFF"]);

  const subscription = await db.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) throw new NotFoundError("Subscription not found");

  if (subscription.status !== SubscriptionStatus.ACTIVE) {
    throw new ForbiddenError("Only ACTIVE subscriptions can be renewed.");
  }

  if (!subscription.plan.renewable) {
    throw new ForbiddenError(
      `Plan "${subscription.plan.name}" does not permit renewal.`
    );
  }

  if (!subscription.expiryDate) {
    throw new ForbiddenError(
      "Renewal is only applicable for subscriptions with a defined expiry date."
    );
  }

  // Extend expiry by one plan term
  const newExpiry = addPeriod(subscription.expiryDate, subscription.plan.period);

  return db.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: { expiryDate: newExpiry },
    });

    await tx.activityLog.create({
      data: {
        entity: "subscription",
        entityId: id,
        action: "RENEWED",
        detail: `Subscription renewed. Expiry extended by 1 ${subscription.plan.period.toLowerCase()} cycle to ${newExpiry.toISOString().split("T")[0]}.`,
        actorId: actor.id,
      },
    });

    return updated;
  });
}

/**
 * Close a subscription.
 * User change 3:
 * - closable flag applies only to ACTIVE -> CLOSED. DRAFT/QUOTATION -> CLOSED is always allowed.
 * - If expiryDate is null, every close of an ACTIVE subscription counts as early.
 */
export async function closeSubscription(id: string) {
  return transitionSubscription(id, SubscriptionStatus.CLOSED);
}

