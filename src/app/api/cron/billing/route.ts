import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/server/services/billing";
import { dunningService } from "@/server/services/dunning";
import { today } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const asOfDate = today();
    let totalProcessed = 0;
    let totalRemaining = 0;
    const aggregatedSummary = {
      activated: 0,
      created: 0,
      skippedPaused: 0,
      skippedInProgress: 0,
      alreadyBilled: 0,
      failed: [] as Array<{ subscriptionId: string; number: string; error: string }>,
      durationMs: 0,
      invoiceIds: [] as string[],
    };

    const start = Date.now();

    // Loop through batches of 100 until remaining is 0 (or safety max 50 batches)
    let maxBatches = 50;
    do {
      const batchResult = await billingService.runBatch({
        asOf: asOfDate,
        batchSize: 100,
        actorId: null,
      });

      totalProcessed += batchResult.processed;
      totalRemaining = batchResult.remaining;

      aggregatedSummary.activated += batchResult.batchSummary.activated;
      aggregatedSummary.created += batchResult.batchSummary.created;
      aggregatedSummary.skippedPaused += batchResult.batchSummary.skippedPaused;
      aggregatedSummary.skippedInProgress += batchResult.batchSummary.skippedInProgress;
      aggregatedSummary.alreadyBilled += batchResult.batchSummary.alreadyBilled;
      aggregatedSummary.failed.push(...batchResult.batchSummary.failed);
      aggregatedSummary.invoiceIds.push(...batchResult.batchSummary.invoiceIds);

      maxBatches--;
    } while (totalRemaining > 0 && maxBatches > 0);

    // Change 3: Run dunning reminders job after billing completes
    const dunningResult = await dunningService.runDunningJob({
      asOf: asOfDate,
      actorId: null,
    });

    aggregatedSummary.durationMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      data: {
        processed: totalProcessed,
        remaining: totalRemaining,
        summary: aggregatedSummary,
        dunning: dunningResult,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Cron billing run failed" },
      { status: 500 }
    );
  }
}

