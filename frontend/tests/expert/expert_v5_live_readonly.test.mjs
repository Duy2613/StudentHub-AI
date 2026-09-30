import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import pg from "pg";
import { APPROVED_STAGING_PROJECT_REF, inspectPostgresTarget } from "../helpers/disposableDbGuard.mjs";

const V5_TABLES = [
  "expert_v5_config", "expert_mission_level_policy", "expert_v5_source_registry",
  "expert_v5_source_events", "expert_v5_source_snapshots", "expert_v5_ingestion_requests",
  "expert_v5_questions", "expert_v5_question_events", "expert_mission_progression",
  "expert_daily_missions", "expert_mission_attempts", "expert_mission_answers",
  "expert_mission_events", "expert_room_presence", "expert_verification_rooms",
  "expert_room_participants", "expert_room_rounds", "expert_room_answers",
  "expert_room_evidence_packages", "expert_room_adjudications", "expert_room_events",
];
const target = inspectPostgresTarget(process.env.DATABASE_URL);
let pool;

before(async () => {
  let apiProjectRef = null;
  try {
    apiProjectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname
      .match(/^([a-z0-9]+)\.supabase\.co$/)?.[1] || null;
  } catch {}

  assert.equal(target.valid, true, "STAGING_DB_IDENTITY_UNPROVEN");
  assert.equal(target.projectRef, APPROVED_STAGING_PROJECT_REF, "STAGING_DB_IDENTITY_MISMATCH");
  assert.equal(apiProjectRef, APPROVED_STAGING_PROJECT_REF, "STAGING_API_DB_IDENTITY_MISMATCH");
  assert.equal(target.database, "postgres", "STAGING_DATABASE_NAME_UNEXPECTED");

  const ca = process.env.DATABASE_SSL_CA
    ? process.env.DATABASE_SSL_CA.replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n")
    : undefined;
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8_000,
    ssl: {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(ca ? { ca } : {}),
    },
  });
  const identity = await pool.query("select current_database() as database_name, current_setting('server_version') as server_version");
  assert.equal(identity.rows[0]?.database_name, "postgres", "STAGING_DATABASE_NOT_READY");
  process.stdout.write(JSON.stringify({
    liveEnvironment: "APPROVED_ISOLATED_STAGING",
    projectRef: target.projectRef,
    databaseHost: target.host,
    databaseName: identity.rows[0].database_name,
    serverVersion: identity.rows[0].server_version,
    mode: "READ_ONLY",
  }) + "\n");
});

after(async () => { await pool?.end(); });

test("staging contains all V5 tables with private RLS and no anon/authenticated reads", async () => {
  const result = await pool.query(
    `select c.relname as table_name, c.relrowsecurity as rls_enabled,
            has_table_privilege('anon', format('private.%I', c.relname), 'select') as anon_select,
            has_table_privilege('authenticated', format('private.%I', c.relname), 'select') as authenticated_select,
            has_table_privilege('service_role', format('private.%I', c.relname), 'select') as service_role_select
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private' and c.relname = any($1::text[])`, [V5_TABLES],
  );
  assert.equal(result.rowCount, V5_TABLES.length, "EXPERT_V5_MIGRATION_INCOMPLETE");
  for (const row of result.rows) {
    assert.equal(row.rls_enabled, true, `${row.table_name}: RLS_DISABLED`);
    assert.equal(row.anon_select, false, `${row.table_name}: ANON_READ_EXPOSED`);
    assert.equal(row.authenticated_select, false, `${row.table_name}: AUTHENTICATED_READ_EXPOSED`);
    assert.equal(row.service_role_select, true, `${row.table_name}: SERVER_ROLE_GRANT_MISSING`);
  }
});

test("V5 staging starts without fabricated source, question, mission or room data", async () => {
  const result = await pool.query(
    `select (select count(*)::integer from private.expert_v5_source_registry) as sources,
            (select count(*)::integer from private.expert_v5_source_snapshots) as snapshots,
            (select count(*)::integer from private.expert_v5_questions) as questions,
            (select count(*)::integer from private.expert_daily_missions) as missions,
            (select count(*)::integer from private.expert_verification_rooms) as rooms`,
  );
  assert.deepEqual(result.rows[0], { sources: 0, snapshots: 0, questions: 0, missions: 0, rooms: 0 });
});

test("staging has the required eight isolated demo identities for room E2E", async () => {
  const result = await pool.query(
    `select count(*)::integer as count
       from auth.users
      where email = any($1::text[])`,
    [[
      "demo-user@gmail.com", "demo-user1@gmail.com", "demo-user2@gmail.com", "demo-user3@gmail.com",
      "demo-expert@gmail.com", "demo-expert1@gmail.com", "demo-expert2@gmail.com", "demo-expert3@gmail.com",
    ]],
  );
  assert.equal(result.rows[0]?.count, 8, `EXPERT_V5_E2E_IDENTITIES_UNREADY: expected 8, found ${result.rows[0]?.count ?? 0}`);
});

test("the eight staging identities include seven active verified Expert scopes", async () => {
  const result = await pool.query(
    `select count(distinct verification.user_id)::integer as count
       from private.expert_verifications verification
       join auth.users account on account.id = verification.user_id
      where account.email = any($1::text[])
        and verification.status = 'VERIFIED'
        and verification.qualification_state = 'DOMAIN_VERIFIED'
        and verification.suspended_at is null
        and (verification.expires_at is null or verification.expires_at > now())`,
    [[
      "demo-user@gmail.com", "demo-user1@gmail.com", "demo-user2@gmail.com", "demo-user3@gmail.com",
      "demo-expert@gmail.com", "demo-expert1@gmail.com", "demo-expert2@gmail.com", "demo-expert3@gmail.com",
    ]],
  );
  assert.equal(result.rows[0]?.count, 7, `EXPERT_V5_E2E_SCOPE_UNREADY: expected 7 active verified Experts, found ${result.rows[0]?.count ?? 0}`);
});
