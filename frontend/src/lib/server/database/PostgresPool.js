import pg from "pg";

const { Pool } = pg;

export class DatabaseUnavailableError extends Error {
  constructor(message = "PostgreSQL is not configured or unavailable.") {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.code = "DATABASE_UNAVAILABLE";
  }
}

let sharedPool;

export function getPostgresPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseUnavailableError("DATABASE_URL is required for durable production state.");
  if (!sharedPool) {
    const configuredPoolMax = Number(process.env.DATABASE_POOL_MAX);
    const boundedPoolMax = Math.min(50, Math.max(1, Math.floor(Number.isFinite(configuredPoolMax) ? configuredPoolMax : 10)));
    const caRaw = process.env.DATABASE_SSL_CA;
    const ca = caRaw ? caRaw.replace(/\\n/g, "\n") : undefined;
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

export function setPostgresPoolForTests(pool) {
  sharedPool = pool;
}
