import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { describeDatabaseError } from "@/lib/db-error";

// Next.js loads .env.local itself and does not override an existing DATABASE_URL.
// This fallback covers scripts and drizzle-kit. dotenv does not override either.
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Add it to .env.local or the process environment.");
}

type UrlInfo = {
  present: true;
  host: string;
  port: string;
  database: string;
  user: string;
  neon: boolean;
};

function describeUrl(url: string): UrlInfo | { present: true; parseable: false } {
  try {
    const parsed = new URL(url);
    return {
      present: true,
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "(none)",
      user: parsed.username || "(none)",
      neon: parsed.hostname.includes("neon.tech"),
    };
  } catch {
    return { present: true, parseable: false };
  }
}

function envFileTarget(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return { file: fileName, exists: false as const };
  const line = fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) return { file: fileName, exists: true as const, hasDatabaseUrl: false as const };
  const raw = line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
  const described = describeUrl(raw);
  return { file: fileName, exists: true as const, hasDatabaseUrl: true as const, ...described };
}

const runtimeTarget = describeUrl(databaseUrl);
const localFileTarget = envFileTarget(".env.local");
const globalForLog = globalThis as typeof globalThis & { __rmpDbLogged?: boolean };
if (!globalForLog.__rmpDbLogged) {
  globalForLog.__rmpDbLogged = true;
console.info("[db:startup] DATABASE_URL exists", {
  runtime: runtimeTarget,
  envLocal: localFileTarget,
  password: "redacted",
  sameHost:
    "host" in runtimeTarget &&
    "host" in localFileTarget &&
    runtimeTarget.host === localFileTarget.host &&
    runtimeTarget.database === localFileTarget.database,
});
if ("neon" in runtimeTarget && !runtimeTarget.neon) {
  console.info("[db:startup] DATABASE_URL is not a Neon host. Vercel should inject the Neon URL; .env.local is only for local development and must not override it.");
}
}

const globalForDb = globalThis as typeof globalThis & {
  __rmpPostgresqlPool?: Pool;
};

const poolMax = Number(process.env.DB_POOL_MAX ?? "");
export const pool =
  globalForDb.__rmpPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Optional: DB_POOL_MAX lets serverless deployments (Neon + Vercel)
    // cap connections per instance. Defaults to pg's built-in pool size.
    ...(Number.isFinite(poolMax) && poolMax > 0 ? { max: Math.min(poolMax, 20) } : {}),
  });

// Always reuse one pool per process — important on serverless (Neon
// connection limits) and prevents multiple module-graph copies of this
// file from opening competing pools.
globalForDb.__rmpPostgresqlPool = pool;

const globalForStartup = globalThis as typeof globalThis & { __rmpDbStartup?: Promise<void> };
if (!globalForStartup.__rmpDbStartup) {
  globalForStartup.__rmpDbStartup = pool
    .query<{ database: string; user: string }>("select current_database() as database, current_user as \"user\"")
    .then((result) => {
      console.info("[db:startup] connected", result.rows[0]);
    })
    .catch((error) => {
      console.error("[db:startup] connection failed\n" + describeDatabaseError(error));
      globalForStartup.__rmpDbStartup = undefined;
    });
}

export const db = drizzle(pool);
