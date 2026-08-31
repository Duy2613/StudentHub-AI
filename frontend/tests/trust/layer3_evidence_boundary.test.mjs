import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { markNetworkGuardedRetriever } from "../../src/lib/ai-trust/layer3/retrieval/NetworkGuard.js";

const TEST_URL = process.env.TRUST_ENGINE_TEST_TARGET || "https://example.invalid/resource";

function claim(rawText = "Đại học Example công bố học phí năm 2026.") {
  return {
    claimId: "fixture-claim-1",
    subject: "Đại học Example",
    predicate: "công bố học phí",
    time: "2026",
    rawText,
  };
}

function sourceFixture({ guarded = true, url = TEST_URL } = {}) {
  const retriever = {
    retrieverId: guarded ? "live_guarded_fixture" : "untrusted_fixture",
    // The public property is metadata only; the service requires the private
    // capability marker below before it can accept live evidence.
    networkGuarded: true,
    async search() {
      return [{
        sourceId: "fixture-source-1",
        url,
        domain: "example.invalid",
        title: "Thông báo học phí năm 2026",
        publisher: "Fixture publisher",
        sourceType: "SEARCH_RETRIEVAL",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        sourceFingerprint: "fixture-source-fingerprint",
        clusterId: "fixture-lineage-1",
        retrievalOutcome: "SUCCESS",
      }];
    },
    async fetch() {
      return {
        status: 200,
        textContent: "Đại học Example công bố học phí năm 2026.",
        publishedAt: new Date().toISOString(),
        sourceType: "SEARCH_RETRIEVAL",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
      };
    },
  };
  return guarded ? markNetworkGuardedRetriever(retriever) : retriever;
}

describe("Layer 3 evidence and provenance boundary", () => {
  it("returns VERIFIED only for bounded live evidence with independent provenance", async () => {
    const result = await Layer3EvidenceService.verify({
      claims: [claim()],
      options: { retriever: sourceFixture(), requestId: "l3-live-fixture" },
    });

    assert.equal(result.status, "VERIFIED");
    assert.equal(result.externalEvidence, true);
    assert.equal(result.metrics.externalEvidence, true);
    assert.equal(result.evidence[0].liveEvidence, true);
    assert.equal(result.evidence[0].providerStatus, "SUCCESS");
    assert.ok(result.evidence[0].sourceFingerprint);
  });

  it("cannot promote a retriever that merely asserts live data without a network guard", async () => {
    const result = await Layer3EvidenceService.verify({
      claims: [claim()],
      options: { retriever: sourceFixture({ guarded: false }), requestId: "l3-untrusted-fixture" },
    });

    assert.equal(result.status, "PARTIAL");
    assert.equal(result.externalEvidence, false);
    assert.equal(result.evidence[0].liveEvidence, false);
    assert.match(result.limitations.join(" "), /chưa được xác nhận trực tiếp|live độc lập/i);
  });

  it("labels the built-in knowledge base as local and never as external verification", async () => {
    const result = await Layer3EvidenceService.verify({ claims: [claim("HCMUTE công bố học phí năm 2026.")] });

    assert.notEqual(result.status, "VERIFIED");
    assert.equal(result.externalEvidence, false);
    assert.ok(result.sources.every((source) => source.sourceType === "LOCAL_KNOWLEDGE_BASE"));
    assert.match(result.limitations.join(" "), /cục bộ|fallback/i);
  });

  it("abstains when there are no claims instead of manufacturing an evidence result", async () => {
    const result = await Layer3EvidenceService.verify({ claims: [], candidateSources: [] });

    assert.equal(result.status, "NOT_APPLICABLE");
    assert.equal(result.verificationCompleteness, 0);
    assert.equal(result.evidenceConfidence, 0);
    assert.equal(result.externalEvidence, false);
  });

  it("falls back honestly when the configured retriever fails", async () => {
    const result = await Layer3EvidenceService.verify({
      claims: [claim("HCMUTE công bố học phí năm 2026.")],
      options: {
        retriever: {
          retrieverId: "failing_external_fixture",
          networkGuarded: true,
          async search() { throw new Error("simulated network loss"); },
          async fetch() { throw new Error("should not be called"); },
        },
      },
    });

    assert.notEqual(result.status, "VERIFIED");
    assert.equal(result.externalEvidence, false);
    assert.equal(result.retrievalMode, "LOCAL_FALLBACK");
    assert.equal(result.retrievalStatus, "UNAVAILABLE");
    assert.ok(result.auditEvents.some((event) => event.type === "RETRIEVER_FAILURE"));
  });

  it("rejects SSRF candidates and preserves insufficient evidence", async () => {
    const result = await Layer3EvidenceService.verify({
      claims: [claim()],
      options: {
        retriever: {
          retrieverId: "guarded_fixture",
          networkGuarded: true,
          async search() {
            return [{ sourceId: "private-source", url: "http://127.0.0.1/admin", title: "private" }];
          },
          async fetch() { throw new Error("must not fetch private target"); },
        },
      },
    });

    assert.equal(result.status, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.externalEvidence, false);
    assert.ok(result.auditEvents.some((event) => event.type === "RETRIEVAL_REJECTED"));
  });

  it("does not verify evidence whose publication date is missing", async () => {
    const retriever = sourceFixture();
    retriever.fetch = async () => ({
      status: 200,
      textContent: "Đại học Example công bố học phí năm 2026.",
      sourceType: "SEARCH_RETRIEVAL",
      providerStatus: "SUCCESS",
      liveEvidence: true,
      retrievalOutcome: "SUCCESS",
    });

    const result = await Layer3EvidenceService.verify({ claims: [claim()], options: { retriever } });
    assert.equal(result.status, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.claimStatuses["fixture-claim-1"], "OUTDATED_EVIDENCE");
    assert.equal(result.externalEvidence, true);
  });
});
