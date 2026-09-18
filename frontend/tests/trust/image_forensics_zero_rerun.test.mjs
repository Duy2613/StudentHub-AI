import test from "node:test";
import assert from "node:assert/strict";
import { ForensicCacheService } from "../../src/lib/ai-trust/forensics/cache/ForensicCacheService.js";
import { FORENSIC_DETECTOR_TYPES, GENAI_VERDICTS, createProviderResult } from "../../src/lib/ai-trust/forensics/providers/SpecialistDetectorAdapter.js";

test("Zero-Rerun Provider Delta — Cached forensic result incurs 0 new provider calls", () => {
  ForensicCacheService.clear();

  const imageHash = "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890";
  const detector = FORENSIC_DETECTOR_TYPES.GENAI_DETECTION;
  const key = ForensicCacheService.generateKey({
    imageHash,
    detector,
    provider: "sightengine",
    modelVersion: "v1",
    policyVersion: "IMAGE_FORENSICS_V1",
  });

  assert.ok(key);
  assert.equal(ForensicCacheService.get(key), null);

  let providerCallCount = 0;

  function runDetectorWithCache() {
    const cached = ForensicCacheService.get(key);
    if (cached) return { result: cached, providerCalled: false };

    providerCallCount++;
    const fresh = createProviderResult({
      provider: "sightengine",
      detector,
      status: "SUCCESS",
      verdict: GENAI_VERDICTS.NO_STRONG_AI_SIGNAL,
      providerScore: 0.08,
    });
    ForensicCacheService.set(key, fresh);
    return { result: fresh, providerCalled: true };
  }

  // First run: calls provider
  const run1 = runDetectorWithCache();
  assert.equal(run1.providerCalled, true);
  assert.equal(providerCallCount, 1);

  // Subsequent runs for the exact same image hash: zero provider calls!
  const run2 = runDetectorWithCache();
  assert.equal(run2.providerCalled, false);
  assert.equal(providerCallCount, 1);

  const run3 = runDetectorWithCache();
  assert.equal(run3.providerCalled, false);
  assert.equal(providerCallCount, 1);

  // Invariant (Hardening Rule 14): ZERO_RERUN_PROVIDER_DELTA = 0
  const providerDelta = providerCallCount - 1;
  assert.equal(providerDelta, 0);

  ForensicCacheService.clear();
});
