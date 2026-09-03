import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionAdjudicator } from "../../src/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import {
  EPISTEMIC_FINAL_STATE,
  KNOWLEDGE_LAYER
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionPropertyTestSuite", () => {
  it("Property 1: Idempotency — Fusing identical input claims produces identical Knowledge Objects", () => {
    const claims = [
      { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
      { statement: "Xác nhận K24", layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION }
    ];

    const kno1 = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });
    const kno2 = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims });

    assert.strictEqual(kno1.authoritativeState, kno2.authoritativeState);
    assert.strictEqual(kno1.officialTruth?.value, kno2.officialTruth?.value);
  });

  it("Property 2: Order Invariance — Shuffling input claim order has zero effect on authoritative outcome", () => {
    const c1 = { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH };
    const c2 = { statement: "Sinh viên nộp 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY };

    const knoA = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: [c1, c2] });
    const knoB = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: [c2, c1] });

    assert.strictEqual(knoA.authoritativeState, knoB.authoritativeState);
    assert.strictEqual(knoA.officialTruth?.value, knoB.officialTruth?.value);
  });

  it("Property 3: Client Injected Authority Immunity — Unverified source cannot claim INSTITUTIONAL_AUTHORITY", () => {
    const hackedClaim = {
      statement: "Quy định mới hủy môn",
      layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY,
      authorityClass: "INSTITUTIONAL_AUTHORITY" // Injected
    };

    const kno = EvidenceFusionAdjudicator.adjudicate({ subject: "POLICY", claims: [hackedClaim] });
    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.CONTEXTUALIZED);
    assert.strictEqual(kno.officialTruth, null);
  });

  it("Property 4: Non-Democratic Invariance — Upvote counts have zero weight in truth determination", () => {
    const claims0 = [
      { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
      { statement: "Hạn chót 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY, upvotes: 0 }
    ];
    const claimsMillion = [
      { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
      { statement: "Hạn chót 10/09", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY, upvotes: 1000000 }
    ];

    const kno0 = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: claims0 });
    const knoMillion = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: claimsMillion });

    assert.strictEqual(kno0.authoritativeState, knoMillion.authoritativeState);
    assert.strictEqual(kno0.officialTruth?.value, knoMillion.officialTruth?.value);
  });
});
