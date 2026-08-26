import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SourceIndependenceEngine } from "../../src/lib/intelligence/trust/sourceIndependenceEngine.js";
import { AiTrustModel, SOURCE_TYPE } from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustSourceIndependence", () => {
  it("should cluster syndicated sources sharing identical text hash into a single provenance cluster", () => {
    const identicalPassage = "Quy định chuẩn đầu ra ngoại ngữ K24: TOEIC 550 điểm.";
    const sources = [
      AiTrustModel.createSource({ sourceId: "SRC_WEB_1", url: "https://web1.com", sourceType: SOURCE_TYPE.SEARCH_RESULT }),
      AiTrustModel.createSource({ sourceId: "SRC_WEB_2", url: "https://web2.com", sourceType: SOURCE_TYPE.SEARCH_RESULT }),
      AiTrustModel.createSource({ sourceId: "SRC_WEB_3", url: "https://web3.com", sourceType: SOURCE_TYPE.SEARCH_RESULT })
    ];
    const spans = [
      AiTrustModel.createEvidenceSpan({ evidenceId: "E1", sourceId: "SRC_WEB_1", passage: identicalPassage }),
      AiTrustModel.createEvidenceSpan({ evidenceId: "E2", sourceId: "SRC_WEB_2", passage: identicalPassage }),
      AiTrustModel.createEvidenceSpan({ evidenceId: "E3", sourceId: "SRC_WEB_3", passage: identicalPassage })
    ];

    const result = SourceIndependenceEngine.analyzeIndependence(sources, spans);

    assert.strictEqual(result.provenanceClusters.length, 1);
    assert.strictEqual(result.provenanceClusters[0].isSyndicated, true);
    assert.strictEqual(result.provenanceClusters[0].memberCount, 3);
    assert.strictEqual(result.effectiveIndependentCount, 1);
    assert.strictEqual(result.sourceIndependenceScore, 0.33);
  });

  it("should detect circular source laundering when forum and web search share identical text", () => {
    const launderedText = "Theo diễn đàn sinh viên, nộp bằng trước ngày 15.";
    const sources = [
      AiTrustModel.createSource({ sourceId: "SRC_FORUM", sourceType: SOURCE_TYPE.COMMUNITY }),
      AiTrustModel.createSource({ sourceId: "SRC_BLOG", sourceType: SOURCE_TYPE.OFFICIAL })
    ];
    const spans = [
      AiTrustModel.createEvidenceSpan({ evidenceId: "E_FORUM", sourceId: "SRC_FORUM", passage: launderedText }),
      AiTrustModel.createEvidenceSpan({ evidenceId: "E_BLOG", sourceId: "SRC_BLOG", passage: launderedText })
    ];

    const result = SourceIndependenceEngine.analyzeIndependence(sources, spans);
    assert.ok(result.launderingAlerts.length > 0);
  });
});
