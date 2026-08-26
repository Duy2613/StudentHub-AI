import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionClaimAligner } from "../../src/lib/intelligence/fusion/evidenceFusionClaimAligner.js";
import {
  CLAIM_RELATION_TYPE,
  KNOWLEDGE_LAYER
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionClaimAlignmentTestSuite", () => {
  it("should normalize diverse phrasing into the same canonical claim representation", () => {
    const claim1 = EvidenceFusionClaimAligner.normalizeClaim({
      statement: "Hạn chót nộp hồ sơ xét tốt nghiệp là ngày 05/09/2026."
    });
    const claim2 = EvidenceFusionClaimAligner.normalizeClaim({
      statement: "Submission deadline: September 5, 2026."
    });

    assert.strictEqual(claim1.subject, "DEADLINE");
    assert.strictEqual(claim1.value, "05/09/2026");
    assert.strictEqual(claim2.subject, "DEADLINE");
    assert.strictEqual(claim2.value, "05/09/2026");
    assert.strictEqual(EvidenceFusionClaimAligner.isEquivalent(claim1, claim2), true);
  });

  it("should correctly classify claim relation as SUPERSEDES for official timeline updates", () => {
    const oldOfficial = EvidenceFusionClaimAligner.normalizeClaim({
      statement: "Hạn chót là 30/08/2026 theo TB 120.",
      layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH
    });
    const newOfficial = EvidenceFusionClaimAligner.normalizeClaim({
      statement: "Hạn chót gia hạn đến 05/09/2026 theo TB 185.",
      layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH
    });

    const relation = EvidenceFusionClaimAligner.classifyRelation(newOfficial, oldOfficial);
    assert.strictEqual(relation, CLAIM_RELATION_TYPE.SUPERSEDES);
  });

  it("should correctly classify claim relation as QUALIFIES for distinct cohort scopes", () => {
    const k24Claim = EvidenceFusionClaimAligner.normalizeClaim({
      statement: "Chuẩn đầu ra TOEIC 500",
      scope: { cohort: "K24" }
    });
    const k26Claim = EvidenceFusionClaimAligner.normalizeClaim({
      statement: "Chuẩn đầu ra TOEIC 550",
      scope: { cohort: "K26" }
    });

    const relation = EvidenceFusionClaimAligner.classifyRelation(k26Claim, k24Claim);
    assert.strictEqual(relation, CLAIM_RELATION_TYPE.QUALIFIES);
  });
});
