import "../../src/lib/server/env/canonicalEnv.js";
import { randomUUID } from "node:crypto";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

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
  return map;
}

export async function createTestTrustCase(pool, { caseId = randomUUID(), ownerId, state = "PASS" }) {
  await pool.query(
    `INSERT INTO public.trust_cases (id, owner_id, state, visibility, created_at, updated_at)
     VALUES ($1, $2, $3, 'PRIVATE', now(), now())
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state`,
    [caseId, ownerId, state]
  );
  return { caseId, ownerId };
}

export async function cleanupTestCase(pool, caseId) {
  if (!caseId) return;
  const reqs = await pool.query(`SELECT id FROM private.expert_review_requests WHERE case_id = $1`, [caseId]);
  const reqIds = reqs.rows.map(r => r.id);

  if (reqIds.length > 0) {
    await pool.query(
      `DELETE FROM private.reputation_events WHERE source_case_id = $1 OR review_id = ANY($2::uuid[])`,
      [caseId, reqIds]
    ).catch(() => {});
    await pool.query(
      `DELETE FROM public.expert_assessments WHERE case_id = $1`,
      [caseId]
    ).catch(() => {});
    await pool.query(
      `DELETE FROM private.expert_assignments WHERE case_id = $1 OR review_request_id = ANY($2::uuid[])`,
      [caseId, reqIds]
    ).catch(() => {});
    await pool.query(
      `DELETE FROM private.expert_review_requests WHERE case_id = $1`,
      [caseId]
    ).catch(() => {});
  } else {
    await pool.query(
      `DELETE FROM public.expert_assessments WHERE case_id = $1`,
      [caseId]
    ).catch(() => {});
    await pool.query(
      `DELETE FROM private.expert_assignments WHERE case_id = $1`,
      [caseId]
    ).catch(() => {});
  }
  await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [caseId]).catch(() => {});
}
