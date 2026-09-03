import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";
import { AiTrustStore } from "../../src/lib/intelligence/trust/aiTrustStore.js";
import { TRUST_STATUS } from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustEngineE2E", () => {
  it("should run full end-to-end evaluation pipeline with claim-level grounding and store persistence", () => {
    AiTrustStore.clear();

    const evalResult = AiTrustEngine.evaluate({
      query: "Quy định chuẩn đầu ra TOEIC khóa K24 là bao nhiêu?",
      rawAnswer: "HCMUTE quy định chuẩn đầu ra tiếng Anh đối với khóa K24 là TOEIC 550 điểm.",
      sources: [
        {
          sourceId: "SRC_REG_K24",
          sourceType: "OFFICIAL",
          authorityTier: 100,
          url: "https://daotao.hcmute.edu.vn/k24",
          publisher: "Phòng Đào Tạo"
        }
      ],
      evidenceSpans: [
        {
          evidenceId: "EVID_1",
          sourceId: "SRC_REG_K24",
          passage: "Sinh viên khóa K24 phải đạt chuẩn đầu ra ngoại ngữ tối thiểu TOEIC 550 điểm."
        }
      ],
      stakeLevel: "HIGH"
    });

    assert.strictEqual(evalResult.trustStatus, TRUST_STATUS.AUTHORITATIVE);
    assert.strictEqual(evalResult.claims.length, 1);
    assert.strictEqual(evalResult.claims[0].status, TRUST_STATUS.AUTHORITATIVE);
    assert.strictEqual(evalResult.metrics.claimCoverage, 1.0);
    assert.strictEqual(evalResult.metrics.citationAccuracy, 1.0);
    assert.strictEqual(evalResult.metrics.authorityScore, 100);

    // Save and retrieve from store
    AiTrustStore.saveEvaluation(evalResult);
    const retrieved = AiTrustStore.getEvaluation(evalResult.evaluationId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.evaluationId, evalResult.evaluationId);
    assert.strictEqual(retrieved.trustStatus, TRUST_STATUS.AUTHORITATIVE);
  });
});
