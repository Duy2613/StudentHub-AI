import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";

async function run() {
  const pool = getPostgresPool();
  const res = await pool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name IN (
      'screenshot_objects',
      'trust_cases',
      'trust_runs',
      'trust_stage_runs',
      'trust_case_revisions',
      'trust_verdict_revisions',
      'case_inputs',
      'trust_evidence_files', 
      'case_runs', 
      'realtime_events', 
      'community_contributions',
      'expert_verifications',
      'integration_outbox',
      'report_jobs',
      'trust_revisions',
      'evidence_passports',
      'decision_scenarios'
    )
    ORDER BY table_schema, table_name;
  `);
  console.log("Specific tables found:", res.rows);
  await pool.end();
}

run().catch(console.error);
