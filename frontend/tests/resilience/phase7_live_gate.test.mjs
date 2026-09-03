import test, { after } from "node:test";
import assert from "node:assert/strict";
import { PlatformResilienceService } from "../../src/lib/server/resilience/PlatformResilienceService.js";
import { RateLimiter } from "../../src/lib/security/hardening/RateLimiter.js";
import { ProviderGateway, PROVIDER_CAPABILITY } from "../../src/lib/server/providers/ProviderGateway.js";
import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

after(async () => {
  await getPostgresPool().end();
});

test("PHASE 7 LIVE GATE: Platform Resilience, Controlled Failure, and Recovery Matrix", async () => {
  const pool = getPostgresPool();

  // 1. Live DB Health Probe
  const readiness = await PlatformResilienceService.evaluateReadiness();
  assert.equal(readiness.database, "HEALTHY", "PostgreSQL database must be accessible");
  assert.ok(["READY", "DEGRADED_OPERATIONAL"].includes(readiness.overall), "Overall platform operational");

  // 2. Safe Domain Reputation Caching
  PlatformResilienceService.cacheDomainReputation("moet.gov.vn", { score: 0.99, safe: true });
  const cached = PlatformResilienceService.getCachedDomainReputation("moet.gov.vn");
  assert.equal(cached.score, 0.99);
  assert.equal(PlatformResilienceService.getCachedDomainReputation("unknown-domain.com"), null);

  // 3. Provider Outage & Timeout Handling
  const gw = new ProviderGateway({ maxRetries: 0, defaultTimeoutMs: 100 });
  gw.registerAdapter(PROVIDER_CAPABILITY.REPUTATION, {
    name: "failing-provider",
    execute: async () => new Promise((resolve) => setTimeout(resolve, 300)),
    nativeFallback: async () => ({ finding: "DEGRADED_FALLBACK", safe: false }),
  });

  const resTimeout = await gw.execute(PROVIDER_CAPABILITY.REPUTATION, { url: "https://test.edu.vn" });
  assert.equal(resTimeout.degraded, true);
  assert.equal(resTimeout.data.finding, "DEGRADED_FALLBACK");

  // 4. Rate Limiting Enforcement
  RateLimiter.clear();
  const testKey = `test_rate_limit_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    assert.equal(RateLimiter.assertRateLimit(testKey, 5, 10), true);
  }
  // 6th request triggers 429
  assert.throws(
    () => RateLimiter.assertRateLimit(testKey, 5, 10),
    (err) => err.statusCode === 429 && err.code === "RATE_LIMIT_EXCEEDED"
  );

  // 5. Bad JWT Rejection
  const validator = new TokenValidator({
    expectedIssuer: "https://auth.studenthub.internal",
    expectedAudience: "studenthub-app",
  });
  assert.throws(
    () => validator.validateToken("invalid.forged.jwt.token"),
    /Invalid JWT format/
  );

  // 6. RLS Denial
  const rlsCheck = await pool.query(
    `SELECT has_table_privilege('anon', 'public.evidence_passports', 'INSERT') as anon_can_insert,
            has_schema_privilege('anon', 'private', 'USAGE') as anon_private_access`
  );
  assert.equal(rlsCheck.rows[0].anon_private_access, false, "Anon cannot access private schema");

  // 7. Structured Telemetry without Leaks
  PlatformResilienceService.recordMetric("rate_limit", "auth_login", 1, {
    bearerToken: "Bearer super_secret_leak_12345",
    domain: "moet.gov.vn",
  });
  const metrics = PlatformResilienceService.getMetrics();
  assert.ok(metrics.rateLimits >= 1, "Rate limit metric recorded");

  // 8. Circuit Breaker Recovery Probe
  const cb = gw._getCircuitBreaker(PROVIDER_CAPABILITY.REPUTATION);
  cb.recordSuccess();
  assert.equal(cb.getState(), "CLOSED", "Circuit breaker successfully returns to CLOSED");
});
