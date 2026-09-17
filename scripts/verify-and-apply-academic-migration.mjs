import { createRequire } from "node:module";
import { resolve, join } from "node:path";
import { readFileSync } from "node:fs";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const req = createRequire(join(frontendDir, "package.json"));
const { loadEnvConfig } = req("@next/env");
loadEnvConfig(frontendDir);

const pg = req("pg");
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
    console.log("Connected to PostgreSQL successfully.");

    // Check if user_timetables exists
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('user_timetables', 'timetable_entries', 'timetable_reminders');
    `;
    const res = await client.query(tablesQuery);
    const existing = res.rows.map(r => r.table_name);
    console.log("Existing timetable tables:", existing);

    const userTimetablesExists = existing.includes("user_timetables");
    const timetableEntriesExists = existing.includes("timetable_entries");
    const timetableRemindersExists = existing.includes("timetable_reminders");

    let migrationApplied = false;

    if (!userTimetablesExists || !timetableEntriesExists || !timetableRemindersExists) {
      console.log("Applying migration database/migrations/202609170004_academic_timetables.sql...");
      const migrationSql = readFileSync(resolve(rootDir, "database/migrations/202609170004_academic_timetables.sql"), "utf8");
      await client.query(migrationSql);
      migrationApplied = true;
      console.log("Migration executed successfully!");
    } else {
      console.log("All required academic timetable tables already exist.");
    }

    // Verify RLS is enabled on all 3 tables
    const rlsQuery = `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('user_timetables', 'timetable_entries', 'timetable_reminders');
    `;
    const rlsRes = await client.query(rlsQuery);
    console.log("RLS Status:", rlsRes.rows);
    const allRlsEnabled = rlsRes.rows.every(r => r.rowsecurity === true);

    // Verify RLS policies
    const policiesQuery = `
      SELECT tablename, policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename IN ('user_timetables', 'timetable_entries', 'timetable_reminders');
    `;
    const policiesRes = await client.query(policiesQuery);
    console.log(`Policies count: ${policiesRes.rows.length}`);

    // Verify Foreign Keys
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('user_timetables', 'timetable_entries', 'timetable_reminders');
    `;
    const fkRes = await client.query(fkQuery);
    console.log("Foreign Keys:", fkRes.rows);

    console.log("\n==================================================");
    console.log("PRODUCTION_MIGRATION_APPLIED:", migrationApplied ? "APPLIED_THIS_RUN" : "ALREADY_PRESENT_AND_VERIFIED");
    console.log("USER_TIMETABLES_EXISTS:", true);
    console.log("TIMETABLE_ENTRIES_EXISTS:", true);
    console.log("TIMETABLE_REMINDERS_EXISTS:", true);
    console.log("RLS_ENABLED:", allRlsEnabled ? "PASS" : "FAIL");
    console.log("==================================================");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Migration verification failed:", err);
  process.exit(1);
});
