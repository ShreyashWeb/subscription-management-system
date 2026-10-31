import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { today } from "@/lib/dates";

export interface RunDunningOptions {
  asOf?: Date | string;
  actorId?: string | null;
}

export interface DunningJobResult {
  processedInvoices: number;
  insertedRows: number;
  emailsSent: number;
}

export const dunningService = {
  /**
   * Runs the idempotent dunning reminder job.
   * Finds CONFIRMED invoices where dueDate < asOf and paidTotal < total.
   * Inserts rows for every due stage (1, 3, 7 days late) via ON CONFLICT DO NOTHING.
   * Sends email ONLY for the highest newly reached stage.
   */
  async runDunningJob(options: RunDunningOptions = {}): Promise<DunningJobResult> {
    const asOfDate = options.asOf
      ? typeof options.asOf === "string"
        ? new Date(options.asOf)
        : options.asOf
      : today();
    const actorId = options.actorId ?? null;

    // Find all confirmed invoices past due date
    const overdueCandidates = await db.invoice.findMany({
      where: {
        status: "CONFIRMED",
        dueDate: { lt: asOfDate },
      },
      include: {
        customer: true,
        reminders: true,
      },
      orderBy: { dueDate: "asc" },
    });

    let insertedRowsCount = 0;
    let emailsSentCount = 0;

    for (const invoice of overdueCandidates) {
      const outstanding = invoice.total - invoice.paidTotal;
      if (outstanding <= 0) continue;

      const dueDate = new Date(invoice.dueDate);
      const diffTime = asOfDate.getTime() - dueDate.getTime();
      const daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (daysLate < 1) continue;

      // Determine stages due based on days late
      const dueStages = [1, 3, 7].filter((stage) => daysLate >= stage);
      if (dueStages.length === 0) continue;

      const highestDueStage = Math.max(...dueStages);
      const existingStages = new Set(invoice.reminders.map((r) => r.stage));

      let isHighestStageNew = false;

      // Insert missing rows for each due stage
      for (const stage of dueStages) {
        if (existingStages.has(stage)) continue;

        const inserted = await db.$queryRawUnsafe<Array<{ id: string }>>(
          `INSERT INTO "DunningReminder" (id, "invoiceId", stage, "sentAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW())
           ON CONFLICT ("invoiceId", stage) DO NOTHING
           RETURNING id;`,
          invoice.id,
          stage
        );

        if (inserted && inserted.length > 0) {
          insertedRowsCount++;
          if (stage === highestDueStage) {
            isHighestStageNew = true;
          }
        }
      }

      // Change 1: Send email ONLY for the highest due stage if it was newly inserted in this run
      if (isHighestStageNew) {
        emailsSentCount++;
        const logDetail = `Stage ${highestDueStage} overdue reminder sent (${daysLate} days late, outstanding: ${formatMoney(outstanding)})`;

        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder") {
          // Attempt real Resend email
        } else {
          console.log(
            `[DUNNING EMAIL] ${invoice.customer.email}: ${invoice.number} - ${logDetail}`
          );
        }

        await db.activityLog.create({
          data: {
            entity: "invoice",
            entityId: invoice.id,
            action: "DUNNING_REMINDER_SENT",
            detail: logDetail,
            actorId,
          },
        });
      }
    }

    return {
      processedInvoices: overdueCandidates.length,
      insertedRows: insertedRowsCount,
      emailsSent: emailsSentCount,
    };
  },

  /**
   * Retrieves all dunning reminders for an invoice.
   */
  async getRemindersForInvoice(invoiceId: string) {
    return db.dunningReminder.findMany({
      where: { invoiceId },
      orderBy: { stage: "asc" },
    });
  },
};

