import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateQualityScore, canSubmitAssessment } from "../../src/lib/communityExpert/promaxDomain.js";

describe("Expert Trust Network V3 Anti-Gaming & Sybil Resistance Contracts", () => {
  it("prevents sybil attack: identical idempotency keys are deduplicated", () => {
    // Attacker tries to submit the same event 50 times to pump score
    const duplicateEvents = Array.from({ length: 50 }, () => ({
      idempotencyKey: "sybil-duplicate-key-001",
      eventType: "ADJUDICATION",
      outcome: "SUPPORT",
      weight: 1,
    }));

    const result = calculateQualityScore(duplicateEvents, { minSample: 20 });
    assert.equal(result.sampleSize, 1, "50 duplicate submissions must only count as 1 event unit");
    assert.equal(result.insufficientData, true, "1 unit cannot meet the 20-unit sufficiency threshold");
  });

  it("prevents cluster flooding: correlated events in one incident cluster are normalized", () => {
    // Attacker tries to create 10 correlated sub-claims inside a single incident cluster
    const clusterEvents = Array.from({ length: 10 }, (_, i) => ({
      idempotencyKey: `cluster-event-${i}`,
      incidentClusterId: "incident-cluster-fraud-attempt",
      eventType: "ADJUDICATION",
      outcome: "SUPPORT",
      weight: 1,
    }));

    const result = calculateQualityScore(clusterEvents, { minSample: 20 });
    assert.equal(result.sampleSize, 1, "Correlated incident cluster must count as 1 independent unit");
  });

  it("prevents self-review: expert cannot evaluate their own work", () => {
    const selfReviewCheck = canSubmitAssessment({
      expertId: "expert-999",
      reviewerId: "expert-999", // Self review
      verifiedDomain: "AI_ML",
      domainStatus: "VERIFIED",
      assignment: {
        expertId: "expert-999",
        status: "ASSIGNED",
        caseRevision: 1,
        conflictOfInterest: false,
      },
      caseRevision: 1,
      coiDeclared: true,
    });

    assert.equal(selfReviewCheck.ok, false);
    assert.equal(selfReviewCheck.code, "SELF_REVIEW_FORBIDDEN");
  });
});
