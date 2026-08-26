import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionStore } from "../../src/lib/intelligence/fusion/evidenceFusionStore.js";

describe("EvidenceFusionUIContractTestSuite", () => {
  it("should provide all Knowledge Objects via getAll() for server-side rendering", () => {
    const all = EvidenceFusionStore.getAll({ redactPrivate: true });
    assert.ok(Array.isArray(all));
    assert.ok(all.length >= 2);

    for (const kno of all) {
      assert.ok(kno.knowledgeObjectId);
      assert.ok(kno.authoritativeState);
      assert.ok(kno.evidenceHealth);
    }
  });

  it("should return null for non-existent Knowledge Object IDs", () => {
    const missing = EvidenceFusionStore.getById("KNO_DOES_NOT_EXIST");
    assert.strictEqual(missing, null);
  });

  it("should return structured Knowledge Diff with explanation for version history", () => {
    const diff = EvidenceFusionStore.computeKnowledgeDiff("KNO_GRADUATION_DEADLINE_2026");
    assert.ok(diff);
    assert.ok(diff.diff);
    assert.ok(diff.diff.explanation);
    assert.strictEqual(typeof diff.diff.officialTruthChanged, "boolean");
  });

  it("should ensure Knowledge Object contract includes all required canonical fields", () => {
    const kno = EvidenceFusionStore.getById("KNO_GRADUATION_DEADLINE_2026");
    assert.ok(kno);

    const requiredFields = [
      "knowledgeObjectId", "version", "subject", "topic",
      "authoritativeState", "evidenceHealth",
      "officialTruth", "expertInterpretation", "communityReality",
      "claims", "supportingEvidence", "contradictions",
      "realityGaps", "unknowns", "limitations",
      "scope", "temporalState", "policyVersion",
      "fusionPolicyVersion", "sourceSetHash",
      "confidenceTelemetry", "generatedAt", "lastVerifiedAt"
    ];

    for (const field of requiredFields) {
      assert.ok(field in kno, `Missing required field: ${field}`);
    }
  });
});
