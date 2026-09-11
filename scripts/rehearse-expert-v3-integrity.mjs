import crypto from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getLocalSupabaseRuntime } from "./local-supabase-runtime.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(resolve(repoRoot, "frontend", "package.json"));
const pg = require("pg");
const DB_CONTAINER = "supabase_db_studenthub-local-supabase";
const DISPOSABLE_ACK = "I_UNDERSTAND_DISPOSABLE_DB_ONLY";

if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== DISPOSABLE_ACK) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV");
}

const runtime = getLocalSupabaseRuntime();
const sourceUrl = new URL(runtime.dbUrl);
const mainUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
if (!new Set(["127.0.0.1", "localhost", "::1"]).has(sourceUrl.hostname.toLowerCase())) throw new Error("LOCAL_REHEARSAL_DATABASE_NOT_LOOPBACK");
if (mainUrl && mainUrl.href === sourceUrl.href) throw new Error("LOCAL_REHEARSAL_DATABASE_COLLIDES_WITH_MAIN");

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function run(command, args, input = null) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code, signal) => resolvePromise({ code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }));
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function loadMigrations() {
  const migrationDir = resolve(repoRoot, "database", "migrations");
  const names = (await readdir(migrationDir))
    .filter((name) => /^\d+_.+\.sql$/i.test(name))
    .sort();
  return Promise.all(names.map(async (name) => ({ name, sql: await readFile(resolve(migrationDir, name), "utf8") })));
}

async function createPlatformReadyDatabase(adminPool, databaseName, platformDump, platformHelpers) {
  await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  const prepare = await run("docker", [
    "exec", DB_CONTAINER, "psql", "-U", "postgres", "-d", databaseName,
    "-v", "ON_ERROR_STOP=1",
    "-c", "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";",
  ]);
  if (prepare.code !== 0) throw new Error(`REHEARSAL_TARGET_PREP_FAILED:${prepare.stderr.toString("utf8").slice(0, 1000)}`);
  const helperRestore = await run(
    "docker",
    ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", databaseName, "-v", "ON_ERROR_STOP=1"],
    Buffer.from(platformHelpers, "utf8")
  );
  if (helperRestore.code !== 0) throw new Error(`REHEARSAL_PLATFORM_HELPER_RESTORE_FAILED:${helperRestore.stderr.toString("utf8").slice(0, 1600)}`);
  const restore = await run("docker", ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", databaseName, "-v", "ON_ERROR_STOP=1"], platformDump);
  if (restore.code !== 0) throw new Error(`REHEARSAL_PLATFORM_SCHEMA_RESTORE_FAILED:${restore.stderr.toString("utf8").slice(0, 1600)}`);
}

function targetConnectionString(databaseName) {
  const target = new URL(runtime.dbUrl);
  target.pathname = `/${databaseName}`;
  return target.toString();
}

async function applyMigrations(pool, migrations, startIndex = 0) {
  for (let index = startIndex; index < migrations.length; index += 1) {
    await pool.query(migrations[index].sql);
  }
}

async function seedOldLikeProjection(pool) {
  const userId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  await pool.query(
    "insert into auth.users(id,aud,role,email,created_at,updated_at) values($1,$2,$2,$3,now(),now())",
    [userId, "authenticated", `f2-old-like-${userId}@example.test`]
  );
  await pool.query(
    "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,$3,$4)",
    [caseId, userId, "INSUFFICIENT_EVIDENCE", "PUBLIC"]
  );
  await pool.query(
    "insert into public.expert_progression_projections(user_id,domain_code,adjudicated_count) values($1,$2,$3)",
    [userId, "GENERAL", 4]
  );
  await pool.query(
    "insert into public.community_perception_votes(user_id,case_id,case_revision,target_type,vote) values($1,$2,1,$3,$4)",
    [userId, caseId, "CASE", "BELIEVE"]
  );
  return { userId, caseId };
}

async function schemaFingerprint(pool) {
  const [columns, constraints, indexes, rls, policies, grants] = await Promise.all([
    pool.query(`
      select table_schema, table_name, column_name, ordinal_position, data_type,
             is_nullable, column_default
        from information_schema.columns
       where table_schema in ('public','private')
       order by table_schema, table_name, ordinal_position`),
    pool.query(`
      select n.nspname as schema_name, c.relname as table_name, con.conname,
             con.contype, pg_get_constraintdef(con.oid) as definition
        from pg_constraint con
        join pg_class c on c.oid = con.conrelid
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname in ('public','private')
       order by n.nspname, c.relname, con.conname`),
    pool.query(`
      select schemaname, tablename, indexname, indexdef
        from pg_indexes
       where schemaname in ('public','private')
       order by schemaname, tablename, indexname`),
    pool.query(`
      select n.nspname as schema_name, c.relname as table_name,
             c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname in ('public','private') and c.relkind = 'r'
       order by n.nspname, c.relname`),
    pool.query(`
      select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        from pg_policies
       where schemaname in ('public','private')
       order by schemaname, tablename, policyname`),
    pool.query(`
      select table_schema, table_name, grantee, privilege_type
        from information_schema.role_table_grants
       where table_schema in ('public','private')
         and grantee in ('anon','authenticated','service_role')
       order by table_schema, table_name, grantee, privilege_type`),
  ]);
  const value = {
    columns: columns.rows,
    constraints: constraints.rows,
    indexes: indexes.rows,
    rls: rls.rows,
    policies: policies.rows,
    grants: grants.rows,
  };
  const digest = crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
  return { digest, value };
}

async function verifySpoofBoundary(pool) {
  const userId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  let directDenied = false;
  let serviceFlag = null;
  await pool.query("begin");
  try {
    await pool.query(
      "insert into auth.users(id,aud,role,email,created_at,updated_at) values($1,$2,$2,$3,now(),now())",
      [userId, "authenticated", `f2-spoof-${userId}@example.test`]
    );
    await pool.query(
      "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,$3,$4)",
      [caseId, userId, "INSUFFICIENT_EVIDENCE", "PUBLIC"]
    );
    await pool.query("set local role authenticated");
    await pool.query("select set_config($1,$2,true)", ["request.jwt.claim.sub", userId]);
    try {
      await pool.query(
        "insert into public.community_perception_votes(user_id,case_id,case_revision,target_type,vote,voter_is_expert_at_vote) values($1,$2,1,$3,$4,true)",
        [userId, caseId, "CASE", "BELIEVE"]
      );
    } catch (error) {
      directDenied = error.code === "42501" || /permission denied/i.test(error.message);
    }
    await pool.query("rollback");
  } catch (error) {
    await pool.query("rollback").catch(() => {});
    throw error;
  }

  await pool.query("begin");
  try {
    await pool.query(
      "insert into auth.users(id,aud,role,email,created_at,updated_at) values($1,$2,$2,$3,now(),now())",
      [userId, "authenticated", `f2-spoof-service-${userId}@example.test`]
    );
    await pool.query(
      "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,$3,$4)",
      [caseId, userId, "INSUFFICIENT_EVIDENCE", "PUBLIC"]
    );
    await pool.query("set local role service_role");
    const inserted = await pool.query(
      "insert into public.community_perception_votes(user_id,case_id,case_revision,target_type,vote,voter_is_expert_at_vote) values($1,$2,1,$3,$4,true) returning voter_is_expert_at_vote",
      [userId, caseId, "CASE", "BELIEVE"]
    );
    serviceFlag = inserted.rows[0]?.voter_is_expert_at_vote ?? null;
    await pool.query("rollback");
  } catch (error) {
    await pool.query("rollback").catch(() => {});
    throw error;
  }
  return { directAuthenticatedInsertDenied: directDenied, serviceRoleFlagAfterTrigger: serviceFlag };
}

const migrations = await loadMigrations();
if (migrations.length < 12 || !migrations.at(-1).name.includes("202609110002")) throw new Error("REHEARSAL_MIGRATION_SET_INCOMPLETE");
const sourceDatabase = decodeURIComponent(sourceUrl.pathname.replace(/^\//, "")) || "postgres";
const adminPool = new pg.Pool({ connectionString: runtime.dbUrl, max: 1, ssl: false });
const databaseA = `studenthub_f2_rc_a_${Date.now()}`;
const databaseB = `studenthub_f2_rc_b_${Date.now()}`;
let poolA;
let poolB;
try {
  const dump = await run("docker", [
    "exec", DB_CONTAINER, "pg_dump", "-U", "postgres", "-d", sourceDatabase,
    "--schema-only", "--no-owner", "--no-privileges", "--schema=auth", "--schema=storage",
  ]);
  if (dump.code !== 0) throw new Error(`REHEARSAL_PLATFORM_SCHEMA_DUMP_FAILED:${dump.stderr.toString("utf8").slice(0, 1600)}`);
  const helperRows = await adminPool.query(
    "select pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=$1 and p.proname=$2",
    ["public", "handle_new_user_v2"]
  );
  if (!helperRows.rows[0]?.definition) throw new Error("REHEARSAL_PLATFORM_HELPER_MISSING");
  await createPlatformReadyDatabase(adminPool, databaseA, dump.stdout, helperRows.rows[0].definition);
  await createPlatformReadyDatabase(adminPool, databaseB, dump.stdout, helperRows.rows[0].definition);
  poolA = new pg.Pool({ connectionString: targetConnectionString(databaseA), max: 1, ssl: false });
  poolB = new pg.Pool({ connectionString: targetConnectionString(databaseB), max: 1, ssl: false });

  await applyMigrations(poolA, migrations.slice(0, -1), 0);
  const oldLikeFixture = await seedOldLikeProjection(poolA);
  await applyMigrations(poolA, migrations, migrations.length - 1);
  await applyMigrations(poolB, migrations, 0);

  const fingerprintA = await schemaFingerprint(poolA);
  const fingerprintB = await schemaFingerprint(poolB);
  if (fingerprintA.digest !== fingerprintB.digest) throw new Error(`REHEARSAL_FINGERPRINT_MISMATCH:${fingerprintA.digest}:${fingerprintB.digest}`);
  const oldLikeReadback = (await poolA.query(
    "select user_id, domain_code, adjudicated_count from public.expert_progression_projections where user_id=$1",
    [oldLikeFixture.userId]
  )).rows;
  const spoofBoundary = await verifySpoofBoundary(poolB);
  if (!spoofBoundary.directAuthenticatedInsertDenied || spoofBoundary.serviceRoleFlagAfterTrigger !== false) {
    throw new Error("REHEARSAL_SPOOF_BOUNDARY_FAILED");
  }

  const result = {
    verdict: "F2_DISPOSABLE_MIGRATION_REHEARSAL_VERIFIED",
    sourceDatabase,
    oldLikeDatabase: databaseA,
    cleanDatabase: databaseB,
    migrationCount: migrations.length,
    migrations: migrations.map(({ name }) => name),
    oldLikeFixtureReadback: oldLikeReadback,
    schemaFingerprint: fingerprintA.digest,
    cleanSchemaFingerprint: fingerprintB.digest,
    fingerprintSections: Object.fromEntries(Object.entries(fingerprintA.value).map(([key, rows]) => [key, rows.length])),
    spoofBoundary,
  };
  console.log(JSON.stringify(result, null, 2));
} finally {
  await poolA?.end().catch(() => {});
  await poolB?.end().catch(() => {});
  await adminPool.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseA)} WITH (FORCE)`).catch(() => {});
  await adminPool.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseB)} WITH (FORCE)`).catch(() => {});
  await adminPool.end();
}
