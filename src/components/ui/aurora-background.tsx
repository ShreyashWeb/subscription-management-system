"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-transparent text-[#f5f5fa]",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={
          {
            "--aurora":
              "repeating-linear-gradient(100deg,var(--aurora-1)_10%,var(--aurora-2)_18%,var(--aurora-3)_26%,var(--aurora-1)_34%,var(--aurora-2)_42%)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,rgba(7,7,13,0.95)_0%,rgba(7,7,13,0.95)_7%,transparent_10%,transparent_12%,rgba(7,7,13,0.95)_16%)",
            "--white-gradient":
              "repeating-linear-gradient(100deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.15)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.15)_16%)",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--dark-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-45 blur-[12px] filter will-change-transform after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-screen after:content-[""]`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_20%,transparent_75%)]`,
          )}
        />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};
