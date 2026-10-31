"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, User, Loader2, ArrowRight } from "lucide-react";

interface DemoLoginButtonsProps {
  variant?: "hero" | "compact" | "nav";
  className?: string;
}

export function DemoLoginButtons({ variant = "hero", className = "" }: DemoLoginButtonsProps) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemo = async (role: "admin" | "customer") => {
    setLoadingRole(role);
    const creds =
      role === "admin"
        ? { email: "admin@brightloop.test", pass: "Admin@12345", dest: "/dashboard" }
        : { email: "customer@brightloop.test", pass: "Customer@12345", dest: "/portal" };

    try {
      const res = await signIn("credentials", {
        email: creds.email,
        password: creds.pass,
        redirect: false,
      });

      if (res?.ok) {
        router.push(creds.dest);
        router.refresh();
      } else {
        setLoadingRole(null);
      }
    } catch {
      setLoadingRole(null);
    }
  };

  if (variant === "nav") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => handleDemo("admin")}
          disabled={!!loadingRole}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
        >
          {loadingRole === "admin" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Zap className="w-3 h-3 fill-black" />
          )}
          Demo as Admin
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => handleDemo("admin")}
          disabled={!!loadingRole}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loadingRole === "admin" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 fill-black" />
          )}
          Demo as Admin
        </button>

        <button
          type="button"
          onClick={() => handleDemo("customer")}
          disabled={!!loadingRole}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer disabled:opacity-50"
        >
          {loadingRole === "customer" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <User className="w-3.5 h-3.5 text-[#22d3ee]" />
          )}
          Demo as Customer
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
      {/* Neo-brutalist "Demo as Admin" button */}
      <button
        type="button"
        onClick={() => handleDemo("admin")}
        disabled={!!loadingRole}
        className="btn-brutal px-6 py-3 text-sm md:text-base flex items-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loadingRole === "admin" ? (
          <Loader2 className="w-4 h-4 animate-spin text-black" />
        ) : (
          <Zap className="w-4 h-4 fill-black text-black" />
        )}
        Demo as Admin
      </button>

      {/* Glass "Demo as Customer" button */}
      <button
        type="button"
        onClick={() => handleDemo("customer")}
        disabled={!!loadingRole}
        className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all flex items-center gap-2 backdrop-blur-md shadow-lg shadow-black/30 hover:border-white/30 cursor-pointer disabled:opacity-60"
      >
        {loadingRole === "customer" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <User className="w-4 h-4 text-[#22d3ee]" />
        )}
        Demo as Customer
      </button>
    </div>
  );
}

