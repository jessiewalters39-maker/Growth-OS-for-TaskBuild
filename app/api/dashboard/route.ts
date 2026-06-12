import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/dashboard";

// GET /api/dashboard — aggregates for the homepage (also used directly by the
// server-rendered dashboard page via lib/dashboard.ts).
export async function GET() {
  return NextResponse.json(await getDashboard());
}
