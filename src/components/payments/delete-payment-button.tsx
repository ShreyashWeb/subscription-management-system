"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePaymentAction } from "@/server/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeletePaymentButton({
  paymentId,
  amountFormatted,
  invoiceNumber,
}: {
  paymentId: string;
  amountFormatted: string;
  invoiceNumber: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deletePaymentAction(paymentId);
      if (res.ok) {
        toast.success(
          `Payment of ${amountFormatted} deleted. Invoice ${invoiceNumber} status is now ${res.data.newStatus}.`
        );
        setConfirming(false);
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-rose-500/20 rounded-lg text-[11px]">
        <span className="text-rose-300 font-medium px-1">Reopen balance?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors"
        >
          {loading ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-1.5 py-0.5 text-zinc-400 hover:text-white"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Delete payment (reopens invoice balance)"
      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

