#!/usr/bin/env node
import "../frontend/src/lib/server/env/canonicalEnv.js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { getBackendIdentity } from "../frontend/src/lib/server/health/readiness.js";
import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";
import {
  GovernanceBootstrapError,
  GOVERNANCE_BOOTSTRAP_PROJECT_REF,
  GovernanceBootstrapService,
} from "../frontend/src/lib/server/governance/GovernanceBootstrapService.js";

const ownerUserId = String(process.env.GOVERNANCE_BOOTSTRAP_OWNER_USER_ID || "").trim();
const reviewerUserId = String(process.env.GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID || "").trim();

if (!ownerUserId || !reviewerUserId) {
  console.error("Set GOVERNANCE_BOOTSTRAP_OWNER_USER_ID and GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID in the approved operator environment. Values are user IDs, not credentials.");
  process.exitCode = 2;
} else if (!stdin.isTTY || !stdout.isTTY) {
  console.error("Governance bootstrap requires an interactive operator terminal.");
  process.exitCode = 2;
} else {
  const confirmation = `BOOTSTRAP GOVERNANCE REVIEWER ${GOVERNANCE_BOOTSTRAP_PROJECT_REF} ${reviewerUserId.toLowerCase()}`;
  const readline = createInterface({ input: stdin, output: stdout });
  let pool;
  try {
    console.log(`Project ref: ${GOVERNANCE_BOOTSTRAP_PROJECT_REF}`);
    console.log(`Owner Auth user ID: ${ownerUserId}`);
    console.log(`Dedicated reviewer Auth user ID: ${reviewerUserId}`);
    console.log("This one-time operation grants only ADMIN to the separate reviewer and writes a durable audit event.");
    const typed = await readline.question(`Type exactly: ${confirmation}\n> `);
    pool = getPostgresPool();
    const result = await GovernanceBootstrapService.bootstrapInitialReviewer({
      ownerUserId,
      reviewerUserId,
      confirmation: typed,
      identity: getBackendIdentity(),
      pool,
      correlationId: `governance-bootstrap-${new Date().toISOString()}`,
    });
    console.log(JSON.stringify({ ...result, projectRef: GOVERNANCE_BOOTSTRAP_PROJECT_REF }, null, 2));
    console.log("Sign the reviewer out and back in before testing ADMIN.SECURITY. Remove the temporary bootstrap ID variables after recording evidence.");
  } catch (error) {
    console.error(JSON.stringify({
      status: "FAILED",
      code: error?.code || "GOVERNANCE_BOOTSTRAP_FAILED",
      message: error instanceof GovernanceBootstrapError ? error.message : "Governance bootstrap failed. See the private operator log for transport diagnostics.",
    }, null, 2));
    process.exitCode = 1;
  } finally {
    readline.close();
    if (pool) await pool.end().catch(() => {});
  }
}
