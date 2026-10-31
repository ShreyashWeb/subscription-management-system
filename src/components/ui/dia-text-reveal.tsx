"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface DiaTextRevealProps {
  text: string[];
  repeat?: boolean;
  repeatDelay?: number; // in seconds
  className?: string;
}

export function DiaTextReveal({
  text,
  repeat = true,
  repeatDelay = 1.2,
  className,
}: DiaTextRevealProps) {
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!text || text.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex + 1 >= text.length) {
          return repeat ? 0 : prevIndex;
        }
        return prevIndex + 1;
      });
    }, (repeatDelay + 1.2) * 1000);

    return () => clearInterval(interval);
  }, [text, repeat, repeatDelay]);

  if (!text || text.length === 0) return null;

  const currentText = text[index] || text[0];

  if (shouldReduceMotion) {
    return <span className={cn("inline-block", className)}>{currentText}</span>;
  }

  return (
    <span className={cn("inline-flex overflow-hidden py-1 relative align-baseline", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          initial={{ y: "80%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-80%", opacity: 0, filter: "blur(6px)" }}
          transition={{
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block bg-gradient-to-r from-[#22d3ee] via-[#6d5dfc] to-[#f472b6] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(109,93,252,0.4)]"
        >
          {currentText}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

