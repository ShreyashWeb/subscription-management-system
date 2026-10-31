"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface ActiveToggleProps {
  id: string;
  initialActive: boolean;
  onToggle: (id: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export function ActiveToggle({
  id,
  initialActive,
  onToggle,
  disabled = false,
}: ActiveToggleProps) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      const res = await onToggle(id);
      if (res.success) {
        setActive(!active);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${
        active
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
          : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 hover:bg-zinc-500/20"
      }`}
      title={disabled ? "Admin only" : active ? "Click to deactivate" : "Click to activate"}
    >
      {loading ? (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      ) : (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            active ? "bg-emerald-400" : "bg-zinc-500"
          }`}
        />
      )}
      <span>{active ? "Active" : "Inactive"}</span>
    </button>
  );
}

