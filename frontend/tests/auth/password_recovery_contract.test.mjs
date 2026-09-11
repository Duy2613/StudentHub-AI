import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { DurableSessionService } from "../../src/lib/security/identity/DurableSessionService.js";

class InMemorySessionRepository {
  constructor() {
    this.sessions = new Map();
    this.audits = [];
  }

  async create(record) {
    this.sessions.set(record.tokenHash.toString("hex"), {
      ...record,
      revoked_at: null,
      revocation_reason: null,
      user_id: record.userId,
    });
  }

  async findActive(tokenHash, now) {
    const session = this.sessions.get(tokenHash.toString("hex"));
    if (!session) return null;
    if (session.revoked_at) return null;
    if (session.expiresAt <= now) return null;
    return session;
  }

  async revoke(tokenHash, reason = "LOGOUT") {
    const session = this.sessions.get(tokenHash.toString("hex"));
    if (!session) return false;
    session.revoked_at = new Date();
    session.revocation_reason = reason;
    return true;
  }

  async revokeAllForUser(userId, exceptTokenHash = null, reason = "LOGOUT_ALL") {
    let count = 0;
    const exceptHex = exceptTokenHash ? exceptTokenHash.toString("hex") : null;
    for (const [key, session] of this.sessions.entries()) {
      if (session.user_id === userId && !session.revoked_at) {
        if (!exceptHex || key !== exceptHex) {
          session.revoked_at = new Date();
          session.revocation_reason = reason;
          count++;
        }
      }
    }
    return count;
  }

  async appendAudit(entry) {
    this.audits.push(entry);
  }
}

describe("Password Recovery & Session Revocation Contracts (Binding Amendments 7 & 11)", () => {
  const pepper = "a-very-secure-test-session-pepper-with-sufficient-entropy-32-chars";

  it("revokes all active durable sessions for a user upon password reset", async () => {
    const repo = new InMemorySessionRepository();
    const service = new DurableSessionService({ repository: repo, pepper });

    const userA = "11111111-1111-4111-8111-111111111111";
    const userB = "22222222-2222-4222-8222-222222222222";

    // Create 3 sessions for user A across multiple devices
    const sA1 = await service.createSession({ userId: userA, email: "usera@school.edu" });
    const sA2 = await service.createSession({ userId: userA, email: "usera@school.edu" });
    const sA3 = await service.createSession({ userId: userA, email: "usera@school.edu" });

    // Create 1 session for user B
    const sB1 = await service.createSession({ userId: userB, email: "userb@school.edu" });

    // Verify all sessions are initially active
    assert.ok(await service.validateSession(sA1.secret));
    assert.ok(await service.validateSession(sA2.secret));
    assert.ok(await service.validateSession(sA3.secret));
    assert.ok(await service.validateSession(sB1.secret));

    // User A resets password -> revokeAllSessions called
    const revokedCount = await service.revokeAllSessions(userA, "PASSWORD_RESET");
    assert.equal(revokedCount, 3, "All 3 sessions of user A must be revoked");

    // All user A sessions must fail with SESSION_REVOKED
    await assert.rejects(
      async () => await service.validateSession(sA1.secret),
      /Session is invalid, expired, or revoked/
    );
    await assert.rejects(
      async () => await service.validateSession(sA2.secret),
      /Session is invalid, expired, or revoked/
    );
    await assert.rejects(
      async () => await service.validateSession(sA3.secret),
      /Session is invalid, expired, or revoked/
    );

    // User B's session must remain active (unaffected)
    const validB = await service.validateSession(sB1.secret);
    assert.equal(validB.user_id, userB);

    // Audit event must be appended
    const audit = repo.audits.find((a) => a.eventType === "SESSION_REVOKED_ALL");
    assert.ok(audit, "SESSION_REVOKED_ALL audit record must exist");
    assert.equal(audit.actorId, userA);
    assert.equal(audit.metadata.reason, "PASSWORD_RESET");
    assert.equal(audit.metadata.revokedCount, 3);
  });

  it("verifies GitHub OAuth scopes adhere to least-privilege (no repo scope)", () => {
    const code = fs.readFileSync("frontend/src/lib/auth/authService.js", "utf8");
    assert.ok(code.includes('scopes: "read:user user:email"'), "GitHub scopes must include read:user user:email");
    assert.ok(!code.includes('scopes: "read:user user:email repo"'), "GitHub scopes must NOT include repo");
  });

  it("verifies forgot-password and reset-password routes exist with required security structures", () => {
    assert.ok(fs.existsSync("frontend/src/app/forgot-password/page.jsx"), "forgot-password page must exist");
    assert.ok(fs.existsSync("frontend/src/app/reset-password/page.jsx"), "reset-password page must exist");
    assert.ok(fs.existsSync("frontend/src/app/api/auth/session/revoke-all/route.js"), "revoke-all API route must exist");
    assert.ok(fs.existsSync("frontend/src/app/api/auth/capabilities/route.js"), "capabilities API route must exist");

    const resetPage = fs.readFileSync("frontend/src/app/reset-password/page.jsx", "utf8");
    assert.ok(resetPage.includes("updateUserPassword"), "reset-password must call updateUserPassword");
    assert.ok(resetPage.includes("hasMinLength"), "reset-password must check password minimum length");
  });
});
