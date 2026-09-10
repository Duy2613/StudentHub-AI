import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import pg from "pg";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const liveUrl = configureDisposableDatabase({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
const liveGate = disposableLiveGate({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const migrations = [
  readFileSync(join(repositoryRoot, "database", "migrations", "202608270001_v2_authority_foundation.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202608290001_feature_freeze_cross_system.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609010001_private_screenshot_storage.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609060001_expert_qualification.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609060002_integration_outbox.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609060003_trust_runs_revisions.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609060004_reports.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609070001_realtime_event_log.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609090001_community_expert_promax.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609100001_expert_authority_snapshot.sql"), "utf8"),
];

const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
const expert = crypto.randomUUID();
const moderator = crypto.randomUUID();
const admin = crypto.randomUUID();
const passportId = crypto.randomUUID();
const postId = crypto.randomUUID();
const expertApplicationId = crypto.randomUUID();
const expertQuizAttemptId = crypto.randomUUID();
const trustCaseId = crypto.randomUUID();
const trustRunId = crypto.randomUUID();
const reportId = crypto.randomUUID();
const eventId = "rls-event-" + crypto.randomUUID();
let client;

async function asRole(role, subject, sql, values = []) {
  assert.match(role, /^(anon|authenticated|service_role)$/);
  await client.query("begin");
  try {
    await client.query("set local role " + role);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [subject || ""]);
    const result = await client.query(sql, values);
    await client.query("rollback");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

describe("PHASE 3 — live PostgreSQL/RLS proof", liveGate, () => {
  before(async () => {
    client = new pg.Client({
      connectionString: liveUrl,
      ssl: process.env.DATABASE_SSL === "disable"
        ? false
        : {
            rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
            ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n") } : {})
          }
    });
    await client.connect();
    for (const migration of migrations) await client.query(migration);
    await client.query(
      "insert into auth.users(id, aud, role, email, created_at, updated_at) values " +
      "($1,'authenticated','authenticated',$2,now(),now())," +
      "($3,'authenticated','authenticated',$4,now(),now())," +
      "($5,'authenticated','authenticated',$6,now(),now())," +
      "($7,'authenticated','authenticated',$8,now(),now())," +
      "($9,'authenticated','authenticated',$10,now(),now()) " +
      "on conflict(id) do nothing",
      [
        userA, "rls-a-" + userA + "@example.test",
        userB, "rls-b-" + userB + "@example.test",
        expert, "rls-expert-" + expert + "@example.test",
        moderator, "rls-moderator-" + moderator + "@example.test",
        admin, "rls-admin-" + admin + "@example.test"
      ]
    );
    for (const [userId, roleCode] of [[expert, "EXPERT"], [moderator, "MODERATOR"], [admin, "ADMIN"]]) {
      await client.query(
        "insert into private.user_roles(user_id, role_id) " +
        "select $1,id from private.roles where code=$2 on conflict do nothing",
        [userId, roleCode]
      );
    }
    await client.query(
      "insert into public.evidence_passports(" +
      "id, owner_id, title, subject_type, subject_id, current_status, revision, demo" +
      ") values($1,$2,'RLS Passport','TRUST_CASE',$3,'INSUFFICIENT_EVIDENCE',1,false)",
      [passportId, userA, passportId]
    );
    await client.query(
      "insert into public.evidence_passport_events(" +
      "id, passport_id, revision, event_type, provenance_class, summary, " +
      "previous_status, new_status, material, source_references, metadata, occurred_at" +
      ") values($1,$2,1,'CREATED','USER_SUBMISSION','RLS fixture', " +
      "'INSUFFICIENT_EVIDENCE','INSUFFICIENT_EVIDENCE',false,'[]'::jsonb,'{}'::jsonb,now())",
      [eventId, passportId]
    );
    await client.query(
      "insert into public.posts(id, author_id, title, content, status) " +
      "values($1,$2,'RLS fixture post','This is a sufficiently long RLS community fixture.','PUBLISHED')",
      [postId, userA]
    );
    await client.query(
      "insert into public.expert_profiles(user_id, public_title, public_bio) " +
      "values($1,'RLS Expert','Public fixture profile')",
      [expert]
    );
    await client.query(
      "insert into public.expert_applications(id,user_id,status,profile_snapshot,requested_domains) " +
      "values($1,$2,'IDENTITY_REVIEW',$3::jsonb,$4::jsonb)",
      [expertApplicationId, userA, JSON.stringify({ displayName: "RLS applicant" }), JSON.stringify(["AI_ML"])]
    );
    await client.query(
      "insert into public.expert_quiz_attempts(id,application_id,user_id,quiz_version,question_ids,deadline_at,max_score) " +
      "values($1,$2,$3,'expert-qualification.v1','[\"scope-boundary-01\"]'::jsonb,now()+interval '10 minutes',1)",
      [expertQuizAttemptId, expertApplicationId, userA]
    );
    await client.query(
      "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,'INSUFFICIENT_EVIDENCE','PRIVATE')",
      [trustCaseId, userA]
    );
    await client.query(
      "insert into public.trust_runs(id,case_id,owner_id,status,pipeline_version,started_at) " +
      "values($1,$2,$3,'COMPLETED','trust.v5',now())",
      [trustRunId, trustCaseId, userA]
    );
    await client.query(
      "insert into public.trust_case_revisions(case_id,owner_id,revision,run_id,state,snapshot) " +
      "values($1,$2,1,$3,'INSUFFICIENT_EVIDENCE','{}'::jsonb)",
      [trustCaseId, userA, trustRunId]
    );
    await client.query(
      "insert into public.trust_verdict_revisions(case_id,owner_id,revision,run_id,verdict) " +
      "values($1,$2,1,$3,'{}'::jsonb)",
      [trustCaseId, userA, trustRunId]
    );
    await client.query(
      "insert into private.report_jobs(" +
      "id,owner_id,report_type,subject_type,subject_id,snapshot_revision,status," +
      "template_version,policy_version,request_fingerprint,idempotency_key,artifact_hash,generated_at" +
      ") values($1,$2,'TRUST_CASE','TRUST_CASE',$3,1,'READY','trust-case.report.v1','trust.v5'," +
      "decode(repeat('cd',32),'hex'),$4,decode(repeat('ef',32),'hex'),now())",
      [reportId, userA, trustCaseId, "phase3-report-" + reportId]
    );
    await client.query(
      "insert into private.report_artifacts(report_id,snapshot_revision,document,artifact_hash) " +
      "values($1,1,$2::jsonb,decode(repeat('ef',32),'hex'))",
      [reportId, JSON.stringify({ schemaVersion: "trust.case.report.v1", reportId })]
    );
  });

  after(async () => {
    if (!client) return;
    await client.query("delete from public.evidence_passport_events where passport_id=$1", [passportId]);
    await client.query("delete from public.evidence_passports where id=$1", [passportId]);
    await client.query("delete from public.posts where id=$1", [postId]);
    await client.query("delete from public.expert_profiles where user_id=$1", [expert]);
    await client.query("delete from private.report_jobs where id=$1", [reportId]);
    await client.query("delete from public.trust_cases where id=$1", [trustCaseId]);
    await client.query("delete from private.user_roles where user_id=any($1::uuid[])", [[expert, moderator, admin]]);
    await client.query("delete from auth.users where id=any($1::uuid[])", [[userA, userB, expert, moderator, admin]]);
    await client.end();
  });

  it("denies anonymous private profile, Passport, session, and screenshot metadata access", async () => {
    await assert.rejects(asRole("anon", "", "select id from public.profiles where id=$1", [userA]), /permission denied/i);
    await assert.rejects(asRole("anon", "", "select user_id from private.server_sessions where user_id=$1", [userA]), /permission denied/i);
    await assert.rejects(asRole("anon", "", "select id from public.evidence_passports where id=$1", [passportId]), /permission denied/i);
    await assert.rejects(asRole("anon", "", "select id from public.screenshot_objects"), /permission denied/i);
  });

  it("allows own profile and Passport reads but denies cross-user reads and writes", async () => {
    assert.equal((await asRole("authenticated", userA, "select id from public.profiles where id=$1", [userA])).rowCount, 1);
    assert.equal((await asRole("authenticated", userA, "select id from public.profiles where id=$1", [userB])).rowCount, 0);
    assert.equal((await asRole("authenticated", userA, "select id from public.evidence_passports where id=$1", [passportId])).rowCount, 1);
    assert.equal((await asRole("authenticated", userB, "select id from public.evidence_passports where id=$1", [passportId])).rowCount, 0);
    assert.equal((await asRole("authenticated", userA, "update public.profiles set display_name='blocked' where id=$1", [userB])).rowCount, 0);
    await assert.rejects(
      asRole("authenticated", userA, "update public.evidence_passports set title='blocked' where id=$1", [passportId]),
      /permission denied/i
    );
    await assert.rejects(
      asRole("authenticated", userA, "insert into public.evidence_passport_events(id,passport_id,revision,event_type,provenance_class,summary,previous_status,new_status,occurred_at) values('blocked',$1,2,'USER_NOTE','USER_SUBMISSION','blocked','INSUFFICIENT_EVIDENCE','INSUFFICIENT_EVIDENCE',now())", [passportId]),
      /permission denied/i
    );
  });

  it("keeps Community observation reads public-safe and owner mutations scoped", async () => {
    assert.equal((await asRole("anon", "", "select id from public.posts where id=$1", [postId])).rowCount, 1);
    assert.equal((await asRole("authenticated", userB, "update public.posts set title='B cannot own this' where id=$1", [postId])).rowCount, 0);
    assert.equal((await asRole("authenticated", userA, "update public.posts set title='Owner can update' where id=$1", [postId])).rowCount, 1);
  });

  it("keeps role, expert verification, reputation, and foreign session authority service-only", async () => {
    assert.equal((await asRole("service_role", "", "select user_id from private.user_roles where user_id=$1 and role_id=(select id from private.roles where code='EXPERT')", [expert])).rowCount, 1);
    await assert.rejects(asRole("authenticated", expert, "select user_id from private.user_roles where user_id=$1", [expert]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "insert into private.user_roles(user_id, role_id) select $1,id from private.roles where code='ADMIN'", [userA]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "insert into private.reputation_events(user_id,domain_code,event_type,delta,reason) values($1,'GLOBAL','SELF',999,'blocked')", [userA]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "insert into private.expert_verifications(user_id,domain_code,status) values($1,'AI','VERIFIED')", [userA]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "select user_id from private.server_sessions where user_id=$1", [userB]), /permission denied/i);
  });

  it("keeps expert qualification progress owner-scoped and promotion service-only", async () => {
    assert.equal((await asRole("authenticated", userA, "select id from public.expert_applications where id=$1", [expertApplicationId])).rowCount, 1);
    assert.equal((await asRole("authenticated", userB, "select id from public.expert_applications where id=$1", [expertApplicationId])).rowCount, 0);
    assert.equal((await asRole("authenticated", userA, "select id from public.expert_quiz_attempts where id=$1", [expertQuizAttemptId])).rowCount, 1);
    await assert.rejects(
      asRole("authenticated", userA, "update public.expert_applications set status='ACTIVE' where id=$1", [expertApplicationId]),
      /permission denied/i
    );
    await assert.rejects(
      asRole("authenticated", userA, "insert into private.expert_qualification_reviews(application_id,user_id,reviewer_id,decision) values($1,$2,$2,'ACTIVATE')", [expertApplicationId, userA]),
      /permission denied/i
    );
  });

  it("keeps Trust run and revision history owner-scoped and append-only to the service role", async () => {
    assert.equal((await asRole("authenticated", userA, "select id from public.trust_runs where id=$1", [trustRunId])).rowCount, 1);
    assert.equal((await asRole("authenticated", userB, "select id from public.trust_runs where id=$1", [trustRunId])).rowCount, 0);
    assert.equal((await asRole("authenticated", userA, "select case_id from public.trust_case_revisions where case_id=$1", [trustCaseId])).rowCount, 1);
    assert.equal((await asRole("authenticated", userA, "select case_id from public.trust_verdict_revisions where case_id=$1", [trustCaseId])).rowCount, 1);
    await assert.rejects(
      asRole("authenticated", userA, "insert into public.trust_case_revisions(case_id,owner_id,revision,run_id,state,snapshot) values($1,$2,2,$3,'ACTIVE','{}'::jsonb)", [trustCaseId, userA, trustRunId]),
      /permission denied/i
    );
  });

  it("keeps report jobs and immutable artifacts private and service-readable", async () => {
    await assert.rejects(asRole("anon", "", "select id from private.report_jobs where id=$1", [reportId]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "select id from private.report_jobs where id=$1", [reportId]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "select report_id from private.report_artifacts where report_id=$1", [reportId]), /permission denied/i);
    assert.equal((await asRole("service_role", "", "select id from private.report_jobs where id=$1", [reportId])).rowCount, 1);
    assert.equal((await asRole("service_role", "", "select report_id from private.report_artifacts where report_id=$1", [reportId])).rowCount, 1);
  });

  it("keeps the realtime event log private and service-readable", async () => {
    await assert.rejects(asRole("anon", "", "select event_id from private.realtime_events"), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "select event_id from private.realtime_events"), /permission denied/i);
    const serviceRead = await asRole("service_role", "", "select event_id from private.realtime_events");
    assert.equal(serviceRead.command, "SELECT");
    assert.ok(serviceRead.fields.some((field) => field.name === "event_id"));
  });

  it("allows the explicit service role to operate the private session store", async () => {
    const result = await asRole(
      "service_role",
      "",
      "insert into private.server_sessions(token_hash,user_id,idle_expires_at,expires_at) " +
      "values(decode(repeat('ab',32),'hex'),$1,now()+interval '5 minutes',now()+interval '1 hour') " +
      "on conflict(token_hash) do update set user_id=excluded.user_id returning user_id",
      [userA]
    );
    assert.equal(result.rows[0].user_id, userA);
  });
});
