import test from "node:test";
import assert from "node:assert/strict";
import {
  SightengineForensicsAdapter,
} from "../../src/lib/ai-trust/forensics/providers/SightengineForensicsAdapter.js";
import {
  FORENSIC_DETECTOR_TYPES,
  DEEPFAKE_VERDICTS,
  DETECTOR_STATUS,
} from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("Deepfake Detector — High score (>= 0.8) maps to LIKELY_DEEPFAKE", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: "success",
      faces: [{ deepfake: 0.91 }],
    }),
  });

  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
    fetchFn: fakeFetch,
  });

  const result = await adapter.detectDeepfake({ bytes: Buffer.alloc(100) });
  assert.equal(result.status, DETECTOR_STATUS.SUCCESS);
  assert.equal(result.detector, FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION);
  assert.equal(result.verdict, DEEPFAKE_VERDICTS.LIKELY_DEEPFAKE);
  assert.equal(result.providerScore, 0.91);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    deepfakeResult: result,
    artifact: { mediaArtifactId: "art_df1", sha256: "hash_df1" },
  });

  assert.equal(evaluated.publicDto.deepfake.verdict, DEEPFAKE_VERDICTS.LIKELY_DEEPFAKE);
  assert.equal(evaluated.publicDto.summary.riskLevel, "HIGH");
  assert.equal(evaluated.publicDto.summary.requiresHumanReview, true);
});

test("Deepfake Detector — Moderate score (0.5 <= score < 0.8) maps to POSSIBLY_DEEPFAKE", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: "success",
      faces: [{ deepfake: 0.62 }],
    }),
  });

  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
    fetchFn: fakeFetch,
  });

  const result = await adapter.detectDeepfake({ bytes: Buffer.alloc(100) });
  assert.equal(result.verdict, DEEPFAKE_VERDICTS.POSSIBLY_DEEPFAKE);
  assert.equal(result.providerScore, 0.62);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    deepfakeResult: result,
    artifact: { mediaArtifactId: "art_df2", sha256: "hash_df2" },
  });

  assert.equal(evaluated.publicDto.deepfake.verdict, DEEPFAKE_VERDICTS.POSSIBLY_DEEPFAKE);
  assert.equal(evaluated.publicDto.summary.riskLevel, "MEDIUM");
});

test("Deepfake Detector — No face detected returns NOT_APPLICABLE with null score", async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: "success",
      faces: [],
    }),
  });

  const adapter = new SightengineForensicsAdapter({
    apiUser: "test_user",
    apiSecret: "test_secret",
    fetchFn: fakeFetch,
  });

  const result = await adapter.detectDeepfake({ bytes: Buffer.alloc(100) });
  assert.equal(result.status, DETECTOR_STATUS.SUCCESS);
  assert.equal(result.verdict, DEEPFAKE_VERDICTS.NOT_APPLICABLE);
  assert.equal(result.providerScore, null);
  assert.equal(result.reasonCode, "NO_FACES_DETECTED");

  const evaluated = ImageForensicsPolicyV1.evaluate({
    deepfakeResult: result,
    artifact: { mediaArtifactId: "art_df3", sha256: "hash_df3" },
  });

  assert.equal(evaluated.publicDto.deepfake.verdict, DEEPFAKE_VERDICTS.NOT_APPLICABLE);
  assert.equal(evaluated.publicDto.deepfake.providerScore, null);
  // Not applicable deepfake does NOT trigger high risk
  assert.notEqual(evaluated.publicDto.summary.riskLevel, "HIGH");
});
