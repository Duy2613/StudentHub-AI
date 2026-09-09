/**
 * StudentHub AI — Canonical Environment Preflight
 *
 * Checks presence and format of required/optional environment variables
 * without ever printing secret values.
 *
 * Status labels:
 *   CONFIGURED | MISSING | INVALID_FORMAT | OPTIONAL | DISABLED
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const envLocalPath = join(frontendDir, ".env.local");

// Load .env.local using @next/env
let nextEnvLoaded = false;
try {
  const nextEnvPath = join(frontendDir, "node_modules", "@next", "env");
  if (existsSync(nextEnvPath)) {
    const { loadEnvConfig } = await import(pathToFileURL(join(nextEnvPath, "index.js")).href);
    loadEnvConfig(frontendDir);
    nextEnvLoaded = true;
  }
} catch {
  // Fallback if @next/env cannot be imported directly
}

// Fallback loader if not loaded yet
if (!nextEnvLoaded && existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

function checkVar(name, { required = false, isUrl = false, formatRegex = null } = {}) {
  const val = process.env[name];
  if (val === undefined || val === "") {
    return required ? "MISSING" : "OPTIONAL";
  }
  if (isUrl) {
    try {
      new URL(val);
      return "CONFIGURED";
    } catch {
      return "INVALID_FORMAT";
    }
  }
  if (formatRegex && !formatRegex.test(val)) {
    return "INVALID_FORMAT";
  }
  return "CONFIGURED";
}

// Check custom model
function checkCustomModel() {
  const modelRegistryPath = join(rootDir, "ai", "models", "model_registry.json");
  const modelWeightsPath = join(frontendDir, "src", "lib", "ai-trust", "models", "multilabel_trained_weights.js");
  const modelRuntimePath = join(frontendDir, "src", "lib", "ai-trust", "models", "StudentHubMultiLabelNeuralModel.js");
  if (existsSync(modelRegistryPath) && existsSync(modelWeightsPath) && existsSync(modelRuntimePath)) {
    return "CONFIGURED";
  }
  return "MISSING";
}

const categories = {
  "APP": [
    { name: "NODE_ENV", status: checkVar("NODE_ENV", { required: false }) },
    { name: "NEXT_PUBLIC_API_URL", status: checkVar("NEXT_PUBLIC_API_URL", { isUrl: true }) },
    { name: "NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE", status: checkVar("NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE") },
    { name: "NEXT_PUBLIC_COMPETITION_DEMO", status: checkVar("NEXT_PUBLIC_COMPETITION_DEMO") },
  ],
  "SUPABASE CLIENT": [
    { name: "NEXT_PUBLIC_SUPABASE_URL", status: checkVar("NEXT_PUBLIC_SUPABASE_URL", { required: true, isUrl: true }) },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: checkVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", { required: true }) },
    { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", status: checkVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") },
    { name: "NEXT_PUBLIC_SUPABASE_EMAIL_PASSWORD_AUTH", status: checkVar("NEXT_PUBLIC_SUPABASE_EMAIL_PASSWORD_AUTH") },
    { name: "NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH", status: checkVar("NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH") },
  ],
  "SUPABASE SERVER": [
    { name: "SUPABASE_URL", status: process.env.SUPABASE_URL ? checkVar("SUPABASE_URL", { isUrl: true }) : checkVar("NEXT_PUBLIC_SUPABASE_URL", { isUrl: true }) },
    { name: "SUPABASE_SERVICE_ROLE_KEY", status: checkVar("SUPABASE_SERVICE_ROLE_KEY", { required: true }) },
    { name: "SUPABASE_JWT_AUDIENCE", status: checkVar("SUPABASE_JWT_AUDIENCE") },
    { name: "STUDENTHUB_SESSION_PEPPER", status: checkVar("STUDENTHUB_SESSION_PEPPER", { required: true }) },
  ],
  "POSTGRES DATABASE": [
    { name: "DATABASE_URL", status: checkVar("DATABASE_URL", { required: true }) },
    { name: "DATABASE_SSL_REJECT_UNAUTHORIZED", status: checkVar("DATABASE_SSL_REJECT_UNAUTHORIZED") },
    { name: "DATABASE_SSL_CA", status: checkVar("DATABASE_SSL_CA") },
  ],
  "RLS DISPOSABLE DB": [
    { name: "STUDENTHUB_RLS_TEST_DATABASE_URL", status: checkVar("STUDENTHUB_RLS_TEST_DATABASE_URL", { required: false }) },
  ],
  "PRIVATE STORAGE": [
    { name: "STUDENTHUB_SCREENSHOT_STORAGE_BUCKET", status: checkVar("STUDENTHUB_SCREENSHOT_STORAGE_BUCKET") },
    { name: "STUDENTHUB_READINESS_REQUIRE_SCREENSHOT_STORAGE", status: checkVar("STUDENTHUB_READINESS_REQUIRE_SCREENSHOT_STORAGE") },
  ],
  "OPENAI": [
    { name: "OPENAI_API_KEY", status: checkVar("OPENAI_API_KEY", { required: false }) },
    { name: "OPENAI_BASE_URL", status: checkVar("OPENAI_BASE_URL", { isUrl: true, required: false }) },
    { name: "OPENAI_MODEL", status: checkVar("OPENAI_MODEL", { required: false }) },
  ],
  "GEMINI": [
    { name: "GEMINI_API_KEY", status: checkVar("GEMINI_API_KEY", { required: false }) },
    { name: "GEMINI_MODEL", status: checkVar("GEMINI_MODEL", { required: false }) },
  ],
  "OTHER AI PROVIDERS": [
    { name: "ANTHROPIC_API_KEY", status: checkVar("ANTHROPIC_API_KEY", { required: false }) },
    { name: "GROQ_API_KEY", status: checkVar("GROQ_API_KEY", { required: false }) },
    { name: "MISTRAL_API_KEY", status: checkVar("MISTRAL_API_KEY", { required: false }) },
  ],
  "CUSTOM MODEL": [
    { name: "CUSTOM_MODEL_RUNTIME", status: checkCustomModel() },
    { name: "CUSTOM_MODEL_WEIGHTS", status: existsSync(join(frontendDir, "src", "lib", "ai-trust", "models", "multilabel_trained_weights.js")) ? "CONFIGURED" : "MISSING" },
  ],
  "SEARCH / RETRIEVAL PROVIDER": [
    { name: "STUDENTHUB_LAYER2_BASE_URL", status: checkVar("STUDENTHUB_LAYER2_BASE_URL", { isUrl: true, required: false }) },
    { name: "GENSPARK_AIDRIVE_ENABLED", status: process.env.GENSPARK_AIDRIVE_ENABLED === "true" ? "CONFIGURED" : "DISABLED" },
  ],
  "STAGING": [
    { name: "STUDENTHUB_STAGING_BASE_URL", status: checkVar("STUDENTHUB_STAGING_BASE_URL", { isUrl: true, required: false }) },
    { name: "STUDENTHUB_STAGING_CASES_PATH", status: checkVar("STUDENTHUB_STAGING_CASES_PATH", { required: false }) },
    { name: "STUDENTHUB_STAGING_STORAGE_STATE", status: checkVar("STUDENTHUB_STAGING_STORAGE_STATE", { required: false }) },
  ],
  "LABBE": [
    { name: "STUDENTHUB_LABBE_MODE", status: process.env.STUDENTHUB_LABBE_MODE ? (process.env.STUDENTHUB_LABBE_MODE === "DISABLED" ? "DISABLED" : "CONFIGURED") : "DISABLED" },
    { name: "STUDENTHUB_LABBE_BASE_URL", status: checkVar("STUDENTHUB_LABBE_BASE_URL", { isUrl: true, required: false }) },
    { name: "STUDENTHUB_LABBE_TOKEN", status: checkVar("STUDENTHUB_LABBE_TOKEN", { required: false }) },
    { name: "STUDENTHUB_LABBE_SCOPE", status: checkVar("STUDENTHUB_LABBE_SCOPE", { required: false }) },
    { name: "STUDENTHUB_LABBE_TEST_DATABASE_URL", status: checkVar("STUDENTHUB_LABBE_TEST_DATABASE_URL", { required: false }) },
  ],
  "OBSERVABILITY": [
    { name: "DEBUG_SECURITY", status: checkVar("DEBUG_SECURITY") },
  ],
};

console.log("============================================================");
console.log("🔍 STUDENTHUB ENVIRONMENT PREFLIGHT REPORT");
console.log("============================================================");
console.log(`Env File: ${existsSync(envLocalPath) ? "frontend/.env.local (FOUND)" : "MISSING"}`);
console.log(`Loader:   ${nextEnvLoaded ? "@next/env (CANONICAL)" : "fallback"}`);
console.log("------------------------------------------------------------");

let hasErrors = false;
for (const [category, vars] of Object.entries(categories)) {
  console.log(`\n[${category}]`);
  for (const v of vars) {
    const paddedName = v.name.padEnd(45, " ");
    console.log(`  ${paddedName} : ${v.status}`);
    if (v.status === "INVALID_FORMAT") hasErrors = true;
  }
}

console.log("\n============================================================");
console.log(`SUMMARY: ${hasErrors ? "⚠️  PREFLIGHT COMPLETED WITH FORMAT ISSUES" : "✅ PREFLIGHT COMPLETED SAFELY (NO SECRETS EXPOSED)"}`);
console.log("============================================================\n");
