import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#18181b",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: "#6d5dfc",
    paddingBottom: 14,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
  },
  brandSubtitle: {
    fontSize: 8,
    color: "#71717a",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#09090b",
  },
  invoiceMeta: {
    fontSize: 8,
    color: "#71717a",
    textAlign: "right",
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  col: {
    width: "48%",
  },
  sectionHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  primaryText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 8,
    color: "#52525b",
    marginBottom: 1,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#3f3f46",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDesc: { width: "42%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "14%", textAlign: "right" },
  colDisc: { width: "14%", textAlign: "right" },
  colTax: { width: "10%", textAlign: "right" },
  colTotal: { width: "10%", textAlign: "right" },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsBox: {
    width: "45%",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fafafa",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#d4d4d8",
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#09090b",
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#4f46e5",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 8,
    textAlign: "center",
    fontSize: 7,
    color: "#a1a1aa",
  },
});

interface InvoicePdfData {
  number: string;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string;
  periodStart: Date | string;
  periodEnd: Date | string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paidTotal: number;
  customer: {
    name: string;
    email: string;
    company?: string | null;
    address?: string | null;
  };
  subscription: {
    number: string;
    plan: {
      name: string;
    };
  };
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    amount: number;
  }>;
}

export function InvoicePdfDocument({ invoice }: { invoice: InvoicePdfData }) {
  const formatDate = (d: Date | string) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toISOString().slice(0, 10);
  };

  const outstanding = Math.max(0, invoice.total - invoice.paidTotal);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Brand Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandTitle}>Brightloop Billing</Text>
            <Text style={styles.brandSubtitle}>High-Precision Subscription Management</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>#{invoice.number}</Text>
            <Text style={styles.invoiceMeta}>Status: {invoice.status}</Text>
          </View>
        </View>

        {/* Addresses & Periods */}
        <View style={styles.sectionRow}>
          <View style={styles.col}>
            <Text style={styles.sectionHeader}>Billed To</Text>
            <Text style={styles.primaryText}>{invoice.customer.name}</Text>
            {invoice.customer.company && (
              <Text style={styles.secondaryText}>{invoice.customer.company}</Text>
            )}
            <Text style={styles.secondaryText}>{invoice.customer.email}</Text>
            {invoice.customer.address && (
              <Text style={styles.secondaryText}>{invoice.customer.address}</Text>
            )}
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionHeader}>Billing Details</Text>
            <Text style={styles.secondaryText}>
              Subscription: {invoice.subscription.number} ({invoice.subscription.plan.name})
            </Text>
            <Text style={styles.secondaryText}>
              Period: {formatDate(invoice.periodStart)} to {formatDate(invoice.periodEnd)}
            </Text>
            <Text style={styles.secondaryText}>Issue Date: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.secondaryText}>Due Date: {formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Lines Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colDisc]}>Discount</Text>
            <Text style={[styles.tableHeaderCell, styles.colTax]}>Tax</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Net</Text>
          </View>

          {invoice.lines.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colPrice}>{formatMoney(line.unitPrice)}</Text>
              <Text style={styles.colDisc}>
                {line.discountAmount > 0 ? `-${formatMoney(line.discountAmount)}` : "—"}
              </Text>
              <Text style={styles.colTax}>{formatMoney(line.taxAmount)}</Text>
              <Text style={styles.colTotal}>{formatMoney(line.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Box */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.secondaryText}>Subtotal:</Text>
              <Text style={styles.secondaryText}>{formatMoney(invoice.subtotal)}</Text>
            </View>
            {invoice.discountTotal > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.secondaryText}>Discounts:</Text>
                <Text style={[styles.secondaryText, { color: "#16a34a" }]}>
                  -{formatMoney(invoice.discountTotal)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.secondaryText}>Tax Total:</Text>
              <Text style={styles.secondaryText}>{formatMoney(invoice.taxTotal)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatMoney(invoice.total)}</Text>
            </View>
            {invoice.paidTotal > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.secondaryText}>Paid:</Text>
                <Text style={styles.secondaryText}>{formatMoney(invoice.paidTotal)}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.secondaryText}>Outstanding:</Text>
              <Text style={[styles.secondaryText, { fontFamily: "Helvetica-Bold" }]}>
                {formatMoney(outstanding)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing Brightloop Billing. Questions? Contact billing@brightloop.com</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdfBuffer(invoice: InvoicePdfData): Promise<Buffer> {
  const doc = <InvoicePdfDocument invoice={invoice} />;
  return renderToBuffer(doc);
}

