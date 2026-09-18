/**
 * StudentHub AI — Server-Only 8-Account QA Demo Provisioner
 *
 * Provisions the canonical 8-account QA matrix for StudentHub AI:
 *   Users:   demo-user, demo-user1, demo-user2, demo-user3
 *   Experts: demo-expert, demo-expert1, demo-expert2, demo-expert3
 *
 * Explicitly invoked with:
 *   ALLOW_DEMO_PROVISIONING=true node scripts/provision-demo-accounts.mjs
 *
 * Fails closed if ALLOW_DEMO_PROVISIONING !== "true".
 * Operates strictly on the exact 8 allowlisted emails in demoAccountPolicy.js.
 * Never exposes passwords or service-role tokens.
 */

import "../frontend/src/lib/server/env/canonicalEnv.js";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import {
  DEMO_ACCOUNT_ALLOWLIST,
  DEMO_ACCOUNT_SPECS,
  DEMO_ENTITLEMENTS,
  QA_VERIFICATION_SOURCE,
  getDemoAccountSpec,
} from "../frontend/src/lib/server/auth/demoAccountPolicy.js";
import { QUIZ_VERSION } from "../frontend/src/lib/server/expert/ExpertQualificationQuiz.js";
import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";
import { ExpertReputationPolicy } from "../frontend/src/lib/server/expert/ExpertReputationPolicy.js";

const PROJECT_REF = "kytdomflmjytzyaabogi";
const PROVISIONING_VERSION = "demo-accounts.v2";
const EXPERT_CANONICAL_DOMAINS = Object.freeze([
  "GENERAL_EPISTEMICS",
  "AI_ML",
  "ACADEMIC_INTEGRITY",
  "CYBERSECURITY",
  "SCHOLARSHIP",
]);
const QUIZ_QUESTION_IDS = [
  "scope-boundary-01",
  "evidence-uncertainty-01",
  "conflict-disclosure-01",
  "source-provenance-01",
  "hard-negative-01",
  "domain-limit-01",
];

const frontendRequire = createRequire(join(resolve(process.cwd(), "frontend"), "package.json"));
const { createClient } = frontendRequire("@supabase/supabase-js");

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function assertRuntime() {
  if (process.env.ALLOW_DEMO_PROVISIONING !== "true") fail("ALLOW_DEMO_PROVISIONING_REQUIRED");
  if (process.env.NODE_ENV === "production" && process.env.DEMO_PROVISIONING_CONFIRMATION !== "STUDENTHUB_QA_DEMO_ONLY") {
    fail("DEMO_PROVISIONING_CONFIRMATION_REQUIRED_IN_PRODUCTION");
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey || !process.env.DATABASE_URL) fail("DEMO_PROVISIONING_ENV_INCOMPLETE");

  let parsed;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    fail("SUPABASE_URL_INVALID");
  }
  if (parsed.hostname !== `${PROJECT_REF}.supabase.co`) fail("WRONG_CANONICAL_SUPABASE_PROJECT");
  return { supabaseUrl, serviceRoleKey };
}

async function listAuthUsers(adminClient) {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail("SUPABASE_AUTH_LOOKUP_FAILED");
    const pageUsers = Array.isArray(data?.users) ? data.users : [];
    users.push(...pageUsers);
    if (pageUsers.length < 1000) break;
  }
  return users;
}

function resolveExactUsers(users) {
  return DEMO_ACCOUNT_ALLOWLIST.map((email) => {
    const matches = users.filter((user) => String(user.email || "").trim().toLowerCase() === email);
    if (matches.length !== 1) fail(matches.length === 0 ? `DEMO_AUTH_USER_NOT_FOUND:${email}` : `DEMO_AUTH_USER_DUPLICATE:${email}`);
    const user = matches[0];
    const providers = [
      user.app_metadata?.provider,
      ...(Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : []),
      ...(Array.isArray(user.identities) ? user.identities.map((identity) => identity.provider) : []),
    ].map((provider) => String(provider || "").toLowerCase());
    if (!providers.includes("email")) fail(`DEMO_AUTH_PROVIDER_NOT_EMAIL:${email}`);
    if (!user.email_confirmed_at) fail(`DEMO_EMAIL_NOT_CONFIRMED:${email}`);
    return { email, userId: String(user.id), authProvider: "email" };
  });
}

function digest(value) {
  return createHash("sha256").update(value).digest();
}

async function ensureProfile(client, account) {
  const spec = getDemoAccountSpec(account.email);
  let displayName = "StudentHub Demo User";
  let bio = null;

  if (spec.role === "EXPERT") {
    const expertTitles = {
      "demo-expert@gmail.com": "Senior Epistemic Lead (5★)",
      "demo-expert1@gmail.com": "Associate Epistemic Evaluator (1★)",
      "demo-expert2@gmail.com": "Certified Epistemic Specialist (3★)",
      "demo-expert3@gmail.com": "Principal Evaluator Candidate (4★)",
    };
    displayName = expertTitles[account.email] || "Demo Expert";
    bio = `QA-provisioned expert for ${spec.scenario}. Server-owned qualification and reputation.`;
  } else {
    const userTitles = {
      "demo-user@gmail.com": "Demo User (Full Active)",
      "demo-user1@gmail.com": "Demo User 1 (New)",
      "demo-user2@gmail.com": "Demo User 2 (Heavy Returning)",
      "demo-user3@gmail.com": "Demo User 3 (Edge)",
    };
    displayName = userTitles[account.email] || "Demo User";
    if (account.email === "demo-user@gmail.com") {
      bio = "Full active StudentHub student account for end-to-end competition demonstration.";
    } else if (account.email === "demo-user2@gmail.com") {
      bio = "High-density returning user with extensive historical activity and multi-domain queries.";
    }
  }

  await client.query(
    `insert into public.profiles (id, display_name, updated_at)
     values ($1, $2, now())
     on conflict (id) do update
       set display_name = excluded.display_name,
           updated_at = now()`,
    [account.userId, displayName]
  );
}

async function ensureRole(client, userId, roleCode) {
  const result = await client.query(
    `insert into private.user_roles (user_id, role_id, granted_by, granted_at, revoked_at)
     select $1, id, null, now(), null
       from private.roles
      where code = $2
     on conflict (user_id, role_id) do update
       set revoked_at = null
     returning user_id`,
    [userId, roleCode]
  );
  if (!result.rows[0]) fail(`DEMO_ROLE_NOT_CONFIGURED:${roleCode}`);
}

async function ensureEntitlements(client, account, entitlements, scopes = []) {
  for (const entitlementCode of entitlements) {
    await client.query(
      `insert into private.demo_entitlements
        (user_id, entitlement_code, source, granted_at, expires_at, revoked_at, metadata)
       values ($1, $2, $3, now(), null, null, $4::jsonb)
       on conflict (user_id, entitlement_code) do update
         set source = excluded.source,
             expires_at = null,
             revoked_at = null,
             metadata = excluded.metadata`,
      [
        account.userId,
        entitlementCode,
        QA_VERIFICATION_SOURCE,
        JSON.stringify({ email: account.email, provisioningVersion: PROVISIONING_VERSION, scopes: scopes || [] }),
      ]
    );
  }
}

async function ensureExpertQualification(client, account) {
  const spec = getDemoAccountSpec(account.email);
  if (spec.role !== "EXPERT") return { domains: [], applicationId: null };

  const profileSnapshot = {
    displayName: account.email === "demo-expert@gmail.com" ? "Demo Senior Expert" : `Demo Expert (${spec.scenario})`,
    bio: `QA-provisioned expert for ${spec.scenario}. This is a controlled product entitlement, not an institutional-email claim.`,
    provisioningSource: QA_VERIFICATION_SOURCE,
    provisioningVersion: PROVISIONING_VERSION,
  };

  const applicationResult = await client.query(
    `select id, profile_snapshot
       from public.expert_applications
      where user_id = $1
      for update`,
    [account.userId]
  );
  let applicationId = applicationResult.rows[0]?.id || null;
  if (!applicationId) {
    const inserted = await client.query(
      `insert into public.expert_applications
        (user_id, status, profile_snapshot, requested_domains, approved_domains, reviewed_at, reviewed_by)
       values ($1, 'ACTIVE', $2::jsonb, $3::jsonb, $3::jsonb, now(), null)
       returning id`,
      [account.userId, JSON.stringify(profileSnapshot), JSON.stringify(EXPERT_CANONICAL_DOMAINS)]
    );
    applicationId = inserted.rows[0]?.id;
  } else {
    await client.query(
      `update public.expert_applications
          set status = 'ACTIVE',
              profile_snapshot = $2::jsonb,
              requested_domains = $3::jsonb,
              approved_domains = $3::jsonb,
              reviewed_at = coalesce(reviewed_at, now()),
              reviewed_by = null,
              updated_at = now()
        where id = $1`,
      [applicationId, JSON.stringify(profileSnapshot), JSON.stringify(EXPERT_CANONICAL_DOMAINS)]
    );
  }

  const attempts = await client.query(
    `select id, status
       from public.expert_quiz_attempts
      where application_id = $1
      order by created_at asc
      for update`,
    [applicationId]
  );
  if (!attempts.rows.length) {
    await client.query(
      `insert into public.expert_quiz_attempts
        (application_id, user_id, quiz_version, question_ids, status, deadline_at, submitted_at, score, max_score)
       values ($1, $2, $3, $4::jsonb, 'PASSED', now() + interval '365 days', now(), 1.0, 6)`,
      [applicationId, account.userId, QUIZ_VERSION, JSON.stringify(QUIZ_QUESTION_IDS)]
    );
  }

  const practiceResponse = {
    scope: "evidence-bounded QA demonstration",
    conclusion: "The reviewer should separate source authority from expert interpretation and state uncertainty.",
    limitations: "This is a QA-provisioned practice record; it is not an external credential.",
  };

  for (const domain of EXPERT_CANONICAL_DOMAINS) {
    const practice = await client.query(
      `select id, state
         from private.expert_practice_submissions
        where application_id = $1 and domain_code = $2
        for update`,
      [applicationId, domain]
    );
    if (!practice.rows.length) {
      await client.query(
        `insert into private.expert_practice_submissions
          (application_id, user_id, domain_code, prompt_version, prompt_snapshot,
           response, evidence_revision_ids, state, idempotency_key, request_digest,
           reviewed_by, reviewed_at)
         values ($1, $2, $3, 'expert-practice.v1', $4::jsonb, $5::jsonb, $6::jsonb,
                 'PASSED', $7, $8, null, now())`,
        [
          applicationId,
          account.userId,
          domain,
          JSON.stringify({ promptVersion: "expert-practice.v1", domain, provisioningSource: QA_VERIFICATION_SOURCE }),
          JSON.stringify(practiceResponse),
          JSON.stringify([`QA_PROVISIONED:${PROVISIONING_VERSION}`]),
          `qa:${PROVISIONING_VERSION}:${account.userId}:${domain}`,
          digest(`${PROVISIONING_VERSION}:${account.userId}:${domain}`),
        ]
      );
    }

    await client.query(
      `insert into private.expert_domains (user_id, domain_code, evidence_count)
       values ($1, $2, 0)
       on conflict (user_id, domain_code) do nothing`,
      [account.userId, domain]
    );

    await client.query(
      `insert into private.expert_verifications
        (user_id, domain_code, status, qualification_state, verified_by, verified_at, evidence_ref)
       values ($1, $2, 'VERIFIED', 'DOMAIN_VERIFIED', null, now(), $3)
       on conflict (user_id, domain_code) do update
         set status = 'VERIFIED',
             qualification_state = 'DOMAIN_VERIFIED',
             suspended_at = null,
             verified_by = null,
             verified_at = now(),
             evidence_ref = excluded.evidence_ref`,
      [account.userId, domain, `${QA_VERIFICATION_SOURCE}:${PROVISIONING_VERSION}:${applicationId}:${domain}`]
    );
  }

  await client.query(
    `insert into public.expert_profiles (user_id, public_title, public_bio, updated_at)
     values ($1, $2, $3, now())
     on conflict (user_id) do update
       set public_title = excluded.public_title,
           public_bio = excluded.public_bio,
           updated_at = now()`,
    [account.userId, profileSnapshot.displayName, profileSnapshot.bio]
  );

  await ensureRole(client, account.userId, "EXPERT");
  return { domains: EXPERT_CANONICAL_DOMAINS, applicationId };
}

async function ensureExpertScenarioBaseline(client, account) {
  const spec = getDemoAccountSpec(account.email);
  if (spec.role !== "EXPERT") return;

  const baselineTargets = {
    "demo-expert@gmail.com": { completedReviews: 50, reputation: 250, targetStar: 5 },
    "demo-expert1@gmail.com": { completedReviews: 1, reputation: 10, targetStar: 1 },
    "demo-expert2@gmail.com": { completedReviews: 20, reputation: 100, targetStar: 3 },
    "demo-expert3@gmail.com": { completedReviews: 49, reputation: 245, targetStar: 4 },
  };

  const target = baselineTargets[account.email];
  if (!target) return;

  // 1. Clean existing QA reputation events & cancel non-baseline completed assignments
  await client.query(
    `update private.expert_assignments
        set status = 'CANCELLED'
      where expert_id = $1 and idempotency_key not like 'qa_baseline:%'`,
    [account.userId]
  );
  await client.query(
    `delete from private.reputation_events
      where user_id = $1 and (idempotency_key like 'qa_%' or idempotency_key like 'assessment_completion:%')`,
    [account.userId]
  );
  await client.query(
    `delete from private.expert_assignments
      where expert_id = $1 and idempotency_key like 'qa_baseline:%'`,
    [account.userId]
  );

  // 2. Insert canonical completed assignments to satisfy workCounts.completed
  // We need a dummy case_id or shared case for baseline assignments
  const caseRes = await client.query(`select id from public.trust_cases limit 1`);
  const caseId = caseRes.rows[0]?.id || randomUUID();

  for (let i = 1; i <= target.completedReviews; i += 1) {
    const assignmentId = randomUUID();
    const idempotencyKey = `qa_baseline:${account.userId}:assign:${i}`;
    await client.query(
      `insert into private.expert_assignments
        (id, expert_id, case_id, case_revision, claim_id, domain_code, status,
         assigned_by, conflict_of_interest, idempotency_key, request_digest, created_at, updated_at)
       values ($1, $2, $3, 1, null, 'GENERAL_EPISTEMICS', 'COMPLETED',
               $2, false, $4, $5, now() - interval '1 day', now())
       on conflict (id) do nothing`,
      [assignmentId, account.userId, caseId, idempotencyKey, digest(idempotencyKey)]
    );
  }

  // 3. Insert canonical reputation events to satisfy sum(delta) = target.reputation
  const eventCount = Math.floor(target.reputation / 5);
  for (let i = 1; i <= eventCount; i += 1) {
    const idempotencyKey = `qa_baseline:${account.userId}:rep:${i}`;
    await client.query(
      `insert into private.reputation_events
        (user_id, domain_code, event_type, delta, reason, actor_id, idempotency_key, created_at)
       values ($1, 'GENERAL_EPISTEMICS', 'EXPERT_ASSESSMENT_COMPLETED', 5,
               $2, $1, $3, now() - interval '1 day')
       on conflict (idempotency_key) do nothing`,
      [account.userId, `QA baseline formal assessment ${i}`, idempotencyKey]
    );
  }

  // Verify calibrated StarLevel
  const repRes = await client.query(
    `select coalesce(sum(delta), 0)::numeric as reputation from private.reputation_events where user_id = $1`,
    [account.userId]
  );
  const countRes = await client.query(
    `select count(*) filter (where status = 'COMPLETED')::int as completed from private.expert_assignments where expert_id = $1`,
    [account.userId]
  );

  const star = ExpertReputationPolicy.calculateStarLevel({
    completedReviews: countRes.rows[0].completed,
    reputation: Number(repRes.rows[0].reputation),
    qualificationState: "ACTIVE",
    activationState: "ACTIVE",
  });

  if (star !== target.targetStar) {
    fail(`EXPERT_STAR_CALIBRATION_MISMATCH:${account.email}:expected=${target.targetStar}:got=${star}`);
  }
}

async function ensureUserScenarioBaseline(client, account) {
  const spec = getDemoAccountSpec(account.email);
  if (spec.role === "EXPERT") return;

  if (account.email === "demo-user@gmail.com") {
    // U0: Full Active User
    // Ensure active timetable exists
    const ttRes = await client.query(`select id from public.user_timetables where user_id = $1 and is_active = true`, [account.userId]);
    let timetableId = ttRes.rows[0]?.id || null;
    if (!timetableId) {
      const inserted = await client.query(
        `insert into public.user_timetables
          (user_id, name, academic_term, source_type, is_active)
         values ($1, 'Thời khóa biểu chính khóa', 'HK1 2026-2027', 'MANUAL', true)
         returning id`,
        [account.userId]
      );
      timetableId = inserted.rows[0]?.id;

      await client.query(
        `insert into public.timetable_entries
          (timetable_id, user_id, course_code, course_name, day_of_week, period_start, period_end, room, lecturer)
         values
          ($1, $2, 'MATH101', 'Giải tích 1', 2, 1, 3, 'A1-201', 'TS. Nguyễn Văn A'),
          ($1, $2, 'CS102', 'Lập trình nâng cao', 4, 4, 6, 'B2-302', 'ThS. Trần Thị B')
         on conflict do nothing`,
        [timetableId, account.userId]
      );
    }
  } else if (account.email === "demo-user1@gmail.com") {
    // U1: Brand New User
    // Must have NO active timetable, NO tasks
    await client.query(`delete from public.user_timetables where user_id = $1`, [account.userId]);
  } else if (account.email === "demo-user2@gmail.com") {
    // U2: Heavy Returning User
    // Ensure active timetable with 4+ courses
    const ttRes = await client.query(`select id from public.user_timetables where user_id = $1 and is_active = true`, [account.userId]);
    if (!ttRes.rows[0]) {
      const inserted = await client.query(
        `insert into public.user_timetables
          (user_id, name, academic_term, source_type, is_active)
         values ($1, 'Thời khóa biểu chuyên ngành', 'HK1 2026-2027', 'MANUAL', true)
         returning id`,
        [account.userId]
      );
      const timetableId = inserted.rows[0]?.id;
      await client.query(
        `insert into public.timetable_entries
          (timetable_id, user_id, course_code, course_name, day_of_week, period_start, period_end, room, lecturer)
         values
          ($1, $2, 'MATH201', 'Xác suất thống kê', 2, 1, 3, 'A1-101', 'TS. Lê C'),
          ($1, $2, 'CS202', 'Cấu trúc dữ liệu', 3, 4, 6, 'B1-204', 'PGS. Vũ D'),
          ($1, $2, 'PHYS101', 'Vật lý đại cương', 5, 1, 3, 'C2-105', 'TS. Hoàng E'),
          ($1, $2, 'ENG201', 'Tiếng Anh chuyên ngành', 6, 7, 9, 'D1-402', 'ThS. Phạm F')
         on conflict do nothing`,
        [timetableId, account.userId]
      );
    }
  }
}

async function provision(accounts) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const results = [];

    for (const account of accounts) {
      const spec = getDemoAccountSpec(account.email);
      if (!spec) fail("DEMO_ACCOUNT_NOT_ALLOWLISTED");

      const roles = await client.query(
        `select r.code
           from private.user_roles ur
           join private.roles r on r.id = ur.role_id
          where ur.user_id = $1 and ur.revoked_at is null`,
        [account.userId]
      );
      if (roles.rows.some((row) => ["ADMIN", "SERVICE", "MODERATOR"].includes(row.code))) fail("DEMO_PRIVILEGED_ROLE_PRESENT");

      await ensureProfile(client, account);
      await ensureRole(client, account.userId, "STUDENT");
      if (spec.role === "EXPERT") {
        await ensureRole(client, account.userId, "EXPERT");
      }
      await ensureEntitlements(client, account, spec.entitlements, spec.scopes);
      const expert = await ensureExpertQualification(client, account);
      await ensureExpertScenarioBaseline(client, account);
      await ensureUserScenarioBaseline(client, account);

      // Read back calibrated stats for reporting
      const repRes = await client.query(
        `select coalesce(sum(delta), 0)::numeric as reputation from private.reputation_events where user_id = $1`,
        [account.userId]
      );
      const countRes = await client.query(
        `select count(*) filter (where status = 'COMPLETED')::int as completed from private.expert_assignments where expert_id = $1`,
        [account.userId]
      );

      const rep = Number(repRes.rows[0].reputation);
      const reviews = countRes.rows[0].completed;
      const star = spec.role === "EXPERT"
        ? ExpertReputationPolicy.calculateStarLevel({
            completedReviews: reviews,
            reputation: rep,
            qualificationState: "ACTIVE",
            activationState: "ACTIVE",
          })
        : null;

      results.push({
        email: account.email,
        userId: account.userId,
        scenario: spec.scenario,
        baseRole: spec.role,
        qaSuperset: true,
        starLevel: star,
        reputation: rep,
        completedReviews: reviews,
        expertDomains: expert.domains || [],
      });
    }

    await client.query("commit");
    return results;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const { supabaseUrl, serviceRoleKey } = assertRuntime();
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const users = resolveExactUsers(await listAuthUsers(adminClient));
  const result = await provision(users);

  console.log(JSON.stringify({
    project: PROJECT_REF,
    provisioningSource: QA_VERIFICATION_SOURCE,
    allowlistCount: DEMO_ACCOUNT_ALLOWLIST.length,
    accounts: result,
    adminRoleGranted: false,
    serviceRoleExposed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(`DEMO_PROVISIONING_FAILED:${error?.code || "UNKNOWN"}`, error);
  process.exitCode = 1;
});
