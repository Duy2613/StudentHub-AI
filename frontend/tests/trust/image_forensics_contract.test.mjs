import test from "node:test";
import assert from "node:assert/strict";
import { ImageForensicsPolicyV1, FORENSICS_VERSION } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";
import { createProviderResult, FORENSIC_DETECTOR_TYPES, GENAI_VERDICTS, DEEPFAKE_VERDICTS, CONFIDENCE_TYPES } from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";

test("Image Forensics Contract — validates canonical mediaForensics schema", async () => {
  const genAiResult = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
    provider: "sightengine",
    status: "SUCCESS",
    verdict: GENAI_VERDICTS.NO_STRONG_AI_SIGNAL,
    providerScore: 0.12,
  });

  const deepfakeResult = createProviderResult({
    detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
    provider: "sightengine",
    status: "SUCCESS",
    verdict: DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL,
    providerScore: 0.05,
  });

  const evaluated = ImageForensicsPolicyV1.evaluate({
    genAiResult,
    deepfakeResult,
    artifact: {
      mediaArtifactId: "art_12345",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      width: 1920,
      height: 1080,
      byteSize: 204800,
    },
  });

  const dto = evaluated.publicDto;

  // Assert schema version
  assert.equal(dto.version, FORENSICS_VERSION);
  assert.equal(dto.version, "IMAGE_FORENSICS_V1");

  // Assert mandatory sections exist independently
  assert.ok(dto.summary, "summary section missing");
  assert.ok(dto.aiGeneration, "aiGeneration section missing");
  assert.ok(dto.deepfake, "deepfake section missing");
  assert.ok(dto.manipulation, "manipulation section missing");
  assert.ok(dto.metadata, "metadata section missing");
  assert.ok(dto.provenance, "provenance section missing");
  assert.ok(dto.compression, "compression section missing");
  assert.ok(dto.resampling, "resampling section missing");
  assert.ok(dto.ocr, "ocr section missing");
  assert.ok(Array.isArray(dto.visibleUrls), "visibleUrls must be an array");
  assert.ok(dto.quality, "quality section missing");
  assert.ok(dto.providerAgreement, "providerAgreement section missing");

  // Invariant: No single global "REAL/FAKE" verdict field exists
  assert.equal(dto.verdict, undefined, "Forbidden single global verdict field must not exist");
  assert.equal(dto.isReal, undefined, "Forbidden isReal boolean must not exist");
  assert.equal(dto.isFake, undefined, "Forbidden isFake boolean must not exist");

  // Confidence type separation
  assert.equal(dto.aiGeneration.confidenceType, CONFIDENCE_TYPES.PROVIDER_SCORE);
  assert.equal(dto.aiGeneration.calibratedConfidence, null);
  assert.equal(dto.deepfake.confidenceType, CONFIDENCE_TYPES.PROVIDER_SCORE);
  assert.equal(dto.deepfake.calibratedConfidence, null);

  // Disclaimer presence
  assert.match(dto.summary.disclaimer, /không xác nhận toàn bộ ảnh là ảnh thật/i);
});
