"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { signupAction } from "@/server/actions/auth";

export function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasswordValid =
    password.length > 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please ensure your password satisfies all 4 requirements below.");
      return;
    }

    setLoading(true);

    try {
      const res = await signupAction({
        name,
        email,
        password,
      });

      if (!res.success) {
        setError(res.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Automatically sign in upon successful registration
      const loginRes = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (loginRes?.ok) {
        router.push("/portal");
        router.refresh();
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#22d3ee] to-[#6d5dfc] mb-3 shadow-lg shadow-[#22d3ee]/25">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
        <p className="text-xs text-zinc-400 mt-1">Get started with Brightloop Customer Portal</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] transition-colors"
            />
          </div>
        </div>

        {/* Live PasswordChecklist component */}
        <PasswordChecklist password={password} />

        <button
          type="submit"
          disabled={loading || !isPasswordValid}
          className="btn-brutal w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Customer Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-xs text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-[#22d3ee] hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </GlassCard>
  );
}

