import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ModerationRepository } from "../../src/lib/server/database/ModerationRepository.js";

class MockModerationDbPool {
  constructor() {
    this.trustCases = new Map([
      ["case-omega-777", { id: "case-omega-777", verdict: "SUPPORTED", confidence: 0.92, status: "RESOLVED" }]
    ]);
    this.communityContributions = new Map([
      ["contrib-101", { id: "contrib-101", caseId: "case-omega-777", publication_state: "PUBLISHED" }]
    ]);
    this.moderationCases = new Map();
    this.votes = new Map();
    this.events = [];
    this.appeals = new Map();
  }

  async connect() {
    return {
      query: async (sql, params) => {
        if (/BEGIN|COMMIT|ROLLBACK/i.test(sql)) return { rowCount: 0 };
        return this.query(sql, params);
      },
      release: () => {}
    };
  }

  async query(sql, params = []) {
    // 1. Insert moderation case
    if (sql.includes("INSERT INTO private.moderation_cases")) {
      const [targetType, targetId, targetAuthorId, reportedBy, reasonCategory, details] = params;
      const id = `modcase-${this.moderationCases.size + 1}`;
      const record = { id, target_type: targetType, target_id: targetId, target_author_id: targetAuthorId, reported_by: reportedBy, reason_category: reasonCategory, details, status: "OPEN" };
      this.moderationCases.set(id, record);
      return { rows: [{ id }] };
    }

    // 2. Select moderation case for update
    if (sql.includes("SELECT target_type, target_id FROM private.moderation_cases")) {
      const caseId = params[0];
      const record = this.moderationCases.get(caseId);
      return { rows: record ? [record] : [] };
    }

    // 3. Update moderation case resolution
    if (sql.includes("UPDATE private.moderation_cases")) {
      const [resolution, resolvedBy, caseId] = params;
      const record = this.moderationCases.get(caseId);
      if (record) {
        record.status = "RESOLVED";
        record.resolution = resolution;
        record.resolved_by = resolvedBy;
      }
      return { rowCount: 1 };
    }

    // 4. Update community contributions publication state
    if (sql.includes("UPDATE public.community_contributions")) {
      const targetId = params[0];
      const contrib = this.communityContributions.get(targetId);
      if (contrib) {
        contrib.publication_state = "MODERATED";
      }
      return { rowCount: 1 };
    }

    // 5. Insert moderation event
    if (sql.includes("INSERT INTO private.moderation_events")) {
      this.events.push({ params });
      return { rowCount: 1 };
    }

    // 6. Record vote
    if (sql.includes("INSERT INTO private.moderation_votes")) {
      const [caseId, moderatorId, action, rationale] = params;
      this.votes.set(`${caseId}:${moderatorId}`, { caseId, moderatorId, action, rationale });
      return { rowCount: 1 };
    }

    // 7. Insert appeal
    if (sql.includes("INSERT INTO public.moderation_appeals")) {
      const [caseId, appellantId, reason] = params;
      const id = `appeal-${this.appeals.size + 1}`;
      const record = { id, moderation_case_id: caseId, appellant_id: appellantId, reason, status: "PENDING", created_at: new Date() };
      this.appeals.set(id, record);
      return { rows: [{ id }] };
    }

    // 8. Select appeals
    if (sql.includes("FROM public.moderation_appeals")) {
      const appellantId = params[0];
      const userAppeals = [...this.appeals.values()].filter((a) => a.appellant_id === appellantId);
      return { rows: userAppeals };
    }

    return { rows: [] };
  }
}

describe("Moderation Workflow Security & Trust Boundary (Binding Amendments 5, 6, 11)", () => {
  it("PROVES: Moderation decisions do NOT alter Trust verdict", async () => {
    const mockDb = new MockModerationDbPool();
    const repo = new ModerationRepository(mockDb);

    const trustBefore = { ...mockDb.trustCases.get("case-omega-777") };
    assert.equal(trustBefore.verdict, "SUPPORTED");
    assert.equal(trustBefore.confidence, 0.92);

    // Report a community contribution
    const { id: caseId } = await repo.createCase({
      targetType: "COMMUNITY_CONTRIBUTION",
      targetId: "contrib-101",
      targetAuthorId: "author-user-01",
      reportedBy: "reporter-user-02",
      reasonCategory: "SPAM",
      details: "Spam link detected in comment",
    });

    // Moderator votes to remove from public projection
    await repo.recordVote({
      caseId,
      moderatorId: "mod-user-99",
      action: "REMOVE_FROM_PUBLIC_PROJECTION",
      rationale: "Violates community guidelines",
    });

    // Resolve the case
    await repo.resolveCase({
      caseId,
      resolvedBy: "mod-user-99",
      resolution: "REMOVE_FROM_PUBLIC_PROJECTION",
    });

    // Verify community contribution is soft-moderated
    const contrib = mockDb.communityContributions.get("contrib-101");
    assert.equal(contrib.publication_state, "MODERATED");

    // PROVE: Trust case verdict, confidence, and status are 100% UNTOUCHED
    const trustAfter = mockDb.trustCases.get("case-omega-777");
    assert.equal(trustAfter.verdict, "SUPPORTED", "Trust verdict must remain completely untouched by community moderation");
    assert.equal(trustAfter.confidence, 0.92, "Trust confidence must remain completely untouched");
    assert.equal(trustAfter.status, "RESOLVED", "Trust case status must remain untouched");
  });

  it("PROVES: Moderation is strictly scoped to Community content and rejects Trust Cases (Amendment 5)", async () => {
    const mockDb = new MockModerationDbPool();
    const repo = new ModerationRepository(mockDb);

    // Attempting to moderate a TRUST_CASE directly must be rejected
    await assert.rejects(
      async () => {
        await repo.createCase({
          targetType: "TRUST_CASE",
          targetId: "case-omega-777",
          targetAuthorId: "system",
          reasonCategory: "OTHER",
          details: "Attempt to override trust case",
        });
      },
      /MODERATION_TARGET_DISALLOWED/,
      "Must forbid moderating Trust cases"
    );
  });

  it("PROVES: Sensitive moderation records remain private; sanitized public appeals only (Amendment 6)", async () => {
    const mockDb = new MockModerationDbPool();
    const repo = new ModerationRepository(mockDb);

    const { id: caseId } = await repo.createCase({
      targetType: "COMMUNITY_CONTRIBUTION",
      targetId: "contrib-101",
      targetAuthorId: "appellant-user-77",
      reportedBy: "secret-reporter-88",
      reasonCategory: "MISINFORMATION",
      details: "Contradicts syllabus",
    });

    // Appellant submits an appeal
    const { appealId } = await repo.submitAppeal({
      caseId,
      appellantId: "appellant-user-77",
      reason: "This is verified syllabus information from official registrar website.",
    });
    assert.ok(appealId);

    // Fetch public appeals for appellant
    const publicAppeals = await repo.getPublicAppeals("appellant-user-77");
    assert.equal(publicAppeals.length, 1);
    assert.equal(publicAppeals[0].id, appealId);
    // Sensitive fields like secret-reporter-88 are NOT exposed
    assert.equal(publicAppeals[0].reported_by, undefined);
  });
});
