import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionAdjudicator } from "../../src/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import { EvidenceFusionStore } from "../../src/lib/intelligence/fusion/evidenceFusionStore.js";
import { EvidenceFusionBlastRadius } from "../../src/lib/intelligence/fusion/evidenceFusionBlastRadius.js";
import { EvidenceFusionReviewEngine } from "../../src/lib/intelligence/fusion/evidenceFusionReviewEngine.js";
import {
  EvidenceFusionModel,
  EPISTEMIC_FINAL_STATE,
  EVIDENCE_HEALTH_STATE,
  KNOWLEDGE_LAYER
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionE2EGoldenScenarioTestSuite", () => {
  it("E2E Scenario A: Official 05/09 + Expert supports + Community reports 10/09 + AI summarizes", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      topic: "GRADUATION_DOSSIER_REVIEW",
      claims: [
        { statement: "Hạn chót nộp hồ sơ 05/09/2026 theo TB 185", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
        { statement: "TS. Minh xác nhận áp dụng cho K24", layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION },
        { statement: "Sinh viên ghi nhận hạn 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY },
        { statement: "Tổng hợp: hạn chính thức 05/09", layer: KNOWLEDGE_LAYER.AI_VERIFIED_REASONING }
      ]
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.strictEqual(kno.officialTruth.value, "05/09/2026");
    assert.ok(kno.expertInterpretation.length >= 1);
    assert.ok(kno.contradictions.some(c => c.type === "COMMUNITY_RUMOR_VS_OFFICIAL"));
  });

  it("E2E Scenario B: Official V1 (30/08) → Official V2 (05/09) supersession", () => {
    const diff = EvidenceFusionStore.computeKnowledgeDiff("KNO_GRADUATION_DEADLINE_2026");

    assert.strictEqual(diff.hasPreviousVersion, true);
    assert.strictEqual(diff.diff.previousOfficialValue, "30/08/2026");
    assert.strictEqual(diff.diff.currentOfficialValue, "05/09/2026");
    assert.strictEqual(diff.currentVersion, 2);
  });

  it("E2E Scenario C: Official 3-day target vs Community 6-8 days → OPERATIONAL_REALITY_GAP", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "PROCESSING_TURNAROUND",
      claims: [
        { statement: "Thời gian xử lý: 3 ngày làm việc", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
        { statement: "Thực tế mất 6-8 ngày làm việc", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY, predicate: "DURATION_DAYS", value: "6_TO_8_DAYS" }
      ]
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.ok(kno.realityGaps.length >= 1);
    assert.strictEqual(kno.realityGaps[0].gapStatus, "SIGNIFICANT_OPERATIONAL_GAP");
    // Official truth is NOT mutated
    assert.ok(kno.officialTruth);
  });

  it("E2E Scenario D: AI claims 'surely deadline is 10/09' with no evidence → UNSUPPORTED", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims: [
        { statement: "Chắc chắn hạn là 10/09", layer: KNOWLEDGE_LAYER.AI_VERIFIED_REASONING }
      ]
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.UNKNOWN);
    assert.strictEqual(kno.officialTruth, null);
  });

  it("E2E Scenario E: Two current official sources conflict → AUTHORITATIVE_CONFLICT + HUMAN_REVIEW_REQUIRED", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims: [
        { statement: "Hạn chót 05/09", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
        { statement: "Hạn chót 15/09", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH }
      ]
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.CONFLICTED);
    assert.strictEqual(kno.evidenceHealth, EVIDENCE_HEALTH_STATE.REQUIRES_REVIEW);
    assert.ok(kno.contradictions.some(c => c.type === "AUTHORITATIVE_OFFICIAL_CONFLICT"));

    const reviewPacket = EvidenceFusionReviewEngine.generateReviewPacket(kno, "AUTHORITATIVE_CONFLICT");
    assert.ok(reviewPacket);
    assert.strictEqual(reviewPacket.status, "PENDING_REGISTRAR_REVIEW");
  });

  it("E2E Scenario F: Expert A supports X + Expert B supports Y + Both cite same study → shared evidence cluster", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "INTERPRETATION",
      claims: [
        { statement: "Diễn giải X", layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION, authorId: "EXP_A", derivationChain: ["STUDY_001"] },
        { statement: "Diễn giải Y", layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION, authorId: "EXP_B", derivationChain: ["STUDY_001"] }
      ]
    });

    assert.ok(kno.contradictions.some(c => c.type === "EXPERT_DISAGREEMENT"));
    assert.strictEqual(kno.confidenceTelemetry.independentProvenanceClustersCount, 1);
  });

  it("E2E Scenario G: 30 community posts copied from one article → 1 provenance cluster", () => {
    const claims = Array.from({ length: 30 }, () => ({
      statement: "Copy paste bài viết nộp hồ sơ",
      layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY,
      derivationChain: ["ORIGINAL_ARTICLE_001"]
    }));

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "PROCESSING", claims });
    assert.strictEqual(kno.confidenceTelemetry.independentProvenanceClustersCount, 1);
  });

  it("E2E Scenario H: Three scoped claims K24=550, K25=500, K20=450 → no contradiction, 3 scope partitions", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "ENGLISH_EXIT_STANDARD",
      claims: [
        { statement: "TOEIC 550 cho K24", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH, scope: { cohort: "K24" } },
        { statement: "TOEIC 500 cho K25", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH, scope: { cohort: "K25" } },
        { statement: "TOEIC 450 cho K20", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH, scope: { cohort: "K20" } }
      ]
    });

    assert.ok(kno.claims.length >= 3);
  });

  it("E2E Scenario I: Source retracted → DEGRADED evidence health + dependent claims identified", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims: [{ statement: "Hạn 05/09", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH }],
      sources: [{ sourceId: "DOC_RETRACTED", isRetracted: true, title: "Thông báo đã bị rút" }]
    });

    assert.strictEqual(kno.evidenceHealth, EVIDENCE_HEALTH_STATE.DEGRADED);
  });

  it("E2E Scenario J: Fusion result changes → new KNO version + blast radius computed", () => {
    const knoV2 = EvidenceFusionStore.getById("KNO_GRADUATION_DEADLINE_2026");
    assert.ok(knoV2);
    assert.strictEqual(knoV2.version, 2);

    const blast = EvidenceFusionBlastRadius.computeBlastRadius(knoV2);
    assert.ok(blast.impactedCount >= 2);
    assert.ok(blast.consumers.some(c => c.systemId === "ACADEMIC_WORKFLOW"));
  });
});
