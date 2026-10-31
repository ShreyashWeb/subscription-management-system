import React from "react";
import { auth } from "@/lib/auth";
import { listProducts } from "@/server/services/products";
import { toggleProductActiveAction } from "@/server/actions/catalog";
import { GlassCard } from "@/components/glass/glass-card";
import { Money } from "@/components/glass/money";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { ActiveToggle } from "@/components/catalog/active-toggle";
import { calculateMargin, calculateEffectivePrice } from "@/lib/money";
import {
  Package,
  Search,
  Filter,
  Layers,
  ChevronDown,
  Tag,
  Shield,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Products & Variants - Brightloop Billing",
  description: "Manage commercial product catalog, variants, and margin pricing",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  const type = resolvedParams.type || "ALL";
  const page = parseInt(resolvedParams.page || "1", 10);

  const { items, total, totalPages } = await listProducts({
    search: q,
    type,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#22d3ee]" />
            Products & Variants
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Commercial items, variant pricing increments, and live profit margins.
          </p>
        </div>

        {isAdmin && <ProductDialog />}
      </div>

      {/* Filters & Search Toolbar */}
      <GlassCard className="p-4 border border-white/10">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search products by name, notes, or type..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              name="type"
              defaultValue={type}
              className="px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#22d3ee] transition-colors"
            >
              <option value="ALL">All Types</option>
              <option value="Software">Software</option>
              <option value="Add-on">Add-on</option>
              <option value="Service">Service</option>
              <option value="Hardware">Hardware</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
          >
            Apply Filters
          </button>

          {(q || type !== "ALL") && (
            <Link
              href="/products"
              className="text-xs text-zinc-400 hover:text-white transition-colors ml-1"
            >
              Reset
            </Link>
          )}
        </form>
      </GlassCard>

      {/* Products Table with Expandable Variants */}
      <GlassCard className="p-0 overflow-hidden border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            Product Catalog ({total})
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {isAdmin ? "ADMIN CONTROL" : "STAFF VIEW-ONLY"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No products match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((product) => {
              const { marginAmount, marginPercent } = calculateMargin(
                product.salesPrice,
                product.costPrice
              );

              return (
                <div key={product.id} className="p-5 hover:bg-white/[0.015] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Product Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {product.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-zinc-300 font-mono border border-white/5">
                          {product.type}
                        </span>
                      </div>
                      {product.notes && (
                        <p className="text-xs text-zinc-400 max-w-xl">{product.notes}</p>
                      )}
                    </div>

                    {/* Right: Prices, Margins, and Actions */}
                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">BASE SALES PRICE</span>
                        <div className="font-bold text-white font-mono text-sm">
                          <Money amount={product.salesPrice} />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 block">COST PRICE</span>
                        <div className="font-medium text-zinc-300 font-mono text-xs">
                          <Money amount={product.costPrice} />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 block">MARGIN</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Money
                            amount={marginAmount}
                            className="font-mono text-xs text-zinc-200"
                          />
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold ${
                              marginAmount >= 0
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/15 text-rose-300"
                            }`}
                          >
                            {marginPercent}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-1">STATUS</span>
                        <ActiveToggle
                          id={product.id}
                          initialActive={product.active}
                          onToggle={toggleProductActiveAction}
                          disabled={!isAdmin}
                        />
                      </div>

                      {isAdmin && (
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-1">EDIT</span>
                          <ProductDialog product={product} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variants Sub-table */}
                  {product.variants.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-white/5">
                      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-[#22d3ee]" />
                        <span>Available Variants ({product.variants.length})</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {product.variants.map((v) => {
                          const effectivePrice = calculateEffectivePrice(
                            product.salesPrice,
                            v.extraPrice
                          );

                          return (
                            <div
                              key={v.id}
                              className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                            >
                              <div>
                                <span className="text-xs font-medium text-white">
                                  {v.attribute}: {v.value}
                                </span>
                                <span className="text-[10px] text-zinc-400 block font-mono">
                                  Extra: +
                                  <Money amount={v.extraPrice} />
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-zinc-400 block font-mono">
                                  EFFECTIVE
                                </span>
                                <span className="text-xs font-bold text-[#22d3ee] font-mono">
                                  <Money amount={effectivePrice} />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Server Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/products?page=${page - 1}&q=${q}&type=${type}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/products?page=${page + 1}&q=${q}&type=${type}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

