"use server";

import { requireRole } from "@/server/policies/permissions";
import { discountsService } from "@/server/services/discounts";
import { discountSchema, DiscountInput } from "@/lib/validators/discount";
import { revalidatePath } from "next/cache";

export async function listDiscountsAction() {
  await requireRole(["ADMIN", "STAFF"]);
  return discountsService.listDiscounts();
}

export async function createDiscountAction(rawInput: DiscountInput) {
  await requireRole(["ADMIN"]);
  const parsed = discountSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION" as const,
        message: parsed.error.issues[0]?.message ?? "Invalid discount data",
      },
    };
  }

  try {
    const discount = await discountsService.createDiscount(parsed.data);
    revalidatePath("/discounts");
    return { ok: true as const, data: discount };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}

export async function updateDiscountAction(id: string, rawInput: DiscountInput) {
  await requireRole(["ADMIN"]);
  const parsed = discountSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION" as const,
        message: parsed.error.issues[0]?.message ?? "Invalid discount data",
      },
    };
  }

  try {
    const discount = await discountsService.updateDiscount(id, parsed.data);
    revalidatePath("/discounts");
    return { ok: true as const, data: discount };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}

export async function deactivateDiscountAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    await discountsService.deactivateDiscount(id);
    revalidatePath("/discounts");
    return { ok: true as const };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}

