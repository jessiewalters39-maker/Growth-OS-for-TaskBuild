import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, sequences } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import type { SequencePayload } from "@/lib/prompts";
import { getAppSettings } from "@/lib/settings";
import { mailerConfigured, sendOutreachEmail } from "@/lib/mailer";
import { emailsSentSince } from "@/lib/sends";

const DAY_MS = 24 * 60 * 60 * 1000;

// nodemailer needs Node's net/tls — never the edge runtime.
export const runtime = "nodejs";

// POST /api/leads/[id]/send — send one email from the lead's latest generated
// sequence through the founder's mailbox (Google Workspace / Gmail SMTP), then
// stamp sentAt back into the
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
      { error: "Email sending isn't configured — set SMTP_USER and SMTP_PASSWORD" },
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

  // Daily send cap — a soft guard so you can't accidentally over-send and get
  // your mailbox throttled or your domain flagged. Counts emails sent in
  // the last rolling 24h; blocks once the cap is hit.
  const cap = settings.dailySendCap;
  const sentLast24h = await emailsSentSince(new Date(Date.now() - DAY_MS));
  if (sentLast24h >= cap) {
    return NextResponse.json(
      {
        error: `Daily send cap reached — ${sentLast24h}/${cap} sent in the last 24h. Raise it in Settings or continue tomorrow.`,
        count: sentLast24h,
        cap,
        remaining: 0,
      },
      { status: 429 },
    );
  }

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

  const count = sentLast24h + 1;
  return NextResponse.json({
    sentAt,
    count,
    cap,
    remaining: Math.max(0, cap - count),
  });
}
