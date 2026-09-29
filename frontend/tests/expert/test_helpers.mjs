import "../../src/lib/server/env/canonicalEnv.js";
import assert from "node:assert/strict";
import nativeTest from "node:test";
import { randomUUID } from "node:crypto";
import { closePostgresPoolForTests } from "../../src/lib/server/database/PostgresPool.js";
import {
  configureDisposableDatabase,
  configureApprovedExpertStagingDatabase,
  EXPERT_STAGING_RUN_FLAG,
  APPROVED_STAGING_PROJECT_REF,
  inspectPostgresTarget,
  DISPOSABLE_DB_BLOCKED,
} from "../helpers/disposableDbGuard.mjs";

// Expert integration tests mutate Trust, assignment, assessment and realtime
// records. Staging is selected only by its identity-checked bootstrap alias;
// ordinary local runs may use the separately acknowledged loopback DB.
const stagingRun = process.env[EXPERT_STAGING_RUN_FLAG] === "1";
export const disposableDatabaseUrl = stagingRun
  ? configureApprovedExpertStagingDatabase()
  : configureDisposableDatabase({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });

if (stagingRun && !disposableDatabaseUrl) {
  throw new Error("STAGING_DB_IDENTITY_MISMATCH_OR_WRITE_AUTHORIZATION_MISSING");
}

async function verifyStagingConnectionBeforeMutation() {
  const target = inspectPostgresTarget(process.env.DATABASE_URL);
  if (target.projectRef !== APPROVED_STAGING_PROJECT_REF || process.env.STUDENTHUB_DATABASE_TARGET !== "APPROVED_ISOLATED_STAGING") {
    throw new Error("STAGING_DB_IDENTITY_MISMATCH");
  }

  const pool = getPostgresPool();
  const result = await pool.query(
    "SELECT current_database() AS database_name, inet_server_addr()::text AS server_address, current_setting($$server_version$$) AS server_version"
  );
  assert.equal(result.rows[0]?.database_name, "postgres", "Unexpected staging database name");
  assert.ok(result.rows[0]?.server_version, "Staging readiness probe did not return a server version");
}

export function liveExpertTest(name, fn) {
  return nativeTest(name, {
    skip: disposableDatabaseUrl ? false : DISPOSABLE_DB_BLOCKED,
  }, async (context) => {
    if (stagingRun) await verifyStagingConnectionBeforeMutation();
    return fn(context);
  });
}

export async function closeExpertTestPool() {
  if (disposableDatabaseUrl) await closePostgresPoolForTests();
}

export async function getDemoAccounts(pool) {
  const emails = [
    "demo-user@gmail.com",
    "demo-user1@gmail.com",
    "demo-user2@gmail.com",
    "demo-user3@gmail.com",
    "demo-expert@gmail.com",
    "demo-expert1@gmail.com",
    "demo-expert2@gmail.com",
    "demo-expert3@gmail.com",
  ];
  const res = await pool.query(
    `SELECT id, email FROM auth.users WHERE email = ANY($1::text[])`,
    [emails]
  );
  const map = {};
  for (const row of res.rows) {
    if (row.email === "demo-user@gmail.com") map.u0 = row.id;
    else if (row.email === "demo-user1@gmail.com") map.u1 = row.id;
    else if (row.email === "demo-user2@gmail.com") map.u2 = row.id;
    else if (row.email === "demo-user3@gmail.com") map.u3 = row.id;
    else if (row.email === "demo-expert@gmail.com") map.e0 = row.id;
    else if (row.email === "demo-expert1@gmail.com") map.e1 = row.id;
    else if (row.email === "demo-expert2@gmail.com") map.e2 = row.id;
    else if (row.email === "demo-expert3@gmail.com") map.e3 = row.id;
  }
  const missing = ["u0", "u1", "u2", "u3", "e0", "e1", "e2", "e3"].filter((key) => !map[key]);
  if (missing.length) {
    throw new Error(`STAGING_TEST_FIXTURES_MISSING: ${missing.length} synthetic demo principals are required before writes.`);
  }
  return map;
}

export async function createTestTrustCase(pool, { caseId = randomUUID(), ownerId, state = "PASS" }) {
  const result = await pool.query(
    `INSERT INTO public.trust_cases (id, owner_id, state, visibility, created_at, updated_at)
     VALUES ($1, $2, $3, 'PRIVATE', now(), now())
     RETURNING id, owner_id, state, visibility`,
    [caseId, ownerId, state]
  );
  assert.equal(result.rows[0]?.id, caseId, "Synthetic Trust case must be present after creation");
  assert.equal(result.rows[0]?.owner_id, ownerId);
  assert.equal(result.rows[0]?.visibility, "PRIVATE");
  return { caseId, ownerId };
}

export async function cleanupTestCase(pool, caseId) {
  if (!caseId) return;
  const failures = [];
  const run = async (query, values) => {
    try {
      return await pool.query(query, values);
    } catch (error) {
      failures.push(error);
      return null;
    }
  };

  const relations = await run(
    `SELECT to_regclass('private.expert_review_requests') AS review_requests,
            to_regclass('private.expert_assignments') AS assignments,
            to_regclass('public.expert_assessments') AS assessments,
            to_regclass('private.reputation_events') AS reputation_events,
            to_regclass('private.realtime_events') AS realtime_events,
            to_regclass('private.expert_review_request_events') AS request_events`,
    []
  );
  const available = relations?.rows[0] || {};
  const reqs = available.review_requests
    ? await run(`SELECT id FROM private.expert_review_requests WHERE case_id = $1`, [caseId])
    : { rows: [] };
  const reqIds = reqs?.rows.map((row) => row.id) || [];

  if (reqIds.length > 0) {
    if (available.reputation_events) await run(`DELETE FROM private.reputation_events WHERE source_case_id = $1 OR review_id = ANY($2::uuid[])`, [caseId, reqIds]);
    if (available.assessments) await run(`DELETE FROM public.expert_assessments WHERE case_id = $1`, [caseId]);
    if (available.assignments) await run(`DELETE FROM private.expert_assignments WHERE case_id = $1 OR review_request_id = ANY($2::uuid[])`, [caseId, reqIds]);
    await run(
      `DELETE FROM private.expert_review_requests WHERE case_id = $1`,
      [caseId]
    );
  } else {
    if (available.reputation_events) await run(`DELETE FROM private.reputation_events WHERE source_case_id = $1`, [caseId]);
    if (available.assessments) await run(`DELETE FROM public.expert_assessments WHERE case_id = $1`, [caseId]);
    if (available.assignments) await run(`DELETE FROM private.expert_assignments WHERE case_id = $1`, [caseId]);
  }
  await run(`DELETE FROM public.trust_cases WHERE id = $1`, [caseId]);

  const readbackChecks = [
    `(SELECT count(*) FROM public.trust_cases WHERE id = $1)::integer AS trust_cases`,
  ];
  if (available.review_requests) readbackChecks.push(`(SELECT count(*) FROM private.expert_review_requests WHERE case_id = $1)::integer AS review_requests`);
  if (available.assignments) readbackChecks.push(`(SELECT count(*) FROM private.expert_assignments WHERE case_id = $1)::integer AS assignments`);
  if (available.assessments) readbackChecks.push(`(SELECT count(*) FROM public.expert_assessments WHERE case_id = $1)::integer AS assessments`);
  if (available.reputation_events) readbackChecks.push(`(SELECT count(*) FROM private.reputation_events WHERE source_case_id = $1)::integer AS reputation_events`);
  if (available.realtime_events) readbackChecks.push(`(SELECT count(*) FROM private.realtime_events WHERE subject_id = $1 OR payload->>'caseId' = $1::text)::integer AS realtime_events`);
  if (available.request_events) readbackChecks.push(`(SELECT count(*) FROM private.expert_review_request_events WHERE request_id = ANY($2::uuid[]))::integer AS request_events`);

  const readback = await run(`SELECT ${readbackChecks.join(", ")}`, [caseId, reqIds]);
  if (readback?.rows[0] && Object.values(readback.rows[0]).some((count) => Number(count) !== 0)) {
    failures.push(new Error(`Expert integration cleanup readback found synthetic rows for case ${caseId}.`));
  }

  if (failures.length) {
    throw new AggregateError(failures, `Expert integration cleanup failed for synthetic case ${caseId}.`);
  }
}
