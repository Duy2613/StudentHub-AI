import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, describe, it } from "node:test";
import pg from "pg";
import { assertStagingEnvironment } from "../../src/lib/security/environment/stagingEnvironment.js";

const liveDatabaseEnvName = process.env.STUDENTHUB_RLS_TEST_DATABASE_URL
  ? "STUDENTHUB_RLS_TEST_DATABASE_URL"
  : "DATABASE_URL";
const liveUrl = process.env[liveDatabaseEnvName];
if (liveUrl) {
  assertStagingEnvironment({
    databaseEnvNames: [liveDatabaseEnvName],
    requireDatabase: true,
    requireLiveOptIn: true,
    command: "phase 3 live RLS test",
  });
}
const requiredTables = Object.freeze([
  "private.audit_events",
  "private.expert_domains",
  "private.expert_verifications",
  "private.reputation_events",
  "private.roles",
  "private.security_outbox",
  "private.server_sessions",
  "private.user_roles",
  "public.case_entities",
  "public.case_follows",
  "public.case_inputs",
  "public.claim_sources",
  "public.claims",
  "public.comments",
  "public.decision_options",
  "public.decision_scenarios",
  "public.entities",
  "public.evidence",
  "public.evidence_passport_events",
  "public.evidence_passports",
  "public.expert_assessments",
  "public.expert_profiles",
  "public.institutions",
  "public.notifications",
  "public.posts",
  "public.profiles",
  "public.screenshot_objects",
  "public.trust_cases",
  "public.votes",
]);

const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
const expert = crypto.randomUUID();
const moderator = crypto.randomUUID();
const admin = crypto.randomUUID();
const passportId = crypto.randomUUID();
const postId = crypto.randomUUID();
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

async function assertAppliedSchema() {
  const tables = await client.query(
    "select table_schema || '.' || table_name as qualified_name " +
    "from information_schema.tables " +
    "where table_schema in ('public','private') " +
    "and (table_schema || '.' || table_name) = any($1::text[]) " +
    "order by qualified_name",
    [requiredTables],
  );
  assert.deepEqual(
    tables.rows.map((row) => row.qualified_name),
    [...requiredTables].sort(),
    "canonical staging schema is incomplete; no migrations are executed by this test",
  );

  const bucket = await client.query(
    "select id, public from storage.buckets where id=$1",
    ["trust-screenshots-private"],
  );
  assert.deepEqual(bucket.rows, [{ id: "trust-screenshots-private", public: false }]);

  const trigger = await client.query(
    "select 1 " +
    "from pg_trigger t " +
    "join pg_class c on c.oid=t.tgrelid " +
    "join pg_namespace n on n.oid=c.relnamespace " +
    "where n.nspname='private' and c.relname='security_outbox' " +
    "and t.tgname='trg_security_outbox_state_transition' and not t.tgisinternal",
  );
  assert.equal(trigger.rowCount, 1, "canonical security outbox trigger is missing");
}

describe("PHASE 3 — live PostgreSQL/RLS proof", { skip: !liveUrl && "STUDENTHUB_RLS_TEST_DATABASE_URL is not configured" }, () => {
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
    await assertAppliedSchema();
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
  });

  after(async () => {
    if (!client) return;
    await client.query("delete from public.evidence_passport_events where passport_id=$1", [passportId]);
    await client.query("delete from public.evidence_passports where id=$1", [passportId]);
    await client.query("delete from public.posts where id=$1", [postId]);
    await client.query("delete from public.expert_profiles where user_id=$1", [expert]);
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
