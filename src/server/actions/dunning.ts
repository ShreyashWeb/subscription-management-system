"use server";

import { requireRole } from "@/server/policies/permissions";
import { dunningService } from "@/server/services/dunning";
import { revalidatePath, revalidateTag } from "next/cache";

export async function runDunningAction(asOf?: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  try {
    const result = await dunningService.runDunningJob({
      asOf,
      actorId: user.id,
    });
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidateTag("dashboard", "default");
    revalidateTag("reports", "default");
    return { ok: true as const, data: result };
  } catch (err: any) {
    return {
      ok: false as const,
      error: {
        code: "SERVER" as const,
        message: err.message ?? "Failed to run dunning job",
      },
    };
  }
}

