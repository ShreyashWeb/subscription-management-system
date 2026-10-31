import React from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/glass/aurora-background";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { StatusPill } from "@/components/glass/status-pill";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen flex flex-col relative z-10">
        {/* Portal Header */}
        <header className="glass sticky top-3 z-20 mx-4 mb-8 px-5 py-3 rounded-[16px] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#6d5dfc]/30">
                B
              </span>
              <span className="font-heading font-bold text-white text-base">
                Brightloop Portal
              </span>
            </Link>
            <StatusPill status="ACTIVE" label="Customer Portal" size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white font-medium">
                {session.user.name?.[0]?.toUpperCase() || "C"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-medium text-white text-xs">{session.user.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono">{session.user.email}</div>
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-xs text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Portal Main Content */}
        <main className="flex-1 px-4 max-w-6xl w-full mx-auto pb-12">
          {children}
        </main>
      </div>
    </AuroraBackground>
  );
}

