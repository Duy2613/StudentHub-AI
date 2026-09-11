import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";
import { after, before, describe, it } from "node:test";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const liveUrl = configureDisposableDatabase({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
const liveGate = disposableLiveGate({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
let client;

describe("F.2 Expert Trust Network V3 live integrity boundary", liveGate, () => {
  before(async () => {
    client = new pg.Client({ connectionString: liveUrl, ssl: false });
    await client.connect();
  });

  after(async () => {
    await client?.end();
  });

  it("has domain-scoped progression, private moderation RLS, and server-only perception grants", async () => {
    const primary = await client.query(`
      select pg_get_constraintdef(con.oid) as definition
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace ns on ns.oid = rel.relnamespace
       where ns.nspname = 'public'
         and rel.relname = 'expert_progression_projections'
         and con.contype = 'p'`);
    assert.equal(primary.rows[0]?.definition, "PRIMARY KEY (user_id, domain_code)");

    const grants = await client.query(`
      select has_table_privilege('authenticated', 'public.community_perception_votes', 'SELECT') as can_select,
             has_table_privilege('authenticated', 'public.community_perception_votes', 'INSERT') as can_insert,
             has_table_privilege('authenticated', 'private.moderation_cases', 'SELECT') as can_read_private_cases`);
    assert.equal(grants.rows[0].can_select, true);
    assert.equal(grants.rows[0].can_insert, false);
    assert.equal(grants.rows[0].can_read_private_cases, false);

    const rls = await client.query(`
      select relname, relrowsecurity
        from pg_class rel join pg_namespace ns on ns.oid = rel.relnamespace
       where (ns.nspname = 'private' and rel.relname in ('community_perception_events','moderation_cases','moderation_votes','moderation_events'))
          or (ns.nspname = 'public' and rel.relname = 'community_perception_votes')
       order by relname`);
    assert.equal(rls.rows.length, 5);
    assert.ok(rls.rows.every((row) => row.relrowsecurity === true));
  });

  it("denies authenticated direct expert-flag spoofing and forces trusted writes to the derived flag", async () => {
    const userId = crypto.randomUUID();
    const caseId = crypto.randomUUID();

    let denied = false;
    await client.query("begin");
    try {
      await client.query(
        "insert into auth.users(id,aud,role,email,created_at,updated_at) values($1,$2,$2,$3,now(),now())",
        [userId, "authenticated", `f2-live-spoof-${userId}@example.test`]
      );
      await client.query(
        "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,$3,$4)",
        [caseId, userId, "INSUFFICIENT_EVIDENCE", "PUBLIC"]
      );
      await client.query("set local role authenticated");
      await client.query("select set_config($1,$2,true)", ["request.jwt.claim.sub", userId]);
      try {
        await client.query(
          "insert into public.community_perception_votes(user_id,case_id,case_revision,target_type,vote,voter_is_expert_at_vote) values($1,$2,1,$3,$4,true)",
          [userId, caseId, "CASE", "BELIEVE"]
        );
      } catch (error) {
        denied = error.code === "42501" || /permission denied/i.test(error.message);
      }
      await client.query("rollback");
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    }
    assert.equal(denied, true);

    await client.query("begin");
    try {
      await client.query(
        "insert into auth.users(id,aud,role,email,created_at,updated_at) values($1,$2,$2,$3,now(),now())",
        [userId, "authenticated", `f2-live-service-${userId}@example.test`]
      );
      await client.query(
        "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,$3,$4)",
        [caseId, userId, "INSUFFICIENT_EVIDENCE", "PUBLIC"]
      );
      await client.query("set local role service_role");
      const result = await client.query(
        "insert into public.community_perception_votes(user_id,case_id,case_revision,target_type,vote,voter_is_expert_at_vote) values($1,$2,1,$3,$4,true) returning voter_is_expert_at_vote",
        [userId, caseId, "CASE", "BELIEVE"]
      );
      assert.equal(result.rows[0].voter_is_expert_at_vote, false);
      await client.query("rollback");
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    }
  });
});
