import {
  APPROVED_STAGING_PROJECT_REF,
  EXPERT_STAGING_RUN_FLAG,
  EXPERT_STAGING_WRITE_ACK,
  inspectPostgresTarget,
} from "../helpers/disposableDbGuard.mjs";

if (process.env[EXPERT_STAGING_RUN_FLAG] === "1") {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  const databaseTarget = inspectPostgresTarget(rawDatabaseUrl);
  let apiProjectRef = null;
  try {
    apiProjectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname
      .match(/^([a-z0-9]+)\.supabase\.co$/)?.[1] || null;
  } catch {}

  if (databaseTarget.projectRef !== APPROVED_STAGING_PROJECT_REF || apiProjectRef !== APPROVED_STAGING_PROJECT_REF) {
    console.error("STAGING_DB_IDENTITY_MISMATCH");
    process.exit(23);
  }
  if (process.env.STUDENTHUB_EXPERT_STAGING_WRITE_ACK !== EXPERT_STAGING_WRITE_ACK) {
    console.error("STAGING_DB_WRITE_AUTHORIZATION_REQUIRED");
    process.exit(24);
  }

  process.env.STUDENTHUB_EXPERT_STAGING_DATABASE_URL = rawDatabaseUrl;
  console.log(JSON.stringify({
    targetEnvironment: "APPROVED_ISOLATED_STAGING",
    projectRef: databaseTarget.projectRef,
    databaseHost: databaseTarget.host,
    databaseName: databaseTarget.database,
    writeAuthorization: "EXPLICIT_ACK_PRESENT",
  }));

  const { default: pg } = await import("pg");
  const caRaw = process.env.DATABASE_SSL_CA;
  const ca = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;
  const pool = new pg.Pool({
    connectionString: rawDatabaseUrl,
    connectionTimeoutMillis: 8_000,
    ssl: {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(ca ? { ca } : {}),
    },
  });

  try {
    const identity = await pool.query(
      "SELECT current_database() AS database_name, inet_server_addr()::text AS server_address, current_setting($$server_version$$) AS server_version"
    );
    const relations = await pool.query(
      `SELECT to_regclass('private.expert_review_requests') AS expert_review_requests,
              to_regclass('private.expert_assignments') AS expert_assignments,
              to_regclass('private.expert_verifications') AS expert_verifications,
              to_regclass('private.expert_review_request_events') AS expert_review_request_events,
              to_regclass('public.expert_profiles') AS expert_profiles,
              to_regclass('public.expert_assessments') AS expert_assessments,
              to_regclass('public.trust_cases') AS trust_cases,
              to_regclass('public.trust_case_revisions') AS trust_case_revisions,
              to_regclass('private.realtime_events') AS realtime_events`
    );
    const requiredRelations = Object.keys(relations.rows[0] || {});
    const missingRelations = requiredRelations.filter((name) => !relations.rows[0][name]);
    const fixtureRows = await pool.query(
      `SELECT count(*)::integer AS fixture_accounts
         FROM auth.users
        WHERE email = ANY($1::text[])`,
      [[
        "demo-user@gmail.com", "demo-user1@gmail.com", "demo-user2@gmail.com", "demo-user3@gmail.com",
        "demo-expert@gmail.com", "demo-expert1@gmail.com", "demo-expert2@gmail.com", "demo-expert3@gmail.com",
      ]]
    );
    const readiness = {
      databaseName: identity.rows[0]?.database_name,
      serverVersion: identity.rows[0]?.server_version,
      readiness: "PASS_READ_ONLY",
      missingRelations,
      fixtureAccountsPresent: fixtureRows.rows[0]?.fixture_accounts || 0,
      fixtureAccountsRequired: 8,
    };
    console.log(JSON.stringify(readiness));

    if (identity.rows[0]?.database_name !== "postgres" || missingRelations.length || readiness.fixtureAccountsPresent !== 8) {
      console.error("STAGING_SCHEMA_OR_TEST_FIXTURES_UNREADY");
      await pool.end();
      process.exit(26);
    }
  } catch (error) {
    console.error(error?.code === "STAGING_DB_IDENTITY_MISMATCH" ? error.code : "STAGING_READ_ONLY_PREFLIGHT_FAILED");
    await pool.end();
    process.exit(27);
  }

  await pool.end();
}
