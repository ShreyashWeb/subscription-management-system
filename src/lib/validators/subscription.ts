import { z } from "zod";
import { toMinorUnits } from "@/lib/money";

export const subscriptionLineInputSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  variantId: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.union([z.string(), z.number()]).optional().nullable(), // Optional: defaults to product.salesPrice + variant.extraPrice per Decision D9
});

export const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  planId: z.string().min(1, "Subscription plan is required"),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().optional().nullable(),
  paymentTermsDays: z.coerce.number().int().min(0).default(15),
  validityDays: z.coerce.number().int().min(1).default(30),
  lines: z.array(subscriptionLineInputSchema).min(1, "At least one product line is required"),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  paymentTermsDays: z.coerce.number().int().min(0).optional(),
  validityDays: z.coerce.number().int().min(1).optional(),
  lines: z.array(subscriptionLineInputSchema).optional(),
});

export const createFromTemplateSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  customerId: z.string().min(1, "Customer is required"),
  startDate: z.string().min(1, "Start date is required"),
});

export const templateLineInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
});

export const quotationTemplateSchema = z.object({
  name: z.string().trim().min(2, "Template name must be at least 2 characters"),
  planId: z.string().min(1, "Plan is required"),
  validityDays: z.coerce.number().int().min(1, "Validity days must be at least 1").default(30),
  lines: z.array(templateLineInputSchema).min(1, "At least one product line is required"),
});

export type SubscriptionLineInput = z.infer<typeof subscriptionLineInputSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CreateFromTemplateInput = z.infer<typeof createFromTemplateSchema>;
export type TemplateLineInput = z.infer<typeof templateLineInputSchema>;
export type QuotationTemplateInput = z.infer<typeof quotationTemplateSchema>;

