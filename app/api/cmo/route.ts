import { NextResponse } from "next/server";
import { generateWeeklyCmo, getCmoReports } from "@/lib/cmo";

// Report generation is an AI call (~20-30s); claim the full Hobby budget.
export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/cmo — latest report + last 8.
export async function GET() {
  return NextResponse.json(await getCmoReports());
}

// POST /api/cmo — generate a report now from real data.
export async function POST() {
  try {
    const report = await generateWeeklyCmo();
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json(
      { error: `CMO generation failed: ${String(e)}` },
      { status: 502 },
    );
  }
}
