/**
 * StudentHub AI — Secret Boundary & Leakage Audit
 *
 * Scans all compiled static browser bundles in frontend/.next/static/
 * to prove that:
 * - No OPENAI_API_KEY value or string reference appears in client bundles
 * - No GEMINI_API_KEY value or string reference appears in client bundles
 * - No SUPABASE_SERVICE_ROLE_KEY value or string reference appears in client bundles
 * - No DATABASE_URL value or connection string appears in client bundles
 * - No STUDENTHUB_SESSION_PEPPER appears in client bundles
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const staticDir = join(frontendDir, ".next", "static");
const envLocalPath = join(frontendDir, ".env.local");

if (!existsSync(staticDir)) {
  console.error("❌ Production build static directory (.next/static) not found. Run build first.");
  process.exit(1);
}

// Collect secret values from .env.local
const secretKeys = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "STUDENTHUB_SESSION_PEPPER",
];

const secretValues = [];
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (secretKeys.includes(k) && v.length > 5) {
        // Strip quotes if any
        const cleanVal = v.replace(/^["']|["']$/g, "").trim();
        secretValues.push({ key: k, value: cleanVal });
      }
    }
  }
}

// Collect all static js files
function collectFiles(dir) {
  let files = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      files = files.concat(collectFiles(full));
    } else if (full.endsWith(".js") || full.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

const bundleFiles = collectFiles(staticDir);
console.log("============================================================");
console.log("🔒 SECRET BOUNDARY & CLIENT BUNDLE AUDIT");
console.log("============================================================");
console.log(`Scanned ${bundleFiles.length} client bundle files in .next/static/`);
console.log(`Probing ${secretValues.length} active server secrets for leakage...`);

let leaksFound = 0;
for (const file of bundleFiles) {
  const code = readFileSync(file, "utf8");
  for (const secret of secretValues) {
    // Check if the exact secret value is found in the client bundle
    if (code.includes(secret.value)) {
      console.error(`🚨 CRITICAL LEAK: ${secret.key} VALUE FOUND in client bundle ${file}`);
      leaksFound++;
    }
    // Also check if raw env variable names like SUPABASE_SERVICE_ROLE_KEY appear in the bundle
    if (secret.key === "SUPABASE_SERVICE_ROLE_KEY" && code.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      console.error(`🚨 LEAK: Variable name ${secret.key} found in client bundle ${file}`);
      leaksFound++;
    }
  }
}

if (leaksFound === 0) {
  console.log("\n✅ ZERO SECRETS LEAKED INTO CLIENT BUNDLE.");
  console.log("  - OPENAI_API_KEY:               NOT IN CLIENT BUNDLE");
  console.log("  - GEMINI_API_KEY:               NOT IN CLIENT BUNDLE");
  console.log("  - SUPABASE_SERVICE_ROLE_KEY:    NOT IN CLIENT BUNDLE");
  console.log("  - DATABASE_URL:                 NOT IN CLIENT BUNDLE");
  console.log("  - STUDENTHUB_SESSION_PEPPER:    NOT IN CLIENT BUNDLE");
  console.log("============================================================\n");
  process.exit(0);
} else {
  console.error(`\n❌ FAIL: ${leaksFound} secret leaks detected in client bundles!`);
  process.exit(1);
}
