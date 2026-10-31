"use client";

import React, { useState } from "react";
import { Plus, Trash2, X, Loader2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { createTemplateAction } from "@/server/actions/subscriptions";

interface PlanOption {
  id: string;
  name: string;
  period: string;
}

interface ProductOption {
  id: string;
  name: string;
  variants: Array<{ id: string; attribute: string; value: string }>;
}

interface TemplateDialogProps {
  plans: PlanOption[];
  products: ProductOption[];
}

interface LineRow {
  productId: string;
  variantId: string;
  quantity: number;
}

export function TemplateDialog({ plans, products }: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const [validityDays, setValidityDays] = useState("30");

  const [lines, setLines] = useState<LineRow[]>([
    {
      productId: products[0]?.id || "",
      variantId: products[0]?.variants[0]?.id || "",
      quantity: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    const defaultVariant = prod?.variants[0];

    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? {
              ...l,
              productId: newProductId,
              variantId: defaultVariant?.id || "",
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
        quantity: 1,
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
      const res = await createTemplateAction({
        name,
        planId,
        validityDays: parseInt(validityDays, 10) || 30,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: l.quantity,
        })),
      });

      if (!res.success) {
        setError(res.error || "Failed to create template");
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
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
        <span>New Template</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <GlassCard className="p-6 relative border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Create Quotation Template
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Standard package of plan, lines, and quote validity days
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

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Standard SaaS Growth Bundle"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Associated Plan *
                    </label>
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.period})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Quotation Validity (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    Quotes created from this template will expire after this many days.
                  </span>
                </div>

                {/* Lines */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Pre-filled Product Lines</span>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Line</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {lines.map((l, idx) => {
                      const prod = products.find((p) => p.id === l.productId);

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-6">
                            <label className="text-[9px] text-zinc-400 block">Product</label>
                            <select
                              value={l.productId}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-4">
                            <label className="text-[9px] text-zinc-400 block">Variant</label>
                            <select
                              value={l.variantId}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, variantId: e.target.value } : item
                                  )
                                )
                              }
                              className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white"
                            >
                              <option value="">Standard Base</option>
                              {prod?.variants.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.attribute}: {v.value}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-1">
                            <label className="text-[9px] text-zinc-400 block">Qty</label>
                            <input
                              type="number"
                              min="1"
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Create Template</span>
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

