/**
 * StudentHub AI — Canonical Environment Loader (Section 5 & 6)
 *
 * Provides ONE unified, canonical environment accessor across:
 * - Next.js App Router
 * - Server actions & API route handlers
 * - Standalone Node tests & integration runners
 *
 * Guarantees that:
 * 1. Only frontend/.env.local is used as local canonical env source.
 * 2. Secrets are NEVER printed or logged.
 * 3. Server secrets cannot leak to client.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

let loaded = false;

function ensureEnvLoaded() {
  if (loaded) return;

  // If already running inside Next.js runtime with env populated
  if ((process.env.NEXT_RUNTIME || process.env.__NEXT_PROCESSED_ENV) && process.env.DATABASE_URL) {
    loaded = true;
    return;
  }

  // Standalone Node / test runners: find and load frontend/.env.local
  const candidates = [
    join(process.cwd(), "frontend", ".env.local"),
    join(process.cwd(), ".env.local"),
    resolve(process.cwd(), "..", "frontend", ".env.local"),
  ];

  let envPath = candidates.find((p) => existsSync(p));

  if (envPath) {
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  loaded = true;
}

ensureEnvLoaded();

export const canonicalEnv = {
  // Application
  NODE_ENV: process.env.NODE_ENV || "development",
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  PROVIDER_MODE: process.env.NODE_ENV === "production"
    ? "LIVE"
    : process.env.NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE || "LIVE",

  // Supabase Client (Public)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

  // Supabase Server (Private - Server Only)
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  STUDENTHUB_SESSION_PEPPER: process.env.STUDENTHUB_SESSION_PEPPER || "",

  // Postgres
  DATABASE_URL: process.env.DATABASE_URL || "",
  RLS_TEST_DATABASE_URL: process.env.STUDENTHUB_RLS_TEST_DATABASE_URL || "",

  // AI Providers (Private - Server Only)
  // OpenAI compatibility is retained for old imports, but it is intentionally
  // disabled as an active production provider for the Gemini-only release.
  OPENAI_RUNTIME: "DISABLED_INTENTIONALLY",
  OPENAI_API_KEY: process.env.OPEN_AI_KEY_1 || process.env.OPENAI_API_KEY || "",
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || ((process.env.OPEN_AI_KEY_1 || process.env.OPENAI_API_KEY) ? "https://api.openai.com/v1" : ""),
  // Retained for deployment diagnostics/backward-compatible env audits. The
  // AI Gateway catalog is authoritative and does not let this value replace
  // a route's verified model.
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",

  // One canonical Gemini secret. Model failover is per model, never per key.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || "",
  // Labbe Assurance
  LABBE_MODE: process.env.STUDENTHUB_LABBE_MODE || "SHADOW",
  LABBE_BASE_URL: process.env.STUDENTHUB_LABBE_BASE_URL || "",
  LABBE_TOKEN: process.env.STUDENTHUB_LABBE_TOKEN || "",
};
