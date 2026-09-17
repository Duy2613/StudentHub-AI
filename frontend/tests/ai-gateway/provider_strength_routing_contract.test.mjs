import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AI_CAPABILITY, PROVIDER_FAMILY } from "../../src/lib/ai-gateway/types.js";
import { verificationCapabilityForInputType } from "../../src/lib/server/trust/MultiModelVerifier.js";

class ConfiguredProvider {
  constructor(family) {
    this.providerFamily = family;
  }

  isConfigured() {
    return true;
  }
}

test("Gemini routing exposes the ordered production fallback chain for every active capability", () => {
  const router = new ModelRouter({
    [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: new ConfiguredProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE),
    [PROVIDER_FAMILY.GEMINI]: new ConfiguredProvider(PROVIDER_FAMILY.GEMINI),
  });

  const deep = router.describeRoute(AI_CAPABILITY.DEEP_REASONING);
  const multimodal = router.describeRoute(AI_CAPABILITY.MULTIMODAL);
  const extraction = router.describeRoute(AI_CAPABILITY.CLAIM_EXTRACTION);

  assert.equal(deep[0].provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(deep[0].model, "gemini-3.8-flash");
  assert.equal(multimodal[0].provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(multimodal[0].model, "gemini-3.8-flash");
  assert.deepEqual(extraction.map((entry) => entry.model), [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
  ]);
  assert.deepEqual(router.describeRoute(AI_CAPABILITY.FAST_CLASSIFICATION).map((entry) => entry.provider), [
    PROVIDER_FAMILY.GEMINI,
    PROVIDER_FAMILY.GEMINI,
    PROVIDER_FAMILY.GEMINI,
  ]);
});

test("Trust input modality selects the provider capability that matches the work", () => {
  assert.equal(verificationCapabilityForInputType("text"), AI_CAPABILITY.DEEP_REASONING);
  assert.equal(verificationCapabilityForInputType("url"), AI_CAPABILITY.DEEP_REASONING);
  assert.equal(verificationCapabilityForInputType("image"), AI_CAPABILITY.MULTIMODAL);
  assert.equal(verificationCapabilityForInputType("file"), AI_CAPABILITY.DOCUMENT);
});
