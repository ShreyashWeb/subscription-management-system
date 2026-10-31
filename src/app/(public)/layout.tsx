import React from "react";
import { AuroraBackground } from "@/components/glass/aurora-background";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
        {children}
      </div>
    </AuroraBackground>
  );
}

