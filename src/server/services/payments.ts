import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ValidationError, ConflictError, NotFoundError } from "@/lib/errors";
import { Prisma, InvoiceStatus } from "@prisma/client";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "UPI" | "CHEQUE";

export interface RecordPaymentInput {
  invoiceId: string;
  method: PaymentMethod;
  amount: number; // minor units
  paidOn: Date | string;
  note?: string | null;
}

export interface ListPaymentsParams {
  customerId?: string;
  invoiceId?: string;
  method?: PaymentMethod | "ALL";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const paymentsService = {
  /**
   * Records a payment against an invoice in a single transaction with row locking.
   * Enforces:
   * 1. Status must be CONFIRMED.
   * 2. Amount > 0.
   * 3. Amount <= outstanding (strict overpayment guard).
   * 4. Automatic flip to PAID when paidTotal === total.
   */
  async recordPayment(input: RecordPaymentInput, actorId?: string | null) {
    if (!input.method) {
      throw new ValidationError("Payment method is required.");
    }

    if (input.amount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero.");
    }

    const paidOnDate = typeof input.paidOn === "string" ? new Date(input.paidOn) : input.paidOn;

    return db.$transaction(
      async (tx) => {
        // 1. Lock invoice row FOR UPDATE
        const lockedRows = await tx.$queryRawUnsafe<Array<{
          id: string;
          number: string;
          status: string;
          total: number;
          paidTotal: number;
          customerId: string;
        }>>(
          `SELECT id, number, status, total, "paidTotal", "customerId"
           FROM "Invoice"
           WHERE id = $1
           FOR UPDATE;`,
          input.invoiceId
        );

        if (!lockedRows || lockedRows.length === 0) {
          throw new NotFoundError("Invoice not found.");
        }

        const invoice = lockedRows[0];

        // 2. Status guard: Accept payments only when the invoice is CONFIRMED
        if (invoice.status !== "CONFIRMED") {
          throw new ValidationError(
            `Payments can only be recorded on CONFIRMED invoices. Current status is ${invoice.status}.`
          );
        }

        // 3. Overpayment guard
        const outstanding = invoice.total - invoice.paidTotal;
        if (input.amount > outstanding) {
          throw new ConflictError(
            `Payment amount of ${formatMoney(input.amount)} exceeds the outstanding balance of ${formatMoney(outstanding)}.`
          );
        }

        // 4. Insert Payment record
        const payment = await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            method: input.method,
            amount: input.amount,
            paidOn: paidOnDate,
            note: input.note ?? null,
            createdById: actorId ?? null,
          },
        });

        const paymentId = payment.id;
        const newPaidTotal = invoice.paidTotal + input.amount;
        const newStatus: InvoiceStatus = newPaidTotal >= invoice.total ? "PAID" : "CONFIRMED";

        // 5. Update Invoice status & paidTotal
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidTotal: newPaidTotal,
            status: newStatus,
          },
        });

        // 6. Audit log
        await tx.activityLog.create({
          data: {
            entity: "invoice",
            entityId: invoice.id,
            action: "PAYMENT_RECORDED",
            detail: `Recorded ${input.method} payment of ${formatMoney(input.amount)}. New status: ${newStatus} (Remaining: ${formatMoney(Math.max(0, invoice.total - newPaidTotal))})`,
            actorId: actorId ?? null,
          },
        });

        return {
          payment: {
            id: paymentId,
            invoiceId: invoice.id,
            method: input.method,
            amount: input.amount,
            paidOn: paidOnDate,
            note: input.note ?? null,
          },
          invoice: {
            id: invoice.id,
            number: invoice.number,
            status: newStatus,
            total: invoice.total,
            paidTotal: newPaidTotal,
            outstanding: Math.max(0, invoice.total - newPaidTotal),
          },
        };
      },
      { maxWait: 15000, timeout: 60000 }
    );
  },

  /**
   * Deletes a payment (Admin only).
   * Reverses paidTotal on the invoice and reopens status to CONFIRMED if balance becomes > 0.
   */
  async deletePayment(paymentId: string, actorId?: string | null) {
    return db.$transaction(
      async (tx) => {
        // Lock payment and associated invoice
        const lockedRows = await tx.$queryRawUnsafe<Array<{
          p_id: string;
          amount: number;
          invoiceId: string;
          inv_number: string;
          inv_status: string;
          inv_total: number;
          inv_paidTotal: number;
        }>>(
          `SELECT
             p.id as p_id, p.amount, p."invoiceId",
             i.number as inv_number, i.status as inv_status,
             i.total as inv_total, i."paidTotal" as "inv_paidTotal"
           FROM "Payment" p
           JOIN "Invoice" i ON p."invoiceId" = i.id
           WHERE p.id = $1
           FOR UPDATE;`,
          paymentId
        );

        if (!lockedRows || lockedRows.length === 0) {
          throw new NotFoundError("Payment not found.");
        }

        const row = lockedRows[0];
        const newPaidTotal = Math.max(0, row.inv_paidTotal - row.amount);
        const newStatus =
          row.inv_status === "PAID" && newPaidTotal < row.inv_total
            ? "CONFIRMED"
            : row.inv_status;

        // Delete the payment row
        await tx.payment.delete({
          where: { id: paymentId },
        });

        // Update invoice
        await tx.invoice.update({
          where: { id: row.invoiceId },
          data: {
            paidTotal: newPaidTotal,
            status: newStatus as InvoiceStatus,
          },
        });

        // Audit log
        await tx.activityLog.create({
          data: {
            entity: "invoice",
            entityId: row.invoiceId,
            action: "PAYMENT_DELETED",
            detail: `Deleted payment of ${formatMoney(row.amount)}. Reopened balance: ${formatMoney(row.inv_total - newPaidTotal)} (Status: ${newStatus})`,
            actorId: actorId ?? null,
          },
        });

        return {
          deletedPaymentId: paymentId,
          invoiceId: row.invoiceId,
          newPaidTotal,
          newStatus,
          outstanding: Math.max(0, row.inv_total - newPaidTotal),
        };
      },
      { maxWait: 15000, timeout: 60000 }
    );
  },

  /**
   * Lists payments with filtering, pagination, and aggregate sum.
   */
  async listPayments(params: ListPaymentsParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PaymentWhereInput = {};

    if (params.customerId) {
      where.invoice = { customerId: params.customerId };
    }

    if (params.invoiceId) {
      where.invoiceId = params.invoiceId;
    }

    if (params.method && params.method !== "ALL") {
      where.method = params.method;
    }

    if (params.dateFrom || params.dateTo) {
      where.paidOn = {};
      if (params.dateFrom) where.paidOn.gte = new Date(params.dateFrom);
      if (params.dateTo) where.paidOn.lte = new Date(params.dateTo);
    }

    if (params.search) {
      where.OR = [
        { note: { contains: params.search, mode: "insensitive" } },
        { invoice: { number: { contains: params.search, mode: "insensitive" } } },
        { invoice: { customer: { name: { contains: params.search, mode: "insensitive" } } } },
      ];
    }

    const [items, total, aggregate] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              total: true,
              paidTotal: true,
              status: true,
              customer: {
                select: { id: true, name: true, email: true, company: true },
              },
            },
          },
        },
        orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      db.payment.count({ where }),
      db.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalAmount: aggregate._sum.amount ?? 0,
    };
  },
};

