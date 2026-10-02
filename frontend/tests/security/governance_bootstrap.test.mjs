import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { GovernanceBootstrapService, GovernanceBootstrapError, GOVERNANCE_BOOTSTRAP_EVENT, GOVERNANCE_BOOTSTRAP_PROJECT_REF } from "../../src/lib/server/governance/GovernanceBootstrapService.js";
import { RBACPolicy } from "../../src/lib/security/authorization/RBACPolicy.js";
import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";
import { RateLimiter } from "../../src/lib/security/hardening/RateLimiter.js";
import { SecurityFabric } from "../../src/lib/security/SecurityFabric.js";

const OWNER_ID = "7f3a5ce2-0b4d-4cc0-9b1d-2e7ac5610101";
const REVIEWER_ID = "8b4d9f72-31aa-4c95-84fd-2a9be4750202";
const OTHER_REVIEWER_ID = "9a17bca2-80fe-45d5-8c72-735c504d0303";
const identity = {
  authProjectRef: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
  browserAuthProjectRef: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
  databaseProjectRef: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
  alignment: "MATCH",
};
const confirmation = `BOOTSTRAP GOVERNANCE REVIEWER ${GOVERNANCE_BOOTSTRAP_PROJECT_REF} ${REVIEWER_ID}`;

class FakeGovernancePool {
  constructor({ ownerEmail = "owner@institution.edu", reviewerEmail = "reviewer@institution.edu", events = [], admins = [], operatorRole = "postgres" } = {}) {
    this.users = new Map([
      [OWNER_ID, { id: OWNER_ID, email: ownerEmail, email_confirmed_at: new Date("2026-01-01T00:00:00Z") }],
      [REVIEWER_ID, { id: REVIEWER_ID, email: reviewerEmail, email_confirmed_at: new Date("2026-01-01T00:00:00Z") }],
      [OTHER_REVIEWER_ID, { id: OTHER_REVIEWER_ID, email: "alternate-reviewer@institution.edu", email_confirmed_at: new Date("2026-01-01T00:00:00Z") }],
    ]);
    this.events = structuredClone(events);
    this.admins = structuredClone(admins);
    this.operatorRole = operatorRole;
    this.calls = [];
    this.connectCount = 0;
  }

  async connect() {
    this.connectCount += 1;
    const snapshot = { events: structuredClone(this.events), admins: structuredClone(this.admins) };
    return {
      query: async (sql, values = []) => {
        const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
        this.calls.push({ sql: normalized, values });
        if (["begin", "commit", "rollback"].includes(normalized)) {
          if (normalized === "rollback") {
            this.events = snapshot.events;
            this.admins = snapshot.admins;
          }
          return { rows: [] };
        }
        if (normalized.includes("pg_advisory_xact_lock")) return { rows: [{}] };
        if (normalized.includes("current_user as role_name")) return { rows: [{ role_name: this.operatorRole, database_name: "postgres" }] };
        if (normalized.includes("from auth.users")) return { rows: this.users.has(values[0]) ? [this.users.get(values[0])] : [] };
        if (normalized.includes("from private.audit_events")) return { rows: structuredClone(this.events.slice(0, 2)) };
        if (normalized.includes("from private.user_roles")) return { rows: structuredClone(this.admins) };
        if (normalized.startsWith("insert into private.user_roles")) {
          const row = { user_id: values[0], revoked_at: null, granted_by: values[1] };
          this.admins.push(row);
          return { rows: [{ user_id: values[0] }] };
        }
        if (normalized.startsWith("insert into private.audit_events")) {
          const event = {
            id: this.events.length + 1,
            event_type: values[0],
            actor_id: values[1],
            target_id: values[2],
            request_id: values[3],
            metadata: JSON.parse(values[4]),
          };
          this.events.push(event);
          return { rows: [{ id: event.id }] };
        }
        throw new Error(`Unexpected fake SQL: ${normalized}`);
      },
      release() {},
    };
  }
}

describe("one-time governance reviewer bootstrap", () => {
  afterEach(() => RateLimiter.clear());

  it("grants only the dedicated ADMIN role, audits it in the transaction, and derives ADMIN.SECURITY", async () => {
    const pool = new FakeGovernancePool();
    const result = await GovernanceBootstrapService.bootstrapInitialReviewer({
      ownerUserId: OWNER_ID,
      reviewerUserId: REVIEWER_ID,
      confirmation,
      identity,
      pool,
      correlationId: "test-bootstrap-1",
    });

    assert.equal(result.state, "BOOTSTRAPPED");
    assert.equal(result.role, "ADMIN");
    assert.equal(result.permission, "ADMIN.SECURITY");
    assert.equal(result.requiresFreshLogin, true);
    assert.equal(pool.admins.length, 1);
    assert.equal(pool.admins[0].user_id, REVIEWER_ID);
    assert.equal(pool.admins[0].granted_by, OWNER_ID);
    assert.equal(pool.events.length, 1);
    assert.equal(pool.events[0].event_type, GOVERNANCE_BOOTSTRAP_EVENT);
    assert.equal(pool.events[0].actor_id, OWNER_ID);
    assert.equal(pool.events[0].target_id, REVIEWER_ID);
    assert.equal(RBACPolicy.hasPermission(["ADMIN"], "ADMIN.SECURITY"), true);
    assert.equal(RBACPolicy.hasPermission(["STUDENT"], "ADMIN.SECURITY"), false);
    assert.equal(RBACPolicy.hasPermission(["EXPERT"], "ADMIN.SECURITY"), false);
  });

  it("is idempotent only for the exact audited reviewer and refuses to replace governance", async () => {
    const pool = new FakeGovernancePool();
    const first = await GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool });
    const second = await GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool });
    assert.equal(first.state, "BOOTSTRAPPED");
    assert.equal(second.state, "ALREADY_BOOTSTRAPPED");
    assert.equal(pool.admins.length, 1);
    assert.equal(pool.events.length, 1);

    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({
        ownerUserId: OWNER_ID,
        reviewerUserId: OTHER_REVIEWER_ID,
        confirmation: `BOOTSTRAP GOVERNANCE REVIEWER ${GOVERNANCE_BOOTSTRAP_PROJECT_REF} ${OTHER_REVIEWER_ID}`,
        identity,
        pool,
      }),
      (error) => error instanceof GovernanceBootstrapError && error.code === "GOVERNANCE_BOOTSTRAP_ALREADY_CONSUMED",
    );

    pool.admins.push({ user_id: OTHER_REVIEWER_ID, revoked_at: new Date("2026-10-01T00:00:00Z") });
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool }),
      (error) => error instanceof GovernanceBootstrapError && error.code === "GOVERNANCE_BOOTSTRAP_ALREADY_CONSUMED",
    );
  });

  it("fails closed for a staging/mismatched target before opening a database connection", async () => {
    const pool = new FakeGovernancePool();
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({
        ownerUserId: OWNER_ID,
        reviewerUserId: REVIEWER_ID,
        confirmation,
        identity: { ...identity, databaseProjectRef: "bniwtkjtramqaozrrtrk", alignment: "MISMATCH" },
        pool,
      }),
      (error) => error instanceof GovernanceBootstrapError && error.code === "GOVERNANCE_BOOTSTRAP_PROJECT_MISMATCH",
    );
    assert.equal(pool.connectCount, 0);
  });

  it("requires the production postgres owner connection before writing any role", async () => {
    const pool = new FakeGovernancePool({ operatorRole: "service_role" });
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool }),
      (error) => error instanceof GovernanceBootstrapError && error.code === "GOVERNANCE_BOOTSTRAP_OPERATOR_NOT_OWNER",
    );
    assert.equal(pool.admins.length, 0);
    assert.equal(pool.events.length, 0);
  });

  it("requires exact confirmation, verified non-demo identities, and no prior ADMIN history", async () => {
    const noConfirmationPool = new FakeGovernancePool();
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation: "ADMIN", identity, pool: noConfirmationPool }),
      (error) => error.code === "GOVERNANCE_BOOTSTRAP_CONFIRMATION_REQUIRED",
    );
    assert.equal(noConfirmationPool.connectCount, 0);

    const demoTargetPool = new FakeGovernancePool({ reviewerEmail: "demo-expert@gmail.com" });
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool: demoTargetPool }),
      (error) => error.code === "REVIEWER_MUST_BE_SEPARATE",
    );
    assert.equal(demoTargetPool.admins.length, 0);

    const priorAdminPool = new FakeGovernancePool({ admins: [{ user_id: "6c8b7da4-7f54-4d0d-9e3d-197321ab0404", revoked_at: null }] });
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool: priorAdminPool }),
      (error) => error.code === "GOVERNANCE_ALREADY_CONFIGURED",
    );
    assert.equal(priorAdminPool.events.length, 0);
    assert.equal(priorAdminPool.admins.length, 1);

    const unverifiedOwnerPool = new FakeGovernancePool();
    unverifiedOwnerPool.users.get(OWNER_ID).email_confirmed_at = null;
    await assert.rejects(
      GovernanceBootstrapService.bootstrapInitialReviewer({ ownerUserId: OWNER_ID, reviewerUserId: REVIEWER_ID, confirmation, identity, pool: unverifiedOwnerPool }),
      (error) => error.code === "OWNER_IDENTITY_NOT_VERIFIED",
    );
    assert.equal(unverifiedOwnerPool.admins.length, 0);
  });

  it("keeps the real qualification review endpoint denied for Student and Expert and reachable only with ADMIN", async () => {
    const tokenValidator = new TokenValidator();
    const reviewRouteSource = readFileSync(new URL("../../src/app/api/expert/qualification/review/route.js", import.meta.url), "utf8");
    assert.match(reviewRouteSource, /SecurityFabric\.wrapHandler/);
    assert.match(reviewRouteSource, /requiredPermission:\s*"ADMIN\.SECURITY"/);
    const reviewGate = SecurityFabric.wrapHandler({
      action: "REVIEW_EXPERT_QUALIFICATION",
      requiredPermission: "ADMIN.SECURITY",
      allowAnonymous: false,
      maxRequests: 60,
      maxBodyBytes: 32 * 1024,
    }, async () => Response.json({ reachedReviewHandler: true }));
    const requestFor = (role) => new Request("https://studenthub.ai/api/expert/qualification/review", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenValidator.signToken({ sub: REVIEWER_ID, roles: [role] })}`, "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const student = await reviewGate(requestFor("STUDENT"));
    const expert = await reviewGate(requestFor("EXPERT"));
    const admin = await reviewGate(requestFor("ADMIN"));

    assert.equal(student.status, 403);
    assert.equal(expert.status, 403);
    assert.equal(admin.status, 200);
    assert.deepEqual(await admin.json(), { reachedReviewHandler: true });
  });
});
