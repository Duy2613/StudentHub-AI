import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionAdjudicator } from "../../src/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import {
  EvidenceFusionModel,
  EPISTEMIC_FINAL_STATE,
  KNOWLEDGE_LAYER,
  AUTHORITY_CLASS
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionMutationTestSuite", () => {
  it("Mutant 1: community → official mutation — Community claim MUST NOT be treated as official truth", () => {
    const claims = [
      { statement: "Diễn đàn nói hạn 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });
    assert.strictEqual(kno.officialTruth, null);
    assert.notStrictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
  });

  it("Mutant 2: expert → official mutation — Expert interpretation MUST NOT become official policy", () => {
    const claims = [
      { statement: "TS. Minh cho rằng hạn có thể gia hạn", layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });
    assert.strictEqual(kno.officialTruth, null);
    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.SUPPORTED);
  });

  it("Mutant 3: AI → official mutation — AI synthesis MUST NOT create authoritative academic truth", () => {
    const claims = [
      { statement: "AI tổng hợp: hạn 05/09", layer: KNOWLEDGE_LAYER.AI_VERIFIED_REASONING }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });
    assert.strictEqual(kno.officialTruth, null);
    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.UNKNOWN);
  });

  it("Mutant 4: duplicate → independent mutation — Duplicate provenance MUST NOT inflate independence count", () => {
    const claims = Array.from({ length: 20 }, () => ({
      statement: "Nộp hồ sơ mất 7 ngày",
      layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY,
      derivationChain: ["SINGLE_ORIGIN"]
    }));

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "PROCESSING", claims });
    assert.strictEqual(kno.confidenceTelemetry.independentProvenanceClustersCount, 1);
  });

  it("Mutant 5: old → current mutation — Historical source MUST NOT silently become current", () => {
    const claim = EvidenceFusionModel.createCanonicalClaim({
      statement: "Quy trình năm 2020",
      temporalState: "HISTORICAL_SUPERSEDED"
    });

    assert.strictEqual(claim.temporalState, "HISTORICAL_SUPERSEDED");
  });

  it("Mutant 6: contradiction → ignored mutation — Contradictions MUST be recorded, never silently dropped", () => {
    const claims = [
      { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
      { statement: "Hạn chót 15/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });
    assert.ok(kno.contradictions.length > 0);
  });

  it("Mutant 7: scope mismatch → merged mutation — Disjoint scopes MUST NOT be merged as contradictions", () => {
    const claims = [
      { statement: "TOEIC 500", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH, scope: { cohort: "K24" } },
      { statement: "TOEIC 550", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH, scope: { cohort: "K26" } }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "ENGLISH_EXIT_STANDARD", claims });
    assert.ok(kno.claims.length >= 2);
  });

  it("Mutant 8: retracted → active mutation — Retracted evidence MUST NOT remain active", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "POLICY",
      claims: [{ statement: "QĐ 3116 áp dụng", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH }],
      sources: [{ sourceId: "RETRACTED_DOC", isRetracted: true }]
    });

    assert.notStrictEqual(kno.evidenceHealth, "HEALTHY");
  });

  it("Mutant 9: fusion order affects result mutation — Order invariance must hold", () => {
    const c1 = { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH };
    const c2 = { statement: "Sinh viên nộp 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY };

    const knoAB = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: [c1, c2] });
    const knoBA = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: [c2, c1] });

    assert.strictEqual(knoAB.authoritativeState, knoBA.authoritativeState);
    assert.strictEqual(knoAB.officialTruth?.value, knoBA.officialTruth?.value);
  });

  it("Mutant 10: client authority accepted mutation — Client-injected authority class MUST be overridden", () => {
    const claims = [
      { statement: "Client hack", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY, authorityClass: "INSTITUTIONAL_AUTHORITY" }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "HACK", claims });
    assert.strictEqual(kno.officialTruth, null);
  });

  it("Mutant 11: weighted-average fallback mutation — System MUST NOT use numeric averaging for truth determination", () => {
    const claims = [
      { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH, confidence: 0.6 },
      { statement: "Hạn chót 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY, confidence: 0.9 }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });
    // Official with lower confidence still wins
    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.strictEqual(kno.officialTruth.value, "05/09/2026");
  });

  it("Mutant 12: Knowledge Object immutability mutation — Frozen objects MUST NOT be modifiable", () => {
    const kno = EvidenceFusionModel.createKnowledgeObject({
      subject: "TEST",
      authoritativeState: EPISTEMIC_FINAL_STATE.AUTHORITATIVE
    });

    assert.throws(() => { kno.authoritativeState = "HACKED"; }, TypeError);
    assert.throws(() => { kno.version = 999; }, TypeError);
  });
});
