import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sequences } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import type { SequencePayload } from "@/lib/prompts";
import { markContacted } from "@/lib/match";

export const runtime = "nodejs";

type Channel = "email" | "sms" | "linkedin";
// channel name → the array key on the payload (email lives under "emails").
const PAYLOAD_KEY: Record<Channel, "emails" | "sms" | "linkedin"> = {
  email: "emails",
  sms: "sms",
  linkedin: "linkedin",
};
const CHANNELS: Channel[] = ["email", "sms", "linkedin"];

// POST /api/leads/[id]/sequence/mark  body: { channel, index, sent }
// Manually stamp (or clear, for undo) the sentAt on an SMS/LinkedIn/email touch
// in the lead's latest sequence — used for the channels we don't send through
// the app. When marking sent, also bump the lead New → Contacted.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const channel = body?.channel as Channel;
  const index = Number(body?.index);
  const sent = Boolean(body?.sent);
  if (!CHANNELS.includes(channel) || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "bad channel or index" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(sequences)
    .where(eq(sequences.leadId, id))
    .orderBy(desc(sequences.createdAt))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "no sequence for this lead" }, { status: 404 });
  }

  const payload = row.payload as SequencePayload;
  const key = PAYLOAD_KEY[channel];
  const msg = payload[key]?.[index];
  if (!msg) {
    return NextResponse.json({ error: "no message at that index" }, { status: 404 });
  }

  const sentAt = sent ? new Date().toISOString() : undefined;
  payload[key][index] = { ...msg, sentAt };
  await db.update(sequences).set({ payload }).where(eq(sequences.id, row.id));

  // First touch of any kind moves the lead to Contacted (only when marking sent).
  const lead = sent ? await markContacted(id) : null;
  return NextResponse.json({ sentAt: sentAt ?? null, lead });
}
