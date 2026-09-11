import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ModerationRepository } from "../../src/lib/server/database/ModerationRepository.js";

class MockModerationDbPool {
  constructor() {
    this.trustCases = new Map([
      ["case-omega-777", { id: "case-omega-777", verdict: "SUPPORTED", confidence: 0.92, status: "RESOLVED" }],
    ]);
    this.communityContributions = new Map([
      ["contrib-101", { id: "contrib-101", author_id: "author-user-01", caseId: "case-omega-777", publication_state: "PUBLISHED" }],
    ]);
    this.moderationCases = new Map();
    this.votes = new Map();
    this.events = [];
    this.appeals = new Map();
    this.qualified = new Set(["mod-user-99", "mod-user-100", "coordinator-01", "appeal-reviewer-01", "author-user-01", "reporter-user-02"]);
    this.conflicts = new Set();
  }

  async connect() {
    return {
      query: (sql, params) => this.query(sql, params),
      release: () => {},
    };
  }

  async query(sql, params = []) {
    const statement = sql.replace(/\s+/g, " ").trim();
    if (/^(BEGIN|COMMIT|ROLLBACK)$/i.test(statement)) return { rowCount: 0, rows: [] };

    if (statement.includes("SELECT id, author_id, publication_state FROM public.community_contributions")) {
      const row = this.communityContributions.get(params[0]);
      return { rows: row ? [row] : [] };
    }

    if (statement.includes("INSERT INTO private.moderation_cases")) {
      const [targetType, targetId, targetAuthorId, reportedBy, targetAuthorSnapshot, reporterSnapshot, reasonCategory, details] = params;
      const id = `modcase-${this.moderationCases.size + 1}`;
      this.moderationCases.set(id, {
        id,
        target_type: targetType,
        target_id: targetId,
        target_author_id: targetAuthorId,
        reported_by: reportedBy,
        target_author_snapshot: targetAuthorSnapshot,
        reporter_snapshot: reporterSnapshot,
        reason_category: reasonCategory,
        details,
        status: "OPEN",
      });
      return { rows: [{ id }] };
    }

    if (statement.includes("SELECT a.id, a.moderation_case_id")) {
      const appeal = this.appeals.get(params[0]);
      const moderationCase = appeal && this.moderationCases.get(appeal.moderation_case_id);
      return {
        rows: appeal && moderationCase
          ? [{
            id: appeal.id,
            moderation_case_id: appeal.moderation_case_id,
            appellant_id: appeal.appellant_id,
            target_type: moderationCase.target_type,
            target_id: moderationCase.target_id,
            target_author_id: moderationCase.target_author_id,
            reported_by: moderationCase.reported_by,
            resolved_by: moderationCase.resolved_by,
            case_status: moderationCase.status,
          }]
          : [],
      };
    }

    if (statement.includes("FROM private.moderation_cases") && statement.includes("WHERE id = $1")) {
      const row = this.moderationCases.get(params[0]);
      return { rows: row ? [row] : [] };
    }

    if (statement.includes("SELECT coalesce(array_agg(r.code")) {
      const actorId = params[0];
      return { rows: [{ role_codes: this.qualified.has(actorId) ? ["MODERATOR"] : ["STUDENT"] }] };
    }

    if (statement.includes("FROM private.expert_verifications ev")) {
      const actorId = params[0];
      return {
        rows: this.qualified.has(actorId)
          ? [{ id: `verification-${actorId}`, domain_code: "GENERAL", status: "VERIFIED", qualification_state: "DOMAIN_VERIFIED", revision: 3, suspended_at: null, expires_at: null }]
          : [],
      };
    }

    if (statement.includes("count(DISTINCT coalesce(incident_cluster_id")) {
      return { rows: [{ sample_size: this.qualified.has(params[0]) ? 20 : 0 }] };
    }

    if (statement.includes("FROM private.expert_practice_decisions")) {
      return { rows: this.qualified.has(params[0]) ? [{ 1: 1 }] : [] };
    }

    if (statement.includes("FROM private.expert_assignments")) {
      return { rows: this.conflicts.has(`${params[0]}:${params[1]}`) ? [{ 1: 1 }] : [] };
    }

    if (statement.includes("SELECT id FROM private.moderation_votes")) {
      const key = `${params[0]}:${params[1]}`;
      return { rows: this.votes.has(key) ? [{ id: this.votes.get(key).id }] : [] };
    }

    if (statement.includes("INSERT INTO private.moderation_votes")) {
      const [caseId, moderatorId, action, rationale, policyVersion, qualificationState, qualitySufficiency, verificationId, verificationRevision, coiState, eligibilitySnapshot, moderatorSnapshot] = params;
      const id = `vote-${this.votes.size + 1}`;
      this.votes.set(`${caseId}:${moderatorId}`, {
        id,
        moderation_case_id: caseId,
        moderator_id: moderatorId,
        action,
        rationale,
        policy_version: policyVersion,
        qualification_state: qualificationState,
        quality_sufficiency: qualitySufficiency,
        verification_id: verificationId,
        verification_revision: verificationRevision,
        coi_state: coiState,
        eligibility_result: "ELIGIBLE",
        eligibility_snapshot: eligibilitySnapshot,
        moderator_snapshot: moderatorSnapshot,
      });
      return { rows: [] };
    }

    if (statement.includes("SELECT action, count(*)::int AS vote_count")) {
      const counts = new Map();
      for (const vote of this.votes.values()) {
        if (vote.moderation_case_id === params[0] && vote.eligibility_result === "ELIGIBLE") {
          counts.set(vote.action, (counts.get(vote.action) || 0) + 1);
        }
      }
      return { rows: [...counts.entries()].map(([action, vote_count]) => ({ action, vote_count })) };
    }

    if (statement.includes("UPDATE private.moderation_cases")) {
      const row = this.moderationCases.get(params[params.length - 1]);
      if (!row) return { rowCount: 0, rows: [] };
      if (statement.includes("status = 'RESOLVED'")) {
        row.status = "RESOLVED";
        row.resolution = params[0];
        row.resolved_by = params[1];
      } else {
        row.status = row.status === "OPEN" ? "IN_REVIEW" : row.status;
      }
      return { rowCount: 1, rows: [] };
    }

    if (statement.includes("UPDATE public.community_contributions")) {
      const row = this.communityContributions.get(params[0]);
      if (row) row.publication_state = "MODERATED";
      return { rowCount: row ? 1 : 0, rows: [] };
    }

    if (statement.includes("INSERT INTO public.moderation_appeals")) {
      const [caseId, appellantId, appellantSnapshot, reason] = params;
      const id = `appeal-${this.appeals.size + 1}`;
      this.appeals.set(id, { id, moderation_case_id: caseId, appellant_id: appellantId, appellant_snapshot: appellantSnapshot, reason, status: "PENDING" });
      return { rows: [{ id }] };
    }

    if (statement.includes("UPDATE public.moderation_appeals")) {
      const [status, reviewNotes, reviewedBy, reviewerSnapshot, appealId] = params;
      const appeal = this.appeals.get(appealId);
      if (appeal) Object.assign(appeal, { status, review_notes: reviewNotes, reviewed_by: reviewedBy, reviewer_snapshot: reviewerSnapshot });
      return { rowCount: appeal ? 1 : 0, rows: [] };
    }

    if (statement.includes("SELECT id, moderation_case_id, reason, status")) {
      const appellantId = params[0];
      return { rows: [...this.appeals.values()].filter((appeal) => appeal.appellant_id === appellantId) };
    }

    if (statement.includes("INSERT INTO private.moderation_events")) {
      this.events.push({ params });
      return { rowCount: 1, rows: [] };
    }

    return { rows: [] };
  }
}

async function createResolvedCase(repo, pool) {
  const created = await repo.createCase({
    targetType: "COMMUNITY_CONTRIBUTION",
    targetId: "contrib-101",
    // This client field is deliberately ignored by the repository.
    targetAuthorId: "spoofed-author",
    reportedBy: "reporter-user-02",
    reasonCategory: "SPAM",
    details: "Spam link detected in a community contribution",
  });
  await repo.recordVote({ caseId: created.id, moderatorId: "mod-user-99", action: "REMOVE_FROM_PUBLIC_PROJECTION", rationale: "Violates community guidelines" });
  await repo.recordVote({ caseId: created.id, moderatorId: "mod-user-100", action: "REMOVE_FROM_PUBLIC_PROJECTION", rationale: "Independent confirmation" });
  await repo.finalizeCase({ caseId: created.id, resolvedBy: "coordinator-01", resolution: "REMOVE_FROM_PUBLIC_PROJECTION" });
  assert.equal(pool.moderationCases.get(created.id).target_author_id, "author-user-01");
  return created.id;
}

describe("Moderation Workflow Security & Trust Boundary (F.2 integrity closure)", () => {
  it("resolves authors server-side, preserves Trust, and requires quorum before soft removal", async () => {
    const pool = new MockModerationDbPool();
    const repo = new ModerationRepository(pool);
    const trustBefore = { ...pool.trustCases.get("case-omega-777") };
    const created = await repo.createCase({
      targetType: "COMMUNITY_CONTRIBUTION",
      targetId: "contrib-101",
      targetAuthorId: "spoofed-author",
      reportedBy: "reporter-user-02",
      reasonCategory: "SPAM",
      details: "Spam link detected in a contribution",
    });
    assert.equal(created.targetAuthorId, "author-user-01");

    await repo.recordVote({ caseId: created.id, moderatorId: "mod-user-99", action: "REMOVE_FROM_PUBLIC_PROJECTION" });
    assert.equal(pool.communityContributions.get("contrib-101").publication_state, "PUBLISHED", "one vote cannot mutate the public projection");
    await assert.rejects(
      () => repo.finalizeCase({ caseId: created.id, resolvedBy: "coordinator-01", resolution: "REMOVE_FROM_PUBLIC_PROJECTION" }),
      /MODERATION_QUORUM_NOT_REACHED/
    );

    await repo.recordVote({ caseId: created.id, moderatorId: "mod-user-100", action: "REMOVE_FROM_PUBLIC_PROJECTION" });
    await assert.rejects(
      () => repo.recordVote({ caseId: created.id, moderatorId: "mod-user-100", action: "REMOVE_FROM_PUBLIC_PROJECTION" }),
      /DUPLICATE_MODERATION_VOTE/
    );
    await repo.finalizeCase({ caseId: created.id, resolvedBy: "coordinator-01", resolution: "REMOVE_FROM_PUBLIC_PROJECTION" });

    assert.equal(pool.communityContributions.get("contrib-101").publication_state, "MODERATED");
    assert.deepEqual(pool.trustCases.get("case-omega-777"), trustBefore, "community moderation must not mutate Trust");
  });

  it("rejects Trust targets and unsupported reaction/profile targets", async () => {
    const repo = new ModerationRepository(new MockModerationDbPool());
    for (const targetType of ["TRUST_CASE", "COMMUNITY_REACTION", "COMMUNITY_PROFILE"]) {
      await assert.rejects(
        () => repo.createCase({ targetType, targetId: "case-omega-777", reasonCategory: "OTHER" }),
        /MODERATION_TARGET_DISALLOWED/
      );
    }
  });

  it("requires qualification, quality, training, and conflict-free independence; stars alone are irrelevant", async () => {
    const pool = new MockModerationDbPool();
    const repo = new ModerationRepository(pool);
    const { id: caseId } = await repo.createCase({ targetType: "COMMUNITY_CONTRIBUTION", targetId: "contrib-101", reportedBy: "reporter-user-02", reasonCategory: "OTHER" });

    await assert.rejects(
      () => repo.recordVote({ caseId, moderatorId: "student-only", action: "KEEP" }),
      /MODERATION_ROLE_REQUIRED/
    );
    await assert.rejects(
      () => repo.recordVote({ caseId, moderatorId: "author-user-01", action: "KEEP" }),
      /SELF_MODERATION_FORBIDDEN/
    );
    await assert.rejects(
      () => repo.recordVote({ caseId, moderatorId: "reporter-user-02", action: "KEEP" }),
      /REPORTER_MODERATION_FORBIDDEN/
    );
    pool.conflicts.add(`mod-user-99:${caseId}`);
    await assert.rejects(
      () => repo.recordVote({ caseId, moderatorId: "mod-user-99", action: "KEEP" }),
      /CONFLICT_OF_INTEREST/
    );
  });

  it("restricts appeals to the authoritative author and requires an independent reviewer", async () => {
    const pool = new MockModerationDbPool();
    const repo = new ModerationRepository(pool);
    const caseId = await createResolvedCase(repo, pool);

    await assert.rejects(
      () => repo.submitAppeal({ caseId, appellantId: "unrelated-user", reason: "This user is not the contribution author." }),
      /APPEAL_OWNER_REQUIRED/
    );
    const { appealId } = await repo.submitAppeal({ caseId, appellantId: "author-user-01", reason: "The removed contribution is supported by the source." });
    await assert.rejects(
      () => repo.resolveAppeal({ appealId, reviewedBy: "coordinator-01", status: "ACCEPTED" }),
      /APPEAL_REVIEWER_NOT_INDEPENDENT/
    );
    await repo.resolveAppeal({ appealId, reviewedBy: "appeal-reviewer-01", status: "REJECTED", reviewNotes: "Independent review completed." });
    assert.equal(pool.appeals.get(appealId).status, "REJECTED");
  });
});
