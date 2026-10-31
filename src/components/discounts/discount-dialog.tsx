"use client";

import React, { useState } from "react";
import { Plus, Edit2, Tag, Percent, DollarSign, X } from "lucide-react";
import { toMinorUnits, fromMinorUnits } from "@/lib/money";
import {
  createDiscountAction,
  updateDiscountAction,
} from "@/server/actions/discounts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DiscountTarget {
  id: string;
  productId?: string | null;
  subscriptionId?: string | null;
}

interface DiscountData {
  id: string;
  name: string;
  type: "FIXED" | "PERCENT";
  value: number;
  minPurchase: number;
  minQty: number;
  startDate: string | Date;
  endDate?: string | Date | null;
  usageLimit?: number | null;
  usedCount: number;
  scope: "PRODUCT" | "SUBSCRIPTION";
  active: boolean;
  targets: DiscountTarget[];
}

interface ProductOption {
  id: string;
  name: string;
}

interface SubscriptionOption {
  id: string;
  number: string;
  customerName: string;
}

interface DiscountDialogProps {
  discount?: DiscountData;
  products: ProductOption[];
  subscriptions: SubscriptionOption[];
  trigger?: React.ReactNode;
}

export function DiscountDialog({
  discount,
  products,
  subscriptions,
  trigger,
}: DiscountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!discount;

  const [name, setName] = useState(discount?.name ?? "");
  const [type, setType] = useState<"FIXED" | "PERCENT">(discount?.type ?? "PERCENT");
  const [displayValue, setDisplayValue] = useState(
    discount
      ? discount.type === "FIXED"
        ? fromMinorUnits(discount.value)
        : (discount.value / 100).toString()
      : "10"
  );
  const [minPurchase, setMinPurchase] = useState(
    discount ? fromMinorUnits(discount.minPurchase) : "0"
  );
  const [minQty, setMinQty] = useState(discount?.minQty.toString() ?? "0");
  const [startDate, setStartDate] = useState(
    discount
      ? new Date(discount.startDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    discount?.endDate
      ? new Date(discount.endDate).toISOString().slice(0, 10)
      : ""
  );
  const [usageLimit, setUsageLimit] = useState(
    discount?.usageLimit ? discount.usageLimit.toString() : ""
  );
  const [scope, setScope] = useState<"PRODUCT" | "SUBSCRIPTION">(
    discount?.scope ?? "PRODUCT"
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    discount?.targets
      .filter((t) => t.productId)
      .map((t) => t.productId as string) ?? []
  );
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>(
    discount?.targets
      .filter((t) => t.subscriptionId)
      .map((t) => t.subscriptionId as string) ?? []
  );
  const [active, setActive] = useState(discount?.active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);

    try {
      const parsedValue =
        type === "FIXED"
          ? toMinorUnits(displayValue)
          : Math.round(parseFloat(displayValue || "0") * 100);

      const payload = {
        name: name.trim(),
        type,
        value: parsedValue,
        minPurchase: toMinorUnits(minPurchase),
        minQty: parseInt(minQty || "0", 10),
        startDate,
        endDate: endDate ? endDate : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        scope,
        targetProductIds: scope === "PRODUCT" ? selectedProductIds : [],
        targetSubscriptionIds: scope === "SUBSCRIPTION" ? selectedSubscriptionIds : [],
        active,
      };

      const res = isEdit
        ? await updateDiscountAction(discount.id, payload)
        : await createDiscountAction(payload);

      if (!res.ok) {
        toast.error(res.error.message);
        setLoading(false);
        return;
      }

      toast.success(
        isEdit ? "Discount updated successfully" : "Discount created successfully"
      );
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSubscription = (subId: string) => {
    setSelectedSubscriptionIds((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId]
    );
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : isEdit ? (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Edit Discount"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-white/16 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">
                  {isEdit ? "Edit Discount Rule" : "Create Discount Rule"}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Discount Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hackathon Early Bird (15% OFF)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("PERCENT")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        type === "PERCENT"
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("FIXED")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        type === "FIXED"
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Fixed Amount
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    {type === "PERCENT" ? "Rate (%)" : "Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    step={type === "PERCENT" ? "0.01" : "0.01"}
                    required
                    value={displayValue}
                    onChange={(e) => setDisplayValue(e.target.value)}
                    placeholder={type === "PERCENT" ? "10.00" : "500.00"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="PRODUCT">PRODUCT (Item-level)</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION (Order-level)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Usage Limit (Empty = Unlimited)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {scope === "PRODUCT" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Target Products ({selectedProductIds.length} selected)
                  </label>
                  <div className="max-h-36 overflow-y-auto p-2 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    {products.length === 0 ? (
                      <p className="text-xs text-zinc-500 p-2">No active products available</p>
                    ) : (
                      products.map((p) => {
                        const checked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors ${
                              checked ? "bg-indigo-500/15 text-white" : "text-zinc-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(p.id)}
                              className="rounded border-zinc-600 text-indigo-500"
                            />
                            <span>{p.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {scope === "SUBSCRIPTION" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Target Subscriptions (Empty = All Subscriptions)
                  </label>
                  <div className="max-h-36 overflow-y-auto p-2 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    {subscriptions.map((s) => {
                      const checked = selectedSubscriptionIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors ${
                            checked ? "bg-indigo-500/15 text-white" : "text-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubscription(s.id)}
                            className="rounded border-zinc-600 text-indigo-500"
                          />
                          <span>
                            {s.number} - {s.customerName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Min Purchase (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Min Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-zinc-600 text-indigo-500"
                />
                <label htmlFor="activeToggle" className="text-sm text-zinc-300 font-medium">
                  Active Rule (evaluated in billing runs)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : isEdit ? "Update Discount" : "Create Discount"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

