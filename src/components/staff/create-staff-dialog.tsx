"use client";

import React, { useState } from "react";
import { UserPlus, X, Loader2, ShieldCheck, Mail, Lock, User, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { createStaffAction } from "@/server/actions/auth";

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPasswordValid =
    password.length > 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Password does not meet the security requirements.");
      return;
    }

    setLoading(true);

    try {
      const res = await createStaffAction({
        name,
        email,
        password,
      });

      if (!res.success) {
        setError(res.error || "Failed to create staff account");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setSuccess(false);
        setLoading(false);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
      >
        <UserPlus className="w-3.5 h-3.5 fill-black" />
        <span>Create Staff Member</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md">
            <GlassCard className="p-6 relative border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Create Staff Account</h3>
                    <p className="text-[11px] text-zinc-400">Admin-authorized team member</p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center">
                  Staff account successfully created!
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-3.5">
                  {error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Staff Name
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jordan Miller"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Staff Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@brightloop.test"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Temporary Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22d3ee] transition-colors"
                      />
                    </div>
                  </div>

                  <PasswordChecklist password={password} />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !isPasswordValid}
                      className="btn-brutal px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Staff</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}

