"use client";

import React from "react";
import { Search, Bell, Shield, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function Topbar() {
  const handleOpenPalette = () => {
    window.dispatchEvent(new Event("open-command-palette"));
  };

  return (
    <header className="glass sticky top-3 z-20 mx-3 mb-4 px-4 py-2.5 rounded-[16px] border border-white/10 flex items-center justify-between">
      {/* ⌘K Command Palette Trigger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleOpenPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all w-64 md:w-80 text-left cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="flex-1">Search or jump to...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded font-mono text-zinc-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls: system status, notifications, role, sign out */}
      <div className="flex items-center gap-3">
        {/* Performance & Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-[11px]">System Online</span>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300">
          <Shield className="w-3.5 h-3.5 text-[#6d5dfc]" />
          <span className="font-semibold text-[11px] tracking-wide uppercase">Admin / Staff</span>
        </div>

        {/* Sign out button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
