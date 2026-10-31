export interface FormatMoneyOptions {
  currency?: string;
  locale?: string;
  showDecimals?: boolean;
}

/**
 * Format integer minor units (e.g. paise, cents) to localized currency string.
 * Example: 150000 -> "₹1,500.00"
 */
export function formatMoney(
  amountInMinorUnits: number,
  options: FormatMoneyOptions = {}
): string {
  const {
    currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "INR",
    locale = "en-IN",
    showDecimals = true,
  } = options;

  const majorUnits = amountInMinorUnits / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(majorUnits);
}

/**
 * Converts major units to minor units (e.g., 1500.50 -> 150050)
 */
export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

/**
 * Converts minor units to major units (e.g., 150050 -> 1500.50)
 */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

