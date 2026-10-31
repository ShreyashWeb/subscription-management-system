"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchCustomers, CustomerSearchResult } from "@/server/actions/customers";
import { Search, X, Check, Loader2, User } from "lucide-react";

interface CustomerComboboxProps {
  value?: string;
  onChange: (customerId?: string) => void;
  placeholder?: string;
}

export function CustomerCombobox({
  value,
  onChange,
  placeholder = "Filter by customer...",
}: CustomerComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial fetch for selected customer or default list
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    searchCustomers(query)
      .then((data) => {
        if (active) {
          setResults(data);
          if (value && !selectedCustomer) {
            const match = data.find((c) => c.id === value);
            if (match) setSelectedCustomer(match);
          }
        }
      })
      .catch((err) => console.error("Customer search error:", err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, value]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <div
        className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-xs text-zinc-200 cursor-pointer transition-colors backdrop-blur-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">
            {selectedCustomer ? (
              <span className="text-white font-medium">
                {selectedCustomer.name}
                {selectedCustomer.company ? ` (${selectedCustomer.company})` : ""}
              </span>
            ) : (
              <span className="text-zinc-400">{placeholder}</span>
            )}
          </span>
        </div>

        {selectedCustomer ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomer(null);
              onChange(undefined);
            }}
            className="p-0.5 hover:text-white text-zinc-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#0f1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-2 border-b border-white/5">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs text-white">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, company..."
                className="w-full bg-transparent focus:outline-none text-xs text-white placeholder-zinc-500"
                autoFocus
              />
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#22d3ee]" />}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-white/[0.02]">
            <div
              className={`px-3 py-2 text-xs cursor-pointer hover:bg-white/[0.06] flex items-center justify-between ${
                !value ? "bg-white/[0.04] text-[#22d3ee] font-medium" : "text-zinc-300"
              }`}
              onClick={() => {
                setSelectedCustomer(null);
                onChange(undefined);
                setIsOpen(false);
              }}
            >
              <span>All Customers</span>
              {!value && <Check className="w-3.5 h-3.5 text-[#22d3ee]" />}
            </div>

            {results.map((c) => {
              const isSelected = value === c.id;
              return (
                <div
                  key={c.id}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-white/[0.06] flex items-center justify-between ${
                    isSelected ? "bg-white/[0.04] text-[#22d3ee] font-medium" : "text-zinc-300"
                  }`}
                  onClick={() => {
                    setSelectedCustomer(c);
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="truncate">
                    <div className="font-medium text-white truncate">{c.name}</div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {c.company ? `${c.company} • ` : ""}
                      {c.email}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#22d3ee] shrink-0 ml-2" />}
                </div>
              );
            })}

            {!isLoading && results.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-zinc-500">
                No customers found matching &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

