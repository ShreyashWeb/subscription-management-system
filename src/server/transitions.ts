import { SubscriptionStatus } from "@prisma/client";
import { today } from "@/lib/dates";
import { format } from "date-fns";

export class InvalidTransitionError extends Error {
  constructor(from: SubscriptionStatus, to: SubscriptionStatus, reason?: string) {
    super(
      `Invalid subscription status transition from ${from} to ${to}${
        reason ? `: ${reason}` : ""
      }`
    );
    this.name = "InvalidTransitionError";
  }
}

/**
 * Status transition matrix per docs/06-BILLING-LOGIC.md section 1.
 * Single source of truth across the application.
 */
export const allowedTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  DRAFT: [SubscriptionStatus.QUOTATION, SubscriptionStatus.CLOSED],
  QUOTATION: [SubscriptionStatus.DRAFT, SubscriptionStatus.CONFIRMED, SubscriptionStatus.CLOSED],
  CONFIRMED: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED],
  ACTIVE: [SubscriptionStatus.CLOSED],
  CLOSED: [],
};

export interface SubscriptionTransitionContext {
  status: SubscriptionStatus;
  quotationValidUntil?: Date | null;
  startDate: Date;
  expiryDate?: Date | null;
  plan: {
    closable: boolean;
    pausable: boolean;
    renewable: boolean;
    trialDays: number;
    active: boolean;
    availableFrom: Date;
    availableTo?: Date | null;
  };
}

/**
 * Validates whether a transition from current status to target status is permitted.
 * Throws InvalidTransitionError with detailed reason if not permitted.
 */
export function validateSubscriptionTransition(
  context: SubscriptionTransitionContext,
  targetStatus: SubscriptionStatus
): void {
  const currentStatus = context.status;

  // 1. Structural jump check
  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new InvalidTransitionError(
      currentStatus,
      targetStatus,
      `Allowed transitions from ${currentStatus} are: [${allowed.join(", ") || "none"}]`
    );
  }

  const currentDate = today();

  // 2. QUOTATION -> CONFIRMED checks
  if (currentStatus === SubscriptionStatus.QUOTATION && targetStatus === SubscriptionStatus.CONFIRMED) {
    if (context.quotationValidUntil && new Date(context.quotationValidUntil) < currentDate) {
      const expiredStr = format(new Date(context.quotationValidUntil), "MMM d, yyyy");
      throw new InvalidTransitionError(
        currentStatus,
        targetStatus,
        `Quotation expired on ${expiredStr}. Please revise to Draft and update validity before confirming.`
      );
    }
  }

  // 3. Early Close Check (User change 3)
  // Closable flag applies only to ACTIVE -> CLOSED; DRAFT/QUOTATION -> CLOSED is always allowed.
  // If expiryDate is null, every close of an ACTIVE subscription counts as early.
  if (currentStatus === SubscriptionStatus.ACTIVE && targetStatus === SubscriptionStatus.CLOSED) {
    const isEarly = !context.expiryDate || currentDate < new Date(context.expiryDate);
    if (isEarly && !context.plan.closable) {
      throw new InvalidTransitionError(
        currentStatus,
        targetStatus,
        "Early close is not permitted by this plan."
      );
    }
  }
}

