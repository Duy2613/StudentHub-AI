/**
 * StudentHub AI — Safe Database & Supabase Discovery
 *
 * Reads database schema, connection mode, extensions, and tables read-only.
 * ABSOLUTELY NON-DESTRUCTIVE: no DROP, no CREATE, no INSERT, no UPDATE.
 * NEVER prints credentials.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const frontendRequire = createRequire(join(frontendDir, "package.json"));
const pg = frontendRequire("pg");
const { Pool } = pg;

const envLocalPath = join(frontendDir, ".env.local");

// Load .env.local
try {
  const nextEnvPath = join(frontendDir, "node_modules", "@next", "env");
  if (existsSync(nextEnvPath)) {
    const { loadEnvConfig } = await import(pathToFileURL(join(nextEnvPath, "index.js")).href);
    loadEnvConfig(frontendDir);
  }
} catch {}

if (!process.env.DATABASE_URL && existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

async function inspectConnection() {
  console.log("============================================================");
  console.log("🐘 SAFE DATABASE & SUPABASE CONNECTION DISCOVERY");
  console.log("============================================================");

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.log("DATABASE_URL: MISSING");
    return { status: "BLOCKED_BY_ENV", reason: "DATABASE_URL is missing" };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    console.log("DATABASE_URL: INVALID_FORMAT");
    return { status: "INVALID_FORMAT", error: e.message };
  }

  const host = parsed.hostname;
  const port = parsed.port || "5432";
  const database = parsed.pathname.replace(/^\//, "");
  const username = parsed.username ? parsed.username.slice(0, 3) + "***" : "unknown";

  let connectionMode = "UNKNOWN";
  if (port === "6543" || host.includes("pooler.supabase.com")) {
    connectionMode = "TRANSACTION_POOLER (Supavisor/PgBouncer 6543)";
  } else if (port === "5432" && host.includes("pooler.supabase.com")) {
    connectionMode = "SESSION_POOLER (Supavisor 5432)";
  } else if (port === "5432") {
    connectionMode = "DIRECT (Port 5432)";
  }

  console.log(`  Host (masked):     ${host}`);
  console.log(`  Port:              ${port}`);
  console.log(`  User (masked):     ${username}`);
  console.log(`  Database:          ${database}`);
  console.log(`  Connection Mode:   ${connectionMode}`);
  console.log(`  SSL Reject Unauth: ${process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false"}`);

  // Test PG connection
  const caRaw = process.env.DATABASE_SSL_CA;
  const caClean = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;

  const pool = new Pool({
    connectionString: rawUrl,
    connectionTimeoutMillis: 8000,
    ssl: process.env.DATABASE_SSL === "disable"
      ? false
      : {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          ...(caClean ? { ca: caClean } : {}),
        },
  });

  let pgResult = {};
  try {
    const client = await pool.connect();
    try {
      // Version
      const verRes = await client.query("SELECT version();");
      pgResult.version = verRes.rows[0]?.version;
      console.log(`\n  Postgres Version:  ${pgResult.version?.split(" on ")[0] || "Unknown"}`);

      // Server info
      const infoRes = await client.query("SELECT current_database(), current_user, inet_server_addr(), inet_server_port();");
      console.log(`  Connected DB:      ${infoRes.rows[0]?.current_database}`);
      console.log(`  Current User:      ${infoRes.rows[0]?.current_user}`);

      // Extensions
      const extRes = await client.query("SELECT extname, extversion FROM pg_extension ORDER BY extname;");
      pgResult.extensions = extRes.rows;
      console.log(`  Installed Exts:    ${extRes.rows.map(r => `${r.extname} (${r.extversion})`).join(", ")}`);

      // Schemas
      const schRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';");
      console.log(`  User Schemas:      ${schRes.rows.map(r => r.schema_name).join(", ")}`);

      // Tables in public, private, auth
      const tblRes = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'private', 'auth', 'storage') ORDER BY table_schema, table_name;");
      console.log(`  Total Tables:      ${tblRes.rows.length}`);
      const publicTables = tblRes.rows.filter(r => r.table_schema === "public").map(r => r.table_name);
      const privateTables = tblRes.rows.filter(r => r.table_schema === "private").map(r => r.table_name);
      console.log(`  Public Tables:     ${publicTables.length > 0 ? publicTables.slice(0, 10).join(", ") + (publicTables.length > 10 ? "..." : "") : "none"}`);
      console.log(`  Private Tables:    ${privateTables.length > 0 ? privateTables.slice(0, 10).join(", ") + (privateTables.length > 10 ? "..." : "") : "none"}`);

      // Advisory Lock probe
      try {
        await client.query("BEGIN;");
        await client.query("SELECT pg_advisory_xact_lock(888777);");
        await client.query("COMMIT;");
        console.log("  pg_advisory_xact_lock: SUPPORTED & WORKING");
        pgResult.advisoryLock = "SUPPORTED";
      } catch (err) {
        console.log(`  pg_advisory_xact_lock: FAILED (${err.message})`);
        pgResult.advisoryLock = "FAILED";
      }

      pgResult.status = "CONNECTED";
    } finally {
      client.release();
    }
  } catch (err) {
    console.log(`\n  Database Connection Failed: ${err.message}`);
    pgResult.status = "FAILED";
    pgResult.error = err.message;
  } finally {
    await pool.end();
  }

  // Supabase Storage & Client probe
  console.log("\n--- [SUPABASE CLIENT & STORAGE AUDIT] ---");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log("  Supabase Service Credentials: MISSING");
  } else {
    try {
      const { createClient } = await import(pathToFileURL(join(frontendDir, "node_modules", "@supabase", "supabase-js", "dist", "index.mjs")).href);
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets();
      if (bucketError) {
        console.log(`  Storage listBuckets error: ${bucketError.message}`);
      } else {
        console.log(`  Storage Accessible: YES (${buckets.length} buckets discovered)`);
        for (const b of buckets) {
          console.log(`    Bucket: '${b.name}' | Public: ${b.public} | ID: ${b.id}`);
        }
        const targetBucket = process.env.STUDENTHUB_SCREENSHOT_STORAGE_BUCKET || "trust-screenshots-private";
        const foundTarget = buckets.find(b => b.name === targetBucket);
        if (foundTarget) {
          console.log(`  Target Bucket '${targetBucket}': FOUND (isPublic=${foundTarget.public})`);
          if (!foundTarget.public) {
            console.log("  Private Storage Status: VERIFIED (Bucket is private)");
          } else {
            console.log("  WARNING: Target bucket is marked PUBLIC!");
          }
        } else {
          console.log(`  Target Bucket '${targetBucket}': NOT FOUND in existing buckets`);
        }
      }
    } catch (e) {
      console.log(`  Supabase SDK Storage test failed: ${e.message}`);
    }
  }

  console.log("\n============================================================");
  console.log(`DATABASE & SUPABASE STATUS: ${pgResult.status === "CONNECTED" ? "✅ CONNECTED & INSPECTED" : "⚠️ FAILED / BLOCKED"}`);
  console.log("============================================================\n");
}

inspectConnection().catch(err => {
  console.error("Discovery error:", err);
  process.exit(1);
});
