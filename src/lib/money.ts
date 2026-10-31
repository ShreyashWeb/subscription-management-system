/**
 * High-precision integer minor-unit conversion and financial calculations.
 * Avoids IEEE 754 binary floating-point multiplication errors (e.g. 19.99 * 100 = 1998.9999999999998).
 */

/**
 * Converts a decimal string or number to integer minor units (e.g. "19.99" -> 1999 paise/cents).
 */
export function toMinorUnits(input: string | number): number {
  if (input === "" || input === undefined || input === null) {
    return 0;
  }

  const str = typeof input === "number" ? input.toFixed(2) : String(input).trim();
  if (!str) return 0;

  const isNegative = str.startsWith("-");
  const cleanStr = isNegative ? str.slice(1) : str;

  const parts = cleanStr.split(".");
  const intPart = parts[0] ? parseInt(parts[0], 10) : 0;
  const decPart = parts[1] ? parts[1].padEnd(2, "0").slice(0, 2) : "00";
  const fraction = parseInt(decPart, 10);

  const minorUnits = intPart * 100 + fraction;
  return isNegative ? -minorUnits : minorUnits;
}

/**
 * Converts integer minor units back to a 2-decimal string (e.g. 1999 -> "19.99").
 */
export function fromMinorUnits(minor: number): string {
  const isNegative = minor < 0;
  const abs = Math.abs(minor);
  const intPart = Math.floor(abs / 100);
  const decPart = (abs % 100).toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}${intPart}.${decPart}`;
}

/**
 * Formats minor units into local currency string for display.
 */
export function formatMoney(
  amount: number, // minor units (e.g. 156000 = ₹1,560.00)
  options: { currency?: string; showDecimals?: boolean } = {}
): string {
  const currency =
    options.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "INR";
  const showDecimals = options.showDecimals ?? true;

  const value = amount / 100;

  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(value);
  } catch {
    return `${currency} ${fromMinorUnits(amount)}`;
  }
}

/**
 * Calculates profit margin between sales price and cost price.
 * User requirement 7: Guard margin % against salesPrice = 0.
 */
export function calculateMargin(
  salesPrice: number,
  costPrice: number
): {
  marginAmount: number;
  marginPercent: number;
} {
  const marginAmount = salesPrice - costPrice;
  const marginPercent =
    salesPrice > 0 ? Math.round(((salesPrice - costPrice) / salesPrice) * 10000) / 100 : 0;

  return { marginAmount, marginPercent };
}

/**
 * Computes the effective variant price = sales price + extra price.
 */
export function calculateEffectivePrice(salesPrice: number, extraPrice = 0): number {
  return salesPrice + extraPrice;
}
