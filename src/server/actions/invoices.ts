"use server";

import { requireRole, requireUser } from "@/server/policies/permissions";
import { invoicesService, ListInvoicesParams } from "@/server/services/invoices";
import { revalidatePath } from "next/cache";

export async function listInvoicesAction(params: ListInvoicesParams = {}) {
  const user = await requireUser();

  // Scoped to customer's own invoices if role is CUSTOMER
  const effectiveCustomerId =
    user.role === "CUSTOMER" ? user.id : params.customerId;

  return invoicesService.listInvoices({
    ...params,
    customerId: effectiveCustomerId,
  });
}

export async function getInvoiceAction(id: string) {
  const user = await requireUser();
  const invoice = await invoicesService.getInvoice(id);

  if (!invoice) {
    return {
      ok: false as const,
      error: { code: "NOT_FOUND" as const, message: "Invoice not found" },
    };
  }

  // Ownership check: If customer, only see own invoice; otherwise 404
  if (user.role === "CUSTOMER" && invoice.customerId !== user.id) {
    return {
      ok: false as const,
      error: { code: "NOT_FOUND" as const, message: "Invoice not found" },
    };
  }

  return { ok: true as const, data: invoice };
}

export async function confirmInvoiceAction(id: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  try {
    const updated = await invoicesService.confirmInvoice(id, user.id);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return { ok: true as const, data: updated };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}

export async function cancelInvoiceAction(id: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  try {
    const updated = await invoicesService.cancelInvoice(id, user.id);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return { ok: true as const, data: updated };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}

export async function confirmAllDraftsAction() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  try {
    const result = await invoicesService.confirmAllDrafts(user.id);
    revalidatePath("/invoices");
    return { ok: true as const, data: result };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}

export async function sendInvoiceAction(id: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  try {
    const updated = await invoicesService.sendInvoice(id, user.id);
    revalidatePath(`/invoices/${id}`);
    return { ok: true as const, data: updated };
  } catch (err: any) {
    return {
      ok: false as const,
      error: { code: "SERVER" as const, message: err.message },
    };
  }
}
