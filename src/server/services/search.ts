import { db } from "@/lib/db";

export interface SearchGlobalParams {
  query: string;
  customerId?: string;
  isInternal?: boolean;
}

export interface SearchGlobalResult {
  subscriptions: Array<{ id: string; number: string; planName: string; status: string }>;
  invoices: Array<{ id: string; number: string; total: number; status: string }>;
  customers: Array<{ id: string; name: string; email: string }>;
}

export const searchService = {
  async searchGlobal(params: SearchGlobalParams): Promise<SearchGlobalResult> {
    const q = params.query.trim();
    if (!q) {
      return { subscriptions: [], invoices: [], customers: [] };
    }

    const isInternal = params.isInternal ?? false;
    const customerId = params.customerId;

    const [subscriptions, invoices, customers] = await Promise.all([
      // Search Subscriptions
      db.subscription.findMany({
        where: {
          number: { contains: q, mode: "insensitive" },
          ...(isInternal ? {} : customerId ? { customerId } : {}),
        },
        select: {
          id: true,
          number: true,
          status: true,
          plan: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // Search Invoices
      db.invoice.findMany({
        where: {
          number: { contains: q, mode: "insensitive" },
          ...(isInternal ? {} : customerId ? { customerId } : {}),
        },
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
        },
        take: 5,
        orderBy: { issueDate: "desc" },
      }),

      // Search Customers (Internal only)
      isInternal
        ? db.user.findMany({
            where: {
              role: "CUSTOMER",
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
            take: 5,
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
    ]);

    return {
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        number: s.number,
        planName: s.plan.name,
        status: s.status,
      })),
      invoices: invoices.map((i) => ({
        id: i.id,
        number: i.number,
        total: i.total,
        status: i.status,
      })),
      customers,
    };
  },
};

