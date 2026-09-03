import {
  createProviderHealthObservation,
  PROVIDER_CAPABILITY,
  PROVIDER_HEALTH_STATUS,
  providerHealthFromResult,
  providerMethodFor,
} from "./types.js";
import { normalizeProviderSelection, PROVIDER_SELECTION_MODE, readProviderSelection } from "./ProviderSelection.js";

function safeText(value, max = 160) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "";
}

function providerIdFor(provider, fallback) {
  return safeText(provider?.providerId || provider?.id, 160) || fallback;
}

const LEGACY_PROVIDER_IDS = Object.freeze({
  [PROVIDER_CAPABILITY.URL_THREAT]: "legacy_verification_layer2",
  [PROVIDER_CAPABILITY.WEB_EVIDENCE]: "legacy_verification_layer3",
  [PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH]: "legacy_verification_layer4",
  [PROVIDER_CAPABILITY.EVIDENCE_ANALYSIS]: "legacy_verification_evidence_analysis",
  [PROVIDER_CAPABILITY.FINAL_SYNTHESIS]: "legacy_verification_final_synthesis",
});

function isEnabled(adapter) {
  if (!adapter || typeof adapter !== "object") return false;
  if (adapter.enabled === true || adapter.isConfigured === true) return true;
  try {
    return typeof adapter.isConfigured === "function" && adapter.isConfigured() === true;
  } catch {
    return false;
  }
}

function providerFromLegacy(adapter, capability, method, fallbackId) {
  if (!adapter) return null;
  if (capability === PROVIDER_CAPABILITY.URL_THREAT && typeof adapter.layer2Provider === "function") {
    return adapter.layer2Provider();
  }
  if (capability === PROVIDER_CAPABILITY.WEB_EVIDENCE && typeof adapter.verifyLayer3 === "function") {
    return { providerId: fallbackId, verify: (params) => adapter.verifyLayer3(params) };
  }
  if (capability === PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH && typeof adapter.verifyLayer4 === "function") {
    return { providerId: fallbackId, synthesize: (params) => adapter.verifyLayer4(params) };
  }
  if (typeof adapter[method] === "function") return { providerId: fallbackId, [method]: (params) => adapter[method](params) };
  return null;
}

function unavailableResult(capability, providerId, params = {}) {
  const requestId = safeText(params?.requestId, 160) || null;
  return {
    status: "UNAVAILABLE",
    providerStatus: PROVIDER_HEALTH_STATUS.NOT_CONFIGURED,
    providerId,
    requestId,
    latencyMs: 0,
    reason: "No provider is configured for this capability.",
    errorCode: "PROVIDER_CAPABILITY_NOT_CONFIGURED",
  };
}

export class ProviderGateway {
  constructor({ providers = {}, legacyVerificationAdapter = null, selection = null, env = process.env, shadowProviders = {} } = {}) {
    const configured = providers && typeof providers === "object" && !Array.isArray(providers) ? providers : {};
    const nativeProviders = new Map();
    for (const capability of Object.values(PROVIDER_CAPABILITY)) {
      const direct = configured[capability] || configured[capability[0].toLowerCase() + capability.slice(1)] || null;
      if (direct) nativeProviders.set(capability, direct);
    }
    this.legacyVerificationAdapter = legacyVerificationAdapter;
    this.selection = normalizeProviderSelection(selection === null || selection === undefined
      ? readProviderSelection(env)
      : selection);
    this.providers = new Map();
    this.shadowProviders = new Map();
    for (const capability of Object.values(PROVIDER_CAPABILITY)) {
      const native = nativeProviders.get(capability) || null;
      const legacy = legacyVerificationAdapter && isEnabled(legacyVerificationAdapter)
        ? providerFromLegacy(legacyVerificationAdapter, capability, providerMethodFor(capability), LEGACY_PROVIDER_IDS[capability])
        : null;
      const configuredShadow = shadowProviders?.[capability] || shadowProviders?.[capability[0].toLowerCase() + capability.slice(1)] || null;
      const mode = this.selection[capability];
      if (mode === PROVIDER_SELECTION_MODE.LEGACY) {
        if (legacy) this.providers.set(capability, legacy);
      } else if (mode === PROVIDER_SELECTION_MODE.NATIVE) {
        if (native) this.providers.set(capability, native);
      } else if (mode === PROVIDER_SELECTION_MODE.SHADOW) {
        if (legacy) {
          this.providers.set(capability, legacy);
          if (native) this.shadowProviders.set(capability, native);
        } else if (native) {
          this.providers.set(capability, native);
        }
      } else if (native) {
        this.providers.set(capability, native);
        if (configuredShadow) this.shadowProviders.set(capability, configuredShadow);
      } else if (legacy) {
        this.providers.set(capability, legacy);
      }
      if (configuredShadow && !this.shadowProviders.has(capability) && this.providers.get(capability) !== configuredShadow) {
        this.shadowProviders.set(capability, configuredShadow);
      }
    }
    for (const [capability, provider] of [...this.providers.entries()]) {
      if (!provider) this.providers.delete(capability);
    }
  }

  get enabled() {
    return [...this.providers.values()].some(Boolean);
  }

  get isConfigured() {
    return this.enabled;
  }

  get(capability) {
    return this.providers.get(capability) || null;
  }

  isCapabilityConfigured(capability) {
    return Boolean(this.get(capability));
  }

  describe() {
    return {
      providerGateway: "studenthub-trust-provider-gateway-v1",
      enabled: this.enabled,
      selection: this.selection,
      capabilities: Object.values(PROVIDER_CAPABILITY).map((capability) => {
        const provider = this.get(capability);
        return {
          capability,
          configured: Boolean(provider),
          providerId: providerIdFor(provider, "not_configured"),
          method: providerMethodFor(capability),
          shadowProviderId: providerIdFor(this.shadowProviders.get(capability), "not_configured"),
        };
      }),
    };
  }

  shadow(capability) {
    return this.shadowProviders.get(capability) || null;
  }

  layer2Provider() {
    return this.get(PROVIDER_CAPABILITY.URL_THREAT);
  }

  async verifyLayer3(params = {}) {
    return this.#invoke(PROVIDER_CAPABILITY.WEB_EVIDENCE, params);
  }

  async verifyLayer4(params = {}) {
    return this.#invoke(PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH, params);
  }

  async invoke(capability, params = {}) {
    return this.#invoke(capability, params);
  }

  async #invoke(capability, params) {
    const provider = this.get(capability);
    const method = providerMethodFor(capability);
    const providerId = providerIdFor(provider, `provider_${String(capability || "unknown").toLowerCase()}`);
    if (!provider || !method || typeof provider[method] !== "function") return unavailableResult(capability, providerId, params);
    try {
      const result = await provider[method](params);
      return result || unavailableResult(capability, providerId, params);
    } catch (error) {
      if (params?.signal?.aborted || error?.name === "AbortError") throw error;
      return {
        ...unavailableResult(capability, providerId, params),
        providerStatus: PROVIDER_HEALTH_STATUS.UNAVAILABLE,
        errorCode: "PROVIDER_INVOCATION_FAILED",
      };
    }
  }

  health(capability, result = null) {
    const provider = this.get(capability);
    return createProviderHealthObservation({
      capability,
      providerId: providerIdFor(provider, "not_configured"),
      status: provider ? providerHealthFromResult(result) : PROVIDER_HEALTH_STATUS.NOT_CONFIGURED,
      requestId: result?.requestId,
      latencyMs: result?.latencyMs,
      errorCode: result?.errorCode,
    });
  }
}

export function createProviderGateway(options = {}) {
  return new ProviderGateway(options);
}

export { PROVIDER_CAPABILITY, PROVIDER_HEALTH_STATUS } from "./types.js";
