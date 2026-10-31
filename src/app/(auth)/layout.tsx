import React from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/glass/aurora-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative z-10">
        <header className="mb-6 text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#22d3ee] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#6d5dfc]/30">
              B
            </span>
            <span className="font-heading">Brightloop Billing</span>
          </Link>
        </header>

        <main className="w-full flex justify-center">{children}</main>

        <footer className="mt-8 text-center text-xs text-zinc-500">
          Brightloop Billing &copy; 2026. Built for Odoo Hackathon.
        </footer>
      </div>
    </AuroraBackground>
  );
}

