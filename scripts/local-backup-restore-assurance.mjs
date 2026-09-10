import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { canonicalEnv } from "../frontend/src/lib/server/env/canonicalEnv.js";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { Pool } = require("pg");
const ACK = "I_UNDERSTAND_DISPOSABLE_DB_ONLY";
const DB_CONTAINER = "supabase_db_studenthub-local-supabase";

if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== ACK) throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV");
const sourceUrl = new URL(canonicalEnv.RLS_TEST_DATABASE_URL);
const mainUrl = new URL(canonicalEnv.DATABASE_URL);
if (!["127.0.0.1", "localhost", "::1"].includes(sourceUrl.hostname.toLowerCase()) || sourceUrl.href === mainUrl.href) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV");
}

const sourceDatabase = decodeURIComponent(sourceUrl.pathname.replace(/^\//, "")) || "postgres";
const sourcePool = new Pool({ connectionString: canonicalEnv.RLS_TEST_DATABASE_URL, max: 1, ssl: false });
const targetDatabase = `studenthub_restore_20260910_${Date.now()}`;
const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const transientAuthTables = [
  "auth.mfa_amr_claims",
  "auth.refresh_tokens",
];

function run(command, args, input = null) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

let targetCreated = false;
let targetPool = null;
try {
  await sourcePool.query(`CREATE DATABASE ${quoteIdentifier(targetDatabase)}`);
  targetCreated = true;

  const prepare = await run("docker", ["exec", DB_CONTAINER, "psql", "-U", "postgres", "-d", targetDatabase, "-v", "ON_ERROR_STOP=1", "-c", "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"]);
  if (prepare.code !== 0) throw new Error(`LOCAL_RESTORE_TARGET_PREP_FAILED:${prepare.code}:${prepare.stderr.toString("utf8").slice(0, 500)}`);

  // The Supabase realtime schema contains platform-owned functions whose
  // role-specific SET clauses cannot be restored by the local postgres role.
  // App state is fully covered by these four application/system dependency
  // schemas; realtime platform internals are exercised by the live container.
  const dump = await run("docker", [
    "exec", DB_CONTAINER, "pg_dump", "-U", "postgres", "-d", sourceDatabase,
    "--format=custom", "--no-owner", "--no-privileges",
    "--schema=auth", "--schema=public", "--schema=private", "--schema=storage",
    // Supabase Auth keeps short-lived token material separately from the
    // application identity. A recovered local run can contain orphaned rows
    // after those sessions have expired, so never make restore correctness
    // depend on replaying transient session artifacts.
    ...transientAuthTables.flatMap((table) => ["--exclude-table-data", table]),
  ]);
  if (dump.code !== 0) throw new Error(`LOCAL_BACKUP_FAILED:${dump.code}:${dump.stderr.toString("utf8").slice(0, 500)}`);
  const backupSha256 = crypto.createHash("sha256").update(dump.stdout).digest("hex");
  await mkdir("artifacts", { recursive: true });
  await writeFile("artifacts/local-supabase-backup-2026-09-10.dump", dump.stdout);
  const archiveUpload = await run("docker", ["exec", "-i", DB_CONTAINER, "sh", "-c", "cat > /tmp/studenthub-assurance.dump"], dump.stdout);
  if (archiveUpload.code !== 0) throw new Error(`LOCAL_BACKUP_ARCHIVE_UPLOAD_FAILED:${archiveUpload.code}`);

  // The default public schema already exists in a new PostgreSQL database.
  // Remove only its schema/comment TOC entries; all application objects and
  // data remain in the archive and are restored with errors still fatal.
  const toc = await run("docker", ["exec", DB_CONTAINER, "pg_restore", "--list", "/tmp/studenthub-assurance.dump"]);
  if (toc.code !== 0) throw new Error(`LOCAL_BACKUP_TOC_FAILED:${toc.code}`);
  const restoreList = toc.stdout.toString("utf8")
    .split(/\r?\n/)
    .filter((line) => !/\bSCHEMA - public\b|\bCOMMENT - SCHEMA public\b/.test(line))
    .join("\n");
  const listUpload = await run("docker", ["exec", "-i", DB_CONTAINER, "sh", "-c", "cat > /tmp/studenthub-assurance-restore.list"], Buffer.from(restoreList, "utf8"));
  if (listUpload.code !== 0) throw new Error(`LOCAL_RESTORE_LIST_UPLOAD_FAILED:${listUpload.code}`);
  const restore = await run("docker", ["exec", DB_CONTAINER, "pg_restore", "-U", "postgres", "-d", targetDatabase, "--use-list=/tmp/studenthub-assurance-restore.list", "--no-owner", "--no-privileges", "--exit-on-error", "/tmp/studenthub-assurance.dump"]);
  if (restore.code !== 0) throw new Error(`LOCAL_RESTORE_FAILED:${restore.code}:${restore.stderr.toString("utf8").slice(0, 1000)}`);

  const targetUrl = new URL(canonicalEnv.RLS_TEST_DATABASE_URL);
  targetUrl.pathname = `/${targetDatabase}`;
  targetPool = new Pool({ connectionString: targetUrl.toString(), max: 1, ssl: false });
  const identity = (await targetPool.query(`select current_database() as database, inet_server_addr()::text as server_address, inet_server_port() as server_port`)).rows[0];
  const counts = (await targetPool.query(`
    select
      (select count(*)::int from information_schema.tables where table_schema in ('public', 'private') and table_type = 'BASE TABLE') as app_tables,
      (select count(*)::int from public.trust_cases) as trust_cases,
      (select count(*)::int from public.community_contributions) as community_contributions,
      (select count(*)::int from public.expert_assessments) as expert_assessments,
      (select count(*)::int from private.integration_outbox) as integration_outbox
  `)).rows[0];
  await targetPool.end();
  targetPool = null;

  const output = {
    target: "LOCAL_DISPOSABLE_SUPABASE",
    sourceDatabase,
    restoredDatabase: identity.database,
    serverAddress: identity.server_address,
    serverPort: identity.server_port,
    backupFormat: "pg_dump_custom",
    backupBytes: dump.stdout.length,
    backupSha256,
    restoredReadback: counts,
    restorePass: Number(counts.app_tables) > 0 && Number(counts.trust_cases) > 0 && Number(counts.expert_assessments) > 0,
  };
  await writeFile("artifacts/local-supabase-backup-restore-2026-09-10.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(output, null, 2));
} finally {
  if (targetPool) await targetPool.end().catch(() => {});
  if (targetCreated) await sourcePool.query(`DROP DATABASE ${quoteIdentifier(targetDatabase)} WITH (FORCE)`).catch(() => {});
  await sourcePool.end();
}
