"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Receipt, Sparkles } from "lucide-react";

export function PortalNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/portal",
      label: "My Subscriptions",
      icon: Package,
      active: pathname === "/portal" || (pathname.startsWith("/portal/subscriptions") && !pathname.includes("/plans")),
    },
    {
      href: "/portal/invoices",
      label: "My Invoices",
      icon: Receipt,
      active: pathname.startsWith("/portal/invoices"),
    },
    {
      href: "/portal/plans",
      label: "Browse Plans",
      icon: Sparkles,
      active: pathname.startsWith("/portal/plans"),
    },
  ];

  return (
    <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? "bg-white/15 text-white shadow-sm shadow-black/20 font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#22d3ee]" : "text-zinc-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

