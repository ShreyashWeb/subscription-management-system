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
} from "recharts";
import { formatMoney } from "@/lib/money";
import { MonthlyTrend } from "@/server/services/reports";

interface RevenueTrendChartProps {
  data: MonthlyTrend[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const chartData = data.map((d) => ({
    month: d.month,
    Invoiced: Math.round(d.invoiced / 100), // convert to major units for chart axis
    Collected: Math.round(d.collected / 100),
    rawInvoiced: d.invoiced,
    rawCollected: d.collected,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inv = payload.find((p: any) => p.dataKey === "Invoiced");
      const col = payload.find((p: any) => p.dataKey === "Collected");
      return (
        <div className="rounded-xl bg-[#0f1117]/95 border border-white/10 p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 font-sans">
          <div className="font-semibold text-white border-b border-white/10 pb-1">{label}</div>
          <div className="flex items-center justify-between gap-4 text-[#22d3ee]">
            <span>Invoiced:</span>
            <span className="font-mono font-medium">
              {formatMoney(inv?.payload?.rawInvoiced ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Collected:</span>
            <span className="font-mono font-medium">
              {formatMoney(col?.payload?.rawCollected ?? 0)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
            wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
          />
          <Bar dataKey="Invoiced" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Collected" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

