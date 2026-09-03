/**
 * StudentHub AI — CitadelAssuranceClient (I4)
 * 
 * Server-only read-only client for querying GovSec Citadel assurance posture.
 * Governed by Cross-System Safety Invariants:
 * - Read-Only: Never sends mutations or affects Citadel detection state.
 * - Decoupled: NEVER influences, mutates, or blocks product TrustDecision.
 * - Strict Egress Validation: Requires server-configured base URL and HTTPS in production.
 * - Fail-Closed Workload Auth: Uses service workload identity, NOT user JWTs.
 * - Resource Bounds: 5000ms strict timeout and 128KB bounded payload read.
 * - Redirection Guard: Rejects unrestricted HTTP redirects.
 */

export class CitadelAssuranceError extends Error {
  constructor(code, message, details = {}) {
    super(`[CitadelAssuranceClient:${code}] ${message}`);
    this.name = "CitadelAssuranceError";
    this.code = code;
    this.details = details;
  }
}

export const ASSURANCE_ERROR_CODE = Object.freeze({
  ASSURANCE_UNAVAILABLE: "ASSURANCE_UNAVAILABLE",
  ASSURANCE_TIMEOUT: "ASSURANCE_TIMEOUT",
  ASSURANCE_MALFORMED: "ASSURANCE_MALFORMED",
  ASSURANCE_OVERSIZED: "ASSURANCE_OVERSIZED",
  ASSURANCE_FORBIDDEN: "ASSURANCE_FORBIDDEN",
  WORKLOAD_AUTH_UNAVAILABLE: "WORKLOAD_AUTH_UNAVAILABLE",
  INVALID_DESTINATION: "INVALID_DESTINATION",
});

const DEFAULT_CITADEL_ASSURANCE_URL = "http://127.0.0.1:8000/api/v1/integrations/studenthub/assurance";
const MAX_RESPONSE_BYTES = 128 * 1024; // 128 KB
const DEFAULT_TIMEOUT_MS = 5000;

export class CitadelAssuranceClient {
  #baseUrl;
  #workloadToken;
  #timeoutMs;
  #fetchFn;

  /**
   * @param {object} [options]
   * @param {string} [options.baseUrl]
   * @param {string} [options.workloadToken]
   * @param {number} [options.timeoutMs=5000]
   * @param {Function} [options.fetchFn=globalThis.fetch]
   */
  constructor({
    baseUrl = process.env.CITADEL_ASSURANCE_URL || DEFAULT_CITADEL_ASSURANCE_URL,
    workloadToken = process.env.CITADEL_WORKLOAD_TOKEN,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchFn = globalThis.fetch,
  } = {}) {
    this.#baseUrl = baseUrl;
    this.#workloadToken = workloadToken;
    this.#timeoutMs = timeoutMs;
    this.#fetchFn = fetchFn;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  /**
   * Strictly validates target URL against security and SSRF constraints.
   * @param {string} urlString 
   * @returns {URL}
   */
  validateEgressUrl(urlString) {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.INVALID_DESTINATION,
        "Malformed Citadel assurance URL."
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && parsed.protocol !== "https:") {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.INVALID_DESTINATION,
        `HTTPS is strictly required in production: ${parsed.protocol}`
      );
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.INVALID_DESTINATION,
        `Disallowed protocol: ${parsed.protocol}`
      );
    }

    // SSRF / Cloud metadata protection
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "169.254.169.254" ||
      hostname === "metadata.google.internal" ||
      hostname === "instance-data"
    ) {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.INVALID_DESTINATION,
        "Access to cloud metadata endpoints is strictly blocked."
      );
    }

    return parsed;
  }

  /**
   * Validates service workload identity.
   * Workload identity is distinct from user JWT and never exposed to the browser.
   * @returns {string}
   */
  validateWorkloadCredentials() {
    const token = this.#workloadToken || process.env.CITADEL_WORKLOAD_TOKEN;
    if (!token || typeof token !== "string" || !token.trim()) {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.WORKLOAD_AUTH_UNAVAILABLE,
        "Citadel workload credentials are not configured or empty."
      );
    }
    return token.trim();
  }

  /**
   * Fetches read-only security assurance posture for a given case or security reference.
   * 
   * @param {string} caseId - Canonical case ID or reference identifier
   * @param {object} [options]
   * @param {string} [options.correlationId]
   * @returns {Promise<object>} Canonical Citadel Assurance DTO
   */
  async getAssurancePosture(caseId, { correlationId = null } = {}) {
    if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_MALFORMED,
        "Valid caseId is required for assurance posture lookup."
      );
    }

    const token = this.validateWorkloadCredentials();
    const cleanCaseId = encodeURIComponent(caseId.trim());
    const targetUrlStr = `${this.#baseUrl.replace(/\/+$/, "")}/${cleanCaseId}`;
    this.validateEgressUrl(targetUrlStr);

    const corrId = correlationId || `corr-citadel-${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeoutMs);

    let response;
    try {
      response = await this.#fetchFn(targetUrlStr, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "User-Agent": "StudentHub-AI/CitadelAssuranceClient (I4)",
          "X-Correlation-ID": corrId,
        },
        redirect: "error", // Prevent silent SSRF via redirection
        signal: controller.signal,
      });
    } catch (networkErr) {
      clearTimeout(timeoutId);
      if (networkErr.name === "AbortError") {
        throw new CitadelAssuranceError(
          ASSURANCE_ERROR_CODE.ASSURANCE_TIMEOUT,
          `Citadel assurance request timed out after ${this.#timeoutMs}ms.`,
          { caseId, correlationId: corrId }
        );
      }
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_UNAVAILABLE,
        `Citadel assurance service unreachable: ${networkErr.message}`,
        { caseId, correlationId: corrId }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle HTTP status codes
    if (response.status === 401 || response.status === 403) {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_FORBIDDEN,
        `Citadel rejected workload credentials (HTTP ${response.status}).`,
        { statusCode: response.status, correlationId: corrId }
      );
    }

    if (response.status === 404) {
      return {
        caseId: caseId.trim(),
        securityFindingStatus: "UNKNOWN",
        securitySeverity: "NONE",
        operationalPriority: "ROUTINE",
        alertReference: null,
        incidentReference: null,
        securityReasonCode: "NOT_OBSERVED",
        securityTimestamp: new Date().toISOString(),
        integrationHealth: "HEALTHY",
      };
    }

    if (response.status >= 500) {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_UNAVAILABLE,
        `Citadel returned server error (HTTP ${response.status}).`,
        { statusCode: response.status, correlationId: corrId }
      );
    }

    if (!response.ok) {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_UNAVAILABLE,
        `Unexpected Citadel response status: HTTP ${response.status}`,
        { statusCode: response.status, correlationId: corrId }
      );
    }

    // Read response with strict byte count bound (128 KB)
    let rawText = "";
    try {
      if (response.body && typeof response.body.getReader === "function") {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.byteLength;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            await reader.cancel();
            throw new CitadelAssuranceError(
              ASSURANCE_ERROR_CODE.ASSURANCE_OVERSIZED,
              `Citadel response exceeded maximum allowable limit of ${MAX_RESPONSE_BYTES} bytes.`,
              { bytesReceived: totalBytes, correlationId: corrId }
            );
          }
          rawText += decoder.decode(value, { stream: true });
        }
      } else {
        rawText = await response.text();
        if (Buffer.byteLength(rawText, "utf8") > MAX_RESPONSE_BYTES) {
          throw new CitadelAssuranceError(
            ASSURANCE_ERROR_CODE.ASSURANCE_OVERSIZED,
            `Citadel response exceeded maximum allowable limit of ${MAX_RESPONSE_BYTES} bytes.`,
            { bytesReceived: Buffer.byteLength(rawText, "utf8"), correlationId: corrId }
          );
        }
      }
    } catch (readErr) {
      if (readErr instanceof CitadelAssuranceError) throw readErr;
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_MALFORMED,
        `Failed to read Citadel response body: ${readErr.message}`,
        { correlationId: corrId }
      );
    }

    // Parse and validate JSON
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new CitadelAssuranceError(
        ASSURANCE_ERROR_CODE.ASSURANCE_MALFORMED,
        "Citadel response body is not valid JSON.",
        { correlationId: corrId }
      );
    }

    // Map to canonical DTO
    return this.normalizeAssuranceDto(caseId.trim(), parsed);
  }

  /**
   * Normalizes arbitrary Citadel response into canonical StudentHub Assurance DTO.
   * INVARIANT: Never outputs trustDecision, riskScore, or scamVerdict.
   * @param {string} caseId 
   * @param {object} data 
   * @returns {object} Canonical Assurance DTO
   */
  normalizeAssuranceDto(caseId, data = {}) {
    const validFindingStatuses = ["CLEAN", "SUSPICIOUS", "ALERTED", "UNDER_INVESTIGATION", "RESOLVED", "UNKNOWN"];
    const validSeverities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const validPriorities = ["P0", "P1", "P2", "P3", "ROUTINE"];

    const findingStatus = String(data.securityFindingStatus || data.finding_status || data.status || "UNKNOWN").toUpperCase();
    const severity = String(data.securitySeverity || data.severity || "NONE").toUpperCase();
    const priority = String(data.operationalPriority || data.priority || "ROUTINE").toUpperCase();

    return {
      caseId,
      securityFindingStatus: validFindingStatuses.includes(findingStatus) ? findingStatus : "UNKNOWN",
      securitySeverity: validSeverities.includes(severity) ? severity : "NONE",
      operationalPriority: validPriorities.includes(priority) ? priority : "ROUTINE",
      alertReference: data.alertReference || data.alert_ref || null,
      incidentReference: data.incidentReference || data.incident_ref || null,
      securityReasonCode: data.securityReasonCode || data.reason_code || null,
      securityTimestamp: data.securityTimestamp || data.timestamp || new Date().toISOString(),
      integrationHealth: data.integrationHealth || "HEALTHY",
    };
  }
}
