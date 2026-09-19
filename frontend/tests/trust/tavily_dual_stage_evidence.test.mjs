import assert from "node:assert/strict";
import test from "node:test";

import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";
import { markNetworkGuardedRetriever } from "../../src/lib/ai-trust/layer3/retrieval/NetworkGuard.js";
import { markTrustedLayer3Result } from "../../src/lib/ai-trust/layer3/TrustBoundary.js";
import { isValidGeminiEvidenceGap } from "../../src/lib/ai-trust/layer4/providers/GeminiEvidenceGapDTO.js";

const CLAIM = {
  claimId: "claim-dual-stage-1",
  subject: "Đại học Example",
  predicate: "công bố học phí",
  time: "2026",
  rawText: "Đại học Example công bố học phí năm 2026.",
};

function dualStageRetriever(calls) {
  return markNetworkGuardedRetriever({
    retrieverId: "tavily_dual_stage_fixture",
    async search(queries) {
      calls.push(queries);
      const supplemental = calls.length > 1;
      return [{
        sourceId: supplemental ? "supplemental-source" : "initial-source",
        url: supplemental
          ? "https://example.invalid/supplemental-record"
          : "https://example.invalid/initial-record",
        domain: "example.invalid",
        title: supplemental ? "Supplemental official record" : "Initial official record",
        publisher: "Example authority",
        sourceType: "SEARCH_RETRIEVAL",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
      }];
    },
    async fetch(url) {
      return {
        status: 200,
        textContent: `${CLAIM.rawText} ${url}`,
        publishedAt: new Date().toISOString(),
        sourceType: "SEARCH_RETRIEVAL",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
      };
    },
  });
}

test("Tavily dual-stage retrieval preserves origins and bounds supplemental queries", async () => {
  const calls = [];
  const retriever = dualStageRetriever(calls);
  const initial = await Layer3EvidenceService.verify({
    claims: [CLAIM],
    options: { requestId: "dual-stage-initial", retriever, allowLocalFallback: false },
  });
  const supplemental = await Layer3EvidenceService.verify({
    claims: [CLAIM],
    options: {
      requestId: "dual-stage-supplemental",
      retriever,
      allowLocalFallback: false,
      retrievalStage: "SUPPLEMENTAL",
      supplementalQueries: [
        { suggestedQuery: "Đại học Example học phí 2026" },
        { suggestedQuery: "Đại học Example thông báo học phí chính thức" },
        { suggestedQuery: "query thứ ba phải bị loại" },
      ],
      previousEvidencePackage: initial,
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[1].length, 2);
  assert.equal(initial.sources[0].retrievalOrigin, "TAVILY_INITIAL");
  assert.ok(supplemental.sources.some((source) => source.retrievalOrigin === "TAVILY_INITIAL"));
  assert.ok(supplemental.sources.some((source) => source.retrievalOrigin === "TAVILY_AI_REQUESTED_SUPPLEMENT"));
  assert.equal(supplemental.metrics.retrievalStage, "SUPPLEMENTAL");
  assert.equal(supplemental.metrics.geminiGeneratedUrlCount, 0);
  assert.equal(supplemental.retrievalPhases.initialSearch.sourceCount, 1);
  assert.equal(supplemental.retrievalPhases.supplementalSearch.queryCount, 2);
  assert.equal(supplemental.retrievalPhases.supplementalSearch.sourceCount, 1);
  assert.equal(supplemental.retrievalPhases.finalValidatedEvidenceSet.validatedSourceCount, 2);
});

test("Gemini gap analysis is query-only and Layer 4 synthesizes once after supplemental retrieval", async () => {
  assert.equal(isValidGeminiEvidenceGap({
    needsMoreEvidence: true,
    evidenceGaps: [{ reason: "Thiếu nguồn chính thức", suggestedQuery: "đối soát thông báo học phí", preferredAuthority: "Official university", targetClaimId: "claim-1" }],
  }), true);
  assert.equal(isValidGeminiEvidenceGap({
    needsMoreEvidence: true,
    evidenceGaps: [{ reason: "Không hợp lệ", suggestedQuery: "https://example.com", preferredAuthority: "example.com", targetClaimId: "claim-1" }],
  }), false);

  const initialLayer3 = markTrustedLayer3Result({
    layer: 3,
    status: "INSUFFICIENT_EVIDENCE",
    claims: [CLAIM],
    sources: [],
    evidence: [],
    conflicts: [],
    externalEvidence: false,
    verificationCompleteness: 0,
  });
  const supplementalLayer3 = markTrustedLayer3Result({
    layer: 3,
    status: "VERIFIED",
    claims: [CLAIM],
    sources: [{ sourceId: "supplemental-source", url: "https://example.invalid/supplemental-record", liveEvidence: true, retrievalOrigin: "TAVILY_AI_REQUESTED_SUPPLEMENT" }],
    evidence: [{ evidenceId: "supplemental-evidence", sourceId: "supplemental-source", claimId: CLAIM.claimId, sourceUrl: "https://example.invalid/supplemental-record", liveEvidence: true, retrievalOrigin: "TAVILY_AI_REQUESTED_SUPPLEMENT", relation: "SUPPORTS", excerpt: CLAIM.rawText }],
    conflicts: [],
    externalEvidence: true,
    verificationCompleteness: 1,
    crossSourceAgreement: { agreementScore: 1, unresolved: false },
    retrievalPhases: {
      supplementalSearch: { status: "COMPLETED", queryCount: 1, sourceCount: 1, validatedSourceCount: 1, retrievalOrigin: "TAVILY_AI_REQUESTED_SUPPLEMENT" },
      finalValidatedEvidenceSet: { status: "COMPLETED", sourceCount: 1, validatedSourceCount: 1, retrievalOrigin: "TAVILY_AI_REQUESTED_SUPPLEMENT" },
    },
  });
  const calls = { gaps: 0, synthesis: 0, supplemental: 0 };
  const provider = {
    async analyzeEvidenceGaps() {
      calls.gaps += 1;
      return {
        status: "COMPLETED",
        needsMoreEvidence: true,
        evidenceGaps: [{ reason: "Thiếu nguồn chính thức", suggestedQuery: "đối soát thông báo học phí", preferredAuthority: "Official university", targetClaimId: CLAIM.claimId }],
      };
    },
    async reason(fusedGraph) {
      calls.synthesis += 1;
      assert.equal(fusedGraph.layer3Evidence.length, 1);
      return { userExplanation: { why: "bounded fixture narrative" }, aiVerificationStatus: "VERIFIED" };
    },
  };

  const result = await Layer4TrustService.evaluate({
    layer1Result: { layer: 1, status: "PASS", signals: [], metrics: { inputContent: CLAIM.rawText } },
    layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [CLAIM], contextSignals: [] },
    layer3Result: initialLayer3,
    options: {
      requestId: "dual-stage-l4",
      provider,
      retrieveSupplementalEvidence: async () => {
        calls.supplemental += 1;
        return { layer3Result: supplementalLayer3, phaseSummary: supplementalLayer3.retrievalPhases.supplementalSearch };
      },
    },
  });

  assert.deepEqual(calls, { gaps: 1, synthesis: 1, supplemental: 1 });
  assert.equal(result.evidenceGapAnalysis.executedQueryCount, 1);
  assert.equal(result.supplementalRetrieval.sourceCount, 1);
});

test("Gemini can add independent URLs, but only reachable URLs are exposed", async () => {
  const validatedUrl = "https://example.invalid/validated-record";
  const geminiUrl = "https://gemini.example/independent-record";
  const fusedGraph = {
    layer3Evidence: [{
      id: "evidence-url-1",
      sourceId: "source-url-1",
      sourceUrl: validatedUrl,
      excerpt: CLAIM.rawText,
    }],
  };
  const verification = (url) => ({
    verdictSignal: "SUPPORTS",
    supportReasons: ["Nguồn đã validate hỗ trợ claim."],
    contradictionReasons: [],
    missingEvidence: [],
    uncertainty: "Không có thêm bất định trong fixture.",
    citationsUsed: [{ id: "evidence-url-1", url }],
    supportingSourceIds: [],
    contradictingSourceIds: [],
    provider: "google",
    model: "gemini-3.8-flash",
  });
  const validProvider = new AIGatewayReasoningProvider({
    gateway: { async generateStructured() { return { ok: true, json: verification(validatedUrl), executedModel: "gemini-3.8-flash", providerStatus: "SUCCESS" }; } },
  });
  const validResult = await validProvider.reason(fusedGraph);
  assert.equal(validResult.aiVerificationStatus, "VERIFIED");
  assert.equal(validResult.aiVerification.citationsUsed[0].url, validatedUrl);
  assert.equal(validResult.aiVerification.citationsUsed[0].retrievalOrigin, "TAVILY_INITIAL");

  const independentProvider = new AIGatewayReasoningProvider({
    gateway: { async generateStructured() { return { ok: true, json: verification(geminiUrl), executedModel: "gemini-3.8-flash", providerStatus: "SUCCESS" }; } },
  });
  const independentResult = await independentProvider.reason(fusedGraph, {
    validateCitationUrl: async (url) => ({ ok: url === geminiUrl, finalUrl: url, url, httpStatus: 200, validationStatus: "REACHABLE" }),
  });
  assert.equal(independentResult.aiVerificationStatus, "VERIFIED");
  assert.equal(independentResult.aiVerification.citationsUsed[0].url, geminiUrl);
  assert.equal(independentResult.aiVerification.citationsUsed[0].retrievalOrigin, "GEMINI_GENERATED");
  assert.equal(independentResult.aiVerification.citationValidation.acceptedCount, 1);

  const invalidProvider = new AIGatewayReasoningProvider({
    gateway: { async generateStructured() { return { ok: true, json: verification("https://broken-gemini.example/not-reachable"), executedModel: "gemini-3.8-flash", providerStatus: "SUCCESS" }; } },
  });
  const invalidResult = await invalidProvider.reason(fusedGraph, {
    validateCitationUrl: async () => ({ ok: false, code: "HTTP_404", httpStatus: 404 }),
  });
  assert.equal(invalidResult.aiVerificationStatus, "VERIFIED");
  assert.equal(invalidResult.aiVerification.citationsUsed.length, 0);
  assert.equal(invalidResult.aiVerification.citationValidation.rejectedCount, 1);
});
