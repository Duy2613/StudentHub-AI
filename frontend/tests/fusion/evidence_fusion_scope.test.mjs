import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionScopeEngine } from "../../src/lib/intelligence/fusion/evidenceFusionScopeEngine.js";

describe("EvidenceFusionScopeTestSuite", () => {
  it("should recognize that K24, K25, K20 claims are distinct scope partitions and not contradictions", () => {
    const scopeK24 = { cohort: "K24", faculty: "KHOA_CNTT" };
    const scopeK25 = { cohort: "K25", faculty: "KHOA_CNTT" };

    const relation = EvidenceFusionScopeEngine.evaluateScopeRelation(scopeK24, scopeK25);
    assert.strictEqual(relation.isDisjoint, true);
    assert.strictEqual(relation.cohortMatch, false);
  });

  it("should partition a collection of claims by scope dimension cleanly", () => {
    const claims = [
      { subject: "TOEIC", scope: { cohort: "K24" }, value: 500 },
      { subject: "TOEIC", scope: { cohort: "K26" }, value: 550 },
      { subject: "TOEIC", scope: { cohort: "K24" }, value: 500 }
    ];

    const partitions = EvidenceFusionScopeEngine.partitionByScope(claims);
    assert.strictEqual(partitions.length, 2);
  });
});
