import React from "react";
import { AuroraBackground } from "@/components/glass/aurora-background";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground>
      <div className="flex min-h-screen w-full relative z-10">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pr-3 pb-6">
          <Topbar />
          <main className="flex-1 px-3 max-w-[1440px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuroraBackground>
  );
}

