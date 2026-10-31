import React from "react";
import { SkeletonTile, SkeletonTable } from "@/components/glass/skeleton-card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}

