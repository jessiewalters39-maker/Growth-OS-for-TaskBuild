// Tiny dependency-free CSV parser + fuzzy header matcher for lead imports.

// RFC-4180-ish parser: handles quoted fields, escaped quotes (""), and
// newlines inside quotes. Returns rows of raw string cells.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Canonical lead field → list of header substrings that should map to it.
const FIELD_ALIASES: Record<string, string[]> = {
  company: ["company", "business", "organization", "org"],
  owner: ["owner", "contact", "name", "first name", "full name"],
  email: ["email", "e-mail"],
  phone: ["phone", "tel", "mobile", "cell"],
  website: ["website", "url", "web", "site"],
  city: ["city", "town"],
  state: ["state", "province", "region"],
  industry: ["industry", "vertical", "trade", "category"],
  source: ["source", "channel", "lead source"],
  landingPage: ["landing", "page", "landing page"],
  createdAt: ["date", "created", "created at", "timestamp"],
};

// Map header cells to canonical field names. Returns { fieldName: columnIndex }.
// Each column is claimed by at most one field, and exact header matches win
// over substring matches — so "Business Name" maps to `company` (exact-ish via
// substring) without also being grabbed by `owner`'s loose "name" alias.
export function matchHeaders(header: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const used = new Set<number>();
  const norm = header.map((h) => h.trim().toLowerCase());

  const claim = (predicate: (alias: string, h: string) => boolean) => {
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (field in out) continue;
      for (let i = 0; i < norm.length; i++) {
        if (used.has(i) || !norm[i]) continue;
        if (aliases.some((a) => predicate(a, norm[i]))) {
          out[field] = i;
          used.add(i);
          break;
        }
      }
    }
  };

  claim((a, h) => h === a); // pass 1: exact header == alias
  claim((a, h) => h.includes(a)); // pass 2: substring, on remaining columns
  return out;
}
