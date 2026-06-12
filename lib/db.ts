import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy Neon HTTP connection. The neon() driver throws immediately if the
// connection string is empty, so we defer construction until the first query
// rather than at module load — otherwise `next build` page-data collection
// (which imports route modules) crashes when DATABASE_URL is unset.
let instance: NeonHttpDatabase<typeof schema> | null = null;

function real(): NeonHttpDatabase<typeof schema> {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  instance = drizzle(url, { schema });
  return instance;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const value = real()[prop as keyof NeonHttpDatabase<typeof schema>];
    return typeof value === "function" ? value.bind(real()) : value;
  },
});
