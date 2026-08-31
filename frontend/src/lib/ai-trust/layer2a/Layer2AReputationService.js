import { RenderLayer2AProvider } from "./RenderLayer2AProvider.js";
import { createLayer2AResult, LAYER_2A_FINDING, LAYER_2A_PROVIDER_STATUS } from "./types.js";
import { markTrustedLayer2AResult } from "./TrustBoundary.js";

const defaultProvider = new RenderLayer2AProvider();

export class Layer2AReputationService {
  static async verify(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const url = typeof input.url === "string" ? input.url : "";
    const requestId = typeof input.requestId === "string" ? input.requestId : null;
    const options = input.options && typeof input.options === "object" && !Array.isArray(input.options) ? input.options : {};
    if (!url) {
      return markTrustedLayer2AResult(createLayer2AResult({
        providerStatus: LAYER_2A_PROVIDER_STATUS.NOT_APPLICABLE,
        finding: LAYER_2A_FINDING.NOT_APPLICABLE,
        requestId,
        notApplicable: true,
      }));
    }

    const provider = options.provider || defaultProvider;
    let result;
    try {
      result = typeof provider?.check === "function"
        ? await provider.check({ url, requestId, signal: options.signal })
        : createLayer2AResult({
          providerStatus: LAYER_2A_PROVIDER_STATUS.UNAVAILABLE,
          finding: LAYER_2A_FINDING.UNKNOWN,
          requestId,
          errorCode: "PROVIDER_CHECK_UNAVAILABLE",
        });
    } catch (error) {
      // Cancellation is control flow, not a provider outage. Let the
      // orchestrator suppress the stale run instead of publishing UNKNOWN
      // for a request the caller explicitly cancelled.
      if (options.signal?.aborted || error?.name === "AbortError") throw error;
      result = createLayer2AResult({
        providerStatus: LAYER_2A_PROVIDER_STATUS.UNAVAILABLE,
        finding: LAYER_2A_FINDING.UNKNOWN,
        requestId,
        errorCode: "PROVIDER_CHECK_FAILED",
      });
    }
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      result = createLayer2AResult({
        providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE,
        finding: LAYER_2A_FINDING.UNKNOWN,
        requestId,
        errorCode: "PROVIDER_INVALID_RESULT",
      });
    }
    return markTrustedLayer2AResult(result);
  }
}
