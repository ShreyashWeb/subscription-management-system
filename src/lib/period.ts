import { BillingPeriod } from "@prisma/client";
import { addDays, addMonths, addYears } from "date-fns";

/**
 * Computes date after adding one billing period per docs/06-BILLING-LOGIC.md section 2.
 */
export function addPeriod(date: Date, period: BillingPeriod): Date {
  switch (period) {
    case BillingPeriod.DAILY:
      return addDays(date, 1);
    case BillingPeriod.WEEKLY:
      return addDays(date, 7);
    case BillingPeriod.MONTHLY:
      return addMonths(date, 1); // date-fns clamps Jan 31 -> Feb 28/29 safely
    case BillingPeriod.YEARLY:
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

