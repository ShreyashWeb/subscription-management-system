import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: Insufficient privileges") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Returns current authenticated session user or throws UnauthorizedError.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user;
}

/**
 * Ensures authenticated user has one of the allowed roles.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Access denied: Required role (${allowedRoles.join(" | ")})`
    );
  }
  return user;
}

/**
 * Customer ownership check: Admin and Staff can access any record;
 * Customers can ONLY access their own records.
 * Per docs/04-API.md, returns NotFoundError (404) rather than 403 when
 * a customer requests another customer's record so IDs cannot be probed.
 */
export async function requireCustomerOwnership(customerId: string) {
  const user = await requireUser();
  if (user.role === Role.ADMIN || user.role === Role.STAFF) {
    return user;
  }
  if (user.role === Role.CUSTOMER && user.id === customerId) {
    return user;
  }
  throw new NotFoundError("Resource not found");
}

