import assert from "node:assert/strict";
import test from "node:test";
import { AIGatewayModelProvider } from "../../src/lib/ai-trust/layer2/providers/AIGatewayModelProvider.js";
import { Layer2SemanticService } from "../../src/lib/ai-trust/layer2/Layer2SemanticService.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { stageFromL2B, stageFromL4 } from "../../src/lib/ai-trust/v5/stageAdapters.js";
import { GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";

test("L2B preserves upstream HTTP status and becomes PARTIAL instead of COMPLETED", async () => {
  const provider = new AIGatewayModelProvider({
    gateway: {
      async generateStructured() {
        return {
          ok: false,
          errorType: GATEWAY_ERROR_TYPE.HTTP_ERROR,
          httpStatus: 429,
          errorMessage: "safe upstream error",
          attempts: [{ provider: "gemini", model: "gemini-3.8-flash", ok: false, errorType: "HTTP_ERROR", httpStatus: 429 }],
          totalLatencyMs: 12,
        };
      },
    },
  });
  const result = await Layer2SemanticService.verify({
    type: "text",
    content: "Một claim cần đối chiếu.",
    options: { provider, requestId: "l2b-provider-fixture" },
  });

  assert.equal(result.metrics.providerStatus, "RATE_LIMITED");
  assert.equal(result.details.providerErrorType, "HTTP_ERROR");
  assert.equal(result.details.providerHttpStatus, 429);
  const stage = stageFromL2B(result, "l2b-provider-fixture");
  assert.equal(stage.providerStatus, "RATE_LIMITED");
  assert.equal(stage.operationStatus, "PARTIAL");
  assert.equal(stage.providerHttpStatus, 429);
});

test("L4 preserves auth failure while deterministic policy remains authoritative", async () => {
  const provider = new AIGatewayReasoningProvider({
    gateway: {
      async generateStructured() {
        return {
          ok: false,
          errorType: GATEWAY_ERROR_TYPE.HTTP_ERROR,
          httpStatus: 401,
          errorMessage: "safe upstream error",
          attempts: [],
          totalLatencyMs: 8,
        };
      },
    },
  });
  const result = await Layer4TrustService.evaluate({
    layer1Result: { status: "UNKNOWN", signals: [] },
    layer2Result: { status: "UNKNOWN", claims: [], contextSignals: [] },
    layer2AResult: { providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE" },
    layer3Result: { status: "INSUFFICIENT", evidence: [], verificationCompleteness: 0 },
    options: { provider },
  });

  assert.equal(result.aiVerificationStatus, "UNAVAILABLE");
  assert.equal(result.aiVerificationErrorType, "HTTP_ERROR");
  assert.equal(result.aiVerificationHttpStatus, 401);
  assert.equal(result.enforcement, "REVIEW");
  const stage = stageFromL4(result, "l4-provider-fixture");
  assert.equal(stage.providerStatus, "AUTH_FAILED");
  assert.equal(stage.operationStatus, "PARTIAL");
  assert.equal(stage.providerHttpStatus, 401);
});

