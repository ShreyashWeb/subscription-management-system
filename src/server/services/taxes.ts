import { db } from "@/lib/db";
import { taxSchema, type TaxInput } from "@/lib/validators/catalog";
import {
  requireRole,
  ForbiddenError,
  NotFoundError,
} from "@/server/policies/permissions";

/**
 * List all taxes. Allowed for Admin and Staff.
 */
export async function listTaxes(params: { activeOnly?: boolean } = {}) {
  await requireRole(["ADMIN", "STAFF"]);

  return db.tax.findMany({
    where: params.activeOnly ? { active: true } : undefined,
    include: {
      _count: {
        select: { subLines: true },
      },
    },
    orderBy: [{ active: "desc" }, { rateBps: "asc" }],
  });
}

/**
 * Create a new tax rate (Admin only).
 * Percentage input (e.g. 18.00) is stored as integer basis points (1800).
 */
export async function createTax(input: TaxInput) {
  await requireRole(["ADMIN"]);
  const parsed = taxSchema.parse(input);

  const rateBps = Math.round(parsed.ratePercent * 100);

  return db.tax.create({
    data: {
      name: parsed.name,
      rateBps,
      active: parsed.active,
    },
  });
}

/**
 * Update an existing tax rate (Admin only).
 */
export async function updateTax(id: string, input: TaxInput) {
  await requireRole(["ADMIN"]);
  const parsed = taxSchema.parse(input);

  const existing = await db.tax.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Tax not found");

  const rateBps = Math.round(parsed.ratePercent * 100);

  return db.tax.update({
    where: { id },
    data: {
      name: parsed.name,
      rateBps,
      active: parsed.active,
    },
  });
}

/**
 * Toggle active status of a tax (Admin only).
 */
export async function toggleTaxActive(id: string) {
  await requireRole(["ADMIN"]);
  const tax = await db.tax.findUnique({ where: { id } });
  if (!tax) throw new NotFoundError("Tax not found");

  return db.tax.update({
    where: { id },
    data: { active: !tax.active },
  });
}

/**
 * Delete a tax rate (Admin only).
 */
export async function deleteTax(id: string) {
  await requireRole(["ADMIN"]);

  const linesCount = await db.subscriptionLine.count({
    where: { taxId: id },
  });

  if (linesCount > 0) {
    throw new ForbiddenError(
      `Cannot delete this tax because it is applied to ${linesCount} active subscription lines. Deactivate it instead.`
    );
  }

  return db.tax.delete({ where: { id } });
}

