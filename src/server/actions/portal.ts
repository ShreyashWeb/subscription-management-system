"use server";

import { requireUser } from "@/server/policies/permissions";
import { portalService } from "@/server/services/portal";
import { prorationService, ProrationLineInput } from "@/server/services/proration";
import { revalidatePath } from "next/cache";

export type ActionResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export async function pauseSubscriptionAction(subscriptionId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const updated = await portalService.pauseSubscription(user.id, subscriptionId);
    revalidatePath("/portal");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { ok: true, data: updated };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: err.name || "SERVER_ERROR",
        message: err.message || "Failed to pause subscription",
      },
    };
  }
}

export async function resumeSubscriptionAction(subscriptionId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const updated = await portalService.resumeSubscription(user.id, subscriptionId);
    revalidatePath("/portal");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { ok: true, data: updated };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: err.name || "SERVER_ERROR",
        message: err.message || "Failed to resume subscription",
      },
    };
  }
}

export async function cancelSubscriptionAction(subscriptionId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const updated = await portalService.cancelSubscription(user.id, subscriptionId);
    revalidatePath("/portal");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { ok: true, data: updated };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: err.name || "SERVER_ERROR",
        message: err.message || "Failed to cancel subscription",
      },
    };
  }
}

export async function previewProrationAction(
  subscriptionId: string,
  params: {
    newPlanId?: string;
    newLines?: ProrationLineInput[];
  }
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const preview = await prorationService.previewChange({
      subscriptionId,
      newPlanId: params.newPlanId,
      newLines: params.newLines,
      customerId: user.id,
    });
    return { ok: true, data: preview };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: err.name || "SERVER_ERROR",
        message: err.message || "Failed to calculate proration preview",
      },
    };
  }
}

export async function applyProrationAction(
  subscriptionId: string,
  params: {
    newPlanId?: string;
    newLines?: ProrationLineInput[];
  }
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const result = await prorationService.applyChange({
      subscriptionId,
      newPlanId: params.newPlanId,
      newLines: params.newLines,
      customerId: user.id,
      actorId: user.id,
    });
    revalidatePath("/portal");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    revalidatePath("/portal/invoices");
    return { ok: true, data: result };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: err.name || "SERVER_ERROR",
        message: err.message || "Failed to apply plan change",
      },
    };
  }
}

