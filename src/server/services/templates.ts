import { db } from "@/lib/db";
import {
  quotationTemplateSchema,
  type QuotationTemplateInput,
} from "@/lib/validators/subscription";
import { requireRole, NotFoundError } from "@/server/policies/permissions";

/**
 * List all quotation templates with plan details and lines.
 */
export async function listTemplates() {
  await requireRole(["ADMIN", "STAFF"]);

  return db.quotationTemplate.findMany({
    include: {
      plan: true,
      lines: {
        include: {
          product: {
            include: { variants: true },
          },
          variant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get single quotation template by ID.
 */
export async function getTemplate(id: string) {
  await requireRole(["ADMIN", "STAFF"]);

  const template = await db.quotationTemplate.findUnique({
    where: { id },
    include: {
      plan: true,
      lines: {
        include: {
          product: {
            include: { variants: true },
          },
          variant: true,
        },
      },
    },
  });

  if (!template) throw new NotFoundError("Quotation template not found");
  return template;
}

/**
 * Create a new quotation template.
 */
export async function createTemplate(input: QuotationTemplateInput) {
  await requireRole(["ADMIN", "STAFF"]);
  const parsed = quotationTemplateSchema.parse(input);

  return db.quotationTemplate.create({
    data: {
      name: parsed.name,
      planId: parsed.planId,
      validityDays: parsed.validityDays,
      lines: {
        create: parsed.lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: l.quantity,
        })),
      },
    },
    include: {
      plan: true,
      lines: true,
    },
  });
}

/**
 * Delete a quotation template.
 */
export async function deleteTemplate(id: string) {
  await requireRole(["ADMIN", "STAFF"]);

  const existing = await db.quotationTemplate.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Template not found");

  return db.quotationTemplate.delete({ where: { id } });
}

