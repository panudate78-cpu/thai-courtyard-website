#!/usr/bin/env node
/**
 * White-label helper: wipe menu + re-seed from SEED_MENU (Thai Courtyard sample).
 * For a new client that uploaded a bad CSV, run this to get back to a known-good menu.
 * Usage:  DATABASE_URL=... node scripts/seed-reset.mjs
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (set in .env.local or env).");
  process.exit(1);
}

const { pool } = await import("../src/db/index.ts").catch(async () => {
  // Fallback: direct pg if src/db not compiled
  const pg = await import("pg");
  const p = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
  return { pool: p };
});

try {
  console.log("Truncating menu_* tables…");
  await pool.query(`TRUNCATE option_choices, option_groups, menu_items, menu_categories RESTART IDENTITY CASCADE`);
  console.log("Truncated. Re-seeding via ensureDatabase()…");
  const { ensureDatabase } = await import("../src/db/bootstrap.ts");
  await ensureDatabase();
  console.log("Done. Menu re-seeded from src/db/seed-data.ts");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  try { await pool.end(); } catch {}
}
