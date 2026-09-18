#!/usr/bin/env node
import "../frontend/src/lib/server/env/canonicalEnv.js";
import process from "node:process";
import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";
import {
  DEMO_ACCOUNT_ALLOWLIST,
  DEMO_ACCOUNT_SPECS,
  assertDemoAccountEmail,
  isDemoAccountEmail
} from "../frontend/src/lib/server/auth/demoAccountPolicy.js";

const REQUIRED_GUARD_TOKEN = "STUDENTHUB_RESET_QA_ONLY";

function fail(code, message) {
  console.error(JSON.stringify({ status: "DENIED", code, message }));
  process.exit(1);
}

async function main() {
  const guard = process.env.CONFIRM_DEMO_RESET;
  if (guard !== REQUIRED_GUARD_TOKEN) {
    fail(
      "CONFIRMATION_GUARD_MISSING",
      `Explicit confirmation guard required. Set CONFIRM_DEMO_RESET=${REQUIRED_GUARD_TOKEN}`
    );
  }

  // Parse optional target emails from argv
  const targetEmails = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const emailsToReset = targetEmails.length > 0 ? targetEmails : DEMO_ACCOUNT_ALLOWLIST;

  for (const email of emailsToReset) {
    if (!isDemoAccountEmail(email)) {
      fail("NON_QA_IDENTITY", `Account ${email} is not in the controlled QA allowlist. Operation denied.`);
    }
    try {
      assertDemoAccountEmail(email);
    } catch (err) {
      fail("ASSERT_DENIED", err.message);
    }
  }

  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch auth IDs strictly for the allowlisted emails
    const usersRes = await client.query(
      `SELECT id, email FROM auth.users WHERE email = ANY($1::text[])`,
      [emailsToReset]
    );

    const emailToId = new Map(usersRes.rows.map((r) => [r.email.toLowerCase(), r.id]));
    const targetUserIds = [];

    for (const email of emailsToReset) {
      const id = emailToId.get(email.toLowerCase());
      if (!id) {
        throw new Error(`Target QA user ${email} not found in auth.users.`);
      }
      targetUserIds.push(id);
    }

    // Safety guard: ensure NO non-allowlisted user IDs are ever touched
    const safetyCheck = await client.query(
      `SELECT count(*)::int as count FROM auth.users WHERE id = ANY($1::uuid[]) AND email != ALL($2::text[])`,
      [targetUserIds, DEMO_ACCOUNT_ALLOWLIST]
    );
    if (safetyCheck.rows[0].count > 0) {
      throw new Error("Safety check failed: non-allowlisted account detected in target IDs!");
    }

    // Reset QA-created records for the target accounts:
    // 1. Cancel QA assignments and remove reputation events
    await client.query(
      `UPDATE private.expert_assignments
          SET status = 'CANCELLED'
        WHERE (expert_id = ANY($1::uuid[]) OR assigned_by = ANY($1::uuid[]))
          AND (idempotency_key NOT LIKE 'qa_baseline:%' OR idempotency_key IS NULL)`,
      [targetUserIds]
    );

    await client.query(
      `DELETE FROM private.reputation_events
        WHERE user_id = ANY($1::uuid[])
          AND (idempotency_key LIKE 'qa_run:%' OR idempotency_key LIKE 'qa_test:%' OR idempotency_key LIKE 'assessment_completion:%')`,
      [targetUserIds]
    );

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          status: "SUCCESS",
          action: "DEMO_SCENARIO_RESET",
          resetAccounts: emailsToReset,
          resetUserIds: targetUserIds,
          nonQaAccountsAffected: 0,
          schemaReset: false
        },
        null,
        2
      )
    );
  } catch (err) {
    await client.query("ROLLBACK");
    fail("RESET_FAILED", err.message);
  } finally {
    client.release();
  }
}

main().catch((err) => fail("UNHANDLED", err.message));
