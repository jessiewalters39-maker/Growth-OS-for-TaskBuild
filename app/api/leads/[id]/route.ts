import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { normEmail } from "@/lib/match";

// Fields the founder can edit from the drawer. `score`/`tier`/`scoreReason`
// are written only by the AI scoring route, not here.
const EDITABLE = [
  "company",
  "owner",
  "email",
  "phone",
  "website",
  "city",
  "state",
  "industry",
  "source",
  "status",
] as const;

// PATCH /api/leads/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of EDITABLE) {
    if (key in body) {
      const raw = body[key];
      if (key === "email") patch.email = normEmail(raw);
      else patch[key] = typeof raw === "string" ? raw.trim() || null : raw;
    }
  }
  const [row] = await db
    .update(leads)
    .set(patch)
    .where(eq(leads.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

// DELETE /api/leads/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  await db.delete(leads).where(eq(leads.id, id));
  return NextResponse.json({ ok: true });
}
