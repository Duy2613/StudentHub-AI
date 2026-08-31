import { RenderLayer2AProvider } from "./RenderLayer2AProvider.js";
import { createLayer2AResult, LAYER_2A_FINDING, LAYER_2A_PROVIDER_STATUS } from "./types.js";
import { markTrustedLayer2AResult } from "./TrustBoundary.js";
import {
  decideReputationLookup,
  REPUTATION_LOOKUP_POLICY,
  REPUTATION_LOOKUP_REASON,
  REPUTATION_LOOKUP_STATUS,
} from "./ReputationLookupPolicy.js";

const defaultProvider = new RenderLayer2AProvider();

export class Layer2AReputationService {
  static async verify(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const url = typeof input.url === "string" ? input.url : "";
    const requestId = typeof input.requestId === "string" ? input.requestId : null;
    const options = input.options && typeof input.options === "object" && !Array.isArray(input.options) ? input.options : {};
    // Recompute the disclosure decision at this boundary. A caller may pass a
    // hint, but it must not be able to turn a private/metadata target into an
    // externally disclosed URL.
    const lookup = decideReputationLookup(url);
    const lookupFields = {
      reputationLookupPolicy: lookup.policy,
      reputationLookupReason: lookup.reason,
      reputationLookupStatus: lookup.policy === REPUTATION_LOOKUP_POLICY.ALLOW
        ? REPUTATION_LOOKUP_STATUS.LOOKUP_PERFORMED
        : lookup.policy === REPUTATION_LOOKUP_POLICY.REDACT
          ? REPUTATION_LOOKUP_STATUS.LOOKUP_REDACTED
          : REPUTATION_LOOKUP_STATUS.SKIPPED_PRIVACY_SAFETY,
      reputationLookupTargetClass: lookup.targetClass,
      reputationLookupDisclosed: lookup.disclosed,
    };

    if (lookup.policy === REPUTATION_LOOKUP_POLICY.SKIP) {
      const emptyInput = !url.trim();
      const invalidInput = lookup.reason === REPUTATION_LOOKUP_REASON.INVALID_URL;
      return markTrustedLayer2AResult(createLayer2AResult({
        providerStatus: emptyInput
          ? LAYER_2A_PROVIDER_STATUS.NOT_APPLICABLE
          : LAYER_2A_PROVIDER_STATUS.INVALID_INPUT,
        finding: emptyInput
          ? LAYER_2A_FINDING.NOT_APPLICABLE
          : invalidInput
            ? LAYER_2A_FINDING.UNKNOWN
            : LAYER_2A_FINDING.SKIPPED_PRIVACY_SAFETY,
        requestId,
        notApplicable: emptyInput,
        errorCode: emptyInput ? null : `REPUTATION_LOOKUP_SKIPPED_${lookup.reason}`,
        message: emptyInput
          ? null
          : `External reputation lookup skipped: ${lookup.reason}.`,
        ...lookupFields,
      }));
    }

    if (!url) {
      return markTrustedLayer2AResult(createLayer2AResult({
        providerStatus: LAYER_2A_PROVIDER_STATUS.NOT_APPLICABLE,
        finding: LAYER_2A_FINDING.NOT_APPLICABLE,
        requestId,
        notApplicable: true,
        ...lookupFields,
      }));
    }

    const provider = options.provider || defaultProvider;
    let result;
    try {
      result = typeof provider?.check === "function"
        ? await provider.check({ url: lookup.lookupUrl || url, requestId, signal: options.signal })
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
    return markTrustedLayer2AResult(createLayer2AResult({
      ...result,
      requestId: result.requestId || requestId,
      ...lookupFields,
    }));
  }
}
