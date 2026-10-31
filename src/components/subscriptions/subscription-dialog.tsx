"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Repeat,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Layers,
  User,
} from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Money } from "@/components/glass/money";
import { toMinorUnits, fromMinorUnits, calculateEffectivePrice } from "@/lib/money";
import {
  createSubscriptionAction,
  createFromTemplateAction,
} from "@/server/actions/subscriptions";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  period: string;
  minQty: number;
  active: boolean;
  availableFrom: Date | string;
  availableTo?: Date | string | null;
}

interface ProductOption {
  id: string;
  name: string;
  salesPrice: number;
  variants: Array<{ id: string; attribute: string; value: string; extraPrice: number }>;
}

interface TaxOption {
  id: string;
  name: string;
  rateBps: number;
}

interface TemplateOption {
  id: string;
  name: string;
  planId: string;
  validityDays: number;
}

interface SubscriptionDialogProps {
  customers: CustomerOption[];
  plans: PlanOption[];
  products: ProductOption[];
  taxes: TaxOption[];
  templates: TemplateOption[];
}

interface LineRow {
  productId: string;
  variantId: string;
  taxId: string;
  quantity: number;
  unitPrice: string; // override unit price
}

export function SubscriptionDialog({
  customers,
  plans,
  products,
  taxes,
  templates,
}: SubscriptionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"scratch" | "template">("scratch");

  // Template Tab State
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || "");
  const [templateCustomerId, setTemplateCustomerId] = useState(customers[0]?.id || "");
  const [templateStartDate, setTemplateStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Scratch Tab State
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("15");
  const [validityDays, setValidityDays] = useState("30");

  const [lines, setLines] = useState<LineRow[]>([
    {
      productId: products[0]?.id || "",
      variantId: products[0]?.variants[0]?.id || "",
      taxId: taxes[0]?.id || "",
      quantity: 1,
      unitPrice: products[0]
        ? fromMinorUnits(
            calculateEffectivePrice(
              products[0].salesPrice,
              products[0].variants[0]?.extraPrice || 0
            )
          )
        : "1000.00",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === planId);
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    const defaultVariant = prod?.variants[0];
    const unitPrice = prod
      ? fromMinorUnits(
          calculateEffectivePrice(prod.salesPrice, defaultVariant?.extraPrice || 0)
        )
      : "0.00";

    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? {
              ...l,
              productId: newProductId,
              variantId: defaultVariant?.id || "",
              unitPrice,
            }
          : l
      )
    );
  };

  const handleVariantChange = (index: number, newVariantId: string) => {
    const line = lines[index];
    const prod = products.find((p) => p.id === line.productId);
    const v = prod?.variants.find((variant) => variant.id === newVariantId);
    const unitPrice = prod
      ? fromMinorUnits(calculateEffectivePrice(prod.salesPrice, v?.extraPrice || 0))
      : "0.00";

    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? {
              ...l,
              variantId: newVariantId,
              unitPrice,
            }
          : l
      )
    );
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    setLines((prev) => [
      ...prev,
      {
        productId: defaultProd?.id || "",
        variantId: defaultProd?.variants[0]?.id || "",
        taxId: taxes[0]?.id || "",
        quantity: 1,
        unitPrice: defaultProd
          ? fromMinorUnits(
              calculateEffectivePrice(
                defaultProd.salesPrice,
                defaultProd.variants[0]?.extraPrice || 0
              )
            )
          : "1000.00",
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "template") {
        const res = await createFromTemplateAction({
          templateId: selectedTemplateId,
          customerId: templateCustomerId,
          startDate: templateStartDate,
        });

        if (!res.success) {
          setError(res.error || "Failed to create from template");
          setLoading(false);
          return;
        }

        setOpen(false);
        setLoading(false);
        router.push(`/subscriptions/${res.data.id}`);
      } else {
        const res = await createSubscriptionAction({
          customerId,
          planId,
          startDate,
          expiryDate: expiryDate || undefined,
          paymentTermsDays: parseInt(paymentTermsDays, 10) || 15,
          validityDays: parseInt(validityDays, 10) || 30,
          lines: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId || undefined,
            taxId: l.taxId || undefined,
            quantity: l.quantity,
            unitPrice: toMinorUnits(l.unitPrice),
          })),
        });

        if (!res.success) {
          setError(res.error || "Failed to create subscription");
          setLoading(false);
          return;
        }

        setOpen(false);
        setLoading(false);
        router.push(`/subscriptions/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 fill-black stroke-[3]" />
        <span>New Subscription</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <GlassCard className="p-6 relative border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Create Subscription Contract
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Sequential SUB numbering, product lines, and plan rules
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Selector Tabs */}
              {templates.length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                  <button
                    type="button"
                    onClick={() => setTab("scratch")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      tab === "scratch"
                        ? "bg-[#6d5dfc] text-white shadow-md shadow-[#6d5dfc]/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Custom Subscription (From Scratch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("template")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      tab === "template"
                        ? "bg-[#22d3ee] text-black shadow-md shadow-[#22d3ee]/30 font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>From Quotation Template</span>
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === "template" ? (
                  /* ================= FROM TEMPLATE TAB ================= */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Select Quotation Template *
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                      >
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} ({tpl.validityDays} days validity)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Customer Account *
                        </label>
                        <select
                          value={templateCustomerId}
                          onChange={(e) => setTemplateCustomerId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={templateStartDate}
                          onChange={(e) => setTemplateStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= FROM SCRATCH TAB ================= */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Customer Account *
                        </label>
                        <select
                          value={customerId}
                          onChange={(e) => setCustomerId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Subscription Plan *
                        </label>
                        <select
                          value={planId}
                          onChange={(e) => setPlanId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.period}) - Min Qty: {p.minQty}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Expiry Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Payment Terms
                        </label>
                        <select
                          value={paymentTermsDays}
                          onChange={(e) => setPaymentTermsDays(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        >
                          <option value="0">Immediate Due</option>
                          <option value="15">Net 15 Days</option>
                          <option value="30">Net 30 Days</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Quote Validity
                        </label>
                        <select
                          value={validityDays}
                          onChange={(e) => setValidityDays(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                        >
                          <option value="15">15 Days</option>
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                        </select>
                      </div>
                    </div>

                    {/* Lines Section */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white">Product Lines</span>
                          {selectedPlan && (
                            <span className="text-[11px] text-zinc-400 block">
                              Total units: {totalQuantity} / Plan minimum: {selectedPlan.minQty}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddLine}
                          className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Line</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {lines.map((l, idx) => {
                          const prod = products.find((p) => p.id === l.productId);
                          const lineTotal = l.quantity * toMinorUnits(l.unitPrice);

                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 grid grid-cols-12 gap-2 items-center"
                            >
                              <div className="col-span-4">
                                <label className="text-[9px] text-zinc-400 block">Product</label>
                                <select
                                  value={l.productId}
                                  onChange={(e) => handleProductChange(idx, e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-3">
                                <label className="text-[9px] text-zinc-400 block">Variant</label>
                                <select
                                  value={l.variantId}
                                  onChange={(e) => handleVariantChange(idx, e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                                >
                                  <option value="">Standard Base</option>
                                  {prod?.variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.attribute}: {v.value} (+{v.extraPrice / 100})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-1">
                                <label className="text-[9px] text-zinc-400 block">Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={l.quantity}
                                  onChange={(e) =>
                                    setLines((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? { ...item, quantity: parseInt(e.target.value, 10) || 1 }
                                          : item
                                      )
                                    )
                                  }
                                  className="w-full px-1.5 py-1 text-xs font-mono rounded-lg bg-white/[0.04] border border-white/10 text-white"
                                />
                              </div>

                              <div className="col-span-2">
                                <label className="text-[9px] text-zinc-400 block">Unit (₹)</label>
                                <input
                                  type="text"
                                  required
                                  value={l.unitPrice}
                                  onChange={(e) =>
                                    setLines((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, unitPrice: e.target.value } : item
                                      )
                                    )
                                  }
                                  className="w-full px-2 py-1 text-xs font-mono rounded-lg bg-white/[0.04] border border-white/10 text-white"
                                />
                              </div>

                              <div className="col-span-1 text-right">
                                <span className="text-[9px] text-zinc-400 block">Total</span>
                                <Money amount={lineTotal} className="text-xs font-bold text-[#22d3ee]" />
                              </div>

                              <div className="col-span-1 text-right">
                                <button
                                  type="button"
                                  disabled={lines.length === 1}
                                  onClick={() => handleRemoveLine(idx)}
                                  className="p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-brutal px-5 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Subscription</span>
                    )}
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}

