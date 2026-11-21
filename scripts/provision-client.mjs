#!/usr/bin/env node
/**
 * White-label provision helper — quick checks + .env.local stub for a new client clone.
 * Usage:
 *   node scripts/provision-client.mjs
 *   node scripts/provision-client.mjs --client "Example Bistro" --domain https://www.example.co.uk
 *
 * Does not require DATABASE_URL to be live; it only writes a stub and prints next steps.
 * Safe to re-run.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const envPath = path.join(root, ".env.local");
const examplePath = path.join(root, ".env.example");

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const pref = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (pref) return pref.split("=").slice(1).join("=");
  return null;
}

const client = arg("client") || arg("name") || "New Restaurant";
const domain = arg("domain") || arg("url") || "https://www.example.co.uk";

console.log("\nThai Courtyard white-label — provision-client\n");
console.log(`Client: ${client}`);
console.log(`Domain: ${domain}\n`);

if (!fs.existsSync(examplePath)) {
  console.error(`Missing ${examplePath} — pull latest main.`);
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log(`Found existing ${envPath} — leaving it in place (not overwriting).`);
} else {
  const example = fs.readFileSync(examplePath, "utf8");
  let stub = example
    .replace("NEXT_PUBLIC_SITE_URL=https://www.example.co.uk", `NEXT_PUBLIC_SITE_URL=${domain}`)
    .replace("info@example.co.uk", `info@${new URL(domain).hostname.replace(/^www\./, "")}`);
  // Pre-fill a random SETUP_TOKEN + ADMIN_SESSION_SECRET if still placeholder
  const rand = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  stub = stub.replace("SETUP_TOKEN=change-me-setup-token", `SETUP_TOKEN=${rand()}-${rand()}`);
  stub = stub.replace("ADMIN_SESSION_SECRET=random-32+chars-for-cookie-signing", `ADMIN_SESSION_SECRET=${rand()}${rand()}${rand()}`);
  fs.writeFileSync(envPath, stub, "utf8");
  console.log(`Wrote ${envPath} — edit DATABASE_URL, BLOB_READ_WRITE_TOKEN, SMTP_*, etc.`);
}

console.log("\nNext steps (see REPLICATION.md):");
console.log("  1. Create Neon Postgres → set DATABASE_URL in .env.local + Vercel env");
console.log("  2. Create Vercel Blob Store → set BLOB_READ_WRITE_TOKEN");
console.log("  3. Push DB: npm run db:push  (auto-migrates on first request anyway)");
console.log("  4. Deploy to Vercel and set all envs + domain → set NEXT_PUBLIC_SITE_URL");
console.log(`  5. Open ${domain.replace(/\/$/, "")}/setup?token=YOUR_SETUP_TOKEN  (use the SETUP_TOKEN from .env.local)`);
console.log("  6. Complete the 6-step wizard → Complete Setup & Launch (locks /setup)\n");

const required = ["DATABASE_URL", "NEXT_PUBLIC_SITE_URL", "BLOB_READ_WRITE_TOKEN"];
let ok = true;
for (const key of required) {
  const present = Boolean(process.env[key]) || fs.readFileSync(envPath, "utf8").includes(`${key}=`) && !fs.readFileSync(envPath, "utf8").includes(`${key}=\n`) && !fs.readFileSync(envPath, "utf8").includes(`${key}=change-me`);
  // crude check: if env file still has placeholder, warn
  const fileVal = (() => {
    try {
      const line = fs.readFileSync(envPath, "utf8").split("\n").find((l) => l.startsWith(`${key}=`));
      return line ? line.split("=").slice(1).join("=") : "";
    } catch { return ""; }
  })();
  const isPlaceholder = !fileVal || fileVal.includes("change-me") || fileVal.includes("example.co.uk") && key === "DATABASE_URL";
  if (isPlaceholder && !process.env[key]) {
    console.warn(`  ⚠ ${key} still placeholder in ${envPath} — fill it before going live.`);
    ok = false;
  }
}
if (ok) console.log("Env checks look ready (or already live). Run npm run build to verify.\n");
else console.log("\nFill the placeholders, then: npm run build && npm run dev → open /setup\n");
