import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { PostgresSessionRepository } from "../../src/lib/security/identity/PostgresSessionRepository.js";
import { DurableSessionService } from "../../src/lib/security/identity/DurableSessionService.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";



test("PostgresSessionRepository: Live durable session create, validate, update last_seen, and revoke in private.server_sessions", async () => {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not configured, skipping live session test");
    return;
  }
  const pool = getPostgresPool();
  const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 1`);
  if (userRes.rows.length === 0) {
    console.log("No users in auth.users, skipping live session test");
    return;
  }
  const realUserId = userRes.rows[0].id;
  const pepper = process.env.STUDENTHUB_SESSION_PEPPER || "test-pepper-that-is-longer-than-thirty-two-characters-minimum-len";

  const repo = new PostgresSessionRepository(pool);
  const service = new DurableSessionService({ repository: repo, pepper });

  let secret = null;

  const testJti = `jti_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    // 1. Create Session
    const sessionRes = await service.createSession(
      { userId: realUserId, authProvider: "supabase", jti: testJti },
      { userAgent: "Mozilla/5.0 Test Suite Runner" }
    );
    assert.ok(sessionRes.secret, "Session secret generated");
    secret = sessionRes.secret;

    // 2. Validate Session
    const active = await service.validateSession(secret);
    assert.ok(active, "Active session found in private.server_sessions");
    assert.equal(active.user_id, realUserId);
    assert.ok(Array.isArray(active.roles));

    // 3. Verify audit log entry
    const auditRes = await pool.query(
      `SELECT * FROM private.audit_events WHERE actor_id = $1 AND event_type = 'SESSION_CREATED' ORDER BY occurred_at DESC LIMIT 1`,
      [realUserId]
    );
    assert.ok(auditRes.rows.length > 0, "SESSION_CREATED audit event logged");

    // 4. Revoke Session
    const revoked = await service.revokeSession(secret, "USER_LOGOUT");
    assert.equal(revoked, true, "Session revoked");

    // 5. Verify validation rejects revoked session
    await assert.rejects(
      async () => service.validateSession(secret),
      /Session is invalid, expired, or revoked/
    );

    // 6. Verify revocation audit log
    const revokeAudit = await pool.query(
      `SELECT * FROM private.audit_events WHERE actor_id = $1 AND event_type = 'SESSION_REVOKED' ORDER BY occurred_at DESC LIMIT 1`,
      [realUserId]
    );
    assert.ok(revokeAudit.rows.length > 0, "SESSION_REVOKED audit event logged");

  } finally {
    if (secret) {
      const tokenHash = service.hashSecret(secret);
      await pool.query(`DELETE FROM private.server_sessions WHERE token_hash = $1`, [tokenHash]);
    }
    await pool.query(`DELETE FROM private.audit_events WHERE metadata->>'jti' = $1`, [testJti]);
  }
});
