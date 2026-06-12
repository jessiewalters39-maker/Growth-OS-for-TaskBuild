import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { askJson } from "@/lib/ai";
import { scorePrompt, type ScoreResult } from "@/lib/prompts";
import { getAppSettings } from "@/lib/settings";

// POST /api/leads/[id]/score — AI fit score against the current target market.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const settings = await getAppSettings();
  let result: ScoreResult;
  try {
    result = await askJson<ScoreResult>(scorePrompt(lead, settings), 300);
  } catch (e) {
    return NextResponse.json(
      { error: `scoring failed: ${String(e)}` },
      { status: 502 },
    );
  }

  const tier = ["Hot", "Warm", "Cold"].includes(result.tier)
    ? result.tier
    : "Warm";
  const score = Math.max(1, Math.min(100, Math.round(result.score) || 1));

  const [row] = await db
    .update(leads)
    .set({ tier, score, scoreReason: result.reason, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return NextResponse.json(row);
}
