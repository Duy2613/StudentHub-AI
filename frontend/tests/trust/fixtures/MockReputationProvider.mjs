import {
  createLayer2AResult,
  LAYER_2A_FINDING,
  LAYER_2A_PROVIDER_STATUS,
} from "../../../src/lib/ai-trust/layer2a/types.js";

/**
 * TEST-ONLY fallback for STATE_L2A_BACKEND=MOCK_REQUIRED.
 *
 * This fixture deliberately emits no positive or safe finding. It exists so
 * the pipeline can be exercised when the external backend is unavailable;
 * its output is never production evidence and never supports an M3 verdict.
 */
export class MockReputationProvider {
  providerId = "mock_reputation_provider_test_only";

  async check({ requestId = null } = {}) {
    return createLayer2AResult({
      provider: this.providerId,
      providerStatus: LAYER_2A_PROVIDER_STATUS.NOT_CONFIGURED,
      finding: LAYER_2A_FINDING.UNKNOWN,
      requestId,
      errorCode: "MOCK_REQUIRED_EXTERNAL_BACKEND_UNAVAILABLE",
      message: "TEST_ONLY_MOCK: external Layer 2A backend unavailable; no safety conclusion.",
    });
  }
}
