"use client";

import React, { useState } from "react";
import { CreditCard, DollarSign, Calendar, FileText, X } from "lucide-react";
import { toMinorUnits, fromMinorUnits, formatMoney } from "@/lib/money";
import { recordPaymentAction } from "@/server/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PaymentMethod } from "@/server/services/payments";

interface RecordPaymentDialogProps {
  invoice: {
    id: string;
    number: string;
    total: number;
    paidTotal: number;
    status: string;
  };
  trigger?: React.ReactNode;
}

const paymentMethods: { label: string; value: PaymentMethod }[] = [
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "UPI", value: "UPI" },
  { label: "Credit/Debit Card", value: "CARD" },
  { label: "Cash", value: "CASH" },
  { label: "Cheque", value: "CHEQUE" },
];

export function RecordPaymentDialog({ invoice, trigger }: RecordPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const outstanding = Math.max(0, invoice.total - invoice.paidTotal);

  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [amountStr, setAmountStr] = useState(fromMinorUnits(outstanding));
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const handleOpen = () => {
    setAmountStr(fromMinorUnits(outstanding));
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = toMinorUnits(amountStr);

    if (amountMinor <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }

    if (amountMinor > outstanding) {
      toast.error(
        `Cannot pay ${formatMoney(amountMinor)}: exceeds outstanding balance of ${formatMoney(outstanding)}`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await recordPaymentAction({
        invoiceId: invoice.id,
        method,
        amount: amountMinor,
        paidOn,
        note: note.trim() || null,
      });

      if (!res.ok) {
        toast.error(res.error.message);
        setLoading(false);
        return;
      }

      toast.success(
        `Payment of ${formatMoney(amountMinor)} recorded! Invoice status is now ${res.data.invoice.status}.`
      );
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen}>{trigger}</span>
      ) : (
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-white/16 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Record Payment for {invoice.number}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Outstanding context callout */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
              <span className="text-zinc-400">Outstanding Balance:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatMoney(outstanding)}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Amount (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmountStr(fromMinorUnits(outstanding))}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Pay Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paidOn}
                  onChange={(e) => setPaidOn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. UTR #123456789 or Cheque #987654"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

