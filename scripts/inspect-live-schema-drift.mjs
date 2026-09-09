import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";
import fs from "fs";
import path from "path";

async function inspectSchemaDrift() {
  console.log("============================================================");
  console.log("🔍 COMPREHENSIVE LIVE SCHEMA DRIFT ANALYSIS");
  console.log("============================================================");

  let pool;
  try {
    pool = getPostgresPool();
  } catch (err) {
    console.error("Failed to initialize PostgresPool:", err.message);
    process.exit(1);
  }

  // 1. Query all tables in public and private schemas
  const tableRes = await pool.query(`
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'private')
    ORDER BY table_schema, table_name;
  `);

  console.log(`\nFound ${tableRes.rows.length} tables/views in public and private schemas.`);

  const actualTables = new Set(tableRes.rows.map(r => `${r.table_schema}.${r.table_name}`));

  // 2. Query RLS enabled tables
  const rlsRes = await pool.query(`
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname IN ('public', 'private')
    ORDER BY schemaname, tablename;
  `);
  const rlsMap = new Map();
  rlsRes.rows.forEach(r => rlsMap.set(`${r.schemaname}.${r.tablename}`, r.rowsecurity));

  // 3. Query all custom functions
  const fnRes = await pool.query(`
    SELECT routine_schema, routine_name
    FROM information_schema.routines
    WHERE routine_schema IN ('public', 'private')
    ORDER BY routine_schema, routine_name;
  `);
  const actualFunctions = new Set(fnRes.rows.map(r => `${r.routine_schema}.${r.routine_name}`));

  // 4. Parse all 9 migration files for expected CREATE TABLE / CREATE INDEX / CREATE FUNCTION
  const migrationsDir = path.resolve("database/migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  const expectedObjects = [];

  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    
    // regex for CREATE TABLE [IF NOT EXISTS] (schema.)name
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_"\.]+)/gi;
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      let rawName = match[1].replace(/"/g, "");
      if (!rawName.includes(".")) rawName = `public.${rawName}`;
      expectedObjects.push({
        type: "TABLE",
        name: rawName,
        migration: file,
      });
    }

    // regex for CREATE FUNCTION (schema.)name
    const fnRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_"\.]+)/gi;
    while ((match = fnRegex.exec(content)) !== null) {
      let rawName = match[1].replace(/"/g, "");
      if (!rawName.includes(".")) rawName = `public.${rawName}`;
      expectedObjects.push({
        type: "FUNCTION",
        name: rawName,
        migration: file,
      });
    }
  }

  console.log(`\n--- EXPECTED VS ACTUAL SCHEMA MATRIX ---`);
  const report = [];
  const missingTables = [];
  const verifiedTables = [];

  for (const exp of expectedObjects) {
    if (exp.type === "TABLE") {
      const exists = actualTables.has(exp.name);
      const rls = rlsMap.get(exp.name) ?? false;
      const status = exists ? "VERIFIED" : "MISSING";
      if (!exists) missingTables.push(exp);
      else verifiedTables.push(exp);

      report.push({
        object: exp.name,
        type: exp.type,
        migration: exp.migration,
        exists,
        rlsEnabled: rls,
        status,
      });
    } else if (exp.type === "FUNCTION") {
      const exists = actualFunctions.has(exp.name);
      report.push({
        object: exp.name,
        type: exp.type,
        migration: exp.migration,
        exists,
        rlsEnabled: "N/A",
        status: exists ? "VERIFIED" : "MISSING",
      });
    }
  }

  // Find extra tables in public/private not in migration files
  const expectedTableNames = new Set(expectedObjects.filter(o => o.type === "TABLE").map(o => o.name));
  const extraTables = [];
  for (const act of actualTables) {
    if (!expectedTableNames.has(act)) {
      extraTables.push(act);
    }
  }

  console.log("\n[SUMMARY OF EXPECTED OBJECTS IN MIGRATIONS]");
  console.log(`Total Expected Tables/Objects: ${expectedObjects.length}`);
  console.log(`Verified Live on Supabase:    ${verifiedTables.length}`);
  console.log(`Missing Live on Supabase:     ${missingTables.length}`);
  console.log(`Extra Tables on Supabase:      ${extraTables.length}`);

  if (missingTables.length > 0) {
    console.log("\n⚠️ MISSING OBJECTS ON LIVE SUPABASE:");
    for (const m of missingTables) {
      console.log(`  - [${m.migration}] ${m.name}`);
    }
  }

  console.log("\n[EXTRA LIVE TABLES (Existing pre-Promax/Legacy/Supabase Core)]:");
  extraTables.slice(0, 25).forEach(t => console.log(`  + ${t}`));
  if (extraTables.length > 25) console.log(`  ... and ${extraTables.length - 25} more`);

  // Write detailed report JSON for docs
  fs.writeFileSync("docs/reports/schema_drift_inspection.json", JSON.stringify({
    timestamp: new Date().toISOString(),
    expectedCount: expectedObjects.length,
    verifiedCount: verifiedTables.length,
    missingCount: missingTables.length,
    missingTables,
    extraTables,
    detailedReport: report
  }, null, 2));

  await pool.end();
}

inspectSchemaDrift().catch(err => {
  console.error("Drift inspection error:", err);
  process.exit(1);
});
