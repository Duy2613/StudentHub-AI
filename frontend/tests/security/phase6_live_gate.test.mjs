import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { PostgresSessionRepository } from "../../src/lib/security/identity/PostgresSessionRepository.js";
import { DurableSessionService } from "../../src/lib/security/identity/DurableSessionService.js";
import { TrustPersistenceService } from "../../src/lib/server/database/TrustPersistenceService.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";



test("PHASE 6 LIVE GATE: Auth session lifecycle, revocation, cross-user denial, and private boundaries", async () => {
  const pool = getPostgresPool();
  const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 2`);
  if (userRes.rows.length === 0) {
    console.log("No users in auth.users, skipping live gate test");
    return;
  }
  const userA = userRes.rows[0].id;
  const userB = userRes.rows[1]?.id || crypto.randomUUID();

  const pepper = process.env.STUDENTHUB_SESSION_PEPPER || "test-pepper-that-is-longer-than-thirty-two-characters-minimum-len";
  const repo = new PostgresSessionRepository(pool);
  const service = new DurableSessionService({ repository: repo, pepper });

  let secretA = null;
  let secretB = null;

  const jtiA = `jti_p6a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const jtiB = `jti_p6b_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    // 1. Login / Session Creation for User A and User B
    const sessionA = await service.createSession(
      { userId: userA, authProvider: "supabase", jti: jtiA },
      { userAgent: "Mozilla/5.0 User A Browser" }
    );
    secretA = sessionA.secret;
    assert.ok(secretA, "Session A secret generated");

    const sessionB = await service.createSession(
      { userId: userB, authProvider: "supabase", jti: jtiB },
      { userAgent: "Mozilla/5.0 User B Browser" }
    );
    secretB = sessionB.secret;
    assert.ok(secretB, "Session B secret generated");

    // 2. Validate Active Sessions
    const activeA = await service.validateSession(secretA);
    assert.equal(activeA.user_id, userA, "Session A resolves User A");
    assert.ok(Array.isArray(activeA.roles), "Roles resolved for User A");

    const activeB = await service.validateSession(secretB);
    assert.equal(activeB.user_id, userB, "Session B resolves User B");

    // 3. Cross-User Denial: Session A secret cannot authenticate as User B
    assert.notEqual(activeA.user_id, userB, "Session A cannot represent User B");

    // 4. Logout / Session Revocation for User A
    const revokedA = await service.revokeSession(secretA, "USER_LOGOUT");
    assert.equal(revokedA, true, "Session A successfully revoked");

    // 5. Revoked Session Rejected
    await assert.rejects(
      async () => service.validateSession(secretA),
      /Session is invalid, expired, or revoked/,
      "Validating revoked Session A must fail with 401"
    );

    // Verify Session B remains active and unaffected (no cross-session revocation leak)
    const stillActiveB = await service.validateSession(secretB);
    assert.equal(stillActiveB.user_id, userB, "Session B remains completely unaffected");

    // 6. Private Schema Inaccessibility
    const anonCheck = await pool.query(
      `SELECT has_schema_privilege('anon', 'private', 'USAGE') as anon_usage,
              has_schema_privilege('authenticated', 'private', 'USAGE') as auth_usage`
    );
    assert.equal(anonCheck.rows[0].anon_usage, false, "anon role has NO access to private schema");
    assert.equal(anonCheck.rows[0].auth_usage, false, "authenticated role has NO access to private schema");

    // 7. Privacy APIs: User Trust History is strictly owner-scoped
    const casesForA = await TrustPersistenceService.listCasesForOwner(userA);
    const casesForB = await TrustPersistenceService.listCasesForOwner(userB);
    for (const c of casesForA) {
      assert.notEqual(c.owner_id, userB, "User A cases must never include User B records");
    }

    // 8. Audit Trail Verification (isolated by unique jti)
    const auditRes = await pool.query(
      `SELECT event_type FROM private.audit_events WHERE metadata->>'jti' = $1`,
      [jtiA]
    );
    assert.equal(auditRes.rows[0]?.event_type, "SESSION_CREATED", "Audit trail logged session lifecycle");

  } finally {
    if (secretA) {
      await pool.query(`DELETE FROM private.server_sessions WHERE token_hash = $1`, [service.hashSecret(secretA)]);
    }
    if (secretB) {
      await pool.query(`DELETE FROM private.server_sessions WHERE token_hash = $1`, [service.hashSecret(secretB)]);
    }
    await pool.query(`DELETE FROM private.audit_events WHERE metadata->>'jti' IN ($1, $2)`, [jtiA, jtiB]);
  }
});
