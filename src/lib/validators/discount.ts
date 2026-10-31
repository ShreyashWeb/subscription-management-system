import { z } from "zod";

export const discountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  type: z.enum(["FIXED", "PERCENT"]),
  value: z.number().int().min(1, "Value must be greater than zero"),
  minPurchase: z.number().int().min(0).default(0),
  minQty: z.number().int().min(0).default(0),
  startDate: z.string().min(10, "Start date is required"),
  endDate: z.string().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  scope: z.enum(["PRODUCT", "SUBSCRIPTION"]),
  targetProductIds: z.array(z.string()).default([]),
  targetSubscriptionIds: z.array(z.string()).default([]),
  active: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === "PERCENT" && data.value > 10000) {
      return false;
    }
    return true;
  },
  {
    message: "Percentage cannot exceed 100.00% (10,000 basis points)",
    path: ["value"],
  }
).refine(
  (data) => {
    if (data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      return false;
    }
    return true;
  },
  {
    message: "End date cannot be earlier than start date",
    path: ["endDate"],
  }
);

export type DiscountInput = z.infer<typeof discountSchema>;
