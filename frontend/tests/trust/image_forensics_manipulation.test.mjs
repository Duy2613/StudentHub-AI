import test from "node:test";
import assert from "node:assert/strict";
import {
  SightengineForensicsAdapter,
} from "../../src/lib/ai-trust/forensics/providers/SightengineForensicsAdapter.js";
import {
  FORENSIC_DETECTOR_TYPES,
  MANIPULATION_VERDICTS,
  DETECTOR_STATUS,
} from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("Manipulation Detector — Unsupported detector returns NOT_SUPPORTED without fabricating score", async () => {
  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
  });

  const result = await adapter.detectManipulation();

  // Invariant (Hardening Rule 7): Must abstain rather than fabricate
  assert.equal(result.status, DETECTOR_STATUS.NOT_SUPPORTED);
  assert.equal(result.detector, FORENSIC_DETECTOR_TYPES.IMAGE_MANIPULATION);
  assert.equal(result.verdict, MANIPULATION_VERDICTS.UNKNOWN);
  assert.equal(result.providerScore, null);
  assert.equal(result.reasonCode, "CAPABILITY_NOT_SUPPORTED");

  const evaluated = ImageForensicsPolicyV1.evaluate({
    manipulationResult: result,
    artifact: { mediaArtifactId: "art_manip", sha256: "hash_manip" },
  });

  assert.equal(evaluated.publicDto.manipulation.status, DETECTOR_STATUS.NOT_SUPPORTED);
  assert.equal(evaluated.publicDto.manipulation.verdict, MANIPULATION_VERDICTS.UNKNOWN);
  assert.equal(evaluated.publicDto.manipulation.providerScore, null);
  assert.match(evaluated.publicDto.manipulation.reason, /(không|chưa) được hỗ trợ/i);
});

test("Manipulation Detector — Never infers manipulation score from GenAI or Deepfake", () => {
  // Even if GenAI is high (0.95), manipulation must remain distinct
  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult: {
      provider: "sightengine",
      detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
      status: DETECTOR_STATUS.SUCCESS,
      verdict: "LIKELY_AI_GENERATED",
      providerScore: 0.95,
    },
    manipulationResult: {
      provider: "sightengine",
      detector: FORENSIC_DETECTOR_TYPES.IMAGE_MANIPULATION,
      status: DETECTOR_STATUS.NOT_SUPPORTED,
      verdict: MANIPULATION_VERDICTS.UNKNOWN,
      providerScore: null,
    },
    artifact: { mediaArtifactId: "art_iso", sha256: "hash_iso" },
  });

  assert.equal(evaluated.publicDto.aiGeneration.verdict, "LIKELY_AI_GENERATED");
  assert.equal(evaluated.publicDto.manipulation.verdict, MANIPULATION_VERDICTS.UNKNOWN);
  assert.equal(evaluated.publicDto.manipulation.providerScore, null);
});
