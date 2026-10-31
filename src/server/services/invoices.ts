import { db } from "@/lib/db";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { today } from "@/lib/dates";

export interface ListInvoicesParams {
  status?: InvoiceStatus | "ALL" | "OVERDUE";
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const invoicesService = {
  async listInvoices(params: ListInvoicesParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.InvoiceWhereInput = {};

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.status && params.status !== "ALL") {
      if (params.status === "OVERDUE") {
        where.status = InvoiceStatus.CONFIRMED;
        where.dueDate = { lt: today() };
        where.paidTotal = { lt: db.invoice.fields.total };
      } else {
        where.status = params.status;
      }
    }

    if (params.search) {
      where.OR = [
        { number: { contains: params.search, mode: "insensitive" } },
        { customer: { name: { contains: params.search, mode: "insensitive" } } },
        { customer: { email: { contains: params.search, mode: "insensitive" } } },
        { subscription: { number: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    if (params.dateFrom || params.dateTo) {
      where.issueDate = {};
      if (params.dateFrom) where.issueDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.issueDate.lte = new Date(params.dateTo);
    }

    const [items, total, aggregates] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true, company: true } },
          subscription: { select: { id: true, number: true, plan: { select: { name: true } } } },
        },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      db.invoice.count({ where }),
      db.invoice.aggregate({
        where,
        _sum: {
          total: true,
          paidTotal: true,
        },
      }),
    ]);

    const totalAmount = aggregates._sum.total ?? 0;
    const totalPaid = aggregates._sum.paidTotal ?? 0;
    const totalOutstanding = Math.max(0, totalAmount - totalPaid);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalAmount,
      totalOutstanding,
    };
  },

  async getInvoice(id: string) {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        lines: {
          include: {
            discount: true,
          },
          orderBy: { id: "asc" },
        },
        payments: {
          orderBy: { paidOn: "desc" },
        },
        reminders: true,
      },
    });

    if (!invoice) return null;

    // Fetch activity log for this invoice
    const activities = await db.activityLog.findMany({
      where: { entity: "invoice", entityId: id },
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { at: "desc" },
    });

    return {
      ...invoice,
      activities,
    };
  },

  async confirmInvoice(id: string, actorId?: string | null) {
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Only DRAFT invoices can be confirmed. Current status: ${invoice.status}`);
    }

    const updated = await db.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CONFIRMED,
      },
    });

    await db.activityLog.create({
      data: {
        entity: "invoice",
        entityId: id,
        action: "INVOICE_CONFIRMED",
        detail: `Invoice ${invoice.number} confirmed`,
        actorId: actorId ?? null,
      },
    });

    return updated;
  },

  async cancelInvoice(id: string, actorId?: string | null) {
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error("Cannot cancel a PAID invoice.");
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error("Invoice is already cancelled.");
    }

    if (invoice.paidTotal > 0) {
      throw new Error(`Cannot cancel invoice with recorded payments (${invoice.paidTotal} paid).`);
    }

    const updated = await db.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
      },
    });

    await db.activityLog.create({
      data: {
        entity: "invoice",
        entityId: id,
        action: "INVOICE_CANCELLED",
        detail: `Invoice ${invoice.number} cancelled`,
        actorId: actorId ?? null,
      },
    });

    return updated;
  },

  async confirmAllDrafts(actorId?: string | null) {
    const drafts = await db.invoice.findMany({
      where: { status: InvoiceStatus.DRAFT },
      select: { id: true, number: true },
    });

    if (drafts.length === 0) {
      return { count: 0 };
    }

    const updated = await db.invoice.updateMany({
      where: { status: InvoiceStatus.DRAFT },
      data: { status: InvoiceStatus.CONFIRMED },
    });

    // Write batch activity log
    await db.activityLog.create({
      data: {
        entity: "invoice",
        entityId: "bulk",
        action: "BULK_CONFIRMED",
        detail: `Bulk confirmed ${updated.count} draft invoices`,
        actorId: actorId ?? null,
      },
    });

    return { count: updated.count };
  },

  async sendInvoice(id: string, actorId?: string | null) {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const updated = await db.invoice.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    await db.activityLog.create({
      data: {
        entity: "invoice",
        entityId: id,
        action: "INVOICE_SENT",
        detail: `Invoice ${invoice.number} sent to ${invoice.customer.email}`,
        actorId: actorId ?? null,
      },
    });

    return updated;
  },
};

