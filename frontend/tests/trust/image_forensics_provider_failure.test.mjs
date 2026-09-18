import test from "node:test";
import assert from "node:assert/strict";
import {
  FORENSIC_DETECTOR_TYPES,
  GENAI_VERDICTS,
  DEEPFAKE_VERDICTS,
  DETECTOR_STATUS,
  createProviderResult,
} from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("Provider Failure — Single specialist failure results in overall status PARTIAL without fabrication", () => {
  // Scenario: GenAI provider failed (500 or timeout), but Deepfake and EXIF succeeded
  const failedGenAi = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
    provider: "sightengine",
    status: DETECTOR_STATUS.FAILED,
    verdict: GENAI_VERDICTS.UNKNOWN,
    providerScore: null,
    reasonCode: "HTTP_500",
    humanExplanation: "Sightengine GenAI API trả về lỗi 500.",
  });

  const successfulDeepfake = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
    provider: "sightengine",
    status: DETECTOR_STATUS.SUCCESS,
    verdict: DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL,
    providerScore: 0.05,
  });

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult: failedGenAi,
    deepfakeResult: successfulDeepfake,
    artifact: { mediaArtifactId: "art_partial", sha256: "hash_partial" },
  });

  const dto = evaluated.publicDto;

  // Invariant (Hardening Rule 9): Overall status must be PARTIAL
  assert.equal(dto.status, "PARTIAL");

  // Missing GenAI result must NOT be fabricated
  assert.equal(dto.aiGeneration.status, DETECTOR_STATUS.FAILED);
  assert.equal(dto.aiGeneration.verdict, GENAI_VERDICTS.UNKNOWN);
  assert.equal(dto.aiGeneration.providerScore, null);

  // Completed Deepfake must remain intact
  assert.equal(dto.deepfake.status, DETECTOR_STATUS.SUCCESS);
  assert.equal(dto.deepfake.verdict, DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL);
});

test("Provider Failure — Complete failure of all specialists results in status FAILED and UNKNOWN risk", () => {
  const failedGenAi = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
    provider: "sightengine",
    status: DETECTOR_STATUS.TIMEOUT,
    verdict: GENAI_VERDICTS.UNKNOWN,
  });

  const failedDeepfake = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
    provider: "sightengine",
    status: DETECTOR_STATUS.RATE_LIMITED,
    verdict: DEEPFAKE_VERDICTS.UNKNOWN,
  });

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult: failedGenAi,
    deepfakeResult: failedDeepfake,
    artifact: { mediaArtifactId: "art_all_fail", sha256: "hash_all_fail" },
  });

  assert.equal(evaluated.publicDto.status, "FAILED");
  assert.equal(evaluated.publicDto.summary.riskLevel, "UNKNOWN");
});
