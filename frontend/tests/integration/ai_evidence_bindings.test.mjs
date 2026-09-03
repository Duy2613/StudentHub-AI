import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEvidenceReferenceValidator,
  validateEvidenceReferences,
} from "../../src/lib/ai-gateway/evidenceBindings.js";

describe("AI evidence binding boundary", () => {
  it("accepts only references present in the current evidence scope", () => {
    const validate = createEvidenceReferenceValidator({
      evidence: [{ evidenceId: "evidence-1", observationId: "l3:observation-1" }],
      sources: [{ sourceId: "source-1", sourceDocumentId: "source_document:1" }],
    });
    assert.equal(validate({ evidenceIds: ["evidence-1"], sourceDocumentIds: ["source_document:1"] }), true);
    assert.equal(validate({ citations: [{ evidenceId: "l3:observation-1", sourceId: "source-1" }] }), true);
  });

  it("rejects fabricated citations and malformed reference fields", () => {
    const unknown = validateEvidenceReferences({ evidenceRefs: ["fabricated-evidence"] }, { knownEvidenceIds: ["evidence-1"] });
    assert.equal(unknown.ok, false);
    assert.equal(unknown.code, "AI_OUTPUT_UNKNOWN_EVIDENCE_REFERENCE");
    const malformed = validateEvidenceReferences({ evidenceIds: "evidence-1" }, { knownEvidenceIds: ["evidence-1"] });
    assert.equal(malformed.ok, false);
    assert.equal(malformed.code, "EVIDENCEIDS_MUST_BE_ARRAY");
  });

  it("fails closed for explicit citations when no evidence is in scope", () => {
    const result = validateEvidenceReferences({ citations: ["source-that-was-not-retrieved"] });
    assert.equal(result.ok, false);
    assert.deepEqual(result.unknownEvidenceIds, ["source-that-was-not-retrieved"]);
  });
});

