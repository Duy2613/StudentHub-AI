/**
 * Main-cloud read-only migration preflight.
 *
 * This script intentionally contains SELECT-only SQL. It compares the local
 * candidate schema manifest with the configured DATABASE_URL target and writes
 * an aggregate artifact without printing credentials or row-level PII.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const frontendRequire = createRequire(join(frontendDir, "package.json"));
const { loadEnvConfig } = frontendRequire("@next/env");
loadEnvConfig(frontendDir);
const { Pool } = frontendRequire("pg");
const candidatePath = resolve(rootDir, "artifacts/local-supabase-schema-manifest-2026-09-10.json");
const outputPath = resolve(rootDir, "artifacts/main-cloud-readonly-preflight-2026-09-10.json");
const scopedSchemas = ["public", "private", "storage"];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const stable = (value) => JSON.stringify(value, Object.keys(value).sort());
const quoteIdent = (value) => `"${String(value).replaceAll('"', '""')}"`;
const objectKey = (row, kind) => {
  if (kind === "table") return `${row.table_schema}.${row.table_name}`;
  if (kind === "column") return `${row.table_schema}.${row.table_name}.${row.column_name}`;
  if (kind === "constraint") return `${row.schema_name}.${row.table_name}.${row.constraint_name}`;
  if (kind === "index") return `${row.schema_name}.${row.table_name}.${row.index_name}`;
  if (kind === "policy") return `${row.schema_name}.${row.table_name}.${row.policy_name}`;
  if (kind === "trigger") return `${row.table_schema}.${row.table_name}.${row.trigger_name}.${row.event_manipulation}`;
  if (kind === "routine") return `${row.schema_name}.${row.routine_name}(${row.arguments})`;
  return JSON.stringify(row);
};

function comparable(row, kind) {
  if (kind === "table") return { row_level_security: Boolean(row.row_level_security) };
  if (kind === "column") return {
    data_type: row.data_type,
    udt_schema: row.udt_schema,
    udt_name: row.udt_name,
    is_nullable: row.is_nullable,
    column_default: row.column_default,
    character_maximum_length: row.character_maximum_length,
    numeric_precision: row.numeric_precision,
    numeric_scale: row.numeric_scale,
  };
  if (kind === "constraint") return { constraint_type: row.constraint_type, definition: row.definition };
  if (kind === "index") return { is_unique: row.is_unique, is_primary: row.is_primary, definition: row.definition };
  if (kind === "policy") return {
    permissive: row.permissive,
    roles: row.roles,
    cmd: row.cmd,
    qual: row.qual,
    with_check: row.with_check,
  };
  if (kind === "trigger") return {
    event_manipulation: row.event_manipulation,
    action_timing: row.action_timing,
    action_statement: row.action_statement,
  };
  if (kind === "routine") return {
    arguments: row.arguments,
    result_type: row.result_type,
    language: row.language,
    security_definer: row.security_definer,
    definition_hash: row.definition_hash,
  };
  return row;
}

function compare(candidateRows, mainRows, kind) {
  const candidateMap = new Map(candidateRows.map((row) => [objectKey(row, kind), row]));
  const mainMap = new Map(mainRows.map((row) => [objectKey(row, kind), row]));
  const missingInMain = [...candidateMap.keys()].filter((key) => !mainMap.has(key)).sort();
  const extraOnMain = [...mainMap.keys()].filter((key) => !candidateMap.has(key)).sort();
  const changed = [...candidateMap.keys()]
    .filter((key) => mainMap.has(key))
    .filter((key) => stable(comparable(candidateMap.get(key), kind)) !== stable(comparable(mainMap.get(key), kind)))
    .sort()
    .map((key) => ({ key, candidate: comparable(candidateMap.get(key), kind), main: comparable(mainMap.get(key), kind) }));
  return {
    candidateCount: candidateRows.length,
    mainCount: mainRows.length,
    missingInMain,
    extraOnMain,
    changed,
  };
}

function migrationImpact(fileName, content) {
  const capture = (pattern) => [...content.matchAll(pattern)].map((match) => match[1] || match[0]).slice(0, 200);
  return {
    file: fileName,
    bytes: Buffer.byteLength(content),
    sha256: sha256(content),
    schemas: capture(/create\s+schema\s+if\s+not\s+exists\s+([a-z0-9_]+)/gi),
    tables: capture(/create\s+table\s+if\s+not\s+exists\s+([a-z0-9_."]+)/gi),
    addedColumns: capture(/alter\s+table\s+([a-z0-9_."]+)\s+add\s+column\s+if\s+not\s+exists\s+([a-z0-9_"]+)/gi).map((value) => value),
    indexes: capture(/create\s+(?:unique\s+)?index\s+if\s+not\s+exists\s+([a-z0-9_"]+)/gi),
    functions: capture(/create\s+or\s+replace\s+function\s+([a-z0-9_."]+)/gi),
    triggers: capture(/create\s+trigger\s+([a-z0-9_"]+)/gi),
    policies: capture(/create\s+policy\s+([a-z0-9_"]+)/gi),
    rlsEnables: (content.match(/enable\s+row\s+level\s+security/gi) || []).length,
    alterStatements: (content.match(/alter\s+table/gi) || []).length,
    dataStatements: {
      insert: (content.match(/\binsert\s+into\b/gi) || []).length,
      update: (content.match(/\bupdate\s+[a-z0-9_."]+/gi) || []).length,
      delete: (content.match(/\bdelete\s+from\b/gi) || []).length,
    },
  };
}

async function main() {
  if (!existsSync(candidatePath)) throw new Error(`Missing candidate manifest: ${candidatePath}`);
  const candidateManifest = JSON.parse(readFileSync(candidatePath, "utf8"));
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is required for read-only main preflight.");
  const parsed = new URL(rawUrl);
  const host = parsed.hostname;
  if (["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error("Refusing to label a local DATABASE_URL as main-cloud preflight.");
  }

  const caRaw = process.env.DATABASE_SSL_CA;
  const ca = caRaw ? caRaw.replace(/^['"]|['"]$/g, "").replaceAll("\\n", "\n") : undefined;
  const pool = new Pool({
    connectionString: rawUrl,
    connectionTimeoutMillis: 12000,
    ssl: process.env.DATABASE_SSL === "disable" ? false : {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(ca ? { ca } : {}),
    },
  });

  const client = await pool.connect();
  try {
    const query = (text, values = []) => client.query(text, values);
    const version = await query("select version()");
    const server = await query("select current_database(), current_user, inet_server_addr()::text, inet_server_port()");
    const schemas = await query("select schema_name from information_schema.schemata where schema_name = any($1) order by schema_name", [scopedSchemas]);
    const tables = await query(`
        select n.nspname as table_schema, c.relname as table_name, c.relrowsecurity as row_level_security
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = any($1) and c.relkind in ('r','p','v','m','f')
        order by n.nspname, c.relname
      `, [scopedSchemas]);
    const columns = await query(`
        select table_schema, table_name, ordinal_position, column_name, data_type, udt_schema,
               udt_name, is_nullable, column_default, character_maximum_length,
               numeric_precision, numeric_scale
        from information_schema.columns
        where table_schema = any($1)
        order by table_schema, table_name, ordinal_position
      `, [scopedSchemas]);
    const constraints = await query(`
        select ns.nspname as schema_name, cls.relname as table_name, con.conname as constraint_name,
               case con.contype when 'p' then 'PRIMARY KEY' when 'u' then 'UNIQUE'
                 when 'f' then 'FOREIGN KEY' when 'c' then 'CHECK' when 'x' then 'EXCLUDE'
                 else con.contype::text end as constraint_type,
               pg_get_constraintdef(con.oid, true) as definition
        from pg_constraint con
        join pg_class cls on cls.oid = con.conrelid
        join pg_namespace ns on ns.oid = cls.relnamespace
        where ns.nspname = any($1)
        order by ns.nspname, cls.relname, con.conname
      `, [scopedSchemas]);
    const indexes = await query(`
        select ns.nspname as schema_name, tbl.relname as table_name, idx.relname as index_name,
               ix.indisunique as is_unique, ix.indisprimary as is_primary,
               pg_get_indexdef(ix.indexrelid) as definition
        from pg_index ix
        join pg_class idx on idx.oid = ix.indexrelid
        join pg_class tbl on tbl.oid = ix.indrelid
        join pg_namespace ns on ns.oid = tbl.relnamespace
        where ns.nspname = any($1)
        order by ns.nspname, tbl.relname, idx.relname
      `, [scopedSchemas]);
    const policies = await query(`
        select schemaname as schema_name, tablename as table_name, policyname as policy_name,
               permissive, roles, cmd, qual, with_check
        from pg_policies where schemaname = any($1)
        order by schemaname, tablename, policyname
      `, [scopedSchemas]);
    const triggers = await query(`
        select event_object_schema as table_schema, event_object_table as table_name,
               trigger_name, event_manipulation, action_timing, action_statement
        from information_schema.triggers where event_object_schema = any($1)
        order by event_object_schema, event_object_table, trigger_name, event_manipulation
      `, [scopedSchemas]);
    const routines = await query(`
        select ns.nspname as schema_name, p.proname as routine_name,
               pg_get_function_identity_arguments(p.oid) as arguments,
               pg_get_function_result(p.oid) as result_type,
               l.lanname as language, p.prosecdef as security_definer,
               md5(pg_get_functiondef(p.oid)) as definition_hash
        from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
        join pg_language l on l.oid = p.prolang
        where ns.nspname = any($1) and p.prokind in ('f','p')
        order by ns.nspname, p.proname, arguments
      `, [scopedSchemas]);

    const mainSchema = {
      tables: tables.rows,
      columns: columns.rows,
      constraints: constraints.rows,
      indexes: indexes.rows,
      policies: policies.rows,
      triggers: triggers.rows,
      routines: routines.rows,
    };
    const localSchema = {
      tables: candidateManifest.schema.tables.filter((row) => scopedSchemas.includes(row.table_schema)),
      columns: candidateManifest.schema.columns.filter((row) => scopedSchemas.includes(row.table_schema)),
      constraints: candidateManifest.schema.constraints.filter((row) => scopedSchemas.includes(row.schema_name)),
      indexes: candidateManifest.schema.indexes.filter((row) => scopedSchemas.includes(row.schema_name)),
      policies: candidateManifest.schema.policies.filter((row) => scopedSchemas.includes(row.schema_name)),
      triggers: candidateManifest.schema.triggers
        .filter((row) => scopedSchemas.includes(row.schema_name))
        .map((row) => ({ ...row, table_schema: row.schema_name })),
      routines: candidateManifest.schema.routines
        .filter((row) => scopedSchemas.includes(row.schema_name))
        .map((row) => ({ ...row, definition_hash: md5Definition(row.definition) })),
    };

    const comparison = {};
    const propertyNames = {
      table: "tables",
      column: "columns",
      constraint: "constraints",
      index: "indexes",
      policy: "policies",
      trigger: "triggers",
      routine: "routines",
    };
    for (const kind of Object.keys(propertyNames)) {
      const property = propertyNames[kind];
      comparison[property] = compare(localSchema[property], mainSchema[property], kind);
    }

    const mainTableKeys = new Set(mainSchema.tables.map((row) => objectKey(row, "table")));
    const mainColumnKeys = new Set(mainSchema.columns.map((row) => objectKey(row, "column")));
    const rowCompatibility = [];
    const criticalTables = [
      ["public", "profiles"],
      ["public", "trust_cases"],
      ["public", "expert_assessments"],
      ["private", "expert_verifications"],
      ["private", "expert_assignments"],
      ["private", "integration_outbox"],
    ];
    for (const [schema, table] of criticalTables) {
      const tableKey = `${schema}.${table}`;
      if (!mainTableKeys.has(tableKey)) {
        rowCompatibility.push({ table: tableKey, status: "NOT_PRESENT_ON_MAIN", rowCount: 0 });
        continue;
      }
      const rowCount = await query(`select count(*)::bigint as count from ${quoteIdent(schema)}.${quoteIdent(table)}`);
      const columnRows = mainSchema.columns.filter((row) => row.table_schema === schema && row.table_name === table);
      const selectedColumns = columnRows.map((row) => row.column_name).filter((name) => [
        "status", "qualification_state", "domain_code", "expert_id", "case_id", "assignment_id",
        "verification_id", "verification_revision", "revision", "coi_declared", "coi_state",
      ].includes(name));
      const nullCounts = {};
      for (const column of selectedColumns) {
        const result = await query(`select count(*) filter (where ${quoteIdent(column)} is null)::bigint as null_count from ${quoteIdent(schema)}.${quoteIdent(table)}`);
        nullCounts[column] = Number(result.rows[0].null_count);
      }
      const distinctStates = {};
      for (const column of selectedColumns.filter((name) => ["status", "qualification_state", "domain_code", "coi_state"].includes(name))) {
        const result = await query(`select ${quoteIdent(column)}::text as value, count(*)::bigint as count from ${quoteIdent(schema)}.${quoteIdent(table)} group by ${quoteIdent(column)} order by ${quoteIdent(column)}::text limit 100`);
        distinctStates[column] = result.rows.map((row) => ({ value: row.value, count: Number(row.count) }));
      }
      const orphanedExpertRefs = schema === "private" && table === "expert_verifications" && mainColumnKeys.has("private.expert_verifications.expert_id")
        ? Number((await query(`select count(*)::bigint as count from private.expert_verifications ev left join auth.users u on u.id = ev.expert_id where u.id is null`)).rows[0].count)
        : null;
      rowCompatibility.push({ table: tableKey, status: "READ_ONLY_INSPECTED", rowCount: Number(rowCount.rows[0].count), nullCounts, distinctStates, orphanedExpertRefs });
    }

    const migrationDirectory = resolve(rootDir, "database/migrations");
    const migrationFiles = [
      "202609070001_realtime_event_log.sql",
      "202609090001_community_expert_promax.sql",
      "202609100001_expert_authority_snapshot.sql",
    ];
    const migrationImpacts = migrationFiles.map((file) => {
      const content = readFileSync(join(migrationDirectory, file), "utf8");
      return migrationImpact(file, content);
    });

    const rowCountsByTable = new Map(rowCompatibility.map((row) => [row.table, row.rowCount]));
    const missingNotNullRisks = comparison.columns.missingInMain
      .map((key) => localSchema.columns.find((row) => objectKey(row, "column") === key))
      .filter(Boolean)
      .filter((row) => rowCountsByTable.has(`${row.table_schema}.${row.table_name}`))
      .filter((row) => Number(rowCountsByTable.get(`${row.table_schema}.${row.table_name}`)) > 0)
      .filter((row) => row.is_nullable === "NO" && !row.column_default)
      .map((row) => ({ key: objectKey(row, "column"), risk: "EXISTING_ROWS_REQUIRE_BACKFILL_OR_MIGRATION_ORDERING" }));

    const output = {
      generatedAt: new Date().toISOString(),
      target: "MAIN_CLOUD_READ_ONLY",
      connection: {
        host,
        port: parsed.port || "5432",
        database: parsed.pathname.replace(/^\//, ""),
        mode: parsed.port === "6543" ? "TRANSACTION_POOLER" : "DIRECT_OR_SESSION_POOLER",
        postgresVersion: version.rows[0]?.version?.split(" on ")[0] || null,
        server: server.rows[0],
      },
      candidate: {
        target: candidateManifest.target,
        schemaFingerprint: candidateManifest.schemaFingerprint,
        schemaCounts: candidateManifest.schemaCounts,
      },
      main: {
        schemas: schemas.rows,
        objectCounts: Object.fromEntries(Object.entries(mainSchema).map(([key, rows]) => [key, rows.length])),
        schemaFingerprint: sha256(JSON.stringify(mainSchema)),
      },
      comparison,
      migrationImpacts,
      rowCompatibility,
      compatibility: {
        missingNotNullRisks,
        orphanedExpertVerificationReferences: rowCompatibility.find((row) => row.table === "private.expert_verifications")?.orphanedExpertRefs ?? null,
        status: missingNotNullRisks.length === 0 ? "NO_IMMEDIATE_NOT_NULL_BACKFILL_RISK_DETECTED" : "REVIEW_REQUIRED",
      },
      mutationGuard: {
        sqlMode: "SELECT_ONLY",
        writesAttempted: 0,
        ddlAttempted: 0,
        dmlAttempted: 0,
      },
    };

    mkdirSync(resolve(rootDir, "artifacts"), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      status: "MAIN_CLOUD_MIGRATION_PREFLIGHT_VERIFIED",
      artifact: "artifacts/main-cloud-readonly-preflight-2026-09-10.json",
      mainSchemaFingerprint: output.main.schemaFingerprint,
      missingTables: comparison.tables.missingInMain.length,
      missingColumns: comparison.columns.missingInMain.length,
      missingConstraints: comparison.constraints.missingInMain.length,
      missingIndexes: comparison.indexes.missingInMain.length,
      missingPolicies: comparison.policies.missingInMain.length,
      missingTriggers: comparison.triggers.missingInMain.length,
      missingRoutines: comparison.routines.missingInMain.length,
      rowCompatibility: output.compatibility.status,
    }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

function md5Definition(value) {
  return createHash("md5").update(String(value || "")).digest("hex");
}

main().catch((error) => {
  console.error(`MAIN_PREFLIGHT_FAILED: ${error.message}`);
  process.exitCode = 1;
});
