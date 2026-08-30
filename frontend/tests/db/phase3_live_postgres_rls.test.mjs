import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import pg from "pg";

const liveUrl = process.env.STUDENTHUB_RLS_TEST_DATABASE_URL;
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const migration = readFileSync(join(repositoryRoot, "database", "migrations", "202608270001_v2_authority_foundation.sql"), "utf8");
const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
let client;

async function asRole(role, subject, sql, values = []) {
  await client.query("begin");
  try {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [subject || ""]);
    const result = await client.query(sql, values);
    await client.query("rollback");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

describe("PHASE 3 — live PostgreSQL/RLS proof", { skip: !liveUrl && "STUDENTHUB_RLS_TEST_DATABASE_URL is not configured" }, () => {
  before(async () => {
    client = new pg.Client({ connectionString: liveUrl, ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } });
    await client.connect();
    await client.query(migration);
    await client.query(`insert into auth.users(id, aud, role, email, created_at, updated_at)
      values($1,'authenticated','authenticated',$2,now(),now()),($3,'authenticated','authenticated',$4,now(),now())
      on conflict(id) do nothing`, [userA, `rls-a-${userA}@example.test`, userB, `rls-b-${userB}@example.test`]);
  });

  after(async () => {
    if (!client) return;
    await client.query("delete from auth.users where id=any($1::uuid[])", [[userA, userB]]);
    await client.end();
  });

  it("denies anonymous private profile/session access", async () => {
    assert.equal((await asRole("anon", "", "select id from public.profiles where id=$1", [userA])).rowCount, 0);
    await assert.rejects(asRole("anon", "", "select user_id from private.server_sessions"), /permission denied/i);
  });

  it("allows own profile access but denies cross-user read and update", async () => {
    assert.equal((await asRole("authenticated", userA, "select id from public.profiles where id=$1", [userA])).rowCount, 1);
    assert.equal((await asRole("authenticated", userA, "select id from public.profiles where id=$1", [userB])).rowCount, 0);
    assert.equal((await asRole("authenticated", userA, "update public.profiles set display_name='blocked' where id=$1", [userB])).rowCount, 0);
  });

  it("denies role, expert verification, reputation and foreign-session authority", async () => {
    await assert.rejects(asRole("authenticated", userA, "insert into private.user_roles(user_id, role_id) select $1,id from private.roles where code='ADMIN'", [userA]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "insert into private.reputation_events(user_id,domain_code,event_type,delta,reason) values($1,'GLOBAL','SELF',999,'blocked')", [userA]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "insert into private.expert_verifications(user_id,domain_code,status) values($1,'AI','VERIFIED')", [userA]), /permission denied/i);
    await assert.rejects(asRole("authenticated", userA, "select user_id from private.server_sessions where user_id=$1", [userB]), /permission denied/i);
  });

  it("allows the explicit service role to operate the private session store", async () => {
    const result = await asRole("service_role", "", `insert into private.server_sessions(token_hash,user_id,idle_expires_at,expires_at)
      values(decode(repeat('ab',32),'hex'),$1,now()+interval '5 minutes',now()+interval '1 hour')
      on conflict(token_hash) do update set user_id=excluded.user_id returning user_id`, [userA]);
    assert.equal(result.rows[0].user_id, userA);
  });
});
