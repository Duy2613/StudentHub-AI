/**
 * StudentHub AI — Secret Boundary & Leakage Audit
 *
 * Scans all compiled static browser bundles in frontend/.next/static/
 * to prove that:
 * - No OPENAI_API_KEY value or string reference appears in client bundles
 * - No GEMINI_API_KEY value or string reference appears in client bundles
 * - No OPENALEX_API_KEY value or string reference appears in client bundles
 * - No OPEN_ALEX_KEY value or string reference appears in client bundles
 * - No TAVILY_API_KEY value or string reference appears in client bundles
 * - No SUPABASE_SERVICE_ROLE_KEY value or string reference appears in client bundles
 * - No SUPABASE_SECRET_KEY or SUPABASE_ACCESS_TOKEN value or string reference appears in client bundles
 * - No DATABASE_URL value or connection string appears in client bundles
 * - No STUDENTHUB_SESSION_PEPPER appears in client bundles
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const buildDir = process.env.STUDENTHUB_NEXT_DIST_DIR || ".next";
const staticDir = join(frontendDir, buildDir, "static");
const envLocalPath = join(frontendDir, ".env.local");

if (!existsSync(staticDir)) {
  console.error("❌ Production build static directory (.next/static) not found. Run build first.");
  process.exit(1);
}

// Collect secret values from .env.local
const secretKeys = [
  "OPENAI_API_KEY",
  "OPEN_AI_KEY_1",
  "GEMINI_API_KEY",
  "SIGHTENGINE_API_SECRET",
  "CAPABILITY_SECRET",
  "JWT_SECRET",
  "STUDENTHUB_LOCAL_JWT_SECRET",
  "OPENALEX_API_KEY",
  "OPEN_ALEX_KEY",
  "TAVILY_API_KEY",
  "STUDENTHUB_LABBE_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "DATABASE_URL",
  "STUDENTHUB_SESSION_PEPPER",
];

const secretValues = [];
const seenSecrets = new Set();
function addSecret(key, rawValue) {
  if (typeof rawValue !== "string") return;
  const value = rawValue.replace(/^(["'])(.*)\1$/, "$2").trim();
  if (value.length <= 5) return;
  const identity = `${key}:${value}`;
  if (seenSecrets.has(identity)) return;
  seenSecrets.add(identity);
  secretValues.push({ key, value });
}

if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (secretKeys.includes(k)) addSecret(k, v);
    }
  }
}
for (const key of secretKeys) addSecret(key, process.env[key]);

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
console.log(`Probing ${secretKeys.length} server-only identifiers and ${secretValues.length} configured secret values for leakage...`);

let leaksFound = 0;
for (const file of bundleFiles) {
  const code = readFileSync(file, "utf8");
  for (const key of secretKeys) {
    // Secret variable names are suspicious even when a local environment has
    // no value configured. Check them independently from value-based probes.
    if (code.includes(key)) {
      console.error(`🚨 LEAK: Variable name ${key} found in client bundle ${file}`);
      leaksFound++;
    }
  }
  for (const secret of secretValues) {
    // Check if the exact secret value is found in the client bundle
    if (code.includes(secret.value)) {
      console.error(`🚨 CRITICAL LEAK: ${secret.key} VALUE FOUND in client bundle ${file}`);
      leaksFound++;
    }
  }
}

if (leaksFound === 0) {
  console.log("\n✅ ZERO SECRETS LEAKED INTO CLIENT BUNDLE.");
  console.log("  - OPENAI_API_KEY:               NOT IN CLIENT BUNDLE");
  console.log("  - OPEN_AI_KEY_1:                NOT IN CLIENT BUNDLE");
  console.log("  - GEMINI_API_KEY:               NOT IN CLIENT BUNDLE");
  console.log("  - SIGHTENGINE_API_SECRET:       NOT IN CLIENT BUNDLE");
  console.log("  - CAPABILITY_SECRET:            NOT IN CLIENT BUNDLE");
  console.log("  - JWT_SECRET:                   NOT IN CLIENT BUNDLE");
  console.log("  - STUDENTHUB_LOCAL_JWT_SECRET:  NOT IN CLIENT BUNDLE");
  console.log("  - OPENALEX_API_KEY:             NOT IN CLIENT BUNDLE");
  console.log("  - OPEN_ALEX_KEY:                NOT IN CLIENT BUNDLE");
  console.log("  - TAVILY_API_KEY:               NOT IN CLIENT BUNDLE");
  console.log("  - STUDENTHUB_LABBE_TOKEN:       NOT IN CLIENT BUNDLE");
  console.log("  - SUPABASE_SERVICE_ROLE_KEY:    NOT IN CLIENT BUNDLE");
  console.log("  - SUPABASE_SECRET_KEY:          NOT IN CLIENT BUNDLE");
  console.log("  - SUPABASE_ACCESS_TOKEN:        NOT IN CLIENT BUNDLE");
  console.log("  - DATABASE_URL:                 NOT IN CLIENT BUNDLE");
  console.log("  - STUDENTHUB_SESSION_PEPPER:    NOT IN CLIENT BUNDLE");
  console.log("============================================================\n");
  process.exit(0);
} else {
  console.error(`\n❌ FAIL: ${leaksFound} secret leaks detected in client bundles!`);
  process.exit(1);
}
