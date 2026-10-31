"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Mail,
  Printer,
  Download,
  AlertTriangle,
} from "lucide-react";
import {
  confirmInvoiceAction,
  cancelInvoiceAction,
  sendInvoiceAction,
} from "@/server/actions/invoices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";

interface InvoiceActionsProps {
  invoice: {
    id: string;
    number: string;
    status: string;
    total: number;
    paidTotal: number;
    sentAt: Date | string | null;
  };
  isStaffOrAdmin: boolean;
}

export function InvoiceActions({ invoice, isStaffOrAdmin }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canConfirm = isStaffOrAdmin && invoice.status === "DRAFT";
  const canRecordPayment =
    isStaffOrAdmin &&
    invoice.status === "CONFIRMED" &&
    invoice.paidTotal < invoice.total;
  const canCancel =
    isStaffOrAdmin &&
    (invoice.status === "DRAFT" ||
      (invoice.status === "CONFIRMED" && invoice.paidTotal === 0));

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await confirmInvoiceAction(invoice.id);
      if (res.ok) {
        toast.success(`Invoice ${invoice.number} confirmed successfully!`);
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await cancelInvoiceAction(invoice.id);
      if (res.ok) {
        toast.success(`Invoice ${invoice.number} cancelled.`);
        setShowCancelConfirm(false);
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await sendInvoiceAction(invoice.id);
      if (res.ok) {
        toast.success(`Invoice email sent!`);
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {canConfirm && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm Invoice</span>
        </button>
      )}

      {canRecordPayment && (
        <RecordPaymentDialog invoice={invoice} />
      )}

      {isStaffOrAdmin && invoice.status !== "CANCELLED" && (
        <button
          onClick={handleSend}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors disabled:opacity-50"
          title={invoice.sentAt ? `Last sent: ${new Date(invoice.sentAt).toLocaleString()}` : "Send via email"}
        >
          <Mail className="w-4 h-4 text-indigo-400" />
          <span>{invoice.sentAt ? "Resend Email" : "Send Email"}</span>
        </button>
      )}

      <button
        onClick={handleOpenPdf}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
      >
        <Download className="w-4 h-4 text-cyan-400" />
        <span>Download PDF</span>
      </button>

      {canCancel && !showCancelConfirm && (
        <button
          onClick={() => setShowCancelConfirm(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 font-medium text-xs transition-colors"
        >
          <XCircle className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      )}

      {showCancelConfirm && (
        <div className="flex items-center gap-2 p-1 bg-rose-500/20 rounded-xl border border-rose-500/30 text-xs">
          <span className="text-rose-200 px-2">Confirm cancel?</span>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600"
          >
            Yes
          </button>
          <button
            onClick={() => setShowCancelConfirm(false)}
            className="px-2 py-1 text-zinc-400 hover:text-white"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

