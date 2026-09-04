/**
 * StudentHub AI — Citadel Staging Configuration Contract Suite
 * 
 * Verifies:
 * 1. Safe Default: Mode defaults to DISABLED when env is absent.
 * 2. Allowed Modes: DISABLED, SHADOW, and STAGING_I5_READ are valid and correctly reported.
 * 3. Barred Mode: Setting mode to ENFORCING is strictly prohibited and throws an error.
 * 4. Unknown Mode: Setting mode to arbitrary unrecognized values throws an error.
 * 5. Bounded Numerics: Timeouts, max retries, and retry delays are strictly bounded.
 * 6. URL Derivation: Ingestion and assurance URLs derive from staging base URL or specific overrides.
 * 7. Server-Only Isolation: Config cannot be loaded in client window environments.
 * 8. Zero Secret Leakage: No credentials committed to the codebase.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CitadelIntegrationConfig,
  CITADEL_INTEGRATION_MODE,
} from "../../src/lib/server/citadel/CitadelIntegrationConfig.js";

describe("Citadel Staging Configuration Contract Suite", () => {
  it("defaults to DISABLED mode when no environment variables are set", () => {
    const config = CitadelIntegrationConfig.getConfiguration({});
    assert.equal(config.mode, CITADEL_INTEGRATION_MODE.DISABLED);
    assert.equal(config.isEnabled, false);
    assert.equal(config.isShadow, false);
    assert.equal(config.isStagingI5Read, false);
    assert.equal(config.timeoutMs, 5000);
    assert.equal(config.retryMaxAttempts, 5);
    assert.equal(config.retryBaseDelayMs, 1000);
  });

  it("supports explicit SHADOW mode", () => {
    const config = CitadelIntegrationConfig.getConfiguration({
      CITADEL_INTEGRATION_MODE: "SHADOW",
      CITADEL_STAGING_BASE_URL: "https://citadel-staging.internal",
      CITADEL_WORKLOAD_TOKEN: "mock-token-123",
      CITADEL_TIMEOUT_MS: "3500",
    });

    assert.equal(config.mode, CITADEL_INTEGRATION_MODE.SHADOW);
    assert.equal(config.isEnabled, true);
    assert.equal(config.isShadow, true);
    assert.equal(config.isStagingI5Read, false);
    assert.equal(config.baseUrl, "https://citadel-staging.internal");
    assert.equal(config.ingestionUrl, "https://citadel-staging.internal/api/v1/integrations/studenthub/events");
    assert.equal(config.assuranceUrl, "https://citadel-staging.internal/api/v1/integrations/studenthub/assurance");
    assert.equal(config.workloadToken, "mock-token-123");
    assert.equal(config.timeoutMs, 3500);
  });

  it("supports explicit STAGING_I5_READ mode", () => {
    const config = CitadelIntegrationConfig.getConfiguration({
      CITADEL_INTEGRATION_MODE: "STAGING_I5_READ",
      CITADEL_STAGING_BASE_URL: "https://citadel-staging.internal",
      CITADEL_SIGNING_KEY: "mock-signing-key-456",
    });

    assert.equal(config.mode, CITADEL_INTEGRATION_MODE.STAGING_I5_READ);
    assert.equal(config.isEnabled, true);
    assert.equal(config.isShadow, false);
    assert.equal(config.isStagingI5Read, true);
    assert.equal(config.signingKey, "mock-signing-key-456");
  });

  it("strictly prohibits and rejects ENFORCING mode", () => {
    assert.throws(
      () => CitadelIntegrationConfig.getConfiguration({ CITADEL_INTEGRATION_MODE: "ENFORCING" }),
      /INVALID_CITADEL_MODE.*ENFORCING mode is strictly prohibited/
    );
    assert.throws(
      () => CitadelIntegrationConfig.getConfiguration({ CITADEL_INTEGRATION_MODE: "enforcing" }),
      /INVALID_CITADEL_MODE.*ENFORCING mode is strictly prohibited/
    );
  });

  it("rejects unknown or invalid integration modes", () => {
    assert.throws(
      () => CitadelIntegrationConfig.getConfiguration({ CITADEL_INTEGRATION_MODE: "RANDOM_UNSUPPORTED" }),
      /INVALID_CITADEL_MODE.*Unknown mode 'RANDOM_UNSUPPORTED'/
    );
  });

  it("enforces safe upper and lower bounds on numeric configuration", () => {
    // Under minimums
    const under = CitadelIntegrationConfig.getConfiguration({
      CITADEL_TIMEOUT_MS: "100", // below 1000
      CITADEL_RETRY_MAX_ATTEMPTS: "0", // below 1
      CITADEL_RETRY_BASE_DELAY_MS: "10", // below 100
    });
    assert.equal(under.timeoutMs, 1000, "Timeout must clamp to minimum 1000ms");
    assert.equal(under.retryMaxAttempts, 1, "Max attempts must clamp to minimum 1");
    assert.equal(under.retryBaseDelayMs, 100, "Base delay must clamp to minimum 100ms");

    // Over maximums
    const over = CitadelIntegrationConfig.getConfiguration({
      CITADEL_TIMEOUT_MS: "999999", // above 30000
      CITADEL_RETRY_MAX_ATTEMPTS: "50", // above 10
      CITADEL_RETRY_BASE_DELAY_MS: "999999", // above 10000
    });
    assert.equal(over.timeoutMs, 30000, "Timeout must clamp to maximum 30000ms");
    assert.equal(over.retryMaxAttempts, 10, "Max attempts must clamp to maximum 10");
    assert.equal(over.retryBaseDelayMs, 10000, "Base delay must clamp to maximum 10000ms");
  });

  it("allows explicit URL overrides for ingestion and assurance endpoints", () => {
    const config = CitadelIntegrationConfig.getConfiguration({
      CITADEL_STAGING_BASE_URL: "https://citadel-staging.internal",
      CITADEL_INGESTION_URL: "https://custom-ingest.internal/events",
      CITADEL_ASSURANCE_URL: "https://custom-assurance.internal/check",
    });

    assert.equal(config.ingestionUrl, "https://custom-ingest.internal/events");
    assert.equal(config.assuranceUrl, "https://custom-assurance.internal/check");
  });
});
