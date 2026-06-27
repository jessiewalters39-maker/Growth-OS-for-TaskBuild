import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, sequences } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { askJson } from "@/lib/ai";
import { sequencePrompt, type SequencePayload } from "@/lib/prompts";
import { getAppSettings } from "@/lib/settings";

// Anthropic SDK needs the Node runtime; generation can take ~30s, so claim the
// full Hobby budget rather than the short platform default.
export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/leads/[id]/sequence — latest saved sequence (or {payload:null}).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const [row] = await db
    .select()
    .from(sequences)
    .where(eq(sequences.leadId, id))
    .orderBy(desc(sequences.createdAt))
    .limit(1);
  return NextResponse.json({
    payload: row?.payload ?? null,
    createdAt: row?.createdAt ?? null,
  });
}

// POST /api/leads/[id]/sequence — generate a fresh 9-message campaign + persist.
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
  let payload: SequencePayload;
  try {
    // 9 messages (5 emails + 2 SMS + 2 LinkedIn) as JSON runs ~1.7k tokens;
    // 1500 truncated it mid-JSON and broke parsing. 4000 gives headroom.
    payload = await askJson<SequencePayload>(sequencePrompt(lead, settings), 4000);
  } catch (e) {
    return NextResponse.json(
      { error: `sequence generation failed: ${String(e)}` },
      { status: 502 },
    );
  }

  // Guard against a malformed shape before persisting.
  if (!payload?.emails?.length) {
    return NextResponse.json(
      { error: "AI returned an unexpected sequence shape" },
      { status: 502 },
    );
  }

  const [row] = await db
    .insert(sequences)
    .values({ leadId: id, payload })
    .returning();
  return NextResponse.json({ payload: row.payload, createdAt: row.createdAt });
}
