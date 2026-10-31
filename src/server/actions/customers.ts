"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";

export interface CustomerSearchResult {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

/**
 * Searches customers by name, email, or company.
 * Restricted to internal staff and admin roles.
 * Returns up to 10 matching records to avoid loading thousands of customers into memory.
 */
export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    throw new ForbiddenError("Only Admin and Staff can search customers.");
  }

  const trimmed = query.trim();
  if (!trimmed) {
    // Return first 10 customers by default
    return db.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, company: true },
      take: 10,
      orderBy: { name: "asc" },
    });
  }

  return db.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { email: { contains: trimmed, mode: "insensitive" } },
        { company: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, company: true },
    take: 10,
    orderBy: { name: "asc" },
  });
}

