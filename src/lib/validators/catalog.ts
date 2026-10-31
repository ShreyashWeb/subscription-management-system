import { z } from "zod";
import { toMinorUnits } from "@/lib/money";

export const variantItemSchema = z.object({
  id: z.string().optional(),
  attribute: z.string().trim().min(1, "Attribute name is required (e.g. Brand)"),
  value: z.string().trim().min(1, "Variant value is required (e.g. Odoo)"),
  extraPrice: z.union([z.string(), z.number()]).transform((val) => toMinorUnits(val)),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  type: z.string().trim().min(1, "Product type is required"),
  salesPrice: z.union([z.string(), z.number()]).transform((val) => toMinorUnits(val)),
  costPrice: z.union([z.string(), z.number()]).transform((val) => toMinorUnits(val)),
  notes: z.string().trim().optional().nullable(),
  active: z.boolean().default(true),
  variants: z.array(variantItemSchema).default([]),
});

export const taxSchema = z.object({
  name: z.string().trim().min(2, "Tax name must be at least 2 characters"),
  ratePercent: z
    .coerce
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100%"),
  active: z.boolean().default(true),
});

export const planSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters"),
  price: z.union([z.string(), z.number()]).transform((val) => toMinorUnits(val)),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  minQty: z.coerce.number().int().min(1, "Minimum quantity must be at least 1").default(1),
  availableFrom: z.string().min(1, "Available from date is required"),
  availableTo: z.string().optional().nullable(),
  autoClose: z.boolean().default(false),
  closable: z.boolean().default(true),
  pausable: z.boolean().default(false),
  renewable: z.boolean().default(true),
  trialDays: z.coerce.number().int().min(0, "Trial days cannot be negative").default(0),
  active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantItemInput = z.infer<typeof variantItemSchema>;
export type TaxInput = z.infer<typeof taxSchema>;
export type PlanInput = z.infer<typeof planSchema>;

