import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CitationEntailmentEngine } from "../../src/lib/intelligence/trust/citationEntailmentEngine.js";
import { ClaimDecompositionEngine } from "../../src/lib/intelligence/trust/claimDecompositionEngine.js";
import {
  AiTrustModel,
  CITATION_STATUS,
  TRUST_STATUS
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustCitationEntailment", () => {
  it("should verify valid entailment when passage matches exact cohort and score", () => {
    const claims = ClaimDecompositionEngine.decompose("HCMUTE yêu cầu TOEIC 550 đối với K24.");
    const sources = [
      AiTrustModel.createSource({
        sourceId: "SRC_OFFICIAL_K24",
        sourceType: "OFFICIAL",
        authorityTier: 100
      })
    ];
    const spans = [
      AiTrustModel.createEvidenceSpan({
        evidenceId: "EVID_K24",
        sourceId: "SRC_OFFICIAL_K24",
        passage: "Quy chuẩn tốt nghiệp cho sinh viên khóa K24: Chuẩn đầu ra tiếng Anh đạt TOEIC 550 điểm."
      })
    ];

    const result = CitationEntailmentEngine.evaluateEntailment(claims, spans, sources);
    assert.strictEqual(result.verifiedClaims.length, 1);
    assert.strictEqual(result.verifiedClaims[0].status, TRUST_STATUS.AUTHORITATIVE);
    assert.strictEqual(result.claimCoverage, 1.0);
    assert.strictEqual(result.citationAccuracy, 1.0);
  });

  it("should return PARTIAL_ENTAILMENT when passage mentions score but lacks cohort scope", () => {
    const claims = ClaimDecompositionEngine.decompose("HCMUTE yêu cầu TOEIC 550 đối với K24.");
    const sources = [
      AiTrustModel.createSource({
        sourceId: "SRC_GENERIC",
        sourceType: "OFFICIAL",
        authorityTier: 100
      })
    ];
    const spans = [
      AiTrustModel.createEvidenceSpan({
        evidenceId: "EVID_GENERIC",
        sourceId: "SRC_GENERIC",
        passage: "Chuẩn tiếng Anh của trường đối với một số chương trình là TOEIC 550 điểm."
      })
    ];

    const result = CitationEntailmentEngine.evaluateEntailment(claims, spans, sources);
    assert.strictEqual(result.verifiedClaims[0].status, TRUST_STATUS.PARTIALLY_SUPPORTED);
    assert.strictEqual(result.citations[0].citationStatus, CITATION_STATUS.PARTIAL_ENTAILMENT);
  });

  it("should detect CITATION_MISMATCH when numeric scores differ", () => {
    const claims = ClaimDecompositionEngine.decompose("HCMUTE yêu cầu TOEIC 550 đối với K24.");
    const sources = [
      AiTrustModel.createSource({
        sourceId: "SRC_OFFICIAL",
        sourceType: "OFFICIAL"
      })
    ];
    const spans = [
      AiTrustModel.createEvidenceSpan({
        evidenceId: "EVID_DIFF",
        sourceId: "SRC_OFFICIAL",
        passage: "Chuẩn đầu ra K24 tiếng Anh chỉ yêu cầu TOEIC 450 điểm."
      })
    ];

    const result = CitationEntailmentEngine.evaluateEntailment(claims, spans, sources);
    assert.strictEqual(result.citations[0].citationStatus, CITATION_STATUS.CITATION_MISMATCH);
    assert.strictEqual(result.verifiedClaims[0].status, TRUST_STATUS.UNSUPPORTED);
  });
});
