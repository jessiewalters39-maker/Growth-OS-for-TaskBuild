import { db } from "./db";
import { sequences } from "./schema";
import type { SequencePayload } from "./prompts";

// Counts outreach emails sent since `since` (a rolling window) by scanning the
// sentAt stamps persisted into each sequence payload. This reuses the existing
// source of truth instead of a separate log table — fine at founder volume;
// revisit with a dedicated sends table if daily volume ever grows large.
export async function emailsSentSince(since: Date): Promise<number> {
  const rows = await db.select({ payload: sequences.payload }).from(sequences);
  const cutoff = since.getTime();
  let count = 0;
  for (const r of rows) {
    const p = r.payload as SequencePayload | null;
    for (const e of p?.emails ?? []) {
      if (e.sentAt && new Date(e.sentAt).getTime() >= cutoff) count++;
    }
  }
  return count;
}
