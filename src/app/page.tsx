"use client";

import React from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/glass/aurora-background";
import { BentoGrid, BentoItem } from "@/components/glass/bento-grid";
import { StatusPill } from "@/components/glass/status-pill";
import { Money } from "@/components/glass/money";
import { NumberTicker } from "@/components/glass/number-ticker";
import { DiaTextReveal } from "@/registry/magicui/dia-text-reveal";
import { DemoLoginButtons } from "@/components/auth/demo-login-buttons";
import { DashboardPreviewMock } from "@/components/landing/dashboard-preview-mock";
import { PricingSection } from "@/components/landing/pricing-section";
import {
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  Receipt,
  Cpu,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <AuroraBackground>
      <div className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-col items-center">
        {/* Navigation Bar */}
        <header className="glass sticky top-3 z-30 w-full mb-8 px-6 py-3 rounded-2xl border border-white/10 flex items-center justify-between backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#6d5dfc]/30">
              B
            </span>
            <span className="font-heading font-bold text-white text-base">
              Brightloop Billing
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block px-3 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              Sign In
            </Link>

            <DemoLoginButtons variant="nav" />
          </div>
        </header>

        {/* Hero Section */}
        <div className="w-full text-center py-10 md:py-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-md shadow-[0_0_20px_rgba(109,93,252,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-[#22d3ee] animate-pulse" />
            <span>Brightloop Billing &bull; Hackathon Edition</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Billing that runs itself to{" "}
            <DiaTextReveal
              repeat
              repeatDelay={1.4}
              text={[
                "eliminate missed renewals",
                "prevent double billing",
                "automate invoice runs",
                "maximize recurring cashflow",
              ]}
            />
          </h1>

          <p className="text-base md:text-lg text-zinc-300 max-w-2xl mx-auto font-normal drop-shadow-sm">
            One platform covering products with variants, multi-period plans,
            lifecycle contracts, automated billing runs with discounts &amp; taxes,
            dunning recovery, and sub-2-second finance analytics.
          </p>

          {/* Action Buttons: Demo as Admin & Demo as Customer */}
          <div className="pt-4">
            <DemoLoginButtons variant="hero" />
          </div>
        </div>

        {/* Live Bento Dashboard Preview Mock */}
        <DashboardPreviewMock />

        {/* 3 Core Value Bento Cards */}
        <section className="w-full my-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
              Enterprise Billing Architecture
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              PostgreSQL &bull; Prisma &bull; Next.js 16
            </span>
          </div>

          <BentoGrid>
            {/* Bento Card 1: Automated Billing Engine */}
            <BentoItem colSpan={4} strong hoverLift className="p-6">
              <div className="w-10 h-10 rounded-xl bg-[#6d5dfc]/15 border border-[#6d5dfc]/30 flex items-center justify-center text-[#6d5dfc] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Automated Billing Engine
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Deterministic catch-up loop handles subscriptions periods behind without double-billing. Atomic discounts resolve usage limits, and taxes calculate accurately per line item.
              </p>
              <div className="space-y-1.5 text-xs text-zinc-300 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Row-locked FOR UPDATE SKIP LOCKED</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ON CONFLICT DO NOTHING idempotency</span>
                </div>
              </div>
            </BentoItem>

            {/* Bento Card 2: Real-time SaaS MRR Waterfall */}
            <BentoItem colSpan={4} strong hoverLift className="p-6">
              <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee] mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Real-Time SaaS Analytics
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                12-month MRR movement waterfall tracks New, Expansion, Contraction, and Churn in parallel SQL aggregates responding in under 2 seconds across thousands of subscriptions.
              </p>
              <div className="space-y-1.5 text-xs text-zinc-300 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live ARR &amp; NRR calculations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RFC-4180 CSV export protection</span>
                </div>
              </div>
            </BentoItem>

            {/* Bento Card 3: Self-Service Customer Portal */}
            <BentoItem colSpan={4} strong hoverLift className="p-6">
              <div className="w-10 h-10 rounded-xl bg-[#f472b6]/15 border border-[#f472b6]/30 flex items-center justify-center text-[#f472b6] mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Customer Self-Service
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Customers manage subscriptions with day-by-day proration previews before confirming plan upgrades, pause/resume contracts, and download official PDF statements.
              </p>
              <div className="space-y-1.5 text-xs text-zinc-300 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Strict customer-scoping (HTTP 404)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Server-enforced plan flags</span>
                </div>
              </div>
            </BentoItem>
          </BentoGrid>
        </section>

        {/* Pricing Table Section */}
        <PricingSection />

        {/* Footer */}
        <footer className="w-full mt-16 pt-8 pb-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white font-bold text-xs">
              B
            </span>
            <span className="font-heading font-bold text-white">
              Brightloop Billing
            </span>
            <span>&bull; Hackathon Submission</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Finance Dashboard
            </Link>
            <Link href="/portal" className="hover:text-white transition-colors">
              Customer Portal
            </Link>
            <Link href="/billing-run" className="hover:text-white transition-colors">
              Billing Run
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </footer>
      </div>
    </AuroraBackground>
  );
}
