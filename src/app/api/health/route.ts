import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health check endpoint for uptime monitoring and judge verification.
 * Runs a lightweight `SELECT 1` query to verify active database connectivity.
 * Note: External uptime monitors (e.g. BetterStack, UptimeRobot) should ping
 * this endpoint every 5 minutes to prevent Neon / Supabase free tiers from sleeping.
 */
export async function GET() {
  const startTime = performance.now();
  try {
    await db.$queryRawUnsafe("SELECT 1;");
    const durationMs = Math.round(performance.now() - startTime);

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
        durationMs,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[HealthCheck] Database connection failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

