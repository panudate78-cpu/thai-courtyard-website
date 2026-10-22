import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same file Next.js loads. Do not override an already-exported DATABASE_URL
// (Vercel/Neon injects it; .env.local is for local development).
loadEnv({ path: ".env.local" });
loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required. Put the Neon URL in .env.local or the environment before running drizzle-kit.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
  out: "./drizzle",
});
