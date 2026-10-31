"use server";

import { requireRole, requireUser } from "@/server/policies/permissions";
import { paymentsService, RecordPaymentInput, ListPaymentsParams } from "@/server/services/payments";
import { revalidatePath, revalidateTag } from "next/cache";

export async function recordPaymentAction(input: RecordPaymentInput) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  try {
    const result = await paymentsService.recordPayment(input, user.id);
    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${input.invoiceId}`);
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidateTag("dashboard", "default");
    revalidateTag("reports", "default");
    return { ok: true as const, data: result };
  } catch (err: any) {
    return {
      ok: false as const,
      error: {
        code: err.code ?? "VALIDATION",
        message: err.message ?? "Failed to record payment",
      },
    };
  }
}

export async function deletePaymentAction(paymentId: string) {
  const user = await requireRole(["ADMIN"]);
  try {
    const result = await paymentsService.deletePayment(paymentId, user.id);
    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${result.invoiceId}`);
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidateTag("dashboard", "default");
    revalidateTag("reports", "default");
    return { ok: true as const, data: result };
  } catch (err: any) {
    return {
      ok: false as const,
      error: {
        code: err.code ?? "SERVER",
        message: err.message ?? "Failed to delete payment",
      },
    };
  }
}

export async function listPaymentsAction(params: ListPaymentsParams = {}) {
  const user = await requireUser();
  const effectiveCustomerId = user.role === "CUSTOMER" ? user.id : params.customerId;

  return paymentsService.listPayments({
    ...params,
    customerId: effectiveCustomerId,
  });
}

