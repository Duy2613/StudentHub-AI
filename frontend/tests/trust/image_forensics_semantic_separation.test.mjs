import test from "node:test";
import assert from "node:assert/strict";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";
import { createProviderResult, FORENSIC_DETECTOR_TYPES, GENAI_VERDICTS, DEEPFAKE_VERDICTS } from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";

test("Semantic Separation — GenAI high + Deepfake low must NEVER result in LIKELY_REAL", async () => {
  // Scenario: Image was synthesized by Midjourney/DALL-E (GenAI 0.99)
  // Because it is a synthesized landscape/document, there is no facial deepfake (Deepfake 0.999 safe/low)
  const genAiResult = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
    provider: "sightengine",
    status: "SUCCESS",
    verdict: GENAI_VERDICTS.LIKELY_AI_GENERATED,
    providerScore: 0.99,
  });

  const deepfakeResult = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
    provider: "sightengine",
    status: "SUCCESS",
    verdict: DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL,
    providerScore: 0.001, // 99.9% clean of face-swap deepfake
  });

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult,
    deepfakeResult,
    artifact: { mediaArtifactId: "art_test", sha256: "abc123" },
  });

  const dto = evaluated.publicDto;

  // 1. Assert independent findings are preserved
  assert.equal(dto.aiGeneration.verdict, GENAI_VERDICTS.LIKELY_AI_GENERATED);
  assert.equal(dto.aiGeneration.providerScore, 0.99);

  assert.equal(dto.deepfake.verdict, DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL);

  // 2. Assert risk level reflects the high GenAI suspicion
  assert.equal(dto.summary.riskLevel, "HIGH");
  assert.equal(dto.summary.requiresHumanReview, true);

  // 3. Assert conflict reasoning is flagged
  assert.ok(dto.providerAgreement.conflicts.length > 0);
  assert.match(dto.providerAgreement.conflicts[0], /hai cơ chế độc lập/i);

  // 4. FORBIDDEN REGRESSIONS:
  // Must NOT produce "LIKELY_REAL", "VERIFIED_REAL", or claim the image is authentic
  const serialized = JSON.stringify(dto).toUpperCase();
  assert.equal(serialized.includes('"LIKELY_REAL"'), false, "Must NEVER produce LIKELY_REAL");
  assert.equal(serialized.includes('"VERIFIED_REAL"'), false, "Must NEVER produce VERIFIED_REAL");
  assert.equal(serialized.includes("ẢNH THẬT 99.9%"), false, "Must NEVER claim 99.9% real");
});
