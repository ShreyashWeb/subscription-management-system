import React from "react";
import { SkeletonTile, SkeletonTable } from "@/components/glass/skeleton-card";

export default function PortalLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </div>
      <SkeletonTable rows={4} />
    </div>
  );
}

