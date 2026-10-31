import React from "react";
import { auth } from "@/lib/auth";
import { listTaxes } from "@/server/services/taxes";
import { toggleTaxActiveAction } from "@/server/actions/catalog";
import { GlassCard } from "@/components/glass/glass-card";
import { TaxDialog } from "@/components/catalog/tax-dialog";
import { ActiveToggle } from "@/components/catalog/active-toggle";
import { Percent, Shield, Hash, Layers } from "lucide-react";

export const metadata = {
  title: "Tax Rules - Brightloop Billing",
  description: "Configure basis points tax rules applied to subscription invoices",
};

export default async function TaxesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const taxes = await listTaxes();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-[#6d5dfc]" />
            Tax Configuration
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Basis points tax rates computed automatically on invoice line items.
          </p>
        </div>

        {isAdmin && <TaxDialog />}
      </div>

      {/* Taxes Table */}
      <GlassCard className="p-0 overflow-hidden border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            Active Tax Rules ({taxes.length})
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {isAdmin ? "ADMIN CONTROL" : "STAFF VIEW-ONLY"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-400">
              <tr>
                <th className="py-3 px-6 font-medium">Tax Rule</th>
                <th className="py-3 px-6 font-medium">Percentage Rate</th>
                <th className="py-3 px-6 font-medium">Precision Basis Points</th>
                <th className="py-3 px-6 font-medium">Applied Subscriptions</th>
                <th className="py-3 px-6 font-medium">Status</th>
                {isAdmin && <th className="py-3 px-6 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {taxes.map((tax) => {
                const percent = (tax.rateBps / 100).toFixed(2);

                return (
                  <tr key={tax.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#6d5dfc]/15 text-[#a78bfa] border border-[#6d5dfc]/25 flex items-center justify-center font-bold text-xs">
                        %
                      </div>
                      <span className="font-semibold text-sm">{tax.name}</span>
                    </td>

                    <td className="py-4 px-6 font-mono text-sm font-bold text-[#22d3ee]">
                      {percent}%
                    </td>

                    <td className="py-4 px-6 font-mono text-zinc-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {tax.rateBps} bps
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-zinc-400 text-xs">
                      {tax._count.subLines} lines
                    </td>

                    <td className="py-4 px-6">
                      <ActiveToggle
                        id={tax.id}
                        initialActive={tax.active}
                        onToggle={toggleTaxActiveAction}
                        disabled={!isAdmin}
                      />
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <TaxDialog tax={tax} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

