import React from "react";
import { GlassCard } from "@/components/glass/glass-card";

export function SkeletonTile() {
  return (
    <GlassCard className="p-5 border border-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-4 w-4 bg-white/10 rounded-full" />
      </div>
      <div className="h-8 w-32 bg-white/15 rounded my-2" />
      <div className="h-3 w-40 bg-white/5 rounded mt-3" />
    </GlassCard>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <GlassCard className="p-6 border border-white/10 space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="h-4 w-36 bg-white/10 rounded" />
        <div className="h-7 w-24 bg-white/10 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5">
            <div className="h-4 w-28 bg-white/10 rounded" />
            <div className="h-4 w-36 bg-white/5 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-6 w-16 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

