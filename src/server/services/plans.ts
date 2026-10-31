import { BillingPeriod, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { planSchema, type PlanInput } from "@/lib/validators/catalog";
import {
  requireRole,
  ForbiddenError,
  NotFoundError,
} from "@/server/policies/permissions";
import { today, evaluatePlanAvailability } from "@/lib/dates";

export interface ListPlansParams {
  period?: BillingPeriod | "ALL";
  active?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * List plans with availability status check.
 * Allowed for Admin and Staff.
 */
export async function listPlans(params: ListPlansParams = {}) {
  await requireRole(["ADMIN", "STAFF"]);

  const { period, active, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.PlanWhereInput = {};

  if (active !== undefined) {
    where.active = active;
  }

  if (period && period !== "ALL") {
    where.period = period as BillingPeriod;
  }

  const [total, items] = await Promise.all([
    db.plan.count({ where }),
    db.plan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
            templates: true,
          },
        },
      },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  const currentDate = today();
  const enrichedItems = items.map((plan) => {
    const availability = evaluatePlanAvailability(
      {
        availableFrom: plan.availableFrom,
        availableTo: plan.availableTo,
      },
      currentDate
    );

    return {
      ...plan,
      availability,
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
 * Get plan by ID with availability check.
 */
export async function getPlan(id: string) {
  await requireRole(["ADMIN", "STAFF"]);

  const plan = await db.plan.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subscriptions: true,
          templates: true,
        },
      },
    },
  });

  if (!plan) throw new NotFoundError("Plan not found");

  const availability = evaluatePlanAvailability(
    {
      availableFrom: plan.availableFrom,
      availableTo: plan.availableTo,
    },
    today()
  );

  return {
    ...plan,
    availability,
  };
}

/**
 * Create a new Plan (Admin only).
 * Correct flag definitions per docs/06-BILLING-LOGIC.md:
 * - renewable: the Renew action is allowed for this plan
 * - autoClose: subscription closes after its last period
 * - closable: early close allowed
 * - pausable: pause allowed
 */
export async function createPlan(input: PlanInput) {
  await requireRole(["ADMIN"]);
  const parsed = planSchema.parse(input);

  const availableFrom = new Date(parsed.availableFrom);
  const availableTo = parsed.availableTo ? new Date(parsed.availableTo) : null;

  if (availableTo && availableTo < availableFrom) {
    throw new Error("Availability end date cannot be earlier than start date");
  }

  return db.plan.create({
    data: {
      name: parsed.name,
      price: parsed.price,
      period: parsed.period as BillingPeriod,
      minQty: parsed.minQty,
      availableFrom,
      availableTo,
      autoClose: parsed.autoClose,
      closable: parsed.closable,
      pausable: parsed.pausable,
      renewable: parsed.renewable,
      trialDays: parsed.trialDays,
      active: parsed.active,
    },
  });
}

/**
 * Update an existing Plan (Admin only).
 */
export async function updatePlan(id: string, input: PlanInput) {
  await requireRole(["ADMIN"]);
  const parsed = planSchema.parse(input);

  const existing = await db.plan.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Plan not found");

  const availableFrom = new Date(parsed.availableFrom);
  const availableTo = parsed.availableTo ? new Date(parsed.availableTo) : null;

  if (availableTo && availableTo < availableFrom) {
    throw new Error("Availability end date cannot be earlier than start date");
  }

  return db.plan.update({
    where: { id },
    data: {
      name: parsed.name,
      price: parsed.price,
      period: parsed.period as BillingPeriod,
      minQty: parsed.minQty,
      availableFrom,
      availableTo,
      autoClose: parsed.autoClose,
      closable: parsed.closable,
      pausable: parsed.pausable,
      renewable: parsed.renewable,
      trialDays: parsed.trialDays,
      active: parsed.active,
    },
  });
}

/**
 * Toggle plan active status (Admin only).
 */
export async function togglePlanActive(id: string) {
  await requireRole(["ADMIN"]);
  const plan = await db.plan.findUnique({ where: { id } });
  if (!plan) throw new NotFoundError("Plan not found");

  return db.plan.update({
    where: { id },
    data: { active: !plan.active },
  });
}

/**
 * Delete a plan (Admin only).
 */
export async function deletePlan(id: string) {
  await requireRole(["ADMIN"]);

  const [subCount, tplCount] = await Promise.all([
    db.subscription.count({ where: { planId: id } }),
    db.quotationTemplate.count({ where: { planId: id } }),
  ]);

  if (subCount > 0 || tplCount > 0) {
    throw new ForbiddenError(
      `Cannot delete plan because it is referenced in ${subCount + tplCount} subscriptions or templates. Deactivate it instead.`
    );
  }

  return db.plan.delete({ where: { id } });
}

