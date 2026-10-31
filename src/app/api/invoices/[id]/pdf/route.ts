import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { invoicesService } from "@/server/services/invoices";
import { generateInvoicePdfBuffer } from "@/server/services/invoice-pdf";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const invoice = await invoicesService.getInvoice(id);

  if (!invoice) {
    return new Response("Invoice Not Found", { status: 404 });
  }

  // Requirement 8: The invoice PDF route returns 404 for customers who do not own the invoice
  if (session.user.role === "CUSTOMER" && invoice.customerId !== session.user.id) {
    return new Response("Invoice Not Found", { status: 404 });
  }

  try {
    const pdfBuffer = await generateInvoicePdfBuffer(invoice as any);
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice-${invoice.number}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return new Response(`PDF Generation Error: ${err.message}`, { status: 500 });
  }
}
