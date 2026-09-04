/**
 * StudentHub AI — CitadelIntegrationConfig
 * 
 * Server-only configuration contract for GovSec Citadel integration (Staging & Shadow).
 * Governed by Cross-System Safety Invariants:
 * - Server-only: Never accessible or bundled into browser/client runtimes.
 * - Zero Committed Secrets: Credentials, keys, and live staging URLs are sourced strictly from environment variables.
 * - Explicit Safe Modes:
 *   - DISABLED: Citadel integration is completely dormant (default in production and bootstrap).
 *   - SHADOW: Outbox events process asynchronously in shadow mode without product impact.
 *   - STAGING_I5_READ: Staging preview for read-only I4/I5 assurance telemetry exploration.
 * - Prohibited Mode: ENFORCING mode is strictly barred in this phase and throws an error if configured.
 * - Decoupled Availability: Product TrustDecision and persistence never depend on Citadel runtime state.
 */

if (typeof window !== "undefined") {
  throw new Error("CitadelIntegrationConfig is strictly server-only and cannot be imported in client/browser contexts.");
}

export const CITADEL_INTEGRATION_MODE = Object.freeze({
  DISABLED: "DISABLED",
  SHADOW: "SHADOW",
  STAGING_I5_READ: "STAGING_I5_READ",
});

const VALID_MODES = new Set(Object.values(CITADEL_INTEGRATION_MODE));

const DEFAULT_TIMEOUT_MS = 5000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 30000;

const DEFAULT_MAX_ATTEMPTS = 5;
const MIN_MAX_ATTEMPTS = 1;
const MAX_MAX_ATTEMPTS = 10;

const DEFAULT_RETRY_BASE_DELAY_MS = 1000;
const MIN_RETRY_BASE_DELAY_MS = 100;
const MAX_RETRY_BASE_DELAY_MS = 10000;

const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:8000";

/**
 * Parses and bounds an integer value within [min, max].
 * @param {any} val 
 * @param {number} defaultVal 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function parseBoundedInt(val, defaultVal, min, max) {
  if (val === undefined || val === null || val === "") return defaultVal;
  const num = Number.parseInt(String(val), 10);
  if (Number.isNaN(num)) return defaultVal;
  return Math.min(max, Math.max(min, num));
}

export class CitadelIntegrationConfig {
  /**
   * Retrieves and validates the current Citadel integration configuration.
   * @param {object} [envOverrides] - Optional environment overrides for testing
   * @returns {object} Canonical configuration object
   */
  static getConfiguration(envOverrides = null) {
    const env = envOverrides || process.env;

    const rawMode = String(env.CITADEL_INTEGRATION_MODE || CITADEL_INTEGRATION_MODE.DISABLED).trim().toUpperCase();

    if (rawMode === "ENFORCING") {
      throw new Error(
        "INVALID_CITADEL_MODE: ENFORCING mode is strictly prohibited. Production enforcement cannot be enabled in this phase."
      );
    }

    if (!VALID_MODES.has(rawMode)) {
      throw new Error(
        `INVALID_CITADEL_MODE: Unknown mode '${rawMode}'. Allowed modes are: ${Array.from(VALID_MODES).join(", ")}.`
      );
    }

    const baseUrl = String(
      env.CITADEL_STAGING_BASE_URL || env.CITADEL_BASE_URL || DEFAULT_LOCAL_BASE_URL
    ).replace(/\/+$/, "");

    const ingestionUrl = env.CITADEL_INGESTION_URL
      ? String(env.CITADEL_INGESTION_URL).trim()
      : `${baseUrl}/api/v1/integrations/studenthub/events`;

    const assuranceUrl = env.CITADEL_ASSURANCE_URL
      ? String(env.CITADEL_ASSURANCE_URL).trim()
      : `${baseUrl}/api/v1/integrations/studenthub/assurance`;

    const workloadToken = env.CITADEL_WORKLOAD_TOKEN
      ? String(env.CITADEL_WORKLOAD_TOKEN).trim()
      : null;

    const signingKey = (env.CITADEL_SIGNING_KEY || env.CITADEL_SIGNING_SECRET)
      ? String(env.CITADEL_SIGNING_KEY || env.CITADEL_SIGNING_SECRET).trim()
      : null;

    const timeoutMs = parseBoundedInt(
      env.CITADEL_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
      MIN_TIMEOUT_MS,
      MAX_TIMEOUT_MS
    );

    const retryMaxAttempts = parseBoundedInt(
      env.CITADEL_RETRY_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
      MIN_MAX_ATTEMPTS,
      MAX_MAX_ATTEMPTS
    );

    const retryBaseDelayMs = parseBoundedInt(
      env.CITADEL_RETRY_BASE_DELAY_MS,
      DEFAULT_RETRY_BASE_DELAY_MS,
      MIN_RETRY_BASE_DELAY_MS,
      MAX_RETRY_BASE_DELAY_MS
    );

    return {
      mode: rawMode,
      isEnabled: rawMode !== CITADEL_INTEGRATION_MODE.DISABLED,
      isShadow: rawMode === CITADEL_INTEGRATION_MODE.SHADOW,
      isStagingI5Read: rawMode === CITADEL_INTEGRATION_MODE.STAGING_I5_READ,
      baseUrl,
      ingestionUrl,
      assuranceUrl,
      workloadToken,
      signingKey,
      timeoutMs,
      retryMaxAttempts,
      retryBaseDelayMs,
    };
  }

  /**
   * Quick check if integration is active (non-DISABLED).
   */
  static isEnabled(envOverrides = null) {
    return this.getConfiguration(envOverrides).isEnabled;
  }

  /**
   * Returns current mode.
   */
  static getMode(envOverrides = null) {
    return this.getConfiguration(envOverrides).mode;
  }
}
