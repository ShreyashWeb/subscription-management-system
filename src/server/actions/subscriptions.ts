"use server";

import { revalidatePath } from "next/cache";
import { SubscriptionStatus } from "@prisma/client";
import {
  createSubscription,
  createSubscriptionFromTemplate,
  updateSubscription,
  transitionSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscription,
} from "@/server/services/subscriptions";
import {
  createTemplate,
  deleteTemplate,
} from "@/server/services/templates";
import {
  createSubscriptionSchema,
  createFromTemplateSchema,
  updateSubscriptionSchema,
  quotationTemplateSchema,
  type CreateSubscriptionInput,
  type CreateFromTemplateInput,
  type UpdateSubscriptionInput,
  type QuotationTemplateInput,
} from "@/lib/validators/subscription";

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/* ================= SUBSCRIPTIONS ================= */

export async function createSubscriptionAction(
  input: CreateSubscriptionInput
): Promise<ActionResponse> {
  try {
    const res = await createSubscription(input);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create subscription" };
  }
}

export async function createFromTemplateAction(
  input: CreateFromTemplateInput
): Promise<ActionResponse> {
  try {
    const res = await createSubscriptionFromTemplate(input);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create from template" };
  }
}

export async function updateSubscriptionAction(
  id: string,
  input: UpdateSubscriptionInput
): Promise<ActionResponse> {
  try {
    const res = await updateSubscription(id, input);
    revalidatePath(`/subscriptions/${id}`);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update subscription" };
  }
}

export async function transitionSubscriptionAction(
  id: string,
  targetStatus: SubscriptionStatus
): Promise<ActionResponse> {
  try {
    const res = await transitionSubscription(id, targetStatus);
    revalidatePath(`/subscriptions/${id}`);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to change status" };
  }
}

export async function pauseSubscriptionAction(id: string): Promise<ActionResponse> {
  try {
    const res = await pauseSubscription(id);
    revalidatePath(`/subscriptions/${id}`);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to pause subscription" };
  }
}

export async function resumeSubscriptionAction(id: string): Promise<ActionResponse> {
  try {
    const res = await resumeSubscription(id);
    revalidatePath(`/subscriptions/${id}`);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to resume subscription" };
  }
}

export async function renewSubscriptionAction(id: string): Promise<ActionResponse> {
  try {
    const res = await renewSubscription(id);
    revalidatePath(`/subscriptions/${id}`);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to renew subscription" };
  }
}

export async function closeSubscriptionAction(id: string): Promise<ActionResponse> {
  try {
    const res = await closeSubscription(id);
    revalidatePath(`/subscriptions/${id}`);
    revalidatePath("/subscriptions");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to close subscription" };
  }
}

/* ================= QUOTATION TEMPLATES ================= */

export async function createTemplateAction(
  input: QuotationTemplateInput
): Promise<ActionResponse> {
  try {
    const res = await createTemplate(input);
    revalidatePath("/templates");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create template" };
  }
}

export async function deleteTemplateAction(id: string): Promise<ActionResponse> {
  try {
    await deleteTemplate(id);
    revalidatePath("/templates");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete template" };
  }
}

