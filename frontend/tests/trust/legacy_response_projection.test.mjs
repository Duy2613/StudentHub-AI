import assert from "node:assert/strict";
import test from "node:test";
import { buildLegacyLayerResponse, buildLegacyPipelineResponse } from "../../src/lib/ai-trust/legacy/LegacyResponseProjector.js";

function source(index, prefix = "https://example.com") {
  return {
    sourceId: `source-${index}`,
    title: `Source ${index}`,
    url: `${prefix}/article-${index}`,
    sourceUrl: `${prefix}/article-${index}`,
    excerpt: `Evidence ${index}`,
    liveEvidence: true,
    retrievalOutcome: "SUCCESS",
    providerStatus: "SUCCESS",
    authorityScore: 0.8,
  };
}

test("legacy projector preserves the sample layer shape and every safe source", () => {
  const sources = Array.from({ length: 125 }, (_, index) => source(index + 1));
  const response = buildLegacyPipelineResponse({
    input: { type: "text", content: "GOAT is Ronaldo", metadata: {} },
    layerResults: {
      layer1: { status: "PASS", reason: "Input accepted" },
      layer2: {
        finding: "NO_KNOWN_THREAT",
        confidence: 0.71,
        conclusion: "Context requires comparison.",
        providerObservations: [{ provider: "Google Fact Check", status: "SUCCESS", verdict: "UNKNOWN", success: true, confidence: 0 }],
      },
      layer3: {
        status: "MIXED",
        evidenceConfidence: 0.5,
        evidenceSummary: "Independent sources disagree.",
        sources,
        evidence: sources.map((item, index) => ({ ...item, evidenceId: `evidence-${index + 1}`, content: `Full evidence ${index + 1}` })),
      },
      layer4: {
        truthStatus: "INSUFFICIENT_EVIDENCE",
        decisionConfidence: 0.35,
        sourceQuality: 0.8,
        evidenceAgreement: 0.5,
        recommendedAction: "REVIEW",
        sources: [source(126, "https://news.example")],
      },
    },
    finalPredict: { truthStatus: "INSUFFICIENT_EVIDENCE", decisionConfidence: 0.35 },
  });

  assert.equal(response.layer2.verdict, "NO_KNOWN_THREAT");
  assert.equal(response.layer2.providers.length, 1);
  assert.equal(response.layer3.sources.length, 125);
  assert.equal(response.layer3.evidence.length, 125);
  assert.equal(response.layer4.sources.length, 126);
  assert.equal(response.layer3.evidence[124].url, "https://example.com/article-125");
  assert.equal(response.layer4.confidence, 0.35);
  assert.equal(buildLegacyLayerResponse("layer3", {
    input: { type: "url", content: "https://example.org" },
    layerResults: { layer3: { status: "SUPPORTED", sources: [source(1)], evidence: [source(1)] } },
  }).sources.length, 1);
});
test("legacy projector returns the image AI/deepfake provider evidence in the compatibility response", () => {
  const response = buildLegacyPipelineResponse({
    input: { type: "image", content: "", metadata: { mimeType: "image/png" } },
    layerResults: {
      layer2: {
        mediaForensics: {
          aiGeneration: {
            status: "COMPLETED",
            verdict: "LIKELY_AI_GENERATED",
            providerScore: 0.99,
            reason: "Synthetic signals detected.",
            providers: [{ provider: "Sightengine", status: "SUCCESS", verdict: "LIKELY_AI_GENERATED", providerScore: 0.99 }],
          },
          deepfake: {
            status: "COMPLETED",
            verdict: "LIKELY_REAL",
            providerScore: 0.001,
            providers: [{ provider: "Sightengine", status: "SUCCESS", verdict: "LIKELY_REAL", providerScore: 0.001 }],
          },
          visibleUrls: ["https://example.com/visible"],
        },
      },
      layer3: {
        status: "UNVERIFIED",
        sources: [{ title: "Detector documentation", url: "https://example.com/detector" }],
        evidence: [{ title: "Detector documentation", url: "https://example.com/detector", content: "Evidence text" }],
      },
      layer4: { truthStatus: "INSUFFICIENT_EVIDENCE", decisionConfidence: 0.2, sources: [] },
    },
    finalPredict: { truthStatus: "INSUFFICIENT_EVIDENCE", decisionConfidence: 0.2 },
  });

  assert.equal(response.layer2.verdict, "LIKELY_AI_GENERATED");
  assert.equal(response.layer2.confidence, 0.99);
  assert.equal(response.layer2.providers.length, 2);
  assert.equal(response.layer2.providers[0].provider, "Sightengine GenAI");
  assert.equal(response.layer2.providers[1].provider, "Sightengine Deepfake");
  assert.equal(response.layer3.sources.some((item) => item.url === "https://example.com/visible"), true);
  assert.equal(response.layer4.aiGenerated, true);
  assert.equal(response.layer4.verdict, "FAKE");
  assert.equal(response.layer4.aiGenerationConfidence, 0.99);
});
