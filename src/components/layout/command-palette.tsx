"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { globalSearchAction, GlobalSearchResults } from "@/server/actions/search";
import { formatMoney } from "@/lib/money";
import {
  Search,
  LayoutDashboard,
  Package,
  Receipt,
  Cpu,
  CreditCard,
  BarChart3,
  Layers,
  Sparkles,
  FileDown,
  User,
  ArrowRight,
  Shield,
  Percent,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>({
    subscriptions: [],
    invoices: [],
    customers: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  // Listen for Cmd+K / Ctrl+K and custom trigger event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleCustomTrigger = () => {
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomTrigger);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomTrigger);
    };
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults({ subscriptions: [], invoices: [], customers: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await globalSearchAction(query);
        setResults(res);
      } catch {
        setResults({ subscriptions: [], invoices: [], customers: [] });
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0 -z-10"
        onClick={() => setOpen(false)}
      />

      <div className="w-full max-w-2xl rounded-2xl glass-strong border border-white/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <Command
          label="Global Command Palette"
          className="w-full bg-transparent text-white"
          shouldFilter={false}
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
            <Search className="w-4 h-4 text-[#22d3ee] shrink-0" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search subscriptions, invoices, customers, or jump to page..."
              className="w-full bg-transparent text-sm text-white placeholder-zinc-400 focus:outline-none"
            />
            {isSearching && (
              <span className="text-[10px] font-mono text-[#22d3ee] animate-pulse">
                Searching...
              </span>
            )}
            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-zinc-400">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[380px] overflow-y-auto p-2 space-y-2 text-xs">
            <Command.Empty className="py-6 text-center text-zinc-400 text-xs">
              {query.trim() ? "No matching records found." : "Type to search or select a page below."}
            </Command.Empty>

            {/* Live Search Results */}
            {results.subscriptions.length > 0 && (
              <Command.Group
                heading="Subscriptions"
                className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider"
              >
                {results.subscriptions.map((sub) => (
                  <Command.Item
                    key={sub.id}
                    value={sub.number}
                    onSelect={() => handleSelect(() => router.push(`/subscriptions/${sub.id}`))}
                    className="flex items-center justify-between p-2.5 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[#22d3ee]" />
                      <span className="font-mono font-bold text-white">{sub.number}</span>
                      <span className="text-zinc-400">&bull; {sub.planName}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      {sub.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.invoices.length > 0 && (
              <Command.Group
                heading="Invoices"
                className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider"
              >
                {results.invoices.map((inv) => (
                  <Command.Item
                    key={inv.id}
                    value={inv.number}
                    onSelect={() => handleSelect(() => router.push(`/invoices/${inv.id}`))}
                    className="flex items-center justify-between p-2.5 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-[#6d5dfc]" />
                      <span className="font-mono font-bold text-white">{inv.number}</span>
                      <span className="text-zinc-400">&bull; {formatMoney(inv.total)}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      {inv.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.customers.length > 0 && (
              <Command.Group
                heading="Customers"
                className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider"
              >
                {results.customers.map((cust) => (
                  <Command.Item
                    key={cust.id}
                    value={cust.name}
                    onSelect={() => handleSelect(() => router.push(`/subscriptions?customerId=${cust.id}`))}
                    className="flex items-center justify-between p-2.5 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium text-white">{cust.name}</span>
                      <span className="text-zinc-400 font-mono text-[11px]">&bull; {cust.email}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation Group */}
            <Command.Group
              heading="Navigation"
              className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider"
            >
              <Command.Item
                value="Dashboard"
                onSelect={() => handleSelect(() => router.push("/dashboard"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#22d3ee]" />
                <span className="font-medium">Dashboard</span>
              </Command.Item>

              <Command.Item
                value="Subscriptions"
                onSelect={() => handleSelect(() => router.push("/subscriptions"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Package className="w-4 h-4 text-[#6d5dfc]" />
                <span className="font-medium">Subscriptions Management</span>
              </Command.Item>

              <Command.Item
                value="Invoices"
                onSelect={() => handleSelect(() => router.push("/invoices"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">Invoices &amp; Overdue Statements</span>
              </Command.Item>

              <Command.Item
                value="Billing Run"
                onSelect={() => handleSelect(() => router.push("/billing-run"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="font-medium">Billing Run Engine</span>
              </Command.Item>

              <Command.Item
                value="Payments"
                onSelect={() => handleSelect(() => router.push("/payments"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <CreditCard className="w-4 h-4 text-[#34d399]" />
                <span className="font-medium">Payments &amp; Collections</span>
              </Command.Item>

              <Command.Item
                value="Reports & MRR"
                onSelect={() => handleSelect(() => router.push("/reports"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-[#f472b6]" />
                <span className="font-medium">Finance Reports &amp; MRR Waterfall</span>
              </Command.Item>

              <Command.Item
                value="Customer Portal"
                onSelect={() => handleSelect(() => router.push("/portal"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Shield className="w-4 h-4 text-[#22d3ee]" />
                <span className="font-medium">Customer Portal</span>
              </Command.Item>

              <Command.Item
                value="Products Catalog"
                onSelect={() => handleSelect(() => router.push("/products"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Layers className="w-4 h-4 text-zinc-400" />
                <span className="font-medium">Products &amp; Variants</span>
              </Command.Item>

              <Command.Item
                value="Subscription Plans"
                onSelect={() => handleSelect(() => router.push("/plans"))}
                className="flex items-center gap-2.5 p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#22d3ee]" />
                <span className="font-medium">Plans &amp; Templates</span>
              </Command.Item>
            </Command.Group>

            {/* Quick Actions Group */}
            <Command.Group
              heading="Quick Actions"
              className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider"
            >
              <Command.Item
                value="Run Billing Day Action"
                onSelect={() => handleSelect(() => router.push("/billing-run"))}
                className="flex items-center justify-between p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Execute Billing Run</span>
                </div>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </Command.Item>

              <Command.Item
                value="Export Invoices CSV"
                onSelect={() =>
                  handleSelect(() => {
                    window.location.href = "/api/export/invoices";
                  })
                }
                className="flex items-center justify-between p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileDown className="w-4 h-4 text-[#22d3ee]" />
                  <span>Export Invoices to CSV</span>
                </div>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </Command.Item>

              <Command.Item
                value="Record Payment Action"
                onSelect={() => handleSelect(() => router.push("/payments"))}
                className="flex items-center justify-between p-2 rounded-xl text-zinc-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Record Customer Payment</span>
                </div>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Guide */}
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↓</kbd> to navigate</span>
              <span>&bull;</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">ENTER</kbd> to open</span>
            </div>
            <span>Brightloop Command Hub</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

