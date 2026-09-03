import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createProviderGateway,
  PROVIDER_CAPABILITY,
  PROVIDER_HEALTH_STATUS,
  PROVIDER_SELECTION_MODE,
} from "../../src/lib/ai-trust/providerGateway/index.js";

describe("canonical Trust provider gateway", () => {
  it("exposes capability ports without coupling callers to vendor names", async () => {
    const calls = [];
    const gateway = createProviderGateway({
      providers: {
        urlThreatProvider: {
          providerId: "native-url-threat",
          check: async (params) => {
            calls.push(["url", params.requestId]);
            return { providerStatus: "SUCCESS", finding: "NO_KNOWN_THREAT", requestId: params.requestId };
          },
        },
        webEvidenceProvider: {
          providerId: "native-web-evidence",
          verify: async (params) => {
            calls.push(["web", params.requestId]);
            return { providerStatus: "SUCCESS", status: "INSUFFICIENT_EVIDENCE", requestId: params.requestId };
          },
        },
      },
    });
    const l2 = await gateway.invoke(PROVIDER_CAPABILITY.URL_THREAT, { requestId: "gateway-1" });
    const l3 = await gateway.verifyLayer3({ requestId: "gateway-2" });
    assert.equal(l2.finding, "NO_KNOWN_THREAT");
    assert.equal(l3.status, "INSUFFICIENT_EVIDENCE");
    assert.deepEqual(calls, [["url", "gateway-1"], ["web", "gateway-2"]]);
    assert.equal(gateway.describe().capabilities.find((item) => item.capability === PROVIDER_CAPABILITY.URL_THREAT).providerId, "native-url-threat");
  });

  it("keeps missing capabilities explicit and non-positive", async () => {
    const gateway = createProviderGateway();
    const result = await gateway.verifyLayer4({ requestId: "gateway-missing" });
    assert.equal(result.providerStatus, PROVIDER_HEALTH_STATUS.NOT_CONFIGURED);
    assert.equal(result.status, "UNAVAILABLE");
    assert.equal(result.rawVerdict, undefined);
    assert.equal(gateway.isCapabilityConfigured(PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH), false);
  });

  it("adapts an enabled legacy adapter only behind the gateway", async () => {
    const calls = [];
    const adapter = {
      enabled: true,
      layer2Provider: () => ({ providerId: "legacy-l2", check: async () => ({ finding: "UNKNOWN" }) }),
      verifyLayer3: async ({ requestId }) => { calls.push(["l3", requestId]); return { status: "PARTIAL", requestId }; },
      verifyLayer4: async ({ requestId }) => { calls.push(["l4", requestId]); return { status: "COMPLETED", requestId }; },
    };
    const gateway = createProviderGateway({ legacyVerificationAdapter: adapter });
    assert.equal(gateway.enabled, true);
    assert.equal(gateway.layer2Provider().providerId, "legacy-l2");
    await gateway.verifyLayer3({ requestId: "legacy-gateway-l3" });
    await gateway.verifyLayer4({ requestId: "legacy-gateway-l4" });
    assert.deepEqual(calls, [["l3", "legacy-gateway-l3"], ["l4", "legacy-gateway-l4"]]);
  });

  it("supports explicit native, legacy, and shadow capability selection", async () => {
    const calls = [];
    const legacy = {
      enabled: true,
      verifyLayer3: async ({ requestId }) => { calls.push(["legacy", requestId]); return { status: "PARTIAL", requestId }; },
    };
    const native = {
      providerId: "native-web",
      verify: async ({ requestId }) => { calls.push(["native", requestId]); return { status: "COMPLETED", requestId }; },
    };
    const gateway = createProviderGateway({
      legacyVerificationAdapter: legacy,
      providers: { webEvidenceProvider: native },
      selection: { [PROVIDER_CAPABILITY.WEB_EVIDENCE]: PROVIDER_SELECTION_MODE.SHADOW },
    });
    assert.equal(gateway.get(PROVIDER_CAPABILITY.WEB_EVIDENCE).providerId, "legacy_verification_layer3");
    assert.equal(gateway.shadow(PROVIDER_CAPABILITY.WEB_EVIDENCE).providerId, "native-web");
    await gateway.verifyLayer3({ requestId: "shadow-active" });
    assert.deepEqual(calls, [["legacy", "shadow-active"]]);
    assert.equal(gateway.describe().selection[PROVIDER_CAPABILITY.WEB_EVIDENCE], "shadow");
  });
});
