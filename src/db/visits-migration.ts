import { pool } from "@/db";
import { describeDatabaseError } from "@/lib/db-error";

/**
 * Anonymous page-view log for the public website ("site visit counter").
 *
 * This is an additive table, created with IF NOT EXISTS on first use. It is
 * deliberately separate from the original migration so existing databases
 * (Neon) pick it up without a manual drizzle-kit push.
 *
 * Privacy: no IP addresses, names or cookies are stored. `visitor_key` is a
 * salted hash that is re-keyed every London day, so it can only answer "how
 * many distinct visitors today" and cannot be linked across days.
 */
export const SITE_VISITS_CREATE_SQL = `CREATE TABLE IF NOT EXISTS "site_visits" (
  "id" bigserial PRIMARY KEY,
  "path" text NOT NULL,
  "visitor_key" text,
  "referrer" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
)`;

export const SITE_VISITS_INDEX_SQL = [
  `CREATE INDEX IF NOT EXISTS "site_visits_created_idx" ON "site_visits" USING btree ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "site_visits_path_idx" ON "site_visits" USING btree ("path")`,
];

const globalForVisits = globalThis as typeof globalThis & {
  __thaiCourtyardVisitsReady?: Promise<boolean>;
};

/**
 * Makes sure the visit log exists. Never throws: a counter must not be able to
 * take the site or the admin panel down. Resolves false when the table could
 * not be created (for example the database is unreachable).
 */
export function ensureVisitsTable(): Promise<boolean> {
  if (!globalForVisits.__thaiCourtyardVisitsReady) {
    globalForVisits.__thaiCourtyardVisitsReady = applyVisitsSchema().catch((error) => {
      console.error("[visits] could not create site_visits\n" + describeDatabaseError(error));
      // Do not cache the failure: the next request retries once the database is back.
      globalForVisits.__thaiCourtyardVisitsReady = undefined;
      return false;
    });
  }
  return globalForVisits.__thaiCourtyardVisitsReady;
}

async function applyVisitsSchema(): Promise<boolean> {
  await pool.query(SITE_VISITS_CREATE_SQL);
  for (const statement of SITE_VISITS_INDEX_SQL) {
    await pool.query(statement);
  }
  return true;
}
