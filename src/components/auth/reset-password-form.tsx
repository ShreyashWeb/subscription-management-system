"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { resetPasswordAction } from "@/server/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPasswordValid =
    password.length > 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing or invalid reset token. Please request a new link.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your new password satisfies all 4 requirements below.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordAction({
        token,
        password,
      });

      if (!res.success) {
        setError(res.error || "Failed to reset password. Link may be expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <GlassCard className="w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h1>
        <p className="text-xs text-zinc-400 mb-6">
          This password reset link is invalid or incomplete. Please request a new reset link.
        </p>
        <Link href="/forgot-password" className="btn-brutal px-4 py-2 text-xs inline-block">
          Request New Link
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] mb-3 shadow-lg shadow-[#6d5dfc]/25">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create New Password</h1>
        <p className="text-xs text-zinc-400 mt-1">Enter your new secure password below</p>
      </div>

      {success ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-200">Password successfully updated!</p>
            <p className="text-emerald-300/80 mt-0.5">Redirecting you to the sign in page...</p>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                New Password
              </label>
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

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#6d5dfc] focus:ring-1 focus:ring-[#6d5dfc] transition-colors"
                />
              </div>
            </div>

            {/* Live PasswordChecklist */}
            <PasswordChecklist password={password} />

            <button
              type="submit"
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              className="btn-brutal w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </GlassCard>
  );
}

