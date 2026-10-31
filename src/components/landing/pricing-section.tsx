"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatMoney } from "@/lib/money";
import { CheckCircle2, Zap, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const SEEDED_PLANS = [
  {
    id: "daily-dev",
    name: "Daily Developer Sandbox",
    price: 20000,
    period: "daily",
    trialDays: 0,
    minQty: 1,
    pausable: false,
    closable: true,
    description: "Rapid prototyping, ephemeral dev environments, and load testing.",
    highlight: false,
    features: [
      "1 Sandbox Instance included",
      "Pay-as-you-go daily invoicing",
      "No long-term commitment",
      "Full API & Webhook access",
    ],
  },
  {
    id: "weekly-growth",
    name: "Weekly Growth Sprint",
    price: 150000,
    period: "weekly",
    trialDays: 3,
    minQty: 1,
    pausable: true,
    closable: true,
    description: "Agile teams running high-velocity delivery cycles and campaigns.",
    highlight: false,
    features: [
      "3-Day Free Trial included",
      "Pausable at any time",
      "Automatic catch-up on resume",
      "Standard email & chat support",
    ],
  },
  {
    id: "pro-monthly",
    name: "Professional Monthly",
    price: 485000,
    period: "monthly",
    trialDays: 14,
    minQty: 1,
    pausable: true,
    closable: true,
    description: "Our most popular tier for scaling businesses and B2B SaaS operators.",
    highlight: true,
    badge: "MOST POPULAR",
    features: [
      "14-Day Full Access Trial",
      "Unlimited invoices & quotes",
      "Self-service pause & proration",
      "Automated dunning reminders (1, 3, 7 days)",
      "Dedicated account review",
    ],
  },
  {
    id: "enterprise-annual",
    name: "Enterprise Annual Plan",
    price: 4800000,
    period: "yearly",
    trialDays: 30,
    minQty: 5,
    pausable: true,
    closable: true,
    description: "Volume deployments with custom SLA and dedicated infrastructure.",
    highlight: false,
    features: [
      "30-Day Enterprise Trial",
      "Minimum 5 user seats",
      "Prorated mid-cycle seat expansions",
      "24/7 Phone & Slack SLA",
      "Custom tax & discount rules",
    ],
  },
];

export function PricingSection() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const res = await signIn("credentials", {
        email: "customer@brightloop.test",
        password: "Customer@12345",
        redirect: false,
      });
      if (res?.ok) {
        router.push("/portal/plans");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  };

  return (
    <section className="w-full py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6d5dfc]/20 border border-[#6d5dfc]/30 text-[#6d5dfc] text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Transparent Pricing
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Multi-Period Subscriptions, Zero Lock-In
        </h2>
        <p className="text-sm md:text-base text-zinc-300">
          Switch periods, pause subscriptions, or scale seats with automatic day-by-day proration adjustments.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SEEDED_PLANS.map((plan) => {
          return (
            <GlassCard
              key={plan.id}
              hoverLift
              glow={plan.highlight}
              className={`p-6 flex flex-col justify-between border relative ${
                plan.highlight
                  ? "border-[#22d3ee]/60 shadow-xl shadow-[#22d3ee]/10 bg-white/[0.06]"
                  : "border-white/10"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22d3ee] text-white text-[10px] font-bold tracking-wider shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                {/* Plan Title */}
                <div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="py-2 border-y border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {formatMoney(plan.price)}
                    </span>
                    <span className="text-xs text-zinc-400">/{plan.period}</span>
                  </div>
                  {plan.trialDays > 0 ? (
                    <div className="text-[11px] text-[#22d3ee] font-medium mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {plan.trialDays} days free trial
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Immediate billing schedule
                    </div>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    plan.highlight
                      ? "btn-brutal"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    "Signing in..."
                  ) : (
                    <>
                      Demo This Plan
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}

