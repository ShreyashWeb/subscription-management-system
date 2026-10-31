"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";
import { formatMoney } from "@/lib/money";
import { MrrMovementMonth } from "@/server/services/reports";

interface MrrMovementChartProps {
  data: MrrMovementMonth[];
}

export function MrrMovementChart({ data }: MrrMovementChartProps) {
  const chartData = data.map((d) => ({
    month: d.month,
    New: Math.round(d.newMrr / 100),
    Expansion: Math.round(d.expansionMrr / 100),
    Contraction: Math.round(-Math.abs(d.contractionMrr) / 100),
    Churned: Math.round(-Math.abs(d.churnedMrr) / 100),
    ClosingMRR: Math.round(d.closingMrr / 100),
    rawNew: d.newMrr,
    rawExpansion: d.expansionMrr,
    rawContraction: d.contractionMrr,
    rawChurned: d.churnedMrr,
    rawClosing: d.closingMrr,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const getVal = (key: string) => payload.find((p: any) => p.dataKey === key)?.payload;
      const row = getVal("New") || {};

      return (
        <div className="rounded-xl bg-[#0f1117]/95 border border-white/10 p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-2 font-sans min-w-[200px]">
          <div className="font-semibold text-white border-b border-white/10 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="font-mono text-[#6d5dfc] text-xs">
              Closing: {formatMoney(row.rawClosing ?? 0)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-cyan-400">
              <span>+ New MRR:</span>
              <span className="font-mono font-medium">{formatMoney(row.rawNew ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span>+ Expansion:</span>
              <span className="font-mono font-medium">{formatMoney(row.rawExpansion ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span>- Contraction:</span>
              <span className="font-mono font-medium">{formatMoney(row.rawContraction ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-400">
              <span>- Churned:</span>
              <span className="font-mono font-medium">{formatMoney(row.rawChurned ?? 0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 16, fontSize: 11 }}
          />
          <Bar dataKey="New" stackId="a" fill="#22d3ee" maxBarSize={28} />
          <Bar dataKey="Expansion" stackId="a" fill="#34d399" maxBarSize={28} />
          <Bar dataKey="Contraction" stackId="b" fill="#f59e0b" maxBarSize={28} />
          <Bar dataKey="Churned" stackId="b" fill="#fb7185" maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="ClosingMRR"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ r: 3, fill: "#a78bfa" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

