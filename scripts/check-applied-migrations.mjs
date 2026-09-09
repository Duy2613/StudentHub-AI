import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const frontendRequire = createRequire(join(frontendDir, "package.json"));
const { loadEnvConfig } = frontendRequire("@next/env");
loadEnvConfig(frontendDir);

const pg = frontendRequire("pg");
const { Pool } = pg;

const caRaw = process.env.DATABASE_SSL_CA;
const ca = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
});

async function main() {
  const client = await pool.connect();
  try {
    // Check schema_migrations
    const migRes = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'schema_migrations';");
    console.log("schema_migrations table found:", migRes.rows);
    if (migRes.rows.length > 0) {
      const s = migRes.rows[0].table_schema;
      const records = await client.query(`SELECT * FROM "${s}".schema_migrations ORDER BY version;`);
      console.log("Applied migration versions:", records.rows.map(r => r.version));
    }

    // Check presence of tables from each migration
    const checks = [
      { name: "v2_authority", table: "public.case_inputs" },
      { name: "feature_freeze", table: "public.decision_scenarios" },
      { name: "private_storage", table: "private.trust_evidence_files" },
      { name: "expert_qualification", table: "private.expert_verifications" },
      { name: "integration_outbox", table: "private.integration_outbox" },
      { name: "trust_runs_revisions", table: "public.case_runs" },
      { name: "reports", table: "private.report_jobs" },
      { name: "realtime_event_log", table: "private.realtime_events" },
      { name: "community_expert_promax", table: "private.community_contributions" },
    ];

    console.log("\nTable existence verification:");
    for (const c of checks) {
      const [schema, tbl] = c.table.split(".");
      const q = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2;",
        [schema, tbl]
      );
      const exists = q.rows.length > 0;
      console.log(`  ${c.name.padEnd(25)} (${c.table.padEnd(35)}): ${exists ? "EXISTS" : "NOT_FOUND"}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Migration check failed:", err.message);
  process.exit(1);
});
