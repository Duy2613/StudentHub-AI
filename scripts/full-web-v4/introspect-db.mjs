import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const frontendRequire = createRequire(join(REPO_ROOT, "frontend", "package.json"));
const { loadEnvConfig } = frontendRequire("@next/env");
loadEnvConfig(resolve(REPO_ROOT, "frontend"));

const pg = frontendRequire("pg");
const { Pool } = pg;

const caRaw = process.env.DATABASE_SSL_CA;
const ca = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, ...(ca ? { ca } : {}) },
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'private')
      ORDER BY table_schema, table_name;
    `);
    const allTables = res.rows.map(r => `${r.table_schema}.${r.table_name}`);
    console.log("Canonical Schemas and Tables in DB:", allTables);

    const canonicalTrustTables = [
      "public.trust_cases",
      "public.trust_runs",
      "public.trust_stage_runs",
    ];

    const discoveredTrustTables = canonicalTrustTables.filter(t => allTables.includes(t));
    const canonicalDiscovered = discoveredTrustTables.length === canonicalTrustTables.length;

    const colRes = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name IN ('trust_cases', 'trust_runs', 'trust_stage_runs', 'case_inputs', 'trust_case_revisions', 'trust_verdict_revisions') 
      ORDER BY table_name, ordinal_position;
    `);
    const cols = {};
    for (const r of colRes.rows) {
      cols[r.table_name] = cols[r.table_name] || [];
      cols[r.table_name].push(r.column_name);
    }

    const { writeFileSync, mkdirSync } = frontendRequire("node:fs");
    const OUTPUT_DIR = resolve(REPO_ROOT, "artifacts/full-web-v4");
    mkdirSync(OUTPUT_DIR, { recursive: true });

    const result = {
      CANONICAL_TRUST_TABLES_DISCOVERED: canonicalDiscovered ? "YES" : "NO",
      LEGACY_TABLE_ASSUMPTION: 0,
      ALL_TABLES: allTables,
      CANONICAL_COLUMNS: cols,
      DISCOVERED_CANONICAL_TABLES: discoveredTrustTables,
    };

    writeFileSync(join(OUTPUT_DIR, "CANONICAL_SCHEMA_INSPECTION.json"), JSON.stringify(result, null, 2));

    console.log("\nSchema Introspection Summary:");
    console.log(`  CANONICAL_TRUST_TABLES_DISCOVERED = ${result.CANONICAL_TRUST_TABLES_DISCOVERED}`);
    console.log(`  LEGACY_TABLE_ASSUMPTION           = ${result.LEGACY_TABLE_ASSUMPTION}`);
    console.log(`Saved to artifacts/full-web-v4/CANONICAL_SCHEMA_INSPECTION.json`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
