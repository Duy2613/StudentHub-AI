/**
 * Layer 2B confidence metadata.
 *
 * This number is a bounded strength-of-local-signal indicator, not a
 * calibrated probability of safety. It is deliberately conservative when
 * the provider boundary is uncertain and is never used to authorize SAFE.
 */

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value) {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(2));
}

export class Layer2ConfidenceEngine {
  static calibrateConfidence(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const layer1Result = input.layer1Result && typeof input.layer1Result === "object" && !Array.isArray(input.layer1Result)
      ? input.layer1Result
      : {};
    const semanticAnalysis = input.semanticAnalysis && typeof input.semanticAnalysis === "object" && !Array.isArray(input.semanticAnalysis)
      ? input.semanticAnalysis
      : {};
    const contextSignals = asArray(semanticAnalysis.contextSignals);
    const consistencyFindings = asArray(semanticAnalysis.consistencyFindings);
    const crossModalFindings = asArray(semanticAnalysis.crossModalFindings);
    const claims = asArray(semanticAnalysis.claims);
    const layer1Status = layer1Result?.status || "UNKNOWN";

    if (!semanticAnalysis || semanticAnalysis.classification === "UNKNOWN" ||
        ["TIMEOUT", "UNAVAILABLE", "INVALID_RESPONSE", "INJECTION_REJECTED"].includes(semanticAnalysis.modelStatus)) {
      return 0;
    }

    const hasCriticalContext = contextSignals.some((signal) => signal?.authoritative !== false && signal?.severity === "critical");
    const hasCriticalCrossModal = crossModalFindings.some((finding) => finding?.authoritative !== false && finding?.severity === "critical");
    const isCoercive = semanticAnalysis.intent?.coercive === true ||
      ["request_credentials", "request_payment"].includes(semanticAnalysis.intent?.primary);

    if (layer1Status === "BLOCK" || (hasCriticalContext && (hasCriticalCrossModal || isCoercive))) return 0.98;
    if (hasCriticalContext || hasCriticalCrossModal) return 0.92;
    if (consistencyFindings.some((finding) => finding?.authoritative !== false)) return 0.72;
    if (layer1Status === "SUSPICIOUS") return 0.68;
    if (claims.some((claim) => claim?.verificationRequired !== false)) return 0.58;

    // A clean semantic screen has only bounded local heuristic support. It is
    // intentionally below the old optimistic pass floor.
    return clamp(contextSignals.length > 0 ? 0.55 : 0.50);
  }
}
