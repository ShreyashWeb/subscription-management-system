"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function BillingPipelineChart() {
  const gradientId = useId();
  const shouldReduceMotion = useReducedMotion();

  // 12 points representing monthly billing volume
  const points = [
    { m: "Nov", v: 34 },
    { m: "Dec", v: 48 },
    { m: "Jan", v: 42 },
    { m: "Feb", v: 65 },
    { m: "Mar", v: 58 },
    { m: "Apr", v: 82 },
    { m: "May", v: 76 },
    { m: "Jun", v: 94 },
    { m: "Jul", v: 110 },
    { m: "Aug", v: 104 },
    { m: "Sep", v: 128 },
    { m: "Oct", v: 142 },
  ];

  const max = 150;
  const width = 640;
  const height = 90;
  const padY = 10;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 40) + 20;
    const y = height - padY - (p.v / max) * (height - padY * 2);
    return { x, y, ...p };
  });

  const pathD = coords.reduce((acc, c, i) => {
    return i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
  }, "");

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  return (
    <div className="w-full space-y-4 my-2">
      {/* Visual Chart Header */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">
          Monthly Invoicing Run Volume (12-Mo Catchup Trajectory)
        </span>
        <span className="font-mono text-[11px] text-[#22d3ee] flex items-center gap-1">
          <Zap className="w-3 h-3 fill-[#22d3ee]" /> +317% throughput
        </span>
      </div>

      {/* Mini Area Chart */}
      <div className="w-full h-24 relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d5dfc" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="20"
            y1={height - padY}
            x2={width - 20}
            y2={height - padY}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1="20"
            y1={height / 2}
            x2={width - 20}
            y2={height / 2}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />

          {/* Area fill */}
          <motion.path
            d={areaD}
            fill={`url(#${gradientId})`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          />

          {/* Line stroke */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#gradientStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          <defs>
            <linearGradient id="gradientStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6d5dfc" />
              <stop offset="60%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>

          {/* Highlight end point */}
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r="4"
            fill="#f472b6"
            className="shadow-lg"
          />
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r="8"
            fill="#f472b6"
            opacity="0.3"
            className="animate-ping"
          />
        </svg>
      </div>

      {/* Lifecycle Flow Steps */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            1. Candidate Scan
          </span>
          <span className="text-xs font-semibold text-zinc-300">Due Subscriptions</span>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            2. Lock & Catchup
          </span>
          <span className="text-xs font-semibold text-[#22d3ee]">Row Locking</span>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            3. Tax & Discounts
          </span>
          <span className="text-xs font-semibold text-[#6d5dfc]">Atomic Counter</span>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
            4. Invoicing
          </span>
          <span className="text-xs font-semibold text-emerald-400">Zero Duplicates</span>
        </div>
      </div>
    </div>
  );
}

