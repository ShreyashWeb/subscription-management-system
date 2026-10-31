"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield, Briefcase, User, ArrowRight, Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const isResetSuccess = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User requirement 5: Show demo buttons only when NEXT_PUBLIC_DEMO_MODE=true
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const handleLogin = async (e: React.FormEvent, targetEmail?: string, targetPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = targetEmail || email;
    const loginPassword = targetPassword || password;

    try {
      const result = await signIn("credentials", {
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        // User requirement 3: Login failures always return the generic message "Invalid email or password"
        setError("Invalid email or password");
        setLoading(false);
        setDemoLoading(null);
        return;
      }

      // Check role or callback redirect
      if (loginEmail.toLowerCase().includes("customer")) {
        router.push("/portal");
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch (err) {
      setError("Invalid email or password");
      setLoading(false);
      setDemoLoading(null);
    }
  };

  const handleDemoLogin = async (role: "admin" | "staff" | "customer") => {
    setDemoLoading(role);
    setError(null);

    const creds = {
      admin: { email: "admin@brightloop.test", pass: "Admin@12345" },
      staff: { email: "staff@brightloop.test", pass: "Staff@12345" },
      customer: { email: "customer@brightloop.test", pass: "Customer@12345" },
    }[role];

    setEmail(creds.email);
    setPassword(creds.pass);
    await handleLogin(null as any, creds.email, creds.pass);
  };

  return (
    <GlassCard className="w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] mb-3 shadow-lg shadow-[#6d5dfc]/25">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-xs text-zinc-400 mt-1">Sign in to your Brightloop Billing account</p>
      </div>

      {isResetSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <span>Password reset successful! Please log in with your new password.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#6d5dfc] focus:ring-1 focus:ring-[#6d5dfc] transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-zinc-300">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#22d3ee] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#6d5dfc] focus:ring-1 focus:ring-[#6d5dfc] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !!demoLoading}
          className="btn-brutal w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* User requirement 5: Show demo buttons only when NEXT_PUBLIC_DEMO_MODE=true */}
      {isDemoMode && (
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider text-center mb-3">
            One-Click Demo Logins
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#6d5dfc]/50 text-xs text-zinc-300 transition-all cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-[#6d5dfc] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-[11px]">Admin</span>
              <span className="text-[9px] text-zinc-500">All features</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("staff")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#22d3ee]/50 text-xs text-zinc-300 transition-all cursor-pointer group"
            >
              <Briefcase className="w-4 h-4 text-[#22d3ee] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-[11px]">Staff</span>
              <span className="text-[9px] text-zinc-500">Operations</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("customer")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#f472b6]/50 text-xs text-zinc-300 transition-all cursor-pointer group"
            >
              <User className="w-4 h-4 text-[#f472b6] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-[11px]">Customer</span>
              <span className="text-[9px] text-zinc-500">Portal view</span>
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-6 text-xs text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#6d5dfc] hover:underline font-medium">
          Create customer account
        </Link>
      </div>
    </GlassCard>
  );
}

