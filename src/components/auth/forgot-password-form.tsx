"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { requestResetAction } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requestResetAction(email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f472b6] to-[#6d5dfc] mb-3 shadow-lg shadow-[#f472b6]/25">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Enter your email to receive a secure single-use reset link
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Reset instructions dispatched</p>
              <p className="mt-1 text-emerald-300/80 leading-relaxed">
                If an account exists with <strong>{email}</strong>, a secure reset link has been
                sent. The link expires in 30 minutes.
              </p>
            </div>
          </div>

          <div className="text-center pt-3">
            <Link
              href="/login"
              className="text-xs text-[#22d3ee] hover:underline inline-flex items-center gap-1 font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Email address
            </label>
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

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center mt-6 text-xs text-zinc-400">
            Remembered your password?{" "}
            <Link href="/login" className="text-[#6d5dfc] hover:underline font-medium">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </GlassCard>
  );
}

