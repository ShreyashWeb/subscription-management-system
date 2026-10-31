import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCsvRow } from "@/lib/csv";
import { formatMoney } from "@/lib/money";
import { format } from "date-fns";

const MAX_EXPORT_ROWS = 5000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const session = await auth();

  // 1. Authorization: Admin and Staff only
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json(
      { error: "Forbidden: CSV exports are restricted to Admin and Staff roles." },
      { status: 403 }
    );
  }

  const { entity } = await params;
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const customerId = searchParams.get("customerId");
  const planId = searchParams.get("planId");

  let csvContent = "";
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");

  try {
    switch (entity.toLowerCase()) {
      case "subscriptions": {
        const where: any = {};
        if (status && status !== "ALL") where.status = status;
        if (customerId) where.customerId = customerId;
        if (planId) where.planId = planId;
        if (from) where.startDate = { ...where.startDate, gte: new Date(from) };
        if (to) where.startDate = { ...where.startDate, lte: new Date(to) };

        const subscriptions = await db.subscription.findMany({
          where,
          take: MAX_EXPORT_ROWS,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { name: true, email: true, company: true } },
            plan: { select: { name: true, period: true } },
            lines: { select: { quantity: true, unitPrice: true } },
          },
        });

        // Headers
        csvContent += formatCsvRow([
          "Subscription Number",
          "Customer Name",
          "Customer Email",
          "Company",
          "Plan Name",
          "Billing Period",
          "Status",
          "Start Date",
          "Next Invoice Date",
          "Expiry Date",
          "Recurring Total",
        ]);

        for (const sub of subscriptions) {
          const recurringTotal = sub.lines.reduce(
            (acc, l) => acc + l.quantity * l.unitPrice,
            0
          );
          csvContent += formatCsvRow([
            sub.number,
            sub.customer.name,
            sub.customer.email,
            sub.customer.company ?? "",
            sub.plan.name,
            sub.plan.period,
            sub.status,
            sub.startDate ? format(sub.startDate, "yyyy-MM-dd") : "",
            sub.nextInvoiceDate ? format(sub.nextInvoiceDate, "yyyy-MM-dd") : "",
            sub.expiryDate ? format(sub.expiryDate, "yyyy-MM-dd") : "",
            formatMoney(recurringTotal),
          ]);
        }
        break;
      }

      case "invoices": {
        const where: any = {};
        if (status && status !== "ALL") {
          if (status === "OVERDUE") {
            where.status = "CONFIRMED";
            where.dueDate = { lt: new Date() };
          } else {
            where.status = status;
          }
        }
        if (customerId) where.customerId = customerId;
        if (from) where.issueDate = { ...where.issueDate, gte: new Date(from) };
        if (to) where.issueDate = { ...where.issueDate, lte: new Date(to) };

        const invoices = await db.invoice.findMany({
          where,
          take: MAX_EXPORT_ROWS,
          orderBy: { issueDate: "desc" },
          include: {
            customer: { select: { name: true, email: true, company: true } },
            subscription: { select: { number: true } },
          },
        });

        csvContent += formatCsvRow([
          "Invoice Number",
          "Subscription Number",
          "Customer Name",
          "Customer Email",
          "Company",
          "Status",
          "Issue Date",
          "Due Date",
          "Period Start",
          "Period End",
          "Subtotal",
          "Discount Total",
          "Tax Total",
          "Total",
          "Paid Total",
          "Outstanding",
        ]);

        for (const inv of invoices) {
          const outstanding = Math.max(0, inv.total - inv.paidTotal);
          csvContent += formatCsvRow([
            inv.number,
            inv.subscription.number,
            inv.customer.name,
            inv.customer.email,
            inv.customer.company ?? "",
            inv.status,
            format(inv.issueDate, "yyyy-MM-dd"),
            format(inv.dueDate, "yyyy-MM-dd"),
            format(inv.periodStart, "yyyy-MM-dd"),
            format(inv.periodEnd, "yyyy-MM-dd"),
            formatMoney(inv.subtotal),
            formatMoney(inv.discountTotal),
            formatMoney(inv.taxTotal),
            formatMoney(inv.total),
            formatMoney(inv.paidTotal),
            formatMoney(outstanding),
          ]);
        }
        break;
      }

      case "payments": {
        const where: any = {};
        if (customerId) where.invoice = { customerId };
        if (from) where.paidOn = { ...where.paidOn, gte: new Date(from) };
        if (to) where.paidOn = { ...where.paidOn, lte: new Date(to) };

        const payments = await db.payment.findMany({
          where,
          take: MAX_EXPORT_ROWS,
          orderBy: { paidOn: "desc" },
          include: {
            invoice: {
              select: {
                number: true,
                customer: { select: { name: true, email: true, company: true } },
              },
            },
          },
        });

        csvContent += formatCsvRow([
          "Payment ID",
          "Invoice Number",
          "Customer Name",
          "Customer Email",
          "Company",
          "Method",
          "Amount",
          "Paid On",
          "Note",
        ]);

        for (const pay of payments) {
          csvContent += formatCsvRow([
            pay.id,
            pay.invoice.number,
            pay.invoice.customer.name,
            pay.invoice.customer.email,
            pay.invoice.customer.company ?? "",
            pay.method,
            formatMoney(pay.amount),
            format(pay.paidOn, "yyyy-MM-dd"),
            pay.note ?? "",
          ]);
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid export entity: '${entity}'. Supported entities: subscriptions, invoices, payments.` },
          { status: 400 }
        );
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${entity}-export-${timestamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[ExportCSV] Failed to generate CSV:", err);
    return NextResponse.json(
      { error: "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}

