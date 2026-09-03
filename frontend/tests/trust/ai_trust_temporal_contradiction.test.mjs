import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TemporalContradictionEngine } from "../../src/lib/intelligence/trust/temporalContradictionEngine.js";
import {
  AiTrustModel,
  TEMPORAL_STATUS,
  TRUST_STATUS
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustTemporalContradiction", () => {
  it("should mark claims OUTDATED when grounded in superseded policy documents", () => {
    const claims = [
      AiTrustModel.createClaim({
        claimId: "C1",
        text: "Hạn nộp hồ sơ là 30/08/2026",
        citationIds: ["SRC_OLD_V1"],
        status: TRUST_STATUS.AUTHORITATIVE
      })
    ];
    const sources = [
      AiTrustModel.createSource({
        sourceId: "SRC_OLD_V1",
        temporalStatus: TEMPORAL_STATUS.SUPERSEDED,
        supersededBy: "SRC_NEW_V2"
      })
    ];

    const result = TemporalContradictionEngine.analyzeTemporalAndContradictions(claims, sources);
    assert.strictEqual(result.claimsWithTemporalStatus[0].status, TRUST_STATUS.OUTDATED);
    assert.strictEqual(result.claimsWithTemporalStatus[0].temporalStatus, TEMPORAL_STATUS.SUPERSEDED);
  });

  it("should detect true contradiction when two active official claims disagree on numeric values for same scope", () => {
    const claims = [
      AiTrustModel.createClaim({
        claimId: "C1",
        predicate: "REQUIRES_LANGUAGE_SCORE",
        scope: "K24",
        numericValue: 550,
        status: TRUST_STATUS.AUTHORITATIVE
      }),
      AiTrustModel.createClaim({
        claimId: "C2",
        predicate: "REQUIRES_LANGUAGE_SCORE",
        scope: "K24",
        numericValue: 500,
        status: TRUST_STATUS.AUTHORITATIVE
      })
    ];
    const sources = [
      AiTrustModel.createSource({ sourceId: "SRC_A", authorityTier: 100 }),
      AiTrustModel.createSource({ sourceId: "SRC_B", authorityTier: 100 })
    ];

    const result = TemporalContradictionEngine.analyzeTemporalAndContradictions(claims, sources);
    assert.strictEqual(result.hasOfficialConflict, true);
    assert.strictEqual(result.contradictions.length, 1);
    assert.strictEqual(result.contradictionSeverity, 1.0);
  });

  it("should mark claims RETRACTED when supporting source is retracted", () => {
    const claims = [
      AiTrustModel.createClaim({
        claimId: "C1",
        text: "Quy định tạm thời",
        citationIds: ["SRC_RETRACTED"]
      })
    ];
    const sources = [
      AiTrustModel.createSource({
        sourceId: "SRC_RETRACTED",
        isRetracted: true
      })
    ];

    const result = TemporalContradictionEngine.analyzeTemporalAndContradictions(claims, sources);
    assert.strictEqual(result.claimsWithTemporalStatus[0].status, TRUST_STATUS.RETRACTED);
  });
});
