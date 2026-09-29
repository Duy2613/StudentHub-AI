import { URL } from "node:url";
import { canonicalEnv } from "../../src/lib/server/env/canonicalEnv.js";

/**
 * Database-writing integration tests only accept loopback disposable targets,
 * or the explicitly acknowledged StudentHub staging target below. DATABASE_URL
 * alone is never a test authorization signal.
 */
export const DISPOSABLE_DB_ACK = "I_UNDERSTAND_DISPOSABLE_DB_ONLY";
export const DISPOSABLE_DB_BLOCKED = "DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV";
export const APPROVED_STAGING_PROJECT_REF = "bniwtkjtramqaozrrtrk";
export const EXPERT_STAGING_WRITE_ACK = "I_AUTHORIZE_SYNTHETIC_STAGING_WRITES";
export const EXPERT_STAGING_RUN_FLAG = "STUDENTHUB_EXPERT_STAGING_RUN";

const MAIN_DATABASE_URL = process.env.DATABASE_URL || canonicalEnv.DATABASE_URL;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function inspectPostgresTarget(value) {
  if (!value || typeof value !== "string") {
    return { valid: false, host: null, database: null, projectRef: null, isLoopback: false };
  }

  try {
    const parsed = new URL(value);
    const protocolIsPostgres = ["postgres:", "postgresql:"].includes(parsed.protocol);
    const host = parsed.hostname.toLowerCase();
    const directProjectRef = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1] || null;
    let poolerProjectRef = null;

    if (host.endsWith(".pooler.supabase.com")) {
      const usernameParts = decodeURIComponent(parsed.username).split(".");
      poolerProjectRef = usernameParts.find((part) => /^[a-z0-9]{20,}$/.test(part)) || null;
    }

    return {
      valid: protocolIsPostgres && Boolean(host),
      host,
      database: parsed.pathname.replace(/^\//, "") || null,
      projectRef: directProjectRef || poolerProjectRef,
      isLoopback: LOOPBACK_HOSTS.has(host),
    };
  } catch {
    return { valid: false, host: null, database: null, projectRef: null, isLoopback: false };
  }
}

function getApiProjectRef(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1] || null;
  } catch {
    return null;
  }
}

export function getDisposableDatabaseUrl({ envNames = ["STUDENTHUB_RLS_TEST_DATABASE_URL", "STUDENTHUB_DISPOSABLE_DATABASE_URL"] } = {}) {
  if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== DISPOSABLE_DB_ACK) return null;
  const canonicalValues = {
    STUDENTHUB_RLS_TEST_DATABASE_URL: canonicalEnv.RLS_TEST_DATABASE_URL,
  };
  const candidate = envNames.map((name) => process.env[name] || canonicalValues[name]).find(Boolean);
  const identity = inspectPostgresTarget(candidate);
  if (!identity.valid || !identity.isLoopback) return null;

  // A separately named URL that is byte-for-byte equal to the application DB
  // is still not disposable. The loopback requirement independently excludes
  // Supabase Main and arbitrary remote PostgreSQL targets.
  if (candidate === MAIN_DATABASE_URL) return null;
  return candidate;
}

export function getApprovedExpertStagingDatabaseUrl() {
  if (process.env[EXPERT_STAGING_RUN_FLAG] !== "1") return null;
  if (process.env.STUDENTHUB_EXPERT_STAGING_WRITE_ACK !== EXPERT_STAGING_WRITE_ACK) return null;

  // The bootstrap alias is set only after checking the staging .env file's DB
  // pooler identity against both the allowlisted ref and Supabase API URL.
  const candidate = process.env.STUDENTHUB_EXPERT_STAGING_DATABASE_URL;
  const identity = inspectPostgresTarget(candidate);
  if (!identity.valid || identity.projectRef !== APPROVED_STAGING_PROJECT_REF) return null;
  if (getApiProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL) !== APPROVED_STAGING_PROJECT_REF) return null;
  return candidate;
}

export function configureApprovedExpertStagingDatabase() {
  const connectionString = getApprovedExpertStagingDatabaseUrl();
  if (!connectionString) return null;
  process.env.DATABASE_URL = connectionString;
  process.env.STUDENTHUB_DATABASE_TARGET = "APPROVED_ISOLATED_STAGING";
  process.env.STUDENTHUB_EXPECTED_STAGING_PROJECT_REF = APPROVED_STAGING_PROJECT_REF;
  process.env.DATABASE_SSL = "require";
  return connectionString;
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
