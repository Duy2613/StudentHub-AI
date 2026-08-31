/**
 * StudentHub AI — Social Source Connectors & Rate Limiting Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  ISourceConnector,
  CONNECTOR_PLATFORM,
  CONNECTOR_CAPABILITY,
  SOURCE_CLASSIFICATION,
  CONNECTOR_HEALTH
} from "../../src/lib/intelligence/social/ISourceConnector.js";
import { ConnectorRegistry } from "../../src/lib/intelligence/social/ConnectorRegistry.js";
import { RateLimitManager } from "../../src/lib/intelligence/social/RateLimitManager.js";
import { IncrementalSyncEngine, SYNC_JOB_STATUS } from "../../src/lib/intelligence/social/IncrementalSyncEngine.js";

describe("Social Source Connectors & Rate Limiting", () => {
  beforeEach(() => {
    ConnectorRegistry.clear();
    RateLimitManager.clear();
    IncrementalSyncEngine.clear();
  });

  it("should enforce capability declarations and deny unknown capabilities", () => {
    const conn = new ISourceConnector({
      connectorId: "custom_rss",
      platform: CONNECTOR_PLATFORM.INSTITUTIONAL_RSS,
      capabilities: [CONNECTOR_CAPABILITY.CAN_READ_PUBLIC_CONTENT, CONNECTOR_CAPABILITY.CAN_SYNC]
    });

    assert.strictEqual(conn.hasCapability(CONNECTOR_CAPABILITY.CAN_SYNC), true);
    assert.strictEqual(conn.hasCapability(CONNECTOR_CAPABILITY.CAN_SEARCH), false);
    assert.strictEqual(conn.hasCapability("UNKNOWN_CAPABILITY_XYZ"), false);

    assert.throws(() => {
      conn.assertCapability(CONNECTOR_CAPABILITY.CAN_SEARCH);
    }, /CAPABILITY_DENIED/);
  });

  it("should register default campus connectors and list their capabilities", () => {
    const list = ConnectorRegistry.listConnectors();
    assert.ok(list.length >= 4);

    const portal = ConnectorRegistry.getConnector("official_portal_hcmute");
    assert.ok(portal);
    assert.strictEqual(portal.platform, CONNECTOR_PLATFORM.OFFICIAL_PORTAL);
    assert.strictEqual(portal.sourceClassification, SOURCE_CLASSIFICATION.OFFICIAL);
  });

  it("should enforce token bucket rate limiting and exponential backoff on 429", () => {
    const connectorId = "test_rate_conn";

    // 1. Initial burst capacity = 3
    const check1 = RateLimitManager.checkRateLimit(connectorId, 60, 3);
    assert.strictEqual(check1.allowed, true);
    assert.strictEqual(check1.remainingTokens, 2);

    const check2 = RateLimitManager.checkRateLimit(connectorId, 60, 3);
    assert.strictEqual(check2.allowed, true);

    const check3 = RateLimitManager.checkRateLimit(connectorId, 60, 3);
    assert.strictEqual(check3.allowed, true);

    // 4. Exhausted
    const check4 = RateLimitManager.checkRateLimit(connectorId, 60, 3);
    assert.strictEqual(check4.allowed, false);
    assert.ok(check4.retryAfterSeconds >= 1);

    // 5. Exponential backoff trigger
    const backoffSec = RateLimitManager.triggerBackoff(connectorId);
    assert.ok(backoffSec >= 5);
  });

  it("should execute incremental sync with checkpointing and state tracking", async () => {
    const connectorId = "official_portal_hcmute";
    const res1 = await IncrementalSyncEngine.runIncrementalSync(connectorId, { limit: 10 });

    assert.ok(res1.itemsIngested >= 1);
    assert.strictEqual(res1.status, SYNC_JOB_STATUS.PARTIAL);

    const jobs = IncrementalSyncEngine.listSyncJobs();
    assert.strictEqual(jobs.length, 1);
    assert.ok(jobs[0].cursor);

    const ingested = IncrementalSyncEngine.getIngestedItems(connectorId);
    assert.ok(ingested.length >= 1);
  });
});
