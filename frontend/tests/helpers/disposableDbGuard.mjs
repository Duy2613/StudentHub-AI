import { URL } from "node:url";
import { canonicalEnv } from "../../src/lib/server/env/canonicalEnv.js";

/**
 * Mutation tests must opt into a database that is explicitly disposable.
 * DATABASE_URL is intentionally never accepted as the test target because
 * the application environment may load the owner's Supabase project from
 * .env.local.
 */
export const DISPOSABLE_DB_ACK = "I_UNDERSTAND_DISPOSABLE_DB_ONLY";
export const DISPOSABLE_DB_BLOCKED = "DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV";
const MAIN_DATABASE_URL = process.env.DATABASE_URL || canonicalEnv.DATABASE_URL;

function isUsableDatabaseUrl(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return ["postgres:", "postgresql:"].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function getDisposableDatabaseUrl({ envNames = ["STUDENTHUB_RLS_TEST_DATABASE_URL", "STUDENTHUB_DISPOSABLE_DATABASE_URL"] } = {}) {
  if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== DISPOSABLE_DB_ACK) return null;
  const canonicalValues = {
    STUDENTHUB_RLS_TEST_DATABASE_URL: canonicalEnv.RLS_TEST_DATABASE_URL,
  };
  const candidate = envNames.map((name) => process.env[name] || canonicalValues[name]).find(Boolean);
  if (!isUsableDatabaseUrl(candidate)) return null;

  // A separately named URL that is byte-for-byte equal to DATABASE_URL is
  // still not a disposable target. Refuse it rather than trusting the label.
  if (process.env.DATABASE_URL && candidate === process.env.DATABASE_URL && candidate === MAIN_DATABASE_URL) return null;
  return candidate;
}

export function configureDisposableDatabase(options = {}) {
  const connectionString = getDisposableDatabaseUrl(options);
  if (!connectionString) return null;
  process.env.DATABASE_URL = connectionString;
  process.env.STUDENTHUB_DATABASE_TARGET = "DISPOSABLE_TEST_ONLY";
  process.env.DATABASE_SSL = "disable";
  return connectionString;
}

export function disposableLiveGate(options = {}) {
  return {
    skip: !getDisposableDatabaseUrl(options) && DISPOSABLE_DB_BLOCKED,
  };
}
