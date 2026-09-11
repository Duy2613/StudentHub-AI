import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { ExpertProgressionRepository } from "../../src/lib/server/database/ExpertProgressionRepository.js";

const root = new URL("../../../", import.meta.url);
const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");

class DomainProjectionPool {
  constructor() {
    this.events = new Map();
    this.projections = new Map();
  }

  async query(sql, params = []) {
    if (sql.includes("FROM private.expert_quality_events")) {
      const [userId, domainCode] = params;
      return { rows: (this.events.get(userId) || []).filter((row) => row.domain_code === domainCode) };
    }
    if (sql.includes("SELECT count(*)::int as count FROM public.expert_assessments")) return { rows: [{ count: 0 }] };
    if (sql.includes("INSERT INTO public.expert_progression_projections")) {
      const [userId, domainCode, adjudicatedCount, upheldCount, overturnedCount, score, starLevel, sufficiencyState, missionsCompletedCount] = params;
      this.projections.set(`${userId}:${domainCode}`, {
        user_id: userId,
        domain_code: domainCode,
        adjudicated_count: adjudicatedCount,
        upheld_count: upheldCount,
        overturned_count: overturnedCount,
        raw_quality_score: score,
        star_level: starLevel,
        sufficiency_state: sufficiencyState,
        missions_completed_count: missionsCompletedCount,
      });
      return { rowCount: 1 };
    }
    if (sql.includes("SELECT * FROM public.expert_progression_projections")) {
      const row = this.projections.get(`${params[0]}:${params[1]}`);
      return { rows: row ? [row] : [] };
    }
    return { rows: [] };
  }
}

test("F.2 migration closes composite domain identity, target consistency, and server-only grants", async () => {
  const migration = await read("database/migrations/202609110002_expert_v3_integrity_closure.sql");
  const progressionRepository = await read("frontend/src/lib/server/database/ExpertProgressionRepository.js");
  const normalized = migration.replace(/\s+/g, " ").toLowerCase();

  assert.match(normalized, /primary key \(user_id, domain_code\)/);
  assert.match(progressionRepository, /ON CONFLICT \(user_id, domain_code\)/i);
  assert.doesNotMatch(progressionRepository, /ON CONFLICT \(user_id\) DO UPDATE/i);
  assert.match(normalized, /community_perception_votes_target_consistency_check/);
  assert.match(normalized, /community_perception_events_target_consistency_check/);
  assert.match(normalized, /revoke insert, update, delete on public\.community_perception_votes from public, anon, authenticated/);
  assert.match(normalized, /drop policy if exists community_perception_write_policy/);
  assert.match(normalized, /alter table private\.moderation_cases enable row level security/);
  assert.match(normalized, /revoke all on private\.community_perception_events, private\.moderation_cases/);
  assert.match(normalized, /qualification_state/);
  assert.match(normalized, /quality_sufficiency/);
  assert.match(normalized, /verification_revision/);
  assert.match(normalized, /coi_state/);
  assert.match(normalized, /eligibility_result/);
  assert.match(normalized, /on delete set null/);
  assert.match(normalized, /moderation_votes_append_only/);
});

test("simultaneous domains produce independent progression rows", async () => {
  const pool = new DomainProjectionPool();
  const userId = "expert-simultaneous-domain-user";
  const makeEvents = (domainCode, outcome) => Array.from({ length: 20 }, (_, index) => ({
    id: `${domainCode}-${index}`,
    user_id: userId,
    domain_code: domainCode,
    event_type: "ADJUDICATION",
    outcome,
    weight: 1,
    idempotency_key: `${domainCode}-key-${index}`,
    created_at: new Date(index),
  }));
  pool.events.set(userId, [
    ...makeEvents("AI_ML", "SUPPORT"),
    ...makeEvents("CYBERSECURITY", "CONTRADICT"),
  ]);

  const repo = new ExpertProgressionRepository(pool);
  const ai = await repo.recalculateProgression(userId, "AI_ML");
  const cyber = await repo.recalculateProgression(userId, "CYBERSECURITY");

  assert.equal(ai.domainCode, "AI_ML");
  assert.equal(cyber.domainCode, "CYBERSECURITY");
  assert.equal(ai.adjudicatedCount, 20);
  assert.equal(cyber.adjudicatedCount, 20);
  assert.equal(pool.projections.size, 2, "one domain recalculation must not overwrite the other domain row");
  assert.ok(pool.projections.has(`${userId}:AI_ML`));
  assert.ok(pool.projections.has(`${userId}:CYBERSECURITY`));
});

test("F.2 authority routes use canonical server eligibility and separate finalization", async () => {
  const moderation = await read("frontend/src/lib/server/database/ModerationRepository.js");
  const casesRoute = await read("frontend/src/app/api/moderation/cases/route.js");
  const voteRoute = await read("frontend/src/app/api/moderation/vote/route.js");
  const policyText = await read("artifacts/expert-v3/MODERATION_POLICY.json");
  const policy = JSON.parse(policyText.replace(/^\uFEFF/, ""));

  assert.deepEqual(policy.scope.allowedTargets, ["COMMUNITY_CONTRIBUTION"]);
  assert.equal(policy.eligibility.roleAloneIsInsufficient, true);
  assert.equal(policy.quorum.minimumIndependentReviewers, 2);
  assert.equal(policy.quorum.castVoteAndFinalizeAreSeparate, true);
  assert.match(moderation, /evaluateModerationEligibility/);
  assert.match(moderation, /MODERATION_TRAINING_REQUIRED/);
  assert.match(moderation, /QUALITY_SUFFICIENCY_REQUIRED/);
  assert.match(moderation, /SELF_MODERATION_FORBIDDEN/);
  assert.match(moderation, /REPORTER_MODERATION_FORBIDDEN/);
  assert.match(moderation, /CONFLICT_OF_INTEREST/);
  assert.match(moderation, /MODERATION_QUORUM_NOT_REACHED/);
  assert.match(moderation, /eligibility_snapshot/);
  assert.doesNotMatch(casesRoute, /targetAuthorId/);
  assert.doesNotMatch(casesRoute, /\["ADMIN", "MODERATOR", "EXPERT"\]/);
  assert.doesNotMatch(voteRoute, /\["ADMIN", "MODERATOR", "EXPERT"\]/);
});
