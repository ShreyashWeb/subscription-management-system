import React from "react";
import { auth } from "@/lib/auth";
import { listTemplates } from "@/server/services/templates";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/glass/glass-card";
import { Money } from "@/components/glass/money";
import { TemplateDialog } from "@/components/templates/template-dialog";
import { SubscriptionDialog } from "@/components/subscriptions/subscription-dialog";
import { FileSpreadsheet, Plus, Repeat, Layers, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Quotation Templates - Brightloop Billing",
  description: "Pre-configured bundles of plans and product lines for rapid quoting",
};

export default async function TemplatesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [templates, plans, products, taxes, customers] = await Promise.all([
    listTemplates(),
    db.plan.findMany({ where: { active: true } }),
    db.product.findMany({
      where: { active: true },
      include: { variants: true },
    }),
    db.tax.findMany({ where: { active: true } }),
    db.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#22d3ee]" />
            Quotation Templates
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pre-defined subscription packages with plan, validity period, and default lines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TemplateDialog plans={plans} products={products} />
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <GlassCard key={tpl.id} hoverLift className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white">{tpl.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#6d5dfc]/15 text-[#a78bfa] border border-[#6d5dfc]/25 font-mono text-[10px] font-semibold">
                      {tpl.plan.name} ({tpl.plan.period})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{tpl.validityDays}d valid</span>
                </div>
              </div>

              {/* Lines Breakdown */}
              <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">
                  Included Product Lines ({tpl.lines.length})
                </span>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {tpl.lines.map((l) => (
                    <div
                      key={l.id}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-white font-medium">{l.product.name}</span>
                        {l.variant && (
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            {l.variant.attribute}: {l.variant.value}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-zinc-300 font-semibold text-xs">
                        × {l.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer: Fast Create */}
            <div className="mt-5 pt-3 border-t border-white/10">
              <SubscriptionDialog
                customers={customers}
                plans={plans}
                products={products}
                taxes={taxes}
                templates={[tpl]}
              />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

