"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  Package,
  Layers,
  FileSpreadsheet,
  Zap,
  Tag,
  Percent,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Subscriptions", href: "/subscriptions", icon: Repeat },
      { name: "Invoices", href: "/invoices", icon: FileText },
      { name: "Payments", href: "/payments", icon: CreditCard },
    ],
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Plans", href: "/plans", icon: Layers },
      { name: "Templates", href: "/templates", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Finance & Admin",
    items: [
      { name: "Billing Run", href: "/billing-run", icon: Zap },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Discounts", href: "/discounts", icon: Tag, adminOnly: true },
      { name: "Taxes", href: "/taxes", icon: Percent, adminOnly: true },
      { name: "Staff", href: "/staff", icon: Users, adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "glass sticky top-3 h-[calc(100vh-24px)] transition-all duration-300 flex flex-col justify-between z-30 m-3 rounded-[22px] border border-white/16 shadow-[0_12px_45px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center font-bold text-white shadow-lg shadow-[#6d5dfc]/40 ring-1 ring-white/30">
              B
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white leading-tight">
                Brightloop
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
                Billing System
              </span>
            </div>
          </Link>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center font-bold text-white shadow-md ring-1 ring-white/30">
            B
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group",
                    isActive ? "text-white" : "text-zinc-400 hover:text-white"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  {/* Shared animated layout indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#6d5dfc]/30 to-[#22d3ee]/20 border border-[#6d5dfc]/40 shadow-[0_0_20px_rgba(109,93,252,0.25)] z-0"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110 shrink-0 relative z-10",
                      isActive
                        ? "text-[#22d3ee] drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
                        : "text-zinc-400 group-hover:text-white"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 relative z-10">
                      {item.name}
                    </span>
                  )}
                  {!collapsed && item.adminOnly && (
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0 relative z-10" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Role & User Footer */}
      <div className="p-3 border-t border-white/10">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/10",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#f472b6] flex items-center justify-center text-xs font-semibold text-white shadow-md shrink-0">
            AD
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-white truncate">
                Admin User
              </span>
              <span className="text-[10px] text-zinc-400 font-mono truncate">
                admin@brightloop.test
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
