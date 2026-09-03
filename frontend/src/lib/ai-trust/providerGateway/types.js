/**
 * Capability-oriented provider contracts for the canonical Trust pipeline.
 * Provider health is deliberately separate from evidence and decision
 * semantics. A provider can be healthy while returning UNKNOWN, and an
 * outage can never be translated into a positive finding.
 */

export const PROVIDER_CAPABILITY = Object.freeze({
  URL_THREAT: "UrlThreatProvider",
  WEB_EVIDENCE: "WebEvidenceProvider",
  INDEPENDENT_RESEARCH: "IndependentResearchProvider",
  EVIDENCE_ANALYSIS: "EvidenceAnalysisProvider",
  FINAL_SYNTHESIS: "FinalSynthesisProvider",
});

export const PROVIDER_HEALTH_STATUS = Object.freeze({
  NOT_CONFIGURED: "NOT_CONFIGURED",
  READY: "READY",
  DEGRADED: "DEGRADED",
  RATE_LIMITED: "RATE_LIMITED",
  TIMEOUT: "TIMEOUT",
  AUTH_FAILED: "AUTH_FAILED",
  MALFORMED: "MALFORMED",
  UNAVAILABLE: "UNAVAILABLE",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
});

const CAPABILITY_METHODS = Object.freeze({
  [PROVIDER_CAPABILITY.URL_THREAT]: "check",
  [PROVIDER_CAPABILITY.WEB_EVIDENCE]: "verify",
  [PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH]: "synthesize",
  [PROVIDER_CAPABILITY.EVIDENCE_ANALYSIS]: "analyze",
  [PROVIDER_CAPABILITY.FINAL_SYNTHESIS]: "synthesize",
});

export function providerMethodFor(capability) {
  return CAPABILITY_METHODS[capability] || null;
}

export function providerHealthFromResult(result) {
  const value = String(result?.providerStatus || result?.status || "").toUpperCase();
  if (Object.values(PROVIDER_HEALTH_STATUS).includes(value)) return value;
  return result ? PROVIDER_HEALTH_STATUS.READY : PROVIDER_HEALTH_STATUS.UNAVAILABLE;
}

export function createProviderHealthObservation({
  capability,
  providerId,
  status = PROVIDER_HEALTH_STATUS.NOT_CONFIGURED,
  requestId = null,
  latencyMs = 0,
  errorCode = null,
} = {}) {
  const safeStatus = Object.values(PROVIDER_HEALTH_STATUS).includes(status)
    ? status
    : PROVIDER_HEALTH_STATUS.UNAVAILABLE;
  return Object.freeze({
    capability: String(capability || "UNKNOWN").slice(0, 80),
    providerId: String(providerId || "unknown_provider").slice(0, 160),
    status: safeStatus,
    requestId: requestId ? String(requestId).slice(0, 160) : null,
    latencyMs: Number.isFinite(Number(latencyMs)) ? Math.max(0, Math.round(Number(latencyMs))) : 0,
    errorCode: errorCode ? String(errorCode).slice(0, 120) : null,
  });
}

export { CAPABILITY_METHODS };
