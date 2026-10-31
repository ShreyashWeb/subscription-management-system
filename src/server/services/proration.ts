import { db } from "@/lib/db";
import { today, evaluatePlanAvailability } from "@/lib/dates";
import { addPeriod } from "@/lib/period";
import { getNextSequenceNumber } from "@/lib/numbering";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { addDays, differenceInCalendarDays } from "date-fns";
import { calculateEffectivePrice } from "@/lib/money";

export interface ProrationLineInput {
  productId: string;
  variantId?: string | null;
  taxId?: string | null;
  quantity: number;
  unitPrice?: number;
}

export interface ProrationPreviewResult {
  periodStart: Date;
  periodEnd: Date;
  changeDate: Date;
  periodDays: number;
  remainingDays: number;
  oldRecurringTotal: number;
  newRecurringTotal: number;
  credit: number;
  charge: number;
  adjustment: number;
  isUpgrade: boolean;
  currentPlanName: string;
  newPlanName: string;
}

export interface ApplyProrationResult extends ProrationPreviewResult {
  subscriptionId: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

/**
 * Pure calculation for proration per docs/06-BILLING-LOGIC.md Section 9:
 * periodDays    = periodEnd - periodStart + 1
 * remainingDays = periodEnd - changeDate + 1
 * credit        = round(oldRecurringTotal * remainingDays / periodDays)
 * charge        = round(newRecurringTotal * remainingDays / periodDays)
 * adjustment    = charge - credit
 */
export function calculateProrationMath(params: {
  oldRecurringTotal: number;
  newRecurringTotal: number;
  periodStart: Date;
  periodEnd: Date;
  changeDate: Date;
}): {
  periodDays: number;
  remainingDays: number;
  credit: number;
  charge: number;
  adjustment: number;
  isUpgrade: boolean;
} {
  const { oldRecurringTotal, newRecurringTotal, periodStart, periodEnd, changeDate } = params;

  // Total days in the current billing period (inclusive)
  const rawPeriodDays = differenceInCalendarDays(periodEnd, periodStart) + 1;
  const periodDays = Math.max(1, rawPeriodDays);

  // Remaining days from change date until end of period (inclusive)
  const rawRemainingDays = differenceInCalendarDays(periodEnd, changeDate) + 1;
  // Clamp between 0 and periodDays
  const remainingDays = Math.max(0, Math.min(rawRemainingDays, periodDays));

  // Prorated refund/credit for unused portion of old plan
  const credit = Math.round((oldRecurringTotal * remainingDays) / periodDays);

  // Prorated charge for portion of new plan
  const charge = Math.round((newRecurringTotal * remainingDays) / periodDays);

  // Net adjustment (positive = additional charge, negative = credit)
  const adjustment = charge - credit;
  const isUpgrade = adjustment > 0 || newRecurringTotal > oldRecurringTotal;

  return {
    periodDays,
    remainingDays,
    credit,
    charge,
    adjustment,
    isUpgrade,
  };
}

export const prorationService = {
  /**
   * Preview a mid-cycle plan or quantity change with zero database mutations.
   */
  async previewChange(params: {
    subscriptionId: string;
    newPlanId?: string;
    newLines?: ProrationLineInput[];
    changeDate?: Date | string;
    customerId?: string;
  }): Promise<ProrationPreviewResult> {
    const { subscriptionId, newPlanId, newLines, customerId } = params;
    const changeDate = params.changeDate ? new Date(params.changeDate) : today();

    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
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

    if (!sub) {
      throw new NotFoundError("Subscription not found");
    }

    // Customer scoping: returns 404 if unauthorized
    if (customerId && sub.customerId !== customerId) {
      throw new NotFoundError("Subscription not found");
    }

    if (sub.status !== "ACTIVE") {
      throw new ValidationError("Proration is only applicable to ACTIVE subscriptions.");
    }

    // Determine current billing period
    const latestInvoice = await db.invoice.findFirst({
      where: { subscriptionId: sub.id },
      orderBy: { periodStart: "desc" },
    });

    let periodStart: Date;
    let periodEnd: Date;

    if (latestInvoice) {
      periodStart = new Date(latestInvoice.periodStart);
      periodEnd = new Date(latestInvoice.periodEnd);
    } else {
      periodStart = new Date(sub.startDate);
      if (sub.nextInvoiceDate) {
        periodEnd = addDays(new Date(sub.nextInvoiceDate), -1);
      } else {
        periodEnd = addDays(addPeriod(periodStart, sub.plan.period), -1);
      }
    }

    // Ensure periodEnd >= periodStart
    if (periodEnd < periodStart) {
      periodEnd = addDays(addPeriod(periodStart, sub.plan.period), -1);
    }

    // Calculate old recurring total
    const oldRecurringTotal = sub.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0
    );

    // Determine target plan
    const targetPlan = newPlanId && newPlanId !== sub.planId
      ? await db.plan.findUnique({ where: { id: newPlanId } })
      : sub.plan;

    if (!targetPlan) {
      throw new NotFoundError("Selected plan not found");
    }

    // Check target plan availability
    if (newPlanId && newPlanId !== sub.planId) {
      const avail = evaluatePlanAvailability(targetPlan, changeDate);
      if (!avail.isAvailable) {
        throw new ValidationError(`Selected plan "${targetPlan.name}" is not currently available.`);
      }
    }

    // Calculate new recurring total
    let newRecurringTotal = 0;
    if (newLines && newLines.length > 0) {
      for (const line of newLines) {
        let price = line.unitPrice;
        if (price === undefined || price === null) {
          const prod = await db.product.findUnique({
            where: { id: line.productId },
            include: { variants: true },
          });
          if (!prod) throw new NotFoundError(`Product not found: ${line.productId}`);
          const extra = line.variantId
            ? prod.variants.find((v) => v.id === line.variantId)?.extraPrice || 0
            : 0;
          price = calculateEffectivePrice(prod.salesPrice, extra);
        }
        newRecurringTotal += line.quantity * price;
      }
    } else {
      // If no new lines passed, keep current lines recurring total (or adapt to target plan if different)
      newRecurringTotal = oldRecurringTotal;
    }

    // Check minQty if changing lines or plan
    const totalQty = newLines && newLines.length > 0
      ? newLines.reduce((sum, l) => sum + l.quantity, 0)
      : sub.lines.reduce((sum, l) => sum + l.quantity, 0);

    if (totalQty < targetPlan.minQty) {
      throw new ValidationError(
        `Total quantity (${totalQty}) is below the required plan minimum (${targetPlan.minQty}).`
      );
    }

    const math = calculateProrationMath({
      oldRecurringTotal,
      newRecurringTotal,
      periodStart,
      periodEnd,
      changeDate,
    });

    return {
      periodStart,
      periodEnd,
      changeDate,
      periodDays: math.periodDays,
      remainingDays: math.remainingDays,
      oldRecurringTotal,
      newRecurringTotal,
      credit: math.credit,
      charge: math.charge,
      adjustment: math.adjustment,
      isUpgrade: math.isUpgrade,
      currentPlanName: sub.plan.name,
      newPlanName: targetPlan.name,
    };
  },

  /**
   * Apply a mid-cycle plan or quantity change atomically inside a transaction.
   * Updates lines, logs activity, and generates a proration invoice if adjustment > 0.
   */
  async applyChange(params: {
    subscriptionId: string;
    newPlanId?: string;
    newLines?: ProrationLineInput[];
    changeDate?: Date | string;
    customerId?: string;
    actorId?: string | null;
  }): Promise<ApplyProrationResult> {
    const { subscriptionId, newPlanId, newLines, customerId, actorId } = params;
    const changeDate = params.changeDate ? new Date(params.changeDate) : today();

    // 1. Get preview calculation first
    const preview = await this.previewChange(params);

    return db.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, lines: true },
      });

      if (!sub) throw new NotFoundError("Subscription not found");
      if (customerId && sub.customerId !== customerId) {
        throw new NotFoundError("Subscription not found");
      }

      const planId = newPlanId || sub.planId;
      const targetPlan = await tx.plan.findUnique({ where: { id: planId } });
      if (!targetPlan) throw new NotFoundError("Target plan not found");

      // 2. Update Subscription lines if provided
      if (newLines && newLines.length > 0) {
        await tx.subscriptionLine.deleteMany({
          where: { subscriptionId: sub.id },
        });

        for (const line of newLines) {
          let price = line.unitPrice;
          if (price === undefined || price === null) {
            const prod = await tx.product.findUnique({
              where: { id: line.productId },
              include: { variants: true },
            });
            if (!prod) throw new NotFoundError(`Product not found: ${line.productId}`);
            const extra = line.variantId
              ? prod.variants.find((v) => v.id === line.variantId)?.extraPrice || 0
              : 0;
            price = calculateEffectivePrice(prod.salesPrice, extra);
          }

          await tx.subscriptionLine.create({
            data: {
              subscriptionId: sub.id,
              productId: line.productId,
              variantId: line.variantId || null,
              taxId: line.taxId || null,
              quantity: line.quantity,
              unitPrice: price,
            },
          });
        }
      }

      // 3. Update subscription's planId if changed
      if (newPlanId && newPlanId !== sub.planId) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { planId: newPlanId },
        });
      }

      let createdInvoiceId: string | undefined;
      let createdInvoiceNumber: string | undefined;

      // 4. If adjustment > 0, generate an immediate Proration Adjustment Invoice
      if (preview.adjustment > 0) {
        const invNumber = await getNextSequenceNumber(tx, "INV", changeDate);
        const dueDate = addDays(changeDate, sub.paymentTermsDays || 15);

        const inv = await tx.invoice.create({
          data: {
            number: invNumber,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            status: "CONFIRMED",
            issueDate: changeDate,
            dueDate,
            periodStart: changeDate,
            periodEnd: preview.periodEnd,
            subtotal: preview.adjustment,
            discountTotal: 0,
            taxTotal: 0,
            total: preview.adjustment,
            paidTotal: 0,
            lines: {
              create: [
                {
                  description: `Proration Adjustment: ${preview.currentPlanName} → ${preview.newPlanName} (${preview.remainingDays}/${preview.periodDays} days)`,
                  quantity: 1,
                  unitPrice: preview.adjustment,
                  lineSubtotal: preview.adjustment,
                  taxAmount: 0,
                  amount: preview.adjustment,
                },
              ],
            },
          },
        });

        createdInvoiceId = inv.id;
        createdInvoiceNumber = inv.number;

        await tx.activityLog.create({
          data: {
            entity: "invoice",
            entityId: inv.id,
            action: "PRORATION_INVOICE_CREATED",
            detail: `Proration adjustment invoice ${inv.number} generated for ₹${(preview.adjustment / 100).toFixed(2)}.`,
            actorId: actorId || null,
          },
        });
      }

      // 5. Activity log for subscription expansion/contraction
      const activityAction =
        preview.newRecurringTotal > preview.oldRecurringTotal
          ? "EXPANSION"
          : preview.newRecurringTotal < preview.oldRecurringTotal
          ? "CONTRACTION"
          : "PLAN_CHANGE";

      await tx.activityLog.create({
        data: {
          entity: "subscription",
          entityId: sub.id,
          action: activityAction,
          detail: `Subscription modified mid-cycle (${preview.remainingDays}/${preview.periodDays} days remaining). Credit: ₹${(preview.credit / 100).toFixed(2)}, Charge: ₹${(preview.charge / 100).toFixed(2)}, Net Adjustment: ₹${(preview.adjustment / 100).toFixed(2)}.`,
          actorId: actorId || null,
        },
      });

      return {
        ...preview,
        subscriptionId: sub.id,
        invoiceId: createdInvoiceId,
        invoiceNumber: createdInvoiceNumber,
      };
    },
    { maxWait: 15000, timeout: 60000 });
  },
};

