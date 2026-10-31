"use server";

import { auth } from "@/lib/auth";
import { searchService, SearchGlobalResult } from "@/server/services/search";

export type GlobalSearchResults = SearchGlobalResult;

export async function globalSearchAction(query: string): Promise<GlobalSearchResults> {
  const session = await auth();
  if (!session?.user) {
    return { subscriptions: [], invoices: [], customers: [] };
  }

  const role = session.user.role;
  const isInternal = role === "ADMIN" || role === "STAFF";

  return searchService.searchGlobal({
    query,
    customerId: session.user.id,
    isInternal,
  });
}
