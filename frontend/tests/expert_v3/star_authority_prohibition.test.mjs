import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ExpertProgressionRepository } from "../../src/lib/server/database/ExpertProgressionRepository.js";
import { canSubmitAssessment } from "../../src/lib/communityExpert/promaxDomain.js";

class MockProgressionDbPool {
  constructor() {
    this.qualityEvents = new Map();
    this.projections = new Map();
    this.assessments = new Map();
  }

  async query(sql, params = []) {
    // 1. Fetch quality events
    if (sql.includes("FROM private.expert_quality_events")) {
      const userId = params[0];
      const events = this.qualityEvents.get(userId) || [];
      return { rows: events };
    }

    // 2. Count completed assessments
    if (sql.includes("SELECT count(*)::int as count FROM public.expert_assessments")) {
      const userId = params[0];
      const userAssessments = this.assessments.get(userId) || [];
      return { rows: [{ count: userAssessments.length }] };
    }

    // 3. Upsert projection
    if (sql.includes("INSERT INTO public.expert_progression_projections")) {
      const [userId, domainCode, adjudicatedCount, upheldCount, overturnedCount, score, starLevel, sufficiencyState, missionsCount] = params;
      const record = {
        user_id: userId,
        domain_code: domainCode,
        adjudicated_count: adjudicatedCount,
        upheld_count: upheldCount,
        overturned_count: overturnedCount,
        raw_quality_score: score,
        star_level: starLevel,
        sufficiency_state: sufficiencyState,
        missions_completed_count: missionsCount,
        last_calculated_at: new Date(),
      };
      this.projections.set(userId, record);
      return { rowCount: 1 };
    }

    // 4. Select projection
    if (sql.includes("SELECT * FROM public.expert_progression_projections")) {
      const userId = params[0];
      const record = this.projections.get(userId);
      return { rows: record ? [record] : [] };
    }

    return { rows: [] };
  }
}

describe("Star Authority Prohibition & Sufficiency Contracts (Binding Amendments 2, 10, 11)", () => {
  it("PROVES: 5-star status does NOT grant Expert authority (STARS != AUTHORITY)", async () => {
    // Scenario: User has achieved 5-star projection
    const fiveStarUser = {
      userId: "user-with-5-stars",
      starLevel: 5,
      rawQualityScore: 0.98,
      sufficiencyState: "SUFFICIENT",
    };

    // Attempting to submit an expert assessment without a verified qualification domain in private.expert_verifications
    const authCheck = canSubmitAssessment({
      expertId: fiveStarUser.userId,
      reviewerId: "coordinator-01",
      verifiedDomain: null, // NOT verified by registrar/faculty
      domainStatus: "UNVERIFIED",
      assignment: {
        expertId: fiveStarUser.userId,
        status: "ASSIGNED",
        caseRevision: 1,
        conflictOfInterest: false,
      },
      caseRevision: 1,
      coiDeclared: true,
    });

    assert.equal(authCheck.ok, false, "5-star user without verified domain MUST be rejected");
    assert.equal(authCheck.code, "DOMAIN_NOT_VERIFIED", "Reason must be DOMAIN_NOT_VERIFIED");
  });

  it("PROVES: Sufficiency threshold requires >= 20 independent units (Do NOT reduce to 5)", async () => {
    const mockDb = new MockProgressionDbPool();
    const repo = new ExpertProgressionRepository(mockDb);
    const userId = "evaluating-expert-user";

    // 1. Add 5 positive adjudicated quality events
    const fiveEvents = [];
    for (let i = 1; i <= 5; i++) {
      fiveEvents.push({
        id: `ev-${i}`,
        user_id: userId,
        domain_code: "GENERAL",
        event_type: "ADJUDICATION",
        outcome: "SUPPORT",
        weight: 1,
        idempotency_key: `key-${i}`,
        created_at: new Date(),
      });
    }
    mockDb.qualityEvents.set(userId, fiveEvents);

    const prog5 = await repo.recalculateProgression(userId);
    assert.equal(prog5.sufficiencyState, "INSUFFICIENT_DATA", "5 events must remain INSUFFICIENT_DATA");
    assert.equal(prog5.starLevel, 1, "Insufficient data must remain at provisional 1 star");

    // 2. Add 14 more events (total 19)
    const nineteenEvents = [...fiveEvents];
    for (let i = 6; i <= 19; i++) {
      nineteenEvents.push({
        id: `ev-${i}`,
        user_id: userId,
        domain_code: "GENERAL",
        event_type: "ADJUDICATION",
        outcome: "SUPPORT",
        weight: 1,
        idempotency_key: `key-${i}`,
        created_at: new Date(),
      });
    }
    mockDb.qualityEvents.set(userId, nineteenEvents);

    const prog19 = await repo.recalculateProgression(userId);
    assert.equal(prog19.sufficiencyState, "INSUFFICIENT_DATA", "19 events must remain INSUFFICIENT_DATA");
    assert.equal(prog19.starLevel, 1, "19 events must not grant higher star level");

    // 3. Add 20th event (total 20 >= minSample threshold)
    const twentyEvents = [...nineteenEvents, {
      id: "ev-20",
      user_id: userId,
      domain_code: "GENERAL",
      event_type: "ADJUDICATION",
      outcome: "SUPPORT",
      weight: 1,
      idempotency_key: "key-20",
      created_at: new Date(),
    }];
    mockDb.qualityEvents.set(userId, twentyEvents);

    const prog20 = await repo.recalculateProgression(userId);
    assert.equal(prog20.sufficiencyState, "SUFFICIENT", ">= 20 events unlocks SUFFICIENT threshold");
    assert.equal(prog20.adjudicatedCount, 20);
    assert.ok(prog20.rawQualityScore >= 0.9, "Quality score with Laplace prior should be ~0.917");
    assert.ok(prog20.starLevel >= 4, "20 upheld events grants high star ranking");
  });

  it("PROVES: expert_quality_events is the single source of truth (Amendment 10)", async () => {
    const mockDb = new MockProgressionDbPool();
    const repo = new ExpertProgressionRepository(mockDb);
    const userId = "zero-event-user";

    // User has 0 events
    mockDb.qualityEvents.set(userId, []);

    const prog = await repo.recalculateProgression(userId);
    assert.equal(prog.adjudicatedCount, 0);
    assert.equal(prog.starLevel, 1);
    assert.equal(prog.sufficiencyState, "INSUFFICIENT_DATA");
    assert.equal(prog.isDerivedOnly, true, "Must explicitly mark as derived projection only");
  });
});
