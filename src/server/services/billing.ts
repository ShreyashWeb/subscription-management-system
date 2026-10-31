import { prisma } from "@/lib/db";
import { addPeriod } from "@/lib/period";
import { addDays } from "date-fns";
import { getNextSequenceNumber } from "@/lib/numbering";
import { calculateTaxAmount } from "@/lib/billing-math";
import { discountsService } from "@/server/services/discounts";
import { today } from "@/lib/dates";

export interface BillingRunBatchOptions {
  asOf?: Date | string;
  batchSize?: number;
  actorId?: string | null;
}

export interface BillingRunBatchResult {
  processed: number;
  remaining: number;
  batchSummary: {
    activated: number;
    created: number;
    skippedPaused: number;
    skippedInProgress: number;
    alreadyBilled: number;
    failed: Array<{ subscriptionId: string; number: string; error: string }>;
    durationMs: number;
    invoiceIds: string[];
  };
}

export const billingService = {
  /**
   * Batch-based billing run:
   * 1. Activates due CONFIRMED subscriptions whose startDate <= asOf.
   * 2. Takes up to `batchSize` ACTIVE candidates whose nextInvoiceDate <= asOf.
   * 3. For each candidate in isolated transaction:
   *    - Row lock with FOR UPDATE SKIP LOCKED and re-check.
   *    - If no row returned: counts as "skipped: in progress", not failed.
   *    - If paused: skips.
   *    - Catch-up loop for missed periods.
   *    - Resolves discounts with guarded atomic usage increment.
   *    - Computes per-line tax and invoice totals.
   *    - Inserts with ON CONFLICT (subscriptionId, periodStart) DO NOTHING RETURNING id.
   *    - If conflicted, reverts claimed discounts and advances date.
   *    - Evaluates autoClose.
   * 4. Returns processed count, remaining count, and batch summary for UI progress bar.
   */
  async runBatch(options: BillingRunBatchOptions = {}): Promise<BillingRunBatchResult> {
    const startTime = Date.now();
    const asOfDate = options.asOf
      ? new Date(options.asOf)
      : today();
    const batchSize = options.batchSize ?? 100;
    const actorId = options.actorId ?? null;

    // Step 1: Activate CONFIRMED subscriptions whose startDate <= asOf
    let activatedCount = 0;
    const dueConfirmed = await prisma.subscription.findMany({
      where: {
        status: "CONFIRMED",
        startDate: { lte: asOfDate },
      },
      include: {
        plan: { select: { trialDays: true } },
      },
      take: batchSize,
    });

    for (const sub of dueConfirmed) {
      const trialDays = sub.plan?.trialDays ?? 0;
      const nextInvoiceDate = addDays(sub.startDate, trialDays);

      const updated = await prisma.subscription.updateMany({
        where: { id: sub.id, status: "CONFIRMED" },
        data: {
          status: "ACTIVE",
          nextInvoiceDate,
        },
      });

      if (updated.count > 0) {
        activatedCount++;
        await prisma.activityLog.create({
          data: {
            entity: "subscription",
            entityId: sub.id,
            action: "ACTIVATED",
            detail: `Activated on billing run as startDate <= asOf (trialDays: ${trialDays})`,
            actorId,
          },
        });
      }
    }

    // Step 2: Query candidate ACTIVE subscriptions for this batch
    const candidates = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        nextInvoiceDate: { lte: asOfDate },
      },
      take: batchSize,
      orderBy: [{ nextInvoiceDate: "asc" }, { id: "asc" }],
      select: { id: true, number: true },
    });

    let createdCount = 0;
    let skippedPaused = 0;
    let skippedInProgress = 0;
    let alreadyBilled = 0;
    const failed: Array<{ subscriptionId: string; number: string; error: string }> = [];
    const invoiceIds: string[] = [];

    // Step 3: Process each candidate in its own isolated transaction
    for (const candidate of candidates) {
      try {
        await prisma.$transaction(
          async (tx) => {
            // Re-check status = ACTIVE and nextInvoiceDate <= asOf with row lock
            const lockedRows = await tx.$queryRawUnsafe<Array<{
              id: string;
              number: string;
              customerId: string;
              planId: string;
              status: string;
              startDate: Date;
              expiryDate: Date | null;
              paymentTermsDays: number;
              nextInvoiceDate: Date;
              isPaused: boolean;
            }>>(
              `SELECT id, number, "customerId", "planId", status, "startDate", "expiryDate", "paymentTermsDays", "nextInvoiceDate", "isPaused"
               FROM "Subscription"
               WHERE id = $1 AND status = 'ACTIVE' AND "nextInvoiceDate" <= $2::date
               FOR UPDATE SKIP LOCKED;`,
              candidate.id,
              asOfDate
            );

          // Change 1: If no row returned, count as skippedInProgress, not failed!
          if (!lockedRows || lockedRows.length === 0) {
            skippedInProgress++;
            return;
          }

          const sub = lockedRows[0];

          if (sub.isPaused) {
            skippedPaused++;
            return;
          }

          const plan = await tx.plan.findUniqueOrThrow({
            where: { id: sub.planId },
          });

          const subLines = await tx.subscriptionLine.findMany({
            where: { subscriptionId: sub.id },
            include: {
              product: true,
              variant: true,
              tax: true,
            },
          });

          if (subLines.length === 0) {
            return;
          }

          let currentNextInvoiceDate = new Date(sub.nextInvoiceDate);

          // Catch-up loop for missed periods
          while (
            currentNextInvoiceDate <= asOfDate &&
            (sub.expiryDate === null || currentNextInvoiceDate <= sub.expiryDate)
          ) {
            const periodStart = new Date(currentNextInvoiceDate);
            const nextPeriodStart = addPeriod(periodStart, plan.period);
            const periodEnd = addDays(nextPeriodStart, -1);

            const linesData = subLines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineSubtotal: l.quantity * l.unitPrice,
              description: l.variant
                ? `${l.product.name} (${l.variant.attribute}: ${l.variant.value})`
                : l.product.name,
              taxRateBps: l.tax && l.tax.active ? l.tax.rateBps : 0,
            }));

            // Resolve discounts (atomic usage increment inside transaction)
            const { lineDiscounts, claimedDiscountIds } =
              await discountsService.resolveDiscountsForLines(tx, {
                asOf: asOfDate,
                subscriptionId: sub.id,
                lines: linesData,
              });

            let invoiceSubtotal = 0;
            let invoiceDiscountTotal = 0;
            let invoiceTaxTotal = 0;

            const computedLines = linesData.map((line, idx) => {
              const discount = lineDiscounts[idx];
              const taxable = discount.taxableAmount;
              const taxAmount = calculateTaxAmount(taxable, line.taxRateBps);
              const lineAmount = taxable + taxAmount;

              invoiceSubtotal += line.lineSubtotal;
              invoiceDiscountTotal += discount.discountAmount;
              invoiceTaxTotal += taxAmount;

              return {
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                lineSubtotal: line.lineSubtotal,
                discountAmount: discount.discountAmount,
                discountId: discount.discountId,
                taxAmount,
                amount: lineAmount,
              };
            });

            const invoiceTotal = invoiceSubtotal - invoiceDiscountTotal + invoiceTaxTotal;
            const issueDate = asOfDate; // Decision D3
            const dueDate = addDays(issueDate, sub.paymentTermsDays);

            const invoiceNumber = await getNextSequenceNumber(tx, "INV", issueDate);

            // Change 4: INSERT ... ON CONFLICT (subscriptionId, periodStart) DO NOTHING RETURNING id
            const insertedRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
              `INSERT INTO "Invoice" (
                id, number, "subscriptionId", "customerId", status,
                "issueDate", "dueDate", "periodStart", "periodEnd",
                subtotal, "discountTotal", "taxTotal", total, "paidTotal",
                "createdAt", "updatedAt"
              )
              VALUES (
                gen_random_uuid()::text, $1, $2, $3, 'DRAFT',
                $4::date, $5::date, $6::date, $7::date,
                $8, $9, $10, $11, 0,
                NOW(), NOW()
              )
              ON CONFLICT ("subscriptionId", "periodStart") DO NOTHING
              RETURNING id;`,
              invoiceNumber,
              sub.id,
              sub.customerId,
              issueDate,
              dueDate,
              periodStart,
              periodEnd,
              invoiceSubtotal,
              invoiceDiscountTotal,
              invoiceTaxTotal,
              invoiceTotal
            );

            if (!insertedRows || insertedRows.length === 0) {
              // Conflicted! Revert claimed discounts and advance date
              await discountsService.revertClaimedDiscounts(tx, claimedDiscountIds);
              alreadyBilled++;
              currentNextInvoiceDate = nextPeriodStart;
              continue;
            }

            const invoiceId = insertedRows[0].id;
            invoiceIds.push(invoiceId);
            createdCount++;

            // Snapshot lines
            for (const line of computedLines) {
              await tx.$queryRawUnsafe(
                `INSERT INTO "InvoiceLine" (
                  id, "invoiceId", description, quantity, "unitPrice",
                  "lineSubtotal", "discountAmount", "discountId", "taxAmount", amount
                )
                VALUES (
                  gen_random_uuid()::text, $1, $2, $3, $4,
                  $5, $6, $7, $8, $9
                );`,
                invoiceId,
                line.description,
                line.quantity,
                line.unitPrice,
                line.lineSubtotal,
                line.discountAmount,
                line.discountId,
                line.taxAmount,
                line.amount
              );
            }

            await tx.activityLog.create({
              data: {
                entity: "invoice",
                entityId: invoiceId,
                action: "INVOICE_GENERATED",
                detail: `Generated invoice ${invoiceNumber} for period ${periodStart.toISOString().slice(0, 10)} - ${periodEnd.toISOString().slice(0, 10)}`,
                actorId,
              },
            });

            currentNextInvoiceDate = nextPeriodStart;
          }

          // Auto-close check
          let shouldAutoClose = false;
          let closeReason = "";

          if (plan.autoClose) {
            if (sub.expiryDate && currentNextInvoiceDate > sub.expiryDate) {
              shouldAutoClose = true;
              closeReason = "Auto-closed: next billing period is beyond expiry date";
            } else if (plan.availableTo && currentNextInvoiceDate > plan.availableTo) {
              shouldAutoClose = true;
              closeReason = "Auto-closed: next billing period is beyond plan availableTo date";
            }
          }

          if (shouldAutoClose) {
            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                status: "CLOSED",
                closedAt: new Date(),
                nextInvoiceDate: null,
              },
            });
            await tx.activityLog.create({
              data: {
                entity: "subscription",
                entityId: sub.id,
                action: "AUTO_CLOSED",
                detail: closeReason,
                actorId,
              },
            });
          } else {
            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                nextInvoiceDate: currentNextInvoiceDate,
              },
            });
          }
        }, { maxWait: 15000, timeout: 60000 });
      } catch (err: any) {
        failed.push({
          subscriptionId: candidate.id,
          number: candidate.number,
          error: err.message,
        });
      }
    }

    // Step 4: Count remaining ACTIVE subscriptions due as of asOfDate
    const remainingCount = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
        nextInvoiceDate: { lte: asOfDate },
      },
    });

    return {
      processed: candidates.length,
      remaining: remainingCount,
      batchSummary: {
        activated: activatedCount,
        created: createdCount,
        skippedPaused,
        skippedInProgress,
        alreadyBilled,
        failed,
        durationMs: Date.now() - startTime,
        invoiceIds,
      },
    };
  },
};
