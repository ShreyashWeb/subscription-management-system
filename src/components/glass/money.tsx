import React from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number; // in minor units (e.g. 150000 = ₹1,500.00)
  currency?: string;
  showDecimals?: boolean;
}

export function Money({
  amount,
  currency,
  showDecimals = true,
  className,
  ...props
}: MoneyProps) {
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

