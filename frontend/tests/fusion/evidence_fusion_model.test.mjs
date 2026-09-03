import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EvidenceFusionModel,
  KNOWLEDGE_LAYER,
  AUTHORITY_CLASS,
  CLAIM_RELATION_TYPE,
  EPISTEMIC_FINAL_STATE,
  EVIDENCE_HEALTH_STATE
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionModelTestSuite", () => {
  it("should create immutable canonical claims with appropriate authority class and hash", () => {
    const claim = EvidenceFusionModel.createCanonicalClaim({
      subject: "DEADLINE",
      predicate: "EQUALS_DATE",
      value: "05/09/2026",
      layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH
    });

    assert.strictEqual(claim.subject, "DEADLINE");
    assert.strictEqual(claim.layer, KNOWLEDGE_LAYER.OFFICIAL_TRUTH);
    assert.strictEqual(claim.authorityClass, AUTHORITY_CLASS.INSTITUTIONAL_AUTHORITY);
    assert.ok(claim.claimHash);
    assert.throws(() => { claim.subject = "MUTATED"; }, TypeError);
  });

  it("should create canonical Knowledge Objects with complete four-layer components", () => {
    const kno = EvidenceFusionModel.createKnowledgeObject({
      subject: "GRADUATION_DEADLINE",
      topic: "GRADUATION_DOSSIER_REVIEW",
      authoritativeState: EPISTEMIC_FINAL_STATE.AUTHORITATIVE,
      evidenceHealth: EVIDENCE_HEALTH_STATE.HEALTHY,
      officialTruth: { statement: "Hạn chót 05/09/2026", value: "05/09/2026" }
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.strictEqual(kno.evidenceHealth, EVIDENCE_HEALTH_STATE.HEALTHY);
    assert.strictEqual(kno.officialTruth.value, "05/09/2026");
    assert.throws(() => { kno.version = 99; }, TypeError);
  });

  it("should redact private student metadata and contact information in redactForPublic", () => {
    const rawKno = {
      knowledgeObjectId: "KNO_TEST_PRIVACY",
      communityReality: {
        firstHandEvidence: [
          { authorId: "SV2411001", ip: "192.168.1.1", statement: "Nộp mất 7 ngày" }
        ]
      },
      expertInterpretation: [
        { expertId: "EXP_01", privateEmail: "prof@private.com", name: "TS. Minh" }
      ]
    };

    const redacted = EvidenceFusionModel.redactForPublic(rawKno);
    assert.strictEqual(redacted.communityReality.firstHandEvidence[0].authorId, undefined);
    assert.strictEqual(redacted.communityReality.firstHandEvidence[0].ip, undefined);
    assert.strictEqual(redacted.expertInterpretation[0].privateEmail, undefined);
    assert.strictEqual(redacted.expertInterpretation[0].name, "TS. Minh");
  });
});
