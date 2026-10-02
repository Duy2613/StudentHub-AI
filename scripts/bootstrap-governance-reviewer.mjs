#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";
import { RBACPolicy } from "../frontend/src/lib/security/authorization/RBACPolicy.js";
import {
  GovernanceBootstrapError,
  GOVERNANCE_BOOTSTRAP_EVENT,
  GOVERNANCE_BOOTSTRAP_PROJECT_REF,
  GOVERNANCE_BOOTSTRAP_VERSION,
  GovernanceBootstrapService,
} from "../frontend/src/lib/server/governance/GovernanceBootstrapService.js";
import {
  GovernanceTransportError,
  prepareProductionDatabaseUrl,
  projectRefFromSupabaseUrl,
} from "./governance-bootstrap-transport.mjs";

const ownerUserId = String(process.env.GOVERNANCE_BOOTSTRAP_OWNER_USER_ID || "").trim();
const reviewerUserId = String(process.env.GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID || "").trim();
const transportPreflightOnly = process.argv.includes("--transport-preflight-only");

function safeErrorCode(error, fallback = "GOVERNANCE_BOOTSTRAP_FAILED") {
  const code = String(error?.code || "");
  return /^[A-Z0-9_.-]{1,80}$/.test(code) ? code : fallback;
}

function configureProductionTransport() {
  const prepared = prepareProductionDatabaseUrl(
    process.env.DATABASE_URL,
    process.env.STUDENTHUB_PRODUCTION_CA_FILE,
  );
  const serverAuthRef = projectRefFromSupabaseUrl(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const browserAuthRef = projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (serverAuthRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF || browserAuthRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF) {
    throw new GovernanceTransportError("AUTH_PROJECT_REF_MISMATCH");
  }
  if (prepared.projectRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF) {
    throw new GovernanceTransportError("DATABASE_PROJECT_REF_MISMATCH");
  }
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "true") {
    throw new GovernanceTransportError("TLS_STRICT_VERIFICATION_REQUIRED");
  }
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
    throw new GovernanceTransportError("NODE_TLS_VERIFICATION_BYPASS_FORBIDDEN");
  }

  process.env.DATABASE_URL = prepared.connectionString;
  process.env.DATABASE_SSL = "verify-full";
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = "true";
  process.env.DATABASE_SSL_CA = readFileSync(prepared.caPath, "utf8");
  delete process.env.PGSSLMODE;
  delete process.env.PGSSLROOTCERT;
  delete process.env.NODE_EXTRA_CA_CERTS;
  return prepared;
}

function getBootstrapIdentity() {
  const prepared = prepareProductionDatabaseUrl(
    process.env.DATABASE_URL,
    process.env.STUDENTHUB_PRODUCTION_CA_FILE,
  );
  return {
    authProjectRef: projectRefFromSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    browserAuthProjectRef: projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    databaseProjectRef: prepared.projectRef,
    alignment: "MATCH",
  };
}

async function runTransportPreflight() {
  let pool;
  try {
    configureProductionTransport();
    pool = getPostgresPool({ loadEnv: false });
    const result = await pool.query("SELECT 1 AS transport_ok");
    if (result.rows[0]?.transport_ok !== 1) throw new GovernanceTransportError("POSTGRES_PREFLIGHT_QUERY_FAILED");
    console.log(JSON.stringify({
      DATABASE_URL_PRESENT: "YES",
      TLS_CA_PRESENT: "YES",
      DB_PROJECT_REF: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
      DB_REF_MATCH: "YES",
      TLS_STRICT: "YES",
      POSTGRES_CONNECTION: "PASS",
    }, null, 2));
    return true;
  } catch (error) {
    const dbRefMatch = (() => {
      try {
        const ref = new URL(process.env.DATABASE_URL).hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/)?.[1];
        return ref === GOVERNANCE_BOOTSTRAP_PROJECT_REF;
      } catch {
        return false;
      }
    })();
    console.error(JSON.stringify({
      DATABASE_URL_PRESENT: process.env.DATABASE_URL ? "YES" : "NO",
      TLS_CA_PRESENT: process.env.STUDENTHUB_PRODUCTION_CA_FILE && existsSync(process.env.STUDENTHUB_PRODUCTION_CA_FILE) ? "YES" : "NO",
      DB_PROJECT_REF: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
      DB_REF_MATCH: dbRefMatch ? "YES" : "NO",
      TLS_STRICT: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" ? "YES" : "NO",
      POSTGRES_CONNECTION: "FAIL",
      DIAGNOSTIC_CODE: safeErrorCode(error, "POSTGRES_CONNECTION_FAILED"),
    }, null, 2));
    return false;
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

async function verifyGovernanceState(pool, ownerId, reviewerId) {
  const [roleResult, auditResult] = await Promise.all([
    pool.query(
      `SELECT r.code
         FROM private.user_roles ur
         JOIN private.roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND ur.revoked_at IS NULL
        ORDER BY r.code ASC`,
      [reviewerId],
    ),
    pool.query(
      `SELECT actor_id, target_id, metadata
         FROM private.audit_events
        WHERE event_type = $1
        ORDER BY occurred_at ASC
        LIMIT 2`,
      [GOVERNANCE_BOOTSTRAP_EVENT],
    ),
  ]);

  const roles = roleResult.rows.map((row) => String(row.code || "").toUpperCase());
  const events = auditResult.rows;
  const audit = events[0];
  const metadata = typeof audit?.metadata === "string" ? JSON.parse(audit.metadata) : audit?.metadata;
  const auditMatches = events.length === 1
    && String(audit.actor_id || "").toLowerCase() === ownerId.toLowerCase()
    && String(audit.target_id || "").toLowerCase() === reviewerId.toLowerCase()
    && metadata?.bootstrapVersion === GOVERNANCE_BOOTSTRAP_VERSION
    && metadata?.projectRef === GOVERNANCE_BOOTSTRAP_PROJECT_REF
    && metadata?.reviewerRole === "ADMIN"
    && metadata?.reviewerPermission === "ADMIN.SECURITY";

  if (!roles.includes("ADMIN") || !RBACPolicy.hasPermission(roles, "ADMIN.SECURITY") || !auditMatches) {
    throw new GovernanceBootstrapError("GOVERNANCE_POSTCONDITION_FAILED", "The durable reviewer role, permission, or audit event did not verify.", 503);
  }

  return { role: "ADMIN", permission: "ADMIN.SECURITY", auditEvent: GOVERNANCE_BOOTSTRAP_EVENT };
}

async function runBootstrap() {
  if (!ownerUserId || !reviewerUserId) {
    console.error("Set the owner and dedicated reviewer Auth user IDs in the approved operator environment.");
    process.exitCode = 2;
    return;
  }
  if (!stdin.isTTY || !stdout.isTTY) {
    console.error("Governance bootstrap requires an interactive operator terminal.");
    process.exitCode = 2;
    return;
  }

  let prepared;
  try {
    prepared = configureProductionTransport();
  } catch (error) {
    console.error(JSON.stringify({ status: "FAILED", code: safeErrorCode(error) }, null, 2));
    process.exitCode = 1;
    return;
  }

  if (prepared.projectRef !== GOVERNANCE_BOOTSTRAP_PROJECT_REF) {
    console.error(JSON.stringify({ status: "FAILED", code: "DATABASE_PROJECT_REF_MISMATCH" }, null, 2));
    process.exitCode = 1;
    return;
  }

  const confirmation = `BOOTSTRAP GOVERNANCE REVIEWER ${GOVERNANCE_BOOTSTRAP_PROJECT_REF} ${reviewerUserId.toLowerCase()}`;
  const readline = createInterface({ input: stdin, output: stdout });
  let pool;
  try {
    console.log(`Project ref: ${GOVERNANCE_BOOTSTRAP_PROJECT_REF}`);
    console.log(`Owner Auth user ID: ${ownerUserId}`);
    console.log(`Dedicated reviewer Auth user ID: ${reviewerUserId}`);
    console.log("This one-time operation grants only ADMIN to the separate reviewer and writes a durable audit event.");
    const typed = await readline.question(`Type exactly: ${confirmation}\n> `);
    pool = getPostgresPool({ loadEnv: false });
    const result = await GovernanceBootstrapService.bootstrapInitialReviewer({
      ownerUserId,
      reviewerUserId,
      confirmation: typed,
      identity: getBootstrapIdentity(),
      pool,
      correlationId: `governance-bootstrap-${new Date().toISOString()}`,
    });
    const verified = await verifyGovernanceState(pool, ownerUserId, reviewerUserId);
    console.log(JSON.stringify({
      status: "PASS",
      state: result.state,
      ...verified,
      projectRef: GOVERNANCE_BOOTSTRAP_PROJECT_REF,
      requiresFreshLogin: result.requiresFreshLogin,
    }, null, 2));
    console.log("Sign the reviewer out and back in before testing ADMIN.SECURITY.");
  } catch (error) {
    console.error(JSON.stringify({
      status: "FAILED",
      code: safeErrorCode(error),
      message: error instanceof GovernanceBootstrapError ? error.message : "Governance bootstrap failed; inspect the private operator transport log.",
    }, null, 2));
    process.exitCode = 1;
  } finally {
    readline.close();
    if (pool) await pool.end().catch(() => {});
  }
}

if (transportPreflightOnly) {
  process.exitCode = (await runTransportPreflight()) ? 0 : 1;
} else {
  await runBootstrap();
}
