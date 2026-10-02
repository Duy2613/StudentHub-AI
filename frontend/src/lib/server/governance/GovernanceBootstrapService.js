import { getBackendIdentity } from "../health/readiness.js";
import { getPostgresPool } from "../database/PostgresPool.js";
import { isDemoAccountEmail } from "../auth/demoAccountPolicy.js";

export const GOVERNANCE_BOOTSTRAP_PROJECT_REF = "kytdomflmjytzyaabogi";
export const GOVERNANCE_BOOTSTRAP_EVENT = "GOVERNANCE_REVIEWER_BOOTSTRAPPED";
export const GOVERNANCE_BOOTSTRAP_VERSION = "governance-bootstrap.v1";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADVISORY_LOCK_KEY = [20261002, 1];

export class GovernanceBootstrapError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message);
    this.name = "GovernanceBootstrapError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function normalizeUserId(value, label) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new GovernanceBootstrapError(`${label}_UUID_REQUIRED`, `A valid ${label.toLowerCase()} user ID is required.`, 400);
  }
  return normalized;
}

function assertProductionIdentity(identity) {
  if (
    identity?.alignment !== "MATCH" ||
    identity?.authProjectRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF ||
    identity?.browserAuthProjectRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF ||
    identity?.databaseProjectRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF
  ) {
    throw new GovernanceBootstrapError("GOVERNANCE_BOOTSTRAP_PROJECT_MISMATCH", "Governance bootstrap requires verified Auth and database identity for the canonical production project.", 503);
  }
}

function expectedConfirmation(reviewerUserId) {
  return `BOOTSTRAP GOVERNANCE REVIEWER ${GOVERNANCE_BOOTSTRAP_PROJECT_REF} ${reviewerUserId}`;
}

async function inTransaction(pool, operation) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function assertConfirmedHuman(row, label) {
  if (!row || !row.email_confirmed_at) {
    throw new GovernanceBootstrapError(`${label}_IDENTITY_NOT_VERIFIED`, `The configured ${label.toLowerCase()} must be an existing email-verified Auth user.`, 403);
  }
  if (isDemoAccountEmail(row.email)) {
    throw new GovernanceBootstrapError(`${label}_MUST_BE_SEPARATE`, `The configured ${label.toLowerCase()} must be separate from the eight acceptance personas.`, 403);
  }
}

async function authUser(client, userId, label) {
  const result = await client.query(
    `SELECT id, email, email_confirmed_at
       FROM auth.users
      WHERE id = $1
      LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  assertConfirmedHuman(row, label);
  return row;
}

async function governanceHistory(client) {
  const [auditResult, roleResult] = await Promise.all([
    client.query(
      `SELECT actor_id, target_id, metadata
         FROM private.audit_events
        WHERE event_type = $1
        ORDER BY occurred_at ASC
        LIMIT 2`,
      [GOVERNANCE_BOOTSTRAP_EVENT]
    ),
    client.query(
      `SELECT ur.user_id::text AS user_id, ur.revoked_at
         FROM private.user_roles ur
         JOIN private.roles r ON r.id = ur.role_id
        WHERE r.code = 'ADMIN'
        ORDER BY ur.granted_at ASC
        FOR UPDATE OF ur`
    ),
  ]);
  return { bootstrapEvents: auditResult.rows, adminAssignments: roleResult.rows };
}

function matchingPriorBootstrap({ bootstrapEvents, adminAssignments, ownerUserId, reviewerUserId }) {
  if (bootstrapEvents.length !== 1) return false;
  const event = bootstrapEvents[0];
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata : {};
  const activeAdmins = adminAssignments.filter((row) => !row.revoked_at);
  return String(event.actor_id || "").toLowerCase() === ownerUserId
    && String(event.target_id || "").toLowerCase() === reviewerUserId
    && metadata.bootstrapVersion === GOVERNANCE_BOOTSTRAP_VERSION
    && metadata.projectRef === GOVERNANCE_BOOTSTRAP_PROJECT_REF
    && adminAssignments.length === 1
    && activeAdmins.length === 1
    && String(activeAdmins[0].user_id || "").toLowerCase() === reviewerUserId;
}

export class GovernanceBootstrapService {
  /**
   * One-time trusted-operator workflow for the first governance reviewer.
   * The caller must use a Supabase project-owner database credential from an
   * approved operator environment. No client request can supply a role or
   * reviewer identity; the command requires both IDs and an exact interactive
   * confirmation before this method is called.
   */
  static async bootstrapInitialReviewer({
    ownerUserId,
    reviewerUserId,
    confirmation,
    identity = getBackendIdentity(),
    pool = getPostgresPool(),
    correlationId = "governance-bootstrap",
  }) {
    const normalizedOwnerId = normalizeUserId(ownerUserId, "OWNER");
    const normalizedReviewerId = normalizeUserId(reviewerUserId, "REVIEWER");
    if (normalizedOwnerId === normalizedReviewerId) {
      throw new GovernanceBootstrapError("GOVERNANCE_BOOTSTRAP_SELF_GRANT_BLOCKED", "The owner identity and dedicated reviewer must be different users.", 403);
    }
    assertProductionIdentity(identity);
    if (String(confirmation || "").trim() !== expectedConfirmation(normalizedReviewerId)) {
      throw new GovernanceBootstrapError("GOVERNANCE_BOOTSTRAP_CONFIRMATION_REQUIRED", "The exact production project and reviewer confirmation is required.", 400);
    }

    return inTransaction(pool, async (client) => {
      const operatorRole = await client.query("SELECT current_user AS role_name, current_database() AS database_name");
      if (operatorRole.rows[0]?.role_name !== "postgres" || operatorRole.rows[0]?.database_name !== "postgres") {
        throw new GovernanceBootstrapError("GOVERNANCE_BOOTSTRAP_OPERATOR_NOT_OWNER", "The operator connection must use the verified production postgres owner role.", 403);
      }
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", ADVISORY_LOCK_KEY);

      await authUser(client, normalizedOwnerId, "OWNER");
      await authUser(client, normalizedReviewerId, "REVIEWER");

      const history = await governanceHistory(client);
      if (history.bootstrapEvents.length > 0) {
        if (matchingPriorBootstrap({ ...history, ownerUserId: normalizedOwnerId, reviewerUserId: normalizedReviewerId })) {
          return {
            state: "ALREADY_BOOTSTRAPPED",
            role: "ADMIN",
            permission: "ADMIN.SECURITY",
            reviewerUserId: normalizedReviewerId,
            auditEvent: GOVERNANCE_BOOTSTRAP_EVENT,
            requiresFreshLogin: true,
          };
        }
        throw new GovernanceBootstrapError("GOVERNANCE_BOOTSTRAP_ALREADY_CONSUMED", "A prior governance bootstrap exists; this operation will not replace or restore governance.");
      }

      if (history.adminAssignments.length > 0) {
        throw new GovernanceBootstrapError("GOVERNANCE_ALREADY_CONFIGURED", "Governance role history already exists; the bootstrap will not overwrite or replace it.");
      }

      const roleResult = await client.query(
        `INSERT INTO private.user_roles (user_id, role_id, granted_by, granted_at, revoked_at)
         SELECT $1, r.id, $2, now(), NULL
           FROM private.roles r
          WHERE r.code = 'ADMIN'
         RETURNING user_id::text AS user_id`,
        [normalizedReviewerId, normalizedOwnerId]
      );
      if (roleResult.rows.length !== 1) {
        throw new GovernanceBootstrapError("GOVERNANCE_ADMIN_ROLE_UNAVAILABLE", "The canonical ADMIN role is unavailable; no reviewer was provisioned.", 503);
      }

      const metadata = {
        bootstrapVersion: GOVERNANCE_BOOTSTRAP_VERSION,
        projectRef: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
        reviewerRole: "ADMIN",
        reviewerPermission: "ADMIN.SECURITY",
        authorizationMethod: "VERIFIED_OWNER_OPERATOR_CREDENTIAL_AND_EXACT_CONFIRMATION",
      };
      const auditResult = await client.query(
        `INSERT INTO private.audit_events
          (event_type, actor_id, target_type, target_id, request_id, metadata)
         VALUES ($1, $2, 'GOVERNANCE_REVIEWER', $3, $4, $5::jsonb)
         RETURNING id`,
        [GOVERNANCE_BOOTSTRAP_EVENT, normalizedOwnerId, normalizedReviewerId, String(correlationId).slice(0, 128), JSON.stringify(metadata)]
      );
      if (auditResult.rows.length !== 1) {
        throw new GovernanceBootstrapError("GOVERNANCE_BOOTSTRAP_AUDIT_FAILED", "The reviewer grant could not be durably audited; the transaction was canceled.", 503);
      }

      return {
        state: "BOOTSTRAPPED",
        role: "ADMIN",
        permission: "ADMIN.SECURITY",
        reviewerUserId: normalizedReviewerId,
        auditEvent: GOVERNANCE_BOOTSTRAP_EVENT,
        auditId: String(auditResult.rows[0].id),
        requiresFreshLogin: true,
      };
    });
  }
}
