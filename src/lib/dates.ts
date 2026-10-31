import { format } from "date-fns";

export function getAppTimezone(): string {
  return process.env.APP_TIMEZONE || "Asia/Kolkata";
}

/**
 * Returns today's calendar date normalized to UTC midnight for the application timezone.
 * Guarantees consistent date comparisons with Prisma @db.Date fields without time zone drift.
 */
export function today(): Date {
  const tz = getAppTimezone();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(new Date()); // "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Returns today's date formatted as "YYYY-MM-DD" in the application timezone.
 */
export function todayString(): string {
  const tz = getAppTimezone();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export type PlanAvailabilityStatus = "ACTIVE" | "UPCOMING" | "EXPIRED";

/**
 * Evaluates whether a plan is currently within its availability window.
 */
export function evaluatePlanAvailability(
  plan: { availableFrom: Date | string; availableTo?: Date | string | null },
  asOf: Date = today()
): {
  isAvailable: boolean;
  status: PlanAvailabilityStatus;
  label: string;
} {
  const asOfTime = asOf.getTime();
  const fromTime = new Date(plan.availableFrom).getTime();
  const toTime = plan.availableTo ? new Date(plan.availableTo).getTime() : null;

  if (asOfTime < fromTime) {
    return {
      isAvailable: false,
      status: "UPCOMING",
      label: "Upcoming (Not Yet Available)",
    };
  }

  if (toTime !== null && asOfTime > toTime) {
    return {
      isAvailable: false,
      status: "EXPIRED",
      label: "Expired Window",
    };
  }

  return {
    isAvailable: true,
    status: "ACTIVE",
    label: "Available",
  };
}

