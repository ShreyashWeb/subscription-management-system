"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
} from "@/server/services/products";
import {
  createTax,
  updateTax,
  toggleTaxActive,
  deleteTax,
} from "@/server/services/taxes";
import {
  createPlan,
  updatePlan,
  togglePlanActive,
  deletePlan,
} from "@/server/services/plans";
import {
  productSchema,
  taxSchema,
  planSchema,
  type ProductInput,
  type TaxInput,
  type PlanInput,
} from "@/lib/validators/catalog";

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/* ================= PRODUCTS ================= */

export async function createProductAction(input: ProductInput): Promise<ActionResponse> {
  try {
    const res = await createProduct(input);
    revalidatePath("/products");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create product" };
  }
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResponse> {
  try {
    const res = await updateProduct(id, input);
    revalidatePath("/products");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product" };
  }
}

export async function toggleProductActiveAction(id: string): Promise<ActionResponse> {
  try {
    const res = await toggleProductActive(id);
    revalidatePath("/products");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle status" };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResponse> {
  try {
    await deleteProduct(id);
    revalidatePath("/products");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete product" };
  }
}

/* ================= TAXES ================= */

export async function createTaxAction(input: TaxInput): Promise<ActionResponse> {
  try {
    const res = await createTax(input);
    revalidatePath("/taxes");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create tax" };
  }
}

export async function updateTaxAction(id: string, input: TaxInput): Promise<ActionResponse> {
  try {
    const res = await updateTax(id, input);
    revalidatePath("/taxes");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update tax" };
  }
}

export async function toggleTaxActiveAction(id: string): Promise<ActionResponse> {
  try {
    const res = await toggleTaxActive(id);
    revalidatePath("/taxes");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle tax status" };
  }
}

export async function deleteTaxAction(id: string): Promise<ActionResponse> {
  try {
    await deleteTax(id);
    revalidatePath("/taxes");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete tax" };
  }
}

/* ================= PLANS ================= */

export async function createPlanAction(input: PlanInput): Promise<ActionResponse> {
  try {
    const res = await createPlan(input);
    revalidatePath("/plans");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create plan" };
  }
}

export async function updatePlanAction(id: string, input: PlanInput): Promise<ActionResponse> {
  try {
    const res = await updatePlan(id, input);
    revalidatePath("/plans");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update plan" };
  }
}

export async function togglePlanActiveAction(id: string): Promise<ActionResponse> {
  try {
    const res = await togglePlanActive(id);
    revalidatePath("/plans");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle plan status" };
  }
}

export async function deletePlanAction(id: string): Promise<ActionResponse> {
  try {
    await deletePlan(id);
    revalidatePath("/plans");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete plan" };
  }
}

