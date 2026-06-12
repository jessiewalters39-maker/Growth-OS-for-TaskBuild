import { CmoView, type Report } from "@/components/CmoView";
import { getCmoReports } from "@/lib/cmo";
import type { CmoPayload } from "@/lib/prompts";

// Serialize a DB row into the client Report shape.
function toReport(row: {
  id: number;
  weekOf: string;
  payload: unknown;
  createdAt: Date | null;
}): Report {
  return {
    id: row.id,
    weekOf: row.weekOf,
    payload: row.payload as CmoPayload,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

export default async function CmoPage() {
  let latest: Report | null = null;
  let history: Report[] = [];
  try {
    const data = await getCmoReports();
    latest = data.latest ? toReport(data.latest) : null;
    history = data.history.map(toReport);
  } catch {
    // No DB yet — CmoView renders its empty state.
  }
  return <CmoView initialLatest={latest} initialHistory={history} />;
}
