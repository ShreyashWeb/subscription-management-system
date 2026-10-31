"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  decimals,
  prefix = "",
  suffix = "",
  formatter,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const effectiveDecimals = decimals ?? decimalPlaces;
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(
    shouldReduceMotion
      ? value
      : direction === "down"
      ? value
      : startValue
  );

  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 90,
  });

  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (shouldReduceMotion) {
      if (ref.current) {
        const text = formatter
          ? formatter(value)
          : value.toLocaleString(undefined, {
              minimumFractionDigits: effectiveDecimals,
              maximumFractionDigits: effectiveDecimals,
            });
        ref.current.textContent = `${prefix}${text}${suffix}`;
      }
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value);
      }, delay * 1000);
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [motionValue, isInView, delay, value, direction, startValue, shouldReduceMotion, formatter, effectiveDecimals, prefix, suffix]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    return springValue.on("change", (latest) => {
      if (ref.current) {
        const rounded = Number(latest.toFixed(effectiveDecimals));
        const text = formatter
          ? formatter(rounded)
          : rounded.toLocaleString(undefined, {
              minimumFractionDigits: effectiveDecimals,
              maximumFractionDigits: effectiveDecimals,
            });
        ref.current.textContent = `${prefix}${text}${suffix}`;
      }
    });
  }, [springValue, effectiveDecimals, formatter, shouldReduceMotion, prefix, suffix]);

  const initialText = formatter
    ? formatter(startValue)
    : startValue.toLocaleString(undefined, {
        minimumFractionDigits: effectiveDecimals,
        maximumFractionDigits: effectiveDecimals,
      });

  return (
    <span
      ref={ref}
      className={cn(
        "num inline-block tracking-tight text-white tabular-nums",
        className
      )}
      {...props}
    >
      {prefix}
      {initialText}
      {suffix}
    </span>
  );
}
