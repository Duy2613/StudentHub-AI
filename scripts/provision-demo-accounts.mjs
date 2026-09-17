/**
 * StudentHub AI — exact, server-only QA demo account provisioner.
 *
 * Run explicitly with:
 *   ALLOW_DEMO_PROVISIONING=true node scripts/provision-demo-accounts.mjs
 *
 * The script has no CLI email input by design. It can only touch the two
 * exact allowlisted accounts in demoAccountPolicy.js.
 */

import "../frontend/src/lib/server/env/canonicalEnv.js";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { DEMO_ACCOUNT_ALLOWLIST, DEMO_ENTITLEMENTS, QA_VERIFICATION_SOURCE, getDemoAccountSpec } from "../frontend/src/lib/server/auth/demoAccountPolicy.js";
import { QUIZ_VERSION } from "../frontend/src/lib/server/expert/ExpertQualificationQuiz.js";
import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";

const PROJECT_REF = "kytdomflmjytzyaabogi";
const PROVISIONING_VERSION = "demo-accounts.v1";
const EXPERT_CANONICAL_DOMAINS = Object.freeze([
  "GENERAL_EPISTEMICS",
  "AI_ML",
  "ACADEMIC_INTEGRITY",
  "CYBERSECURITY",
  "SCHOLARSHIP",
]);
const EXPERT_DOMAIN = "GENERAL_EPISTEMICS";
const EXPERT_EMAIL = "demo-expert@gmail.com";
const USER_EMAIL = "demo-user@gmail.com";
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
    if (matches.length !== 1) fail(matches.length === 0 ? "DEMO_AUTH_USER_NOT_FOUND" : "DEMO_AUTH_USER_DUPLICATE");
    const user = matches[0];
    const providers = [
      user.app_metadata?.provider,
      ...(Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : []),
      ...(Array.isArray(user.identities) ? user.identities.map((identity) => identity.provider) : []),
    ].map((provider) => String(provider || "").toLowerCase());
    if (!providers.includes("email")) fail("DEMO_AUTH_PROVIDER_NOT_EMAIL");
    if (!user.email_confirmed_at) fail("DEMO_EMAIL_NOT_CONFIRMED");
    return { email, userId: String(user.id), authProvider: "email" };
  });
}

function digest(value) {
  return createHash("sha256").update(value).digest();
}

async function assertSchema(client) {
  const required = [
    ["private", "demo_entitlements"],
    ["public", "expert_applications"],
    ["public", "expert_quiz_attempts"],
    ["private", "expert_practice_submissions"],
    ["private", "expert_verifications"],
  ];
  const result = await client.query(
    `select table_schema, table_name
       from information_schema.tables
      where (table_schema, table_name) in (${required.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(",")})`,
    required.flat()
  );
  const present = new Set(result.rows.map((row) => `${row.table_schema}.${row.table_name}`));
  if (required.some(([schema, table]) => !present.has(`${schema}.${table}`))) fail("DEMO_PROVISIONING_MIGRATION_REQUIRED");
}

async function ensureProfile(client, account) {
  const displayName = account.email === EXPERT_EMAIL ? "Demo Expert" : "Demo User";
  await client.query(
    `insert into public.profiles (id, display_name)
     values ($1, $2)
     on conflict (id) do nothing`,
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
  if (!result.rows[0]) fail("DEMO_ROLE_NOT_CONFIGURED");
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
  if (account.email !== EXPERT_EMAIL) return { domains: [], applicationId: null };

  const profileSnapshot = {
    displayName: "Demo Expert",
    bio: "QA-provisioned competition demo expert. This is a controlled product entitlement, not an institutional-email claim.",
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
  if (applicationResult.rows[0] && applicationResult.rows[0].profile_snapshot?.provisioningSource !== QA_VERIFICATION_SOURCE) {
    fail("DEMO_EXPERT_APPLICATION_NOT_QA_OWNED");
  }
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
  if (!applicationId) fail("DEMO_EXPERT_APPLICATION_FAILED");

  const attempts = await client.query(
    `select id, status
       from public.expert_quiz_attempts
      where application_id = $1
      order by created_at asc
      for update`,
    [applicationId]
  );
  if (attempts.rows.length && !attempts.rows.some((row) => row.status === "PASSED")) fail("DEMO_EXPERT_QUIZ_HAS_NON_QA_STATE");
  if (!attempts.rows.length) {
    await client.query(
      `insert into public.expert_quiz_attempts
        (application_id, user_id, quiz_version, question_ids, status, deadline_at, submitted_at, score, max_score)
       values ($1, $2, $3, $4::jsonb, 'PASSED', now() + interval '365 days', now(), 1, 6)`,
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
    if (practice.rows.length && practice.rows[0].state !== "PASSED") fail("DEMO_EXPERT_PRACTICE_HAS_NON_QA_STATE");
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
    `insert into public.expert_profiles (user_id, public_title, public_bio)
     values ($1, 'QA Demo Expert', $2)
     on conflict (user_id) do update
       set public_title = excluded.public_title,
           public_bio = excluded.public_bio,
           updated_at = now()`,
    [account.userId, profileSnapshot.bio]
  );

  await ensureRole(client, account.userId, "EXPERT");
  return { domains: EXPERT_CANONICAL_DOMAINS, applicationId };
}

async function provision(accounts) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await assertSchema(client);
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
      await ensureEntitlements(client, account, spec.entitlements, spec.scopes);
      const expert = await ensureExpertQualification(client, account);
      await client.query(
        `insert into private.audit_events (event_type, actor_id, target_type, target_id, metadata)
         select 'DEMO_ACCOUNT_PROVISIONED', null, 'USER', $1, $2::jsonb
          where not exists (
            select 1 from private.audit_events
             where event_type = 'DEMO_ACCOUNT_PROVISIONED' and target_id = $1
          )`,
        [account.userId, JSON.stringify({ email: account.email, source: QA_VERIFICATION_SOURCE, version: PROVISIONING_VERSION })]
      );
      results.push({
        email: account.email,
        userId: account.userId,
        authProvider: account.authProvider,
        roles: account.email === EXPERT_EMAIL ? ["STUDENT", "EXPERT"] : ["STUDENT"],
        entitlements: spec.entitlements,
        qaScopes: spec.scopes || [],
        institutionalEmailVerified: false,
        verificationSource: "NONE",
        demoAccessSource: QA_VERIFICATION_SOURCE,
        expertDomain: expert.domains?.[0] || null,
        expertDomains: expert.domains || [],
        expertApplicationId: expert.applicationId,
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
    allowlist: DEMO_ACCOUNT_ALLOWLIST,
    accounts: result,
    serviceRoleExposed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(`DEMO_PROVISIONING_FAILED:${error?.code || "UNKNOWN"}`, error);
  process.exitCode = 1;
});

