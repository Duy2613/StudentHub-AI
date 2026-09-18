import test from "node:test";
import assert from "node:assert/strict";
import {
  SightengineForensicsAdapter,
} from "../../src/lib/ai-trust/forensics/providers/SightengineForensicsAdapter.js";
import {
  FORENSIC_DETECTOR_TYPES,
  GENAI_VERDICTS,
  CONFIDENCE_TYPES,
  DETECTOR_STATUS,
} from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("GenAI Detector — High score (>= 0.8) maps to LIKELY_AI_GENERATED", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: "success",
      type: { ai_generated: 0.94 },
    }),
  });

  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
    fetchFn: fakeFetch,
  });

  const dummyBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const result = await adapter.detectGenAi({ bytes: dummyBytes });

  assert.equal(result.status, DETECTOR_STATUS.SUCCESS);
  assert.equal(result.detector, FORENSIC_DETECTOR_TYPES.GENAI_DETECTION);
  assert.equal(result.verdict, GENAI_VERDICTS.LIKELY_AI_GENERATED);
  assert.equal(result.providerScore, 0.94);
  assert.equal(result.confidenceType, CONFIDENCE_TYPES.PROVIDER_SCORE);
  assert.equal(result.calibratedConfidence, null);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult: result,
    artifact: { mediaArtifactId: "art_1", sha256: "hash1" },
  });

  assert.equal(evaluated.publicDto.aiGeneration.verdict, GENAI_VERDICTS.LIKELY_AI_GENERATED);
  assert.equal(evaluated.publicDto.summary.riskLevel, "HIGH");
  assert.equal(evaluated.publicDto.summary.requiresHumanReview, true);
});

test("GenAI Detector — Moderate score (0.5 <= score < 0.8) maps to POSSIBLY_AI_GENERATED", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: "success",
      type: { ai_generated: 0.65 },
    }),
  });

  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
    fetchFn: fakeFetch,
  });

  const result = await adapter.detectGenAi({ bytes: Buffer.alloc(100) });
  assert.equal(result.verdict, GENAI_VERDICTS.POSSIBLY_AI_GENERATED);
  assert.equal(result.providerScore, 0.65);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult: result,
    artifact: { mediaArtifactId: "art_2", sha256: "hash2" },
  });

  assert.equal(evaluated.publicDto.aiGeneration.verdict, GENAI_VERDICTS.POSSIBLY_AI_GENERATED);
  assert.equal(evaluated.publicDto.summary.riskLevel, "MEDIUM");
});

test("GenAI Detector — Low score (< 0.5) maps to NO_STRONG_AI_SIGNAL, never LIKELY_REAL", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: "success",
      type: { ai_generated: 0.04 },
    }),
  });

  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
    fetchFn: fakeFetch,
  });

  const result = await adapter.detectGenAi({ bytes: Buffer.alloc(100) });
  assert.equal(result.verdict, GENAI_VERDICTS.NO_STRONG_AI_SIGNAL);
  assert.equal(result.providerScore, 0.04);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult: result,
    artifact: { mediaArtifactId: "art_3", sha256: "hash3" },
  });

  assert.equal(evaluated.publicDto.aiGeneration.verdict, GENAI_VERDICTS.NO_STRONG_AI_SIGNAL);
  // Must NOT claim image is verified real
  assert.equal(evaluated.publicDto.verdict, undefined);
  assert.equal(evaluated.publicDto.isReal, undefined);
  assert.match(evaluated.publicDto.summary.disclaimer, /không xác nhận toàn bộ ảnh là ảnh thật/i);
});
