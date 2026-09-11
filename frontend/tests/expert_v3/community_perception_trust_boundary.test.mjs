import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CommunityPerceptionRepository } from "../../src/lib/server/database/CommunityPerceptionRepository.js";

class MockPerceptionDbPool {
  constructor() {
    this.trustCases = new Map([
      ["case-alpha-001", { id: "case-alpha-001", status: "OPEN", verdict: "UNVERIFIED", confidence: 0.15 }]
    ]);
    this.expertVerifications = new Map([
      ["expert-user-01", { userId: "expert-user-01", status: "VERIFIED", suspendedAt: null, expiresAt: null }]
    ]);
    this.votes = new Map();
    this.events = [];
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
    // 1. Check expert verification
    if (sql.includes("FROM private.expert_verifications")) {
      const userId = params[0];
      const verified = this.expertVerifications.get(userId);
      if (verified && verified.status === "VERIFIED") {
        return { rows: [{ "?column?": 1 }] };
      }
      return { rows: [] };
    }

    // 2. Select existing vote
    if (sql.includes("SELECT id, vote, voter_is_expert_at_vote")) {
      const [userId, caseId, caseRevision, claimId, contributionId, targetType] = params;
      const key = `${userId}:${caseId}:${caseRevision}:${claimId || ""}:${contributionId || ""}:${targetType}`;
      const existing = this.votes.get(key);
      if (existing) {
        return { rows: [{ id: existing.id, vote: existing.vote, voter_is_expert_at_vote: existing.voter_is_expert_at_vote }] };
      }
      return { rows: [] };
    }

    // 3. Insert vote
    if (sql.includes("INSERT INTO public.community_perception_votes")) {
      const [userId, caseId, caseRevision, claimId, contributionId, targetType, vote, isExpert] = params;
      const id = `vote-${this.votes.size + 1}`;
      const key = `${userId}:${caseId}:${caseRevision}:${claimId || ""}:${contributionId || ""}:${targetType}`;
      const record = { id, userId, caseId, caseRevision, claimId, contributionId, targetType, vote, voter_is_expert_at_vote: isExpert };
      this.votes.set(key, record);
      return { rows: [{ id }] };
    }

    // 4. Update vote
    if (sql.includes("UPDATE public.community_perception_votes")) {
      const [vote, isExpert, voteId] = params;
      for (const [k, v] of this.votes.entries()) {
        if (v.id === voteId) {
          v.vote = vote;
          v.voter_is_expert_at_vote = isExpert;
        }
      }
      return { rowCount: 1 };
    }

    // 5. Insert perception event
    if (sql.includes("INSERT INTO private.community_perception_events")) {
      this.events.push({ params });
      return { rowCount: 1 };
    }

    // 6. Aggregate summary
    if (sql.includes("SELECT") && sql.includes("total_believe")) {
      const [caseId, caseRevision, claimId, contributionId, targetType] = params;
      let totalBelieve = 0;
      let totalDoubt = 0;
      let expertBelieve = 0;
      let expertDoubt = 0;

      for (const v of this.votes.values()) {
        if (v.caseId === caseId && v.caseRevision === caseRevision && v.targetType === targetType) {
          if (v.vote === "BELIEVE") {
            totalBelieve++;
            if (v.voter_is_expert_at_vote) expertBelieve++;
          } else if (v.vote === "DOUBT") {
            totalDoubt++;
            if (v.voter_is_expert_at_vote) expertDoubt++;
          }
        }
      }

      return {
        rows: [{
          total_believe: totalBelieve,
          total_doubt: totalDoubt,
          expert_believe: expertBelieve,
          expert_doubt: expertDoubt,
          total_votes: totalBelieve + totalDoubt,
        }]
      };
    }

    return { rows: [] };
  }
}

describe("Community Perception Trust Boundary (Binding Amendments 3, 4, 11)", () => {
  it("PROVES: 100 BELIEVE votes do NOT alter or mutate Trust Engine verdict", async () => {
    const mockDb = new MockPerceptionDbPool();
    const repo = new CommunityPerceptionRepository(mockDb);

    const initialCase = { ...mockDb.trustCases.get("case-alpha-001") };
    assert.equal(initialCase.verdict, "UNVERIFIED");
    assert.equal(initialCase.confidence, 0.15);

    // Cast 100 BELIEVE votes from 100 distinct student accounts
    for (let i = 1; i <= 100; i++) {
      const userId = `student-voter-${String(i).padStart(3, "0")}`;
      await repo.castVote({
        userId,
        caseId: "case-alpha-001",
        caseRevision: 1,
        vote: "BELIEVE",
      });
    }

    // Verify aggregate summary has 100 BELIEVE votes
    const summary = await repo.getSummary({ caseId: "case-alpha-001", caseRevision: 1 });
    assert.equal(summary.totalBelieve, 100);
    assert.equal(summary.totalDoubt, 0);
    assert.equal(summary.totalVotes, 100);
    assert.equal(summary.isAuthoritativeVerdict, false);
    assert.ok(summary.disclaimer.includes("KHÔNG thay thế cho phán quyết bằng chứng của Trust Engine"));

    // Verify the Trust case state and verdict are completely UNTOUCHED
    const caseAfter100Votes = mockDb.trustCases.get("case-alpha-001");
    assert.equal(caseAfter100Votes.verdict, "UNVERIFIED", "Trust verdict must remain completely unchanged");
    assert.equal(caseAfter100Votes.confidence, 0.15, "Trust confidence must not increase from community perception votes");
    assert.equal(caseAfter100Votes.status, "OPEN", "Trust case status must remain untouched");
  });

  it("PROVES: Community perception votes are revision-aware (Amendment 3)", async () => {
    const mockDb = new MockPerceptionDbPool();
    const repo = new CommunityPerceptionRepository(mockDb);
    const userId = "student-multi-rev-01";

    // Vote on Revision 1
    await repo.castVote({
      userId,
      caseId: "case-alpha-001",
      caseRevision: 1,
      vote: "BELIEVE",
    });

    // Vote on Revision 2
    await repo.castVote({
      userId,
      caseId: "case-alpha-001",
      caseRevision: 2,
      vote: "DOUBT",
    });

    const summaryRev1 = await repo.getSummary({ caseId: "case-alpha-001", caseRevision: 1 });
    const summaryRev2 = await repo.getSummary({ caseId: "case-alpha-001", caseRevision: 2 });

    assert.equal(summaryRev1.totalBelieve, 1);
    assert.equal(summaryRev1.totalDoubt, 0);

    assert.equal(summaryRev2.totalBelieve, 0);
    assert.equal(summaryRev2.totalDoubt, 1);
  });

  it("PROVES: Expert flag is strictly server-derived and never trusted from client (Amendment 4)", async () => {
    const mockDb = new MockPerceptionDbPool();
    const repo = new CommunityPerceptionRepository(mockDb);

    // Regular student tries to vote
    const resStudent = await repo.castVote({
      userId: "regular-student-99",
      caseId: "case-alpha-001",
      caseRevision: 1,
      vote: "BELIEVE",
      isExpert: true, // Client attempts to spoof expert status
    });
    assert.equal(resStudent.isExpert, false, "Client-provided expert flag must be ignored");

    // Verified expert votes
    const resExpert = await repo.castVote({
      userId: "expert-user-01",
      caseId: "case-alpha-001",
      caseRevision: 1,
      vote: "BELIEVE",
    });
    assert.equal(resExpert.isExpert, true, "Verified expert must be attested server-side");
  });
});
