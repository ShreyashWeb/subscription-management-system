"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { NumberTicker } from "./number-ticker";

interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number; // in minor units (e.g. 150000 = ₹1,500.00)
  currency?: string;
  showDecimals?: boolean;
  animate?: boolean;
}

export function Money({
  amount,
  currency,
  showDecimals = true,
  animate = false,
  className,
  ...props
}: MoneyProps) {
  if (animate) {
    return (
      <NumberTicker
        value={amount}
        formatter={(val) =>
          formatMoney(Math.round(val), { currency, showDecimals })
        }
        className={cn("num font-medium text-white tracking-tight", className)}
        {...props}
      />
    );
  }

  const formatted = formatMoney(amount, { currency, showDecimals });

  return (
    <span
      className={cn("num font-medium text-white tracking-tight", className)}
      {...props}
    >
      {formatted}
    </span>
  );
}
