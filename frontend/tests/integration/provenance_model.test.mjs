import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCanonicalEvidence,
  buildCanonicalTrustProjection,
} from "../../src/lib/ai-trust/integrations/canonicalTrustProjection.js";
import { contentFingerprint, sourceDocumentIdFor } from "../../src/lib/ai-trust/provenance/index.js";

describe("canonical provenance model", () => {
  it("keeps one source document and separate Layer 3/Layer 4 observations", () => {
    const layers = {
      layer3: {
        evidence: [{ evidenceId: "web-observation", claimId: "claim-1", sourceId: "same-source", sourceUrl: "https://example.com/article", sourceTitle: "Article", excerpt: "Web observation", relation: "SUPPORTS", providerStatus: "SUCCESS", liveEvidence: true }],
        sources: [{ sourceId: "same-source", url: "https://example.com/article", title: "Article", providerStatus: "SUCCESS" }],
      },
      layer4: {
        legacyIntegration: {
          status: "COMPLETED",
          providerStatus: "SUCCESS",
          providerId: "research-provider",
          rawVerdict: "UNKNOWN",
          assessmentConfidence: 0.4,
          sources: [{ id: "same-source", url: "https://example.com/article", title: "Article" }],
        },
      },
    };
    const evidence = buildCanonicalEvidence({ requestId: "provenance-run", input: { type: "url", content: "https://example.com/article" }, layers });
    const projection = buildCanonicalTrustProjection({
      requestId: "provenance-run",
      input: { type: "url", content: "https://example.com/article" },
      pipeline: { pipelineStatus: "PARTIAL", stages: {} },
      layers,
      finalDecision: { security: "UNKNOWN", truth: "INSUFFICIENT_EVIDENCE", action: "REVIEW" },
    });
    const sourceDocumentIds = new Set(projection.provenance.sourceDocuments.map((item) => item.sourceDocumentId));
    const observations = projection.provenance.evidenceObservations.filter((item) => item.sourceDocumentId === sourceDocumentIdFor({ url: "https://example.com/article" }));
    assert.equal(evidence.length, 3);
    assert.equal(sourceDocumentIds.size, 1);
    assert.equal(observations.length, 2);
    assert.deepEqual(new Set(observations.map((item) => item.origin)), new Set(["LAYER_3_WEB_EVIDENCE", "LAYER_4_INDEPENDENT_RESEARCH"]));
    assert.notEqual(observations[0].observationId, observations[1].observationId);
    assert.ok(observations.every((item) => item.retrievalRunId && item.providerId));
    assert.equal(projection.provenance.claimEvidenceLinks.length, 1);
    assert.equal(projection.provenance.decisionRevisions.length, 1);
    assert.equal(projection.graph.provenanceSchemaVersion, "trust.provenance.v1");
  });

  it("uses bounded content fingerprints as a deduplication signal, not identity", () => {
    const first = contentFingerprint("Official notice 2026");
    const second = contentFingerprint("Official   notice 2026");
    assert.equal(first, second);
    assert.notEqual(first, contentFingerprint("Different observation"));
    assert.notEqual(sourceDocumentIdFor({ url: "https://example.com/a" }), sourceDocumentIdFor({ url: "https://example.com/b" }));
  });
});
