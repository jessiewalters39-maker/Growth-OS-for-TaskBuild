import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, sequences } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import type { SequencePayload } from "@/lib/prompts";
import { getAppSettings } from "@/lib/settings";
import { mailerConfigured, sendOutreachEmail } from "@/lib/mailer";

// nodemailer needs Node's net/tls — never the edge runtime.
export const runtime = "nodejs";

// POST /api/leads/[id]/send — send one email from the lead's latest generated
// sequence through the founder's Zoho mailbox, then stamp sentAt back into the
// stored payload. Body: { index: number } (position in payload.emails).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  if (!mailerConfigured()) {
    return NextResponse.json(
      { error: "Email sending isn't configured — set ZOHO_USER and ZOHO_APP_PASSWORD" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const index = Number(body?.index);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "bad index" }, { status: 400 });
  }

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json(
      { error: "This lead has no email address" },
      { status: 422 },
    );
  }

  const [row] = await db
    .select()
    .from(sequences)
    .where(eq(sequences.leadId, id))
    .orderBy(desc(sequences.createdAt))
    .limit(1);
  if (!row) {
    return NextResponse.json(
      { error: "No sequence generated for this lead yet" },
      { status: 404 },
    );
  }

  const payload = row.payload as SequencePayload;
  const msg = payload.emails?.[index];
  if (!msg) {
    return NextResponse.json({ error: "No email at that index" }, { status: 404 });
  }

  const settings = await getAppSettings();
  try {
    await sendOutreachEmail({
      to: lead.email,
      subject: msg.subject ?? "",
      body: msg.body,
      fromName: settings.senderName,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Send failed: ${String(e)}` },
      { status: 502 },
    );
  }

  // Stamp sentAt and persist the whole payload back to this sequence row.
  const sentAt = new Date().toISOString();
  payload.emails[index] = { ...msg, sentAt };
  await db
    .update(sequences)
    .set({ payload })
    .where(eq(sequences.id, row.id));

  return NextResponse.json({ sentAt });
}
