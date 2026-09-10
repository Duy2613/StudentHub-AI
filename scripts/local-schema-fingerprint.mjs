import crypto from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { canonicalEnv } from "../frontend/src/lib/server/env/canonicalEnv.js";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { Pool } = require("pg");
const ACK = "I_UNDERSTAND_DISPOSABLE_DB_ONLY";

if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== ACK) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV");
}

const testUrl = new URL(canonicalEnv.RLS_TEST_DATABASE_URL);
const mainUrl = new URL(canonicalEnv.DATABASE_URL);
if (!["127.0.0.1", "localhost", "::1"].includes(testUrl.hostname.toLowerCase()) || testUrl.href === mainUrl.href) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV");
}

const pool = new Pool({ connectionString: canonicalEnv.RLS_TEST_DATABASE_URL, max: 1, ssl: false });
const query = async (text, values = []) => (await pool.query(text, values)).rows;

try {
  const identity = (await query(`
    select current_database() as database,
           inet_server_addr()::text as server_address,
           inet_server_port() as server_port,
           current_user as database_user,
           version() as postgres_version
  `))[0];

  const tableRows = await query(`
    select table_schema, table_name, (
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = t.table_schema and c.relname = t.table_name
    ) as row_level_security
    from information_schema.tables t
    where (table_schema in ('public', 'private')
       or (table_schema = 'storage' and table_name in ('buckets', 'objects')))
      and table_type = 'BASE TABLE'
    order by table_schema, table_name
  `);
  const columnRows = await query(`
    select table_schema, table_name, ordinal_position, column_name, data_type,
           udt_schema, udt_name, is_nullable, column_default, character_maximum_length,
           numeric_precision, numeric_scale
    from information_schema.columns
    where table_schema in ('public', 'private')
       or (table_schema = 'storage' and table_name in ('buckets', 'objects'))
    order by table_schema, table_name, ordinal_position
  `);
  const constraintRows = await query(`
    select n.nspname as schema_name, c.relname as table_name, con.conname as constraint_name,
           case con.contype when 'p' then 'PRIMARY KEY' when 'u' then 'UNIQUE'
             when 'f' then 'FOREIGN KEY' when 'c' then 'CHECK' when 'x' then 'EXCLUSION'
             else con.contype::text end as constraint_type,
           pg_get_constraintdef(con.oid, true) as definition
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
       or (n.nspname = 'storage' and c.relname in ('buckets', 'objects'))
    order by schema_name, table_name, constraint_name
  `);
  const indexRows = await query(`
    select n.nspname as schema_name, t.relname as table_name, i.relname as index_name,
           ix.indisunique as is_unique, ix.indisprimary as is_primary,
           pg_get_indexdef(ix.indexrelid) as definition
    from pg_index ix
    join pg_class i on i.oid = ix.indexrelid
    join pg_class t on t.oid = ix.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname in ('public', 'private')
       or (n.nspname = 'storage' and t.relname in ('buckets', 'objects'))
    order by schema_name, table_name, index_name
  `);
  const policyRows = await query(`
    select schemaname as schema_name, tablename as table_name, policyname as policy_name,
           permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname in ('public', 'private', 'storage')
      and (schemaname <> 'storage' or tablename in ('buckets', 'objects'))
    order by schema_name, table_name, policy_name
  `);
  const triggerRows = await query(`
    select event_object_schema as schema_name, event_object_table as table_name,
           trigger_name, event_manipulation, action_timing, action_statement
    from information_schema.triggers
    where event_object_schema in ('public', 'private')
       or (event_object_schema = 'storage' and event_object_table in ('buckets', 'objects'))
    order by schema_name, table_name, trigger_name, event_manipulation
  `);
  const routineRows = await query(`
    select n.nspname as schema_name, p.proname as routine_name,
           pg_get_function_identity_arguments(p.oid) as arguments,
           pg_get_function_result(p.oid) as result_type,
           l.lanname as language, p.prosecdef as security_definer,
           pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
    where n.nspname in ('public', 'private')
    order by schema_name, routine_name, arguments
  `);

  const migrationDirectory = join(process.cwd(), "database", "migrations");
  const migrationFiles = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  const migrations = [];
  for (const name of migrationFiles) {
    const content = await readFile(join(migrationDirectory, name));
    migrations.push({ name, bytes: content.length, sha256: crypto.createHash("sha256").update(content).digest("hex") });
  }

  const schema = {
    tables: tableRows,
    columns: columnRows,
    constraints: constraintRows,
    indexes: indexRows,
    policies: policyRows,
    triggers: triggerRows,
    routines: routineRows
  };
  const canonical = JSON.stringify(schema);
  const output = {
    generatedAt: new Date().toISOString(),
    target: "LOCAL_DISPOSABLE_SUPABASE",
    identity: {
      database: identity.database,
      serverAddress: identity.server_address,
      serverPort: identity.server_port,
      databaseUser: identity.database_user,
      postgresMajor: String(identity.postgres_version).match(/PostgreSQL (\d+)/)?.[1] ?? "unknown"
    },
    migrations,
    schemaFingerprint: crypto.createHash("sha256").update(canonical).digest("hex"),
    schemaCounts: {
      tables: tableRows.length,
      columns: columnRows.length,
      constraints: constraintRows.length,
      indexes: indexRows.length,
      policies: policyRows.length,
      triggers: triggerRows.length,
      routines: routineRows.length
    },
    schema
  };
  await mkdir("artifacts", { recursive: true });
  await writeFile("artifacts/local-supabase-schema-manifest-2026-09-10.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    target: output.target,
    database: output.identity.database,
    serverAddress: output.identity.serverAddress,
    serverPort: output.identity.serverPort,
    migrationCount: migrations.length,
    schemaFingerprint: output.schemaFingerprint,
    schemaCounts: output.schemaCounts
  }, null, 2));
} finally {
  await pool.end();
}
