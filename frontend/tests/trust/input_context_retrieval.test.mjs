import assert from "node:assert/strict";
import test from "node:test";

import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { markNetworkGuardedRetriever } from "../../src/lib/ai-trust/layer3/retrieval/NetworkGuard.js";
import { buildGeminiLayer4Prompts } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";

function contextRetriever(calls, { direct = false } = {}) {
  return markNetworkGuardedRetriever({
    retrieverId: "tavily_input_context_fixture",
    async search(queries) {
      calls.push(queries);
      return direct ? [] : [{
        sourceId: "input-context-source",
        url: "https://example.invalid/ronaldo-messi-context",
        domain: "example.invalid",
        title: "Ronaldo and Messi debate context",
        publisher: "Example News",
        sourceType: "SEARCH_RETRIEVAL",
        providerStatus: "SUCCESS",
        retrievalOutcome: "CANDIDATE",
      }];
    },
    async fetch(url) {
      return {
        status: 200,
        finalUrl: url,
        textContent: "A public article discusses the long-running Ronaldo and Messi GOAT debate, including different opinions, statistics, and counterarguments from sports coverage.",
        liveEvidence: true,
        providerStatus: "SUCCESS",
        retrievalOutcome: "SUCCESS",
      };
    },
  });
}

test("claim-less free-form input still gets Tavily queries and contextual evidence", async () => {
  const calls = [];
  const result = await Layer3EvidenceService.verify({
    input: { type: "text", content: "GOAT is Ronaldo" },
    claims: [],
    candidateSources: [],
    options: { retriever: contextRetriever(calls), allowLocalFallback: false, requestId: "input-context-text" },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].strategy, "INPUT_EXACT");
  assert.equal(calls[0].length, 4);
  assert.equal(result.status, "NOT_APPLICABLE");
  assert.equal(result.sources[0].sourceScope, "input_context");
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].claimId, "");
  assert.equal(result.evidence[0].evidenceScope, "input_context");
  assert.equal(result.evidence[0].relation, "CONTEXTUALIZES");
  assert.equal(result.evidence[0].liveEvidence, true);
  assert.equal(result.externalEvidence, true);
  assert.ok(result.limitations.some((item) => item.includes("verdict claim-specific")));
});

test("URL-only input is searched independently and preserves direct provenance", async () => {
  const calls = [];
  const result = await Layer3EvidenceService.verify({
    input: { type: "url", content: "https://vercel.com/" },
    claims: [],
    options: { retriever: contextRetriever(calls, { direct: true }), allowLocalFallback: false, requestId: "input-context-url" },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].strategy, "INPUT_URL_EXACT");
  assert.equal(calls[0].length, 4);
  assert.equal(result.status, "NOT_APPLICABLE");
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].retrievalOrigin, "DIRECT_INPUT");
  assert.equal(result.sources[0].liveEvidence, true);
  assert.equal(result.evidence[0].evidenceScope, "input_context");
  assert.equal(result.evidence[0].sourceUrl, "https://vercel.com/");
});

test("input-context discovery shares the bounded Tavily budget with claim verification", async () => {
  const calls = [];
  await Layer3EvidenceService.verify({
    input: { type: "text", content: "GOAT is Ronaldo" },
    claims: [{
      claimId: "goat-claim",
      subject: "Ronaldo",
      predicate: "is the GOAT",
      rawText: "Ronaldo is the GOAT",
    }],
    options: { retriever: contextRetriever(calls), allowLocalFallback: false, requestId: "input-context-shared-budget" },
  });

  assert.deepEqual(calls[0].slice(0, 4).map((item) => item.strategy), [
    "INPUT_EXACT",
    "INPUT_NEUTRAL_CONTEXT",
    "EXACT_CLAIM",
    "ENTITY_ACTION",
  ]);
});

test("Gemini Layer 4 receives raw input and contextual evidence without a claim gate", () => {
  const prompts = buildGeminiLayer4Prompts({
    deterministic: { classification: "INSUFFICIENT_EVIDENCE", truthStatus: "NOT_APPLICABLE", enforcement: "REVIEW" },
    inputContext: { type: "text", content: "GOAT is Ronaldo" },
    evidence: [{
      sourceId: "context-source",
      sourceUrl: "https://example.invalid/ronaldo-messi-context",
      evidenceScope: "input_context",
      relation: "CONTEXTUALIZES",
      excerpt: "The article compares Ronaldo and Messi from several viewpoints.",
    }],
  });

  assert.match(prompts.systemPrompt, /Interpret the raw user input freely/);
  assert.match(prompts.userPrompt, /GOAT is Ronaldo/);
  assert.match(prompts.userPrompt, /input_context/);
});
