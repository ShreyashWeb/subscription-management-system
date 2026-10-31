"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Tag,
  DollarSign,
  Layers,
  Edit2,
} from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Money } from "@/components/glass/money";
import { toMinorUnits, fromMinorUnits, calculateMargin, calculateEffectivePrice } from "@/lib/money";
import { createProductAction, updateProductAction } from "@/server/actions/catalog";

interface VariantRow {
  id?: string;
  attribute: string;
  value: string;
  extraPrice: string; // string input e.g. "560.00"
}

interface ProductDialogProps {
  product?: {
    id: string;
    name: string;
    type: string;
    salesPrice: number;
    costPrice: number;
    notes?: string | null;
    active: boolean;
    variants: Array<{
      id: string;
      attribute: string;
      value: string;
      extraPrice: number;
    }>;
  };
  trigger?: React.ReactNode;
}

export function ProductDialog({ product, trigger }: ProductDialogProps) {
  const isEdit = !!product;
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(product?.name || "");
  const [type, setType] = useState(product?.type || "Software");
  const [salesPrice, setSalesPrice] = useState(
    product ? fromMinorUnits(product.salesPrice) : "1000.00"
  );
  const [costPrice, setCostPrice] = useState(
    product ? fromMinorUnits(product.costPrice) : "400.00"
  );
  const [notes, setNotes] = useState(product?.notes || "");
  const [active, setActive] = useState(product?.active ?? true);

  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      id: v.id,
      attribute: v.attribute,
      value: v.value,
      extraPrice: fromMinorUnits(v.extraPrice),
    })) || []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time margin calculations
  const salesMinor = toMinorUnits(salesPrice);
  const costMinor = toMinorUnits(costPrice);
  const { marginAmount, marginPercent } = calculateMargin(salesMinor, costMinor);

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { attribute: "Brand", value: "Odoo", extraPrice: "560.00" },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantRow,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        type,
        salesPrice: salesMinor,
        costPrice: costMinor,
        notes: notes || undefined,
        active,
        variants: variants.map((v) => ({
          id: v.id,
          attribute: v.attribute.trim(),
          value: v.value.trim(),
          extraPrice: toMinorUnits(v.extraPrice),
        })),
      };

      const res = isEdit
        ? await updateProductAction(product.id, payload)
        : await createProductAction(payload);

      if (!res.success) {
        setError(res.error || "Failed to save product");
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
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : isEdit ? (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Edit Product"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 fill-black stroke-[3]" />
          <span>New Product</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <GlassCard className="p-6 relative border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {isEdit ? "Edit Product & Variants" : "Create New Product"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Catalog item with optional price variants and profit margins
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cloud ERP Suite"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Product Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee] transition-colors"
                    >
                      <option value="Software">Software</option>
                      <option value="Add-on">Add-on</option>
                      <option value="Service">Service</option>
                      <option value="Hardware">Hardware</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Margin Calculations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Sales Price (Standard) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-mono">₹</span>
                      <input
                        type="text"
                        required
                        value={salesPrice}
                        onChange={(e) => setSalesPrice(e.target.value)}
                        placeholder="1000.00"
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Cost Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-mono">₹</span>
                      <input
                        type="text"
                        required
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="400.00"
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2 flex items-center justify-between text-xs border-t border-white/5 text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span>Gross Margin:</span>
                      <Money amount={marginAmount} className="text-white font-semibold font-mono" />
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                        marginAmount >= 0
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {marginPercent}% Margin
                    </span>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white">Product Variants</span>
                      <p className="text-[11px] text-zinc-400">
                        Add attributes with extra prices (e.g. Brand = Odoo, +₹560.00)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Variant</span>
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-center text-[11px] text-zinc-500">
                      No variants added. This product sells at its standard base price.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {variants.map((v, idx) => {
                        const extraMinor = toMinorUnits(v.extraPrice);
                        const effectiveMinor = calculateEffectivePrice(salesMinor, extraMinor);

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-3">
                              <input
                                type="text"
                                required
                                value={v.attribute}
                                onChange={(e) => handleVariantChange(idx, "attribute", e.target.value)}
                                placeholder="Attribute (e.g. Brand)"
                                className="w-full px-2 py-1 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                              />
                            </div>

                            <div className="col-span-3">
                              <input
                                type="text"
                                required
                                value={v.value}
                                onChange={(e) => handleVariantChange(idx, "value", e.target.value)}
                                placeholder="Value (e.g. Odoo)"
                                className="w-full px-2 py-1 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                              />
                            </div>

                            <div className="col-span-3">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[10px] text-zinc-400 font-mono">
                                  +₹
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={v.extraPrice}
                                  onChange={(e) =>
                                    handleVariantChange(idx, "extraPrice", e.target.value)
                                  }
                                  placeholder="560.00"
                                  className="w-full pl-6 pr-2 py-1 text-xs font-mono rounded-lg bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-[#22d3ee]"
                                />
                              </div>
                            </div>

                            <div className="col-span-2 text-right">
                              <span className="text-[10px] text-zinc-400 block font-mono">
                                Eff. Price
                              </span>
                              <Money amount={effectiveMinor} className="text-xs font-bold text-[#22d3ee]" />
                            </div>

                            <div className="col-span-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Technical specifications, SLA details or packaging..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="productActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-[#22d3ee] focus:ring-0"
                  />
                  <label htmlFor="productActive" className="text-xs text-zinc-300 cursor-pointer">
                    Active in catalog (available for new quotation lines)
                  </label>
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
                    className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEdit ? "Update Product" : "Save Product"}</span>
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

