import { Prisma } from "@prisma/client";

/**
 * Atomically generates the next sequential number using PostgreSQL raw SQL:
 * INSERT INTO "Counter" (key, value) VALUES ($1, 1)
 * ON CONFLICT (key) DO UPDATE SET value = "Counter".value + 1
 * RETURNING value;
 *
 * Guarantees zero gaps and zero duplicate collisions under concurrent transactions.
 */
export async function getNextSequenceNumber(
  tx: Prisma.TransactionClient,
  prefix: "SUB" | "INV",
  date: Date = new Date()
): Promise<string> {
  const year = date.getUTCFullYear();
  const counterKey = `${prefix}-${year}`;

  const rows = await tx.$queryRawUnsafe<Array<{ value: number }>>(
    `INSERT INTO "Counter" ("key", "value")
     VALUES ($1, 1)
     ON CONFLICT ("key") DO UPDATE
     SET "value" = "Counter"."value" + 1
     RETURNING "value";`,
    counterKey
  );

  if (!rows || rows.length === 0) {
    throw new Error(`Failed to generate sequence number for key ${counterKey}`);
  }

  const seq = rows[0].value;
  const padLen = prefix === "INV" ? 6 : 5;
  return `${prefix}-${year}-${String(seq).padStart(padLen, "0")}`;
}

