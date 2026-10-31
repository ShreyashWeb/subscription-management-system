import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  productSchema,
  variantItemSchema,
  type ProductInput,
  type VariantItemInput,
} from "@/lib/validators/catalog";
import {
  requireRole,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/policies/permissions";

export interface ListProductsParams {
  search?: string;
  type?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * List products with server pagination, search, and type filtering.
 * Allowed for Admin and Staff.
 */
export async function listProducts(params: ListProductsParams = {}) {
  await requireRole(["ADMIN", "STAFF"]);

  const { search, type, active, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {};

  if (active !== undefined) {
    where.active = active;
  }

  if (type && type !== "ALL") {
    where.type = type;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: {
        variants: {
          orderBy: [{ attribute: "asc" }, { value: "asc" }],
        },
      },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get single product by ID with variants.
 */
export async function getProduct(id: string) {
  await requireRole(["ADMIN", "STAFF"]);
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: [{ attribute: "asc" }, { value: "asc" }],
      },
    },
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return product;
}

/**
 * Create a new product with optional variants (Admin only).
 * User requirement 7: Catch duplicate variants with friendly message.
 */
export async function createProduct(input: ProductInput) {
  await requireRole(["ADMIN"]);
  const parsed = productSchema.parse(input);

  // Validate for duplicate variants within the input itself
  const variantKeys = new Set<string>();
  for (const v of parsed.variants) {
    const key = `${v.attribute.toLowerCase().trim()}:${v.value.toLowerCase().trim()}`;
    if (variantKeys.has(key)) {
      throw new ConflictError(
        `Duplicate variant: Attribute "${v.attribute}" with value "${v.value}" is repeated.`
      );
    }
    variantKeys.add(key);
  }

  try {
    const product = await db.product.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        salesPrice: parsed.salesPrice,
        costPrice: parsed.costPrice,
        notes: parsed.notes,
        active: parsed.active,
        variants: {
          create: parsed.variants.map((v) => ({
            attribute: v.attribute.trim(),
            value: v.value.trim(),
            extraPrice: v.extraPrice,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return product;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError(
        "A variant with this attribute and value already exists on this product."
      );
    }
    throw error;
  }
}

/**
 * Update product details and sync its variants (Admin only).
 */
export async function updateProduct(id: string, input: ProductInput) {
  await requireRole(["ADMIN"]);
  const parsed = productSchema.parse(input);

  // Check existence
  const existing = await db.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!existing) {
    throw new NotFoundError("Product not found");
  }

  // Validate duplicate variants in input
  const variantKeys = new Set<string>();
  for (const v of parsed.variants) {
    const key = `${v.attribute.toLowerCase().trim()}:${v.value.toLowerCase().trim()}`;
    if (variantKeys.has(key)) {
      throw new ConflictError(
        `Duplicate variant: Attribute "${v.attribute}" with value "${v.value}" is repeated.`
      );
    }
    variantKeys.add(key);
  }

  try {
    // In a transaction: update product, update/create/delete variants
    return await db.$transaction(async (tx) => {
      // 1. Update product fields
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: parsed.name,
          type: parsed.type,
          salesPrice: parsed.salesPrice,
          costPrice: parsed.costPrice,
          notes: parsed.notes,
          active: parsed.active,
        },
      });

      // 2. Sync variants: determine existing vs incoming
      const existingVariantIds = new Set(existing.variants.map((v) => v.id));
      const incomingWithIds = parsed.variants.filter((v) => v.id);
      const incomingIds = new Set(incomingWithIds.map((v) => v.id!));

      // Variants to delete: in existing but not in incoming
      const toDeleteIds = [...existingVariantIds].filter((vId) => !incomingIds.has(vId));
      for (const vId of toDeleteIds) {
        // User requirement 4: Check references before deletion
        const [subLinesCount, tplLinesCount] = await Promise.all([
          tx.subscriptionLine.count({ where: { variantId: vId } }),
          tx.templateLine.count({ where: { variantId: vId } }),
        ]);

        if (subLinesCount > 0 || tplLinesCount > 0) {
          const v = existing.variants.find((item) => item.id === vId);
          throw new ForbiddenError(
            `Cannot delete variant "${v?.attribute}: ${v?.value}" because it is referenced in ${subLinesCount + tplLinesCount} active subscriptions or templates. You can set extra price to 0 or deactivate the product.`
          );
        }

        await tx.productVariant.delete({ where: { id: vId } });
      }

      // Upsert incoming variants
      for (const v of parsed.variants) {
        if (v.id && existingVariantIds.has(v.id)) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              attribute: v.attribute.trim(),
              value: v.value.trim(),
              extraPrice: v.extraPrice,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              attribute: v.attribute.trim(),
              value: v.value.trim(),
              extraPrice: v.extraPrice,
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: { variants: true },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError(
        "A variant with this attribute and value already exists on this product."
      );
    }
    throw error;
  }
}

/**
 * Toggle product active status (Admin only).
 */
export async function toggleProductActive(id: string) {
  await requireRole(["ADMIN"]);
  const product = await db.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError("Product not found");

  return db.product.update({
    where: { id },
    data: { active: !product.active },
  });
}

/**
 * Delete product (Admin only).
 * User requirement 4: Reject deleting products referenced by subscription or template lines.
 */
export async function deleteProduct(id: string) {
  await requireRole(["ADMIN"]);

  const [subLinesCount, tplLinesCount] = await Promise.all([
    db.subscriptionLine.count({ where: { productId: id } }),
    db.templateLine.count({ where: { productId: id } }),
  ]);

  if (subLinesCount > 0 || tplLinesCount > 0) {
    throw new ForbiddenError(
      `Cannot delete product because it is referenced in ${subLinesCount + tplLinesCount} subscriptions or templates. Please toggle it to inactive instead.`
    );
  }

  return db.product.delete({ where: { id } });
}

