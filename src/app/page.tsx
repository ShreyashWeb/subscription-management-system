import React from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/glass/aurora-background";
import { BentoGrid, BentoItem } from "@/components/glass/bento-grid";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import {
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <AuroraBackground>
      <div className="w-full max-w-6xl mx-auto px-4 py-12 flex flex-col items-center">
        {/* Top Tag & Header */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
          <span>Phase 0: Design Foundation & Architecture Ready</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-center text-white max-w-3xl leading-[1.15]">
          Billing that runs itself on{" "}
          <span className="bg-gradient-to-r from-[#6d5dfc] via-[#22d3ee] to-[#f472b6] bg-clip-text text-transparent">
            Aurora Glass
          </span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 text-center max-w-2xl mt-4">
          One platform for plans, quotation templates, subscriptions, automatic
          invoicing, payments, and real-time revenue analytics.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 mb-12">
          <Link href="/dashboard" className="btn-brutal px-6 py-3 text-base">
            <Zap className="w-4 h-4 mr-2 fill-black" />
            Enter Dashboard Shell
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all flex items-center gap-2"
          >
            Explore App Shell <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Design System Showcase Bento Grid */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">
              Design System Primitives Preview
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              Geist Sans &bull; Space Grotesk Tabular
            </span>
          </div>

          <BentoGrid>
            {/* Hero Tile: Recurring Revenue & Money Component */}
            <BentoItem colSpan={8} strong glow>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                  Revenue Metric (Money Component)
                </span>
                <StatusPill status="ACTIVE" size="sm" />
              </div>

              <div className="my-2">
                <div className="text-4xl md:text-5xl font-extrabold text-white">
                  <Money amount={48500000} />
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Stored as integer minor units (48500000 paise = ₹4,85,000.00),
                  formatted via Intl.NumberFormat with tabular numerals.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[11px] text-zinc-400 block">Day Rate</span>
                  <Money amount={161666} className="text-sm text-zinc-200" />
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[11px] text-zinc-400 block">ARR Value</span>
                  <Money amount={582000000} className="text-sm text-zinc-200" />
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[11px] text-zinc-400 block">Avg Churn</span>
                  <span className="text-sm font-mono text-emerald-400">0.8%</span>
                </div>
              </div>
            </BentoItem>

            {/* Status Pills Showcase */}
            <BentoItem colSpan={4}>
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-3 block">
                StatusPill Matrix
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Subscription Draft</span>
                  <StatusPill status="DRAFT" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Sales Quotation</span>
                  <StatusPill status="QUOTATION" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Confirmed Order</span>
                  <StatusPill status="CONFIRMED" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Active Recurring</span>
                  <StatusPill status="ACTIVE" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Invoice Paid</span>
                  <StatusPill status="PAID" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Overdue Invoices</span>
                  <StatusPill status="OVERDUE" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Closed Cycle</span>
                  <StatusPill status="CLOSED" size="sm" />
                </div>
              </div>
            </BentoItem>

            {/* Glass Surfaces Showcase */}
            <BentoItem colSpan={4} hoverLift>
              <div className="flex items-center gap-2 mb-2 text-white font-medium text-sm">
                <Layers className="w-4 h-4 text-[#22d3ee]" />
                <span>Translucent .glass</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Backdrop-filtered 18px blur with 1px translucent border, soft
                shadow, and inner top highlight for visual depth.
              </p>
            </BentoItem>

            <BentoItem colSpan={4} strong hoverLift>
              <div className="flex items-center gap-2 mb-2 text-white font-medium text-sm">
                <Shield className="w-4 h-4 text-[#6d5dfc]" />
                <span>Dense .glass-strong</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Higher opacity fill and 24px blur designed for dense data tables,
                form controls, and high-readability analytics.
              </p>
            </BentoItem>

            <BentoItem colSpan={4} hoverLift>
              <div className="flex items-center gap-2 mb-2 text-white font-medium text-sm">
                <BarChart3 className="w-4 h-4 text-[#f472b6]" />
                <span>Under 2s SLA Ready</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Architected with SQL aggregates, indexed foreign keys, and server
                pagination designed for thousands of records.
              </p>
            </BentoItem>
          </BentoGrid>
        </div>
      </div>
    </AuroraBackground>
  );
}
