import { prisma } from "@/lib/db";
import { DiscountInput } from "@/lib/validators/discount";
import { Prisma } from "@prisma/client";
import { allocateLargestRemainder } from "@/lib/billing-math";

export interface LineDiscountResult {
  discountAmount: number;
  discountId: string | null;
  discountName: string | null;
  taxableAmount: number;
}

export const discountsService = {
  async listDiscounts() {
    return prisma.discount.findMany({
      include: {
        targets: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getDiscount(id: string) {
    return prisma.discount.findUnique({
      where: { id },
      include: {
        targets: true,
      },
    });
  },

  async createDiscount(input: DiscountInput) {
    return prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: input.name,
          type: input.type,
          value: input.value,
          minPurchase: input.minPurchase,
          minQty: input.minQty,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          usageLimit: input.usageLimit ?? null,
          scope: input.scope,
          active: input.active,
        },
      });

      if (input.scope === "PRODUCT" && input.targetProductIds.length > 0) {
        await tx.discountTarget.createMany({
          data: input.targetProductIds.map((productId) => ({
            discountId: discount.id,
            productId,
          })),
        });
      } else if (input.scope === "SUBSCRIPTION" && input.targetSubscriptionIds.length > 0) {
        await tx.discountTarget.createMany({
          data: input.targetSubscriptionIds.map((subscriptionId) => ({
            discountId: discount.id,
            subscriptionId,
          })),
        });
      }

      return discount;
    });
  },

  async updateDiscount(id: string, input: DiscountInput) {
    return prisma.$transaction(async (tx) => {
      const discount = await tx.discount.update({
        where: { id },
        data: {
          name: input.name,
          type: input.type,
          value: input.value,
          minPurchase: input.minPurchase,
          minQty: input.minQty,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          usageLimit: input.usageLimit ?? null,
          scope: input.scope,
          active: input.active,
        },
      });

      // Refresh targets
      await tx.discountTarget.deleteMany({ where: { discountId: id } });

      if (input.scope === "PRODUCT" && input.targetProductIds.length > 0) {
        await tx.discountTarget.createMany({
          data: input.targetProductIds.map((productId) => ({
            discountId: discount.id,
            productId,
          })),
        });
      } else if (input.scope === "SUBSCRIPTION" && input.targetSubscriptionIds.length > 0) {
        await tx.discountTarget.createMany({
          data: input.targetSubscriptionIds.map((subscriptionId) => ({
            discountId: discount.id,
            subscriptionId,
          })),
        });
      }

      return discount;
    });
  },

  async deactivateDiscount(id: string) {
    return prisma.discount.update({
      where: { id },
      data: { active: false },
    });
  },

  /**
   * Resolves discounts for lines in the billing run.
   * Uses Decision D1 (no stacking, best discount per line, subscription scope applies to remainder via largest-remainder).
   * Atomically claims discount usage using UPDATE ... WHERE usedCount < usageLimit.
   */
  async resolveDiscountsForLines(
    tx: Prisma.TransactionClient,
    params: {
      asOf: Date;
      subscriptionId: string;
      lines: Array<{
        productId: string;
        quantity: number;
        lineSubtotal: number;
      }>;
    }
  ): Promise<{
    lineDiscounts: Array<{
      discountAmount: number;
      discountId: string | null;
      discountName: string | null;
      taxableAmount: number;
    }>;
    claimedDiscountIds: string[];
  }> {
    const { asOf, subscriptionId, lines } = params;

    // Fetch active candidates whose validity window covers asOf
    const candidates = await tx.discount.findMany({
      where: {
        active: true,
        startDate: { lte: asOf },
        OR: [{ endDate: null }, { endDate: { gte: asOf } }],
      },
      include: {
        targets: true,
      },
    });

    const claimedDiscountIds: string[] = [];

    // Helper: atomically increment discount usage
    const tryClaimDiscount = async (discountId: string): Promise<boolean> => {
      const updated = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `UPDATE "Discount"
         SET "usedCount" = "usedCount" + 1
         WHERE id = $1 AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
         RETURNING id;`,
        discountId
      );
      if (updated && updated.length > 0) {
        claimedDiscountIds.push(discountId);
        return true;
      }
      return false;
    };

    // 1. Resolve product-scope discounts per line sequentially (avoiding concurrent queries on tx)
    const productLineDiscounts: Array<{
      discountAmount: number;
      discountId: string | null;
      discountName: string | null;
    }> = [];

    for (const line of lines) {
      const eligibleProductDiscounts = candidates.filter((d) => {
        if (d.scope !== "PRODUCT") return false;
        if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return false;
        if (line.quantity < d.minQty) return false;
        if (line.lineSubtotal < d.minPurchase) return false;
        return d.targets.some((t) => t.productId === line.productId);
      });

      if (eligibleProductDiscounts.length === 0) {
        productLineDiscounts.push({ discountAmount: 0, discountId: null, discountName: null });
        continue;
      }

      // Calculate potential discount for each and pick highest (Decision D1)
      const scored = eligibleProductDiscounts.map((d) => {
        let amt = 0;
        if (d.type === "FIXED") {
          amt = Math.min(d.value, line.lineSubtotal);
        } else {
          amt = Math.round((line.lineSubtotal * d.value) / 10000);
        }
        return { discount: d, amount: amt };
      });

      scored.sort((a, b) => b.amount - a.amount);

      let applied = false;
      // Try to atomically claim the best one
      for (const item of scored) {
        if (item.amount <= 0) continue;
        const claimed = await tryClaimDiscount(item.discount.id);
        if (claimed) {
          productLineDiscounts.push({
            discountAmount: item.amount,
            discountId: item.discount.id,
            discountName: item.discount.name,
          });
          applied = true;
          break;
        }
      }

      if (!applied) {
        productLineDiscounts.push({ discountAmount: 0, discountId: null, discountName: null });
      }
    }

    // Remaining line bases after product discounts
    const remainingLineBases = lines.map((line, idx) =>
      Math.max(0, line.lineSubtotal - productLineDiscounts[idx].discountAmount)
    );
    const remainingSubtotal = remainingLineBases.reduce((sum, b) => sum + b, 0);
    const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

    // 2. Resolve subscription-scope discount
    const eligibleSubDiscounts = candidates.filter((d) => {
      if (d.scope !== "SUBSCRIPTION") return false;
      if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return false;
      if (totalQuantity < d.minQty) return false;
      if (remainingSubtotal < d.minPurchase) return false;
      // Either explicitly targets this subscription, or has no targets (global)
      return (
        d.targets.length === 0 ||
        d.targets.some((t) => t.subscriptionId === subscriptionId)
      );
    });

    let chosenSubDiscount: (typeof candidates)[0] | null = null;
    let subDiscountAmount = 0;

    if (eligibleSubDiscounts.length > 0 && remainingSubtotal > 0) {
      const scoredSub = eligibleSubDiscounts.map((d) => {
        let amt = 0;
        if (d.type === "FIXED") {
          amt = Math.min(d.value, remainingSubtotal);
        } else {
          amt = Math.round((remainingSubtotal * d.value) / 10000);
        }
        return { discount: d, amount: amt };
      });

      scoredSub.sort((a, b) => b.amount - a.amount);

      for (const item of scoredSub) {
        if (item.amount <= 0) continue;
        const claimed = await tryClaimDiscount(item.discount.id);
        if (claimed) {
          chosenSubDiscount = item.discount;
          subDiscountAmount = item.amount;
          break;
        }
      }
    }

    // Allocate subscription discount across lines via largest-remainder method
    const allocatedSubDiscounts = chosenSubDiscount
      ? allocateLargestRemainder(subDiscountAmount, remainingLineBases)
      : lines.map(() => 0);

    // Combine results
    const lineDiscounts = lines.map((line, idx) => {
      const prodDiscount = productLineDiscounts[idx];
      const subAllocated = allocatedSubDiscounts[idx];
      const totalLineDiscount = prodDiscount.discountAmount + subAllocated;

      // Active discount reference (line gets product discount if present, else subscription discount)
      const appliedDiscountId = prodDiscount.discountId ?? chosenSubDiscount?.id ?? null;
      const appliedDiscountName =
        prodDiscount.discountName ?? chosenSubDiscount?.name ?? null;

      const taxableAmount = Math.max(0, line.lineSubtotal - totalLineDiscount);

      return {
        discountAmount: totalLineDiscount,
        discountId: appliedDiscountId,
        discountName: appliedDiscountName,
        taxableAmount,
      };
    });

    return { lineDiscounts, claimedDiscountIds };
  },

  /**
   * Reverts claimed discount usages if an invoice insertion conflicted
   */
  async revertClaimedDiscounts(
    tx: Prisma.TransactionClient,
    discountIds: string[]
  ) {
    for (const discountId of discountIds) {
      await tx.$queryRawUnsafe(
        `UPDATE "Discount"
         SET "usedCount" = GREATEST(0, "usedCount" - 1)
         WHERE id = $1;`,
        discountId
      );
    }
  },
};
