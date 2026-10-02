import pg from "pg";
import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const { Pool } = pg;
let envLoaded = false;

function ensureEnvLoaded() {
  if (envLoaded) return;
  if (process.env.STUDENTHUB_HERMETIC_TEST_MODE === "1") {
    envLoaded = true;
    return;
  }
  if ((process.env.NEXT_RUNTIME || process.env.__NEXT_PROCESSED_ENV) && process.env.DATABASE_URL) {
    envLoaded = true;
    return;
  }

  const candidates = [
    join(process.cwd(), "frontend", ".env.local"),
    join(process.cwd(), ".env.local"),
    resolve(process.cwd(), "..", "frontend", ".env.local"),
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (envPath) {
    try {
      const content = readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex > 0) {
          const key = trimmed.slice(0, equalsIndex).trim();
          const value = trimmed.slice(equalsIndex + 1).trim();
          if (!process.env[key]) process.env[key] = value;
        }
      }
    } catch {
      // Match canonicalEnv: an unreadable optional local env file is ignored.
    }
  }
  envLoaded = true;
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "PostgreSQL is not configured or unavailable.") {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.code = "DATABASE_UNAVAILABLE";
  }
}

let sharedPool;

export function getPostgresPool({ loadEnv = true } = {}) {
  if (loadEnv) ensureEnvLoaded();
  // Do not import canonicalEnv here: its module initializer loads every value
  // from frontend/.env.local. Operator callers can pass loadEnv:false and an
  // explicit allowlisted DATABASE_URL without importing unrelated secrets.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseUnavailableError("DATABASE_URL is required for durable production state.");
  if (!sharedPool) {
    const configuredPoolMax = Number(process.env.DATABASE_POOL_MAX);
    const boundedPoolMax = Math.min(50, Math.max(1, Math.floor(Number.isFinite(configuredPoolMax) ? configuredPoolMax : 10)));
    const caRaw = process.env.DATABASE_SSL_CA;
    const ca = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;
    sharedPool = new Pool({
      connectionString,
      max: boundedPoolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.DATABASE_SSL === "disable"
        ? false
        : {
            rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
            ...(ca ? { ca } : {})
          },
    });
  }
  return sharedPool;
}

export async function closePostgresPoolForTests() {
  if (sharedPool) await sharedPool.end();
  sharedPool = undefined;
}
