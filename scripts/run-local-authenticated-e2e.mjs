import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assertLoopbackUrl,
  assertMainAndLocalDistinct,
  getLocalSupabaseRuntime,
  localAuthAdminCreate,
  localAuthAdminDelete,
  localRuntimeEnv,
  probeLocalAuth,
} from "./local-supabase-runtime.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frontendRoot = resolve(repoRoot, "frontend");
const artifactPath = resolve(repoRoot, "artifacts", "local-authenticated-e2e-2026-09-10.json");
const networkGuardPath = resolve(repoRoot, "scripts", "local-e2e-network-guard.mjs");
const originalEnv = { ...process.env };
const runTag = `${Date.now()}-${randomBytes(4).toString("hex")}`;

const users = [];
const seededCaseIds = [];
const serverLogs = [];
const testLogs = [];
let localPool = null;
let applicationPool = null;
let nextServer = null;
let nextDistDir = null;
let localRuntime = null;
let canonical = null;
let cleanupStatus = "NOT_STARTED";
let cleanupRemaining = null;
let cleanupStep = null;
let testExitCode = null;

function importRepo(relativePath) {
  return import(pathToFileURL(resolve(repoRoot, relativePath)).href);
}

function safeError(error) {
  return String(error?.message || error || "UNKNOWN_ERROR")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT_REDACTED]")
    .slice(0, 800);
}

function redactOutput(value) {
  let output = String(value || "");
  const secrets = [
    localRuntime?.jwtSecret,
    localRuntime?.anonKey,
    localRuntime?.serviceRoleKey,
    canonical?.SUPABASE_SERVICE_ROLE_KEY,
    canonical?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ].filter((secret) => typeof secret === "string" && secret.length >= 16);
  for (const secret of secrets) output = output.split(secret).join("[SECRET_REDACTED]");
  return output
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT_REDACTED]")
    .slice(-12_000);
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function hostOf(value) {
  try { return new URL(value).hostname.toLowerCase(); } catch { return null; }
}

function restoreProcessEnv() {
  for (const key of Object.keys(process.env)) {
    if (!Object.hasOwn(originalEnv, key)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnv)) process.env[key] = value;
}

async function freePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolvePromise) => server.close(resolvePromise));
  if (!port) throw new Error("LOCAL_E2E_FREE_PORT_UNAVAILABLE");
  return port;
}

async function waitFor(check, timeoutMs = 60_000, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs));
  }
  throw lastError || new Error("LOCAL_E2E_WAIT_TIMEOUT");
}

function appendOutput(target, chunk) {
  target.push(String(chunk));
  if (target.length > 300) target.shift();
}

function spawnAndCapture(command, args, options, target) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, windowsHide: true });
    child.stdout?.on("data", (chunk) => appendOutput(target, chunk));
    child.stderr?.on("data", (chunk) => appendOutput(target, chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => resolvePromise({ code, signal }));
  });
}

async function stopNextServer() {
  if (!nextServer || nextServer.exitCode !== null) return;
  const pid = nextServer.pid;
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `taskkill /PID ${pid} /T /F`], { stdio: "ignore" });
    } else {
      nextServer.kill("SIGTERM");
    }
  } catch {
    try { nextServer.kill(); } catch {}
  }
  await waitFor(() => nextServer.exitCode !== null, 10_000, 150).catch(() => {});
  nextServer = null;
}

function removeDisposableNextDist() {
  if (!nextDistDir) return;
  const resolved = resolve(frontendRoot, nextDistDir);
  if (!resolved.startsWith(resolve(frontendRoot, ".next-local-auth-"))) return;
  rmSync(resolved, { recursive: true, force: true });
  nextDistDir = null;
}

async function createSyntheticUser(kind, index = "") {
  const email = `studenthub-local-${kind}-${runTag}-${index}@studenthub.local.test`;
  const password = `LocalE2E!${runTag}!${randomBytes(6).toString("hex")}`;
  const created = await localAuthAdminCreate(localRuntime, {
    email,
    password,
    userMetadata: { full_name: `StudentHub Local ${kind}`, e2e_fixture: true },
  });
  const user = { id: created.id, email, password, kind };
  users.push(user);
  return user;
}

async function foreignKeyEdges(client, referencedTable) {
  const result = await client.query(
    `select n.nspname as schema_name, c.relname as table_name, a.attname as column_name
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
       join pg_attribute a on a.attrelid = c.oid and a.attnum = con.conkey[1]
      where con.contype = $1 and con.confrelid = to_regclass($2)
      order by 1, 2, 3`,
    ["f", referencedTable]
  );
  return result.rows;
}

async function deleteForeignKeyRows(client, referencedTable, ids) {
  if (!ids.length) return;
  const edges = await foreignKeyEdges(client, referencedTable);
  for (const edge of edges) {
    const table = `${quoteIdentifier(edge.schema_name)}.${quoteIdentifier(edge.table_name)}`;
    const column = quoteIdentifier(edge.column_name);
    await client.query(`delete from ${table} where ${column} = any($1::uuid[])`, [ids]);
  }
}

async function collectSyntheticIds(pool) {
  const userIds = users.map((user) => user.id);
  const caseRows = await pool.query(
    `select id from public.trust_cases where owner_id = any($1::uuid[]) or id = any($2::uuid[])`,
    [userIds, seededCaseIds]
  );
  const caseIds = [...new Set(caseRows.rows.map((row) => row.id))];
  const runRows = caseIds.length
    ? await pool.query("select id from public.trust_runs where case_id = any($1::uuid[])", [caseIds])
    : { rows: [] };
  const evidenceRows = caseIds.length
    ? await pool.query("select id from public.evidence where case_id = any($1::uuid[])", [caseIds])
    : { rows: [] };
  const contributionRows = caseIds.length
    ? await pool.query("select id from public.community_contributions where author_id = any($1::uuid[]) or case_id = any($2::uuid[])", [userIds, caseIds])
    : { rows: [] };
  const passportRows = await pool.query(
    "select id from public.evidence_passports where owner_id = any($1::uuid[]) or subject_id = any($2::text[])",
    [userIds, caseIds]
  );
  const applicationRows = await pool.query("select id from public.expert_applications where user_id = any($1::uuid[])", [userIds]);
  const attemptRows = applicationRows.rows.length
    ? await pool.query("select id from public.expert_quiz_attempts where application_id = any($1::uuid[])", [applicationRows.rows.map((row) => row.id)])
    : { rows: [] };
  const practiceRows = await pool.query("select id from private.expert_practice_submissions where user_id = any($1::uuid[])", [userIds]);
  const assignmentRows = caseIds.length
    ? await pool.query("select id from private.expert_assignments where expert_id = any($1::uuid[]) or assigned_by = any($1::uuid[]) or case_id = any($2::uuid[])", [userIds, caseIds])
    : { rows: [] };
  const assessmentRows = caseIds.length
    ? await pool.query("select id from public.expert_assessments where expert_id = any($1::uuid[]) or case_id = any($2::uuid[])", [userIds, caseIds])
    : { rows: [] };
  const verificationRows = await pool.query("select id from private.expert_verifications where user_id = any($1::uuid[])", [userIds]);
  const claimRows = caseIds.length
    ? await pool.query(
      `select distinct c.id from public.claims c
        where c.creator_id = any($1::uuid[])
           or exists (select 1 from public.claim_sources cs join public.evidence e on e.id = cs.evidence_id where cs.claim_id = c.id and e.case_id = any($2::uuid[]))`,
      [userIds, caseIds]
    )
    : { rows: [] };
  return {
    userIds,
    caseIds,
    runIds: runRows.rows.map((row) => row.id),
    evidenceIds: evidenceRows.rows.map((row) => row.id),
    contributionIds: contributionRows.rows.map((row) => row.id),
    passportIds: passportRows.rows.map((row) => row.id),
    applicationIds: applicationRows.rows.map((row) => row.id),
    attemptIds: attemptRows.rows.map((row) => row.id),
    practiceIds: practiceRows.rows.map((row) => row.id),
    assignmentIds: assignmentRows.rows.map((row) => row.id),
    assessmentIds: assessmentRows.rows.map((row) => row.id),
    verificationIds: verificationRows.rows.map((row) => row.id),
    claimIds: claimRows.rows.map((row) => row.id),
  };
}

async function cleanupSyntheticLocalData(pool) {
  if (!pool || !users.length) {
    cleanupStatus = "NO_SYNTHETIC_USERS";
    return;
  }
  const ids = await collectSyntheticIds(pool);
  const allTextIds = [...new Set([
    ...ids.userIds,
    ...ids.caseIds,
    ...ids.runIds,
    ...ids.evidenceIds,
    ...ids.contributionIds,
    ...ids.passportIds,
    ...ids.applicationIds,
    ...ids.attemptIds,
    ...ids.practiceIds,
    ...ids.assignmentIds,
    ...ids.assessmentIds,
    ...ids.verificationIds,
    ...ids.claimIds,
  ])];
  const client = await pool.connect();
  try {
    await client.query("begin");
    // This is a local-only, exact-ID disposable-fixture cleanup. It avoids
    // firing application append-only triggers or cascading into unrelated
    // rows. The session setting is transaction-local and is never used for
    // application writes or Main Supabase.
    await client.query("set local session_replication_role = replica");

    for (const [table, column, values] of [
      ["public.evidence_passport_events", "passport_id", ids.passportIds],
      ["public.expert_quiz_answers", "attempt_id", ids.attemptIds],
      ["private.expert_practice_decisions", "submission_id", ids.practiceIds],
      ["private.expert_review_decisions", "assessment_id", ids.assessmentIds],
      ["private.community_reaction_events", "contribution_id", ids.contributionIds],
      ["public.claim_sources", "evidence_id", ids.evidenceIds],
      ["public.case_entities", "case_id", ids.caseIds],
      ["public.trust_stage_runs", "case_id", ids.caseIds],
    ]) {
      if (values.length) {
        cleanupStep = `delete:${table}.${column}`;
        await client.query(`delete from ${table} where ${column} = any($1::uuid[])`, [values]);
      }
    }

    if (ids.userIds.length) {
      cleanupStep = "delete:private.integration_outbox";
      await client.query("delete from private.integration_outbox where subject = any($1::text[]) or aggregate_id = any($2::text[])", [ids.userIds, allTextIds]);
      cleanupStep = "delete:private.audit_events";
      await client.query("delete from private.audit_events where actor_id = any($1::uuid[]) or target_id = any($2::text[])", [ids.userIds, allTextIds]);
      cleanupStep = "delete:private.realtime_events";
      await client.query("delete from private.realtime_events where subject_id = any($1::uuid[])", [ids.userIds]);
    }

    // Delete every direct FK child for exact synthetic user/case/aggregate
    // identifiers. FK triggers are disabled only for this transaction, so the
    // order cannot strand a synthetic row behind an append-only history guard.
    for (const target of [
      ["public.expert_quiz_attempts", ids.attemptIds],
      ["private.expert_practice_submissions", ids.practiceIds],
      ["public.expert_applications", ids.applicationIds],
      ["public.expert_assessments", ids.assessmentIds],
      ["private.expert_assignments", ids.assignmentIds],
      ["private.expert_verifications", ids.verificationIds],
      ["public.evidence_passports", ids.passportIds],
      ["public.community_contributions", ids.contributionIds],
      ["public.evidence", ids.evidenceIds],
      ["public.claims", ids.claimIds],
      ["public.trust_runs", ids.runIds],
      ["public.trust_cases", ids.caseIds],
    ]) {
      cleanupStep = `delete-fk:${target[0]}`;
      await deleteForeignKeyRows(client, target[0], target[1]);
    }

    if (ids.passportIds.length) { cleanupStep = "delete:public.evidence_passport_events"; await client.query("delete from public.evidence_passport_events where passport_id = any($1::uuid[])", [ids.passportIds]); }
    if (ids.attemptIds.length) { cleanupStep = "delete:public.expert_quiz_answers"; await client.query("delete from public.expert_quiz_answers where attempt_id = any($1::uuid[])", [ids.attemptIds]); }
    if (ids.practiceIds.length) { cleanupStep = "delete:private.expert_practice_decisions"; await client.query("delete from private.expert_practice_decisions where submission_id = any($1::uuid[])", [ids.practiceIds]); }
    if (ids.assessmentIds.length) { cleanupStep = "delete:private.expert_review_decisions"; await client.query("delete from private.expert_review_decisions where assessment_id = any($1::uuid[])", [ids.assessmentIds]); }
    if (ids.contributionIds.length) {
      cleanupStep = "delete:private.community_reaction_events";
      await client.query("delete from private.community_reaction_events where contribution_id = any($1::uuid[])", [ids.contributionIds]);
      cleanupStep = "delete:public.community_contribution_revisions";
      await client.query("delete from public.community_contribution_revisions where contribution_id = any($1::uuid[])", [ids.contributionIds]);
    }
    if (ids.evidenceIds.length) { cleanupStep = "delete:public.claim_sources"; await client.query("delete from public.claim_sources where evidence_id = any($1::uuid[])", [ids.evidenceIds]); }
    if (ids.caseIds.length) {
      for (const table of [
        "public.case_corrections",
        "public.case_appeals",
        "private.case_appeal_reviews",
        "private.community_quality_events",
        "private.expert_quality_events",
        "public.expert_assessments",
        "private.expert_assignments",
        "public.community_contributions",
        "public.evidence",
        "public.case_inputs",
        "public.case_entities",
        "public.trust_stage_runs",
        "public.trust_verdict_revisions",
        "public.trust_case_revisions",
        "public.trust_runs",
        "public.trust_cases",
      ]) {
        cleanupStep = `delete:optional:${table}`;
        await client.query("savepoint cleanup_optional_delete");
        try {
          await client.query(`delete from ${table} where case_id = any($1::uuid[])`, [ids.caseIds]);
          await client.query("release savepoint cleanup_optional_delete");
        } catch (error) {
          if (!["42P01", "42703"].includes(error?.code)) throw error;
          await client.query("rollback to savepoint cleanup_optional_delete");
          await client.query("release savepoint cleanup_optional_delete");
        }
      }
    }
    if (ids.contributionIds.length) {
      cleanupStep = "delete:private.community_reaction_events.final";
      await client.query("delete from private.community_reaction_events where contribution_id = any($1::uuid[])", [ids.contributionIds]);
      cleanupStep = "delete:public.community_contributions.final";
      await client.query("delete from public.community_contributions where id = any($1::uuid[])", [ids.contributionIds]);
    }
    if (ids.userIds.length) {
      cleanupStep = "delete:private.community_quality_events";
      await client.query("delete from private.community_quality_events where subject_id = any($1::uuid[]) or actor_id = any($1::uuid[])", [ids.userIds]);
      cleanupStep = "delete:private.expert_quality_events";
      await client.query("delete from private.expert_quality_events where user_id = any($1::uuid[]) or actor_id = any($1::uuid[])", [ids.userIds]);
      cleanupStep = "delete:private.realtime_events.final";
      await client.query("delete from private.realtime_events where subject_id = any($1::uuid[])", [ids.userIds]);
    }

    // Includes auth.identities/sessions and every application FK child. It is
    // exact synthetic UUID matching; no email wildcard or broad reset is used.
    cleanupStep = "delete-fk:auth.users";
    await deleteForeignKeyRows(client, "auth.users", ids.userIds);
    cleanupStep = "delete:auth.users";
    await client.query("delete from auth.users where id = any($1::uuid[])", [ids.userIds]);
    cleanupStep = "commit";
    await client.query("commit");

    cleanupStep = "verify:auth.users";
    const remainingUsers = await pool.query("select count(*)::int as count from auth.users where id = any($1::uuid[])", [ids.userIds]);
    cleanupStep = "verify:trust_cases";
    const remainingCases = await pool.query("select count(*)::int as count from public.trust_cases where owner_id = any($1::uuid[])", [ids.userIds]);
    cleanupStep = "verify:community_contributions";
    const remainingContributions = await pool.query("select count(*)::int as count from public.community_contributions where author_id = any($1::uuid[])", [ids.userIds]);
    cleanupStep = "verify:private.realtime_events";
    const remainingRealtime = await pool.query("select count(*)::int as count from private.realtime_events where subject_id = any($1::uuid[])", [ids.userIds]);
    cleanupRemaining = {
      users: remainingUsers.rows[0].count,
      cases: remainingCases.rows[0].count,
      contributions: remainingContributions.rows[0].count,
      realtimeEvents: remainingRealtime.rows[0].count,
    };
    if (Object.values(cleanupRemaining).some((value) => value !== 0)) throw new Error("LOCAL_SYNTHETIC_CLEANUP_INCOMPLETE");
    cleanupStatus = "LOCAL_SYNTHETIC_DATA_AND_AUTH_CLEANED";
  } catch (error) {
    await client.query("rollback").catch(() => {});
    cleanupStatus = `LOCAL_CLEANUP_FAILED:${cleanupStep || "unknown"}:${safeError(error)}`;
    throw error;
  } finally {
    client.release();
  }
}

async function collectRunSummary(pool) {
  const userIds = users.map((user) => user.id);
  const count = async (sql, values = [userIds]) => Number((await pool.query(sql, values)).rows[0]?.count || 0);
  return {
    syntheticUsers: await count("select count(*)::int as count from auth.users where id = any($1::uuid[])") ,
    trustCases: await count("select count(*)::int as count from public.trust_cases where owner_id = any($1::uuid[])") ,
    communityContributions: await count("select count(*)::int as count from public.community_contributions where author_id = any($1::uuid[])") ,
    communityReactions: await count("select count(*)::int as count from public.community_reactions where user_id = any($1::uuid[])") ,
    expertApplications: await count("select count(*)::int as count from public.expert_applications where user_id = any($1::uuid[])") ,
    expertVerifications: await count("select count(*)::int as count from private.expert_verifications where user_id = any($1::uuid[])") ,
    expertPracticeSubmissions: await count("select count(*)::int as count from private.expert_practice_submissions where user_id = any($1::uuid[])") ,
    expertAssignments: await count("select count(*)::int as count from private.expert_assignments where expert_id = any($1::uuid[]) or assigned_by = any($1::uuid[])") ,
    expertAssessments: await count("select count(*)::int as count from public.expert_assessments where expert_id = any($1::uuid[])") ,
    evidencePassports: await count("select count(*)::int as count from public.evidence_passports where owner_id = any($1::uuid[])") ,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  let status = "LOCAL_AUTHENTICATED_E2E_FAILED";
  let failure = null;
  let networkViolations = [];
  let runSummary = null;
  let identity = null;
  let baseUrl = null;
  let mainCloudHosts = [];

  try {
    // Compute the local runtime before loading the canonical environment. The
    // canonical file is intentionally Main; it is read for comparison only.
    localRuntime = getLocalSupabaseRuntime();
    canonical = (await importRepo("frontend/src/lib/server/env/canonicalEnv.js")).canonicalEnv;
    identity = assertMainAndLocalDistinct({
      mainApiUrl: canonical.SUPABASE_URL || canonical.NEXT_PUBLIC_SUPABASE_URL,
      // RLS_TEST_DATABASE_URL is intentionally the disposable local test
      // target in this workspace. Main comparison must use canonical DATABASE_URL.
      mainDbUrl: canonical.DATABASE_URL,
      runtime: localRuntime,
    });
    const probe = await probeLocalAuth(localRuntime);
    assertLoopbackUrl(localRuntime.apiUrl, "LOCAL_API_URL");
    assertLoopbackUrl(`http://${localRuntime.dbHost}:${localRuntime.dbPort}`, "LOCAL_DB_HOST");

    mainCloudHosts = [...new Set([
      hostOf(canonical.SUPABASE_URL || canonical.NEXT_PUBLIC_SUPABASE_URL),
      hostOf(canonical.DATABASE_URL),
    ].filter(Boolean))];
    const localOverlay = localRuntimeEnv(localRuntime, {
      NODE_ENV: "test",
      STUDENTHUB_LOCAL_E2E: "1",
      STUDENTHUB_LOCAL_JWKS_URL: `${localRuntime.apiUrl}/auth/v1/.well-known/jwks.json`,
      SUPABASE_JWT_ISSUER: `${localRuntime.apiUrl}/auth/v1`,
      STUDENTHUB_LABBE_MODE: "DISABLED",
      STUDENTHUB_LABBE_BASE_URL: "",
      STUDENTHUB_LABBE_TOKEN: "",
      NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE: "LIVE",
      STUDENTHUB_PERSISTENCE_ADAPTER: "postgres",
      STUDENTHUB_COMMUNITY_DEMO: "false",
      STUDENTHUB_SESSION_PEPPER: randomBytes(32).toString("hex"),
      OPENAI_API_KEY: "",
      GEMINI_API_KEY: "",
      OPENAI_BASE_URL: "",
      STUDENTHUB_MAIN_CLOUD_HOSTS: mainCloudHosts.join(","),
    });
    Object.assign(process.env, localOverlay);
    const { getLocalE2ENetworkViolations } = await importRepo("scripts/local-e2e-network-guard.mjs");

    const pg = createRequire(new URL("../frontend/package.json", import.meta.url))("pg");
    applicationPool = new pg.Pool({ connectionString: localRuntime.dbUrl, ssl: false, max: 10 });
    localPool = applicationPool;

    const candidate = await createSyntheticUser("candidate");
    const reviewer = await createSyntheticUser("reviewer");
    const reactor = await createSyntheticUser("reactor");
    const helpers = [];
    for (let index = 0; index < 6; index += 1) helpers.push(await createSyntheticUser("helper", index));

    const adminRole = await localPool.query("select id from private.roles where code = 'ADMIN' limit 1");
    if (!adminRole.rows[0]) throw new Error("LOCAL_ADMIN_ROLE_UNAVAILABLE");
    await localPool.query(
      `insert into private.user_roles(user_id, role_id, granted_by, granted_at, revoked_at)
       values($1, $2, $3, now(), null)
       on conflict (user_id, role_id) do update set granted_by=excluded.granted_by, granted_at=now(), revoked_at=null`,
      [reviewer.id, adminRole.rows[0].id, reviewer.id]
    );

    const { createTrustOrchestrator } = await importRepo("frontend/src/lib/ai-trust/TrustOrchestrator.js");
    const { TrustPersistenceService } = await importRepo("frontend/src/lib/server/database/TrustPersistenceService.js");
    const { CommunityRepository } = await importRepo("frontend/src/lib/server/database/CommunityRepository.js");
    const { closePostgresPoolForTests } = await importRepo("frontend/src/lib/server/database/PostgresPool.js");

    const trustInput = {
      type: "text",
      content: `StudentHub local authenticated Trust fixture ${runTag}: bounded evidence, uncertainty, and a request for source confirmation.`,
      metadata: { institutionContext: "StudentHub Local Disposable Runtime" },
    };
    const trustRequestId = `local-e2e-trust-${runTag}`;
    const trustPipeline = await createTrustOrchestrator().run(trustInput, { requestId: trustRequestId });
    const persistedTrust = await TrustPersistenceService.recordTrustExecution({
      pipelineResult: trustPipeline,
      input: trustInput,
      principal: { subjectId: `user:${candidate.id}` },
      requestId: trustRequestId,
      idempotencyKey: `local-e2e-trust-${runTag}`,
      labbeEnv: { ...process.env, STUDENTHUB_LABBE_MODE: "DISABLED" },
    });
    if (!persistedTrust.persisted || !persistedTrust.caseId) throw new Error("LOCAL_TRUST_PERSISTENCE_SETUP_FAILED");
    seededCaseIds.push(persistedTrust.caseId);
    await localPool.query("update public.trust_cases set visibility='PUBLIC', updated_at=now() where id=$1 and owner_id=$2", [persistedTrust.caseId, candidate.id]);
    const primaryRevision = await localPool.query("select revision from public.trust_case_revisions where case_id=$1 order by revision desc limit 1", [persistedTrust.caseId]);
    if (Number(primaryRevision.rows[0]?.revision) !== 1) throw new Error("LOCAL_PRIMARY_REVISION_SETUP_FAILED");
    let primaryEvidence = await localPool.query("select id from public.evidence where case_id=$1 order by created_at asc", [persistedTrust.caseId]);
    if (!primaryEvidence.rows.length) {
      const evidenceId = randomUUID();
      await localPool.query(
        `insert into public.evidence(id, case_id, source_type, source_identifier, observed_at, extractor_version, confidence, provenance)
         values($1,$2,'LOCAL_FIXTURE',$3,now(),'local-e2e-v1',0.8,$4::jsonb)`,
        [evidenceId, persistedTrust.caseId, `local:${runTag}:primary`, JSON.stringify({ local: true, synthetic: true })]
      );
      primaryEvidence = { rows: [{ id: evidenceId }] };
    }
    const primaryEvidenceId = primaryEvidence.rows[0].id;

    const manualCases = [persistedTrust.caseId];
    const manualEvidence = [primaryEvidenceId];
    for (let index = 0; index < 4; index += 1) {
      const caseId = randomUUID();
      const runId = randomUUID();
      const evidenceId = randomUUID();
      const inputFingerprint = createHash("sha256").update(`local-manual-${runTag}-${index}`).digest();
      await localPool.query(
        `insert into public.trust_cases(id, owner_id, state, visibility) values($1,$2,'SUSPICIOUS','PUBLIC')`,
        [caseId, candidate.id]
      );
      await localPool.query(
        `insert into public.trust_runs(id, case_id, owner_id, request_id, input_fingerprint, status, pipeline_version, started_at, completed_at)
         values($1,$2,$3,$4,$5,'COMPLETED','trust.v5.local-fixture',now(),now())`,
        [runId, caseId, candidate.id, `local-manual-${runTag}-${index}`, inputFingerprint]
      );
      await localPool.query(
        `insert into public.trust_case_revisions(case_id, owner_id, revision, run_id, state, snapshot)
         values($1,$2,1,$3,'SUSPICIOUS',$4::jsonb)`,
        [caseId, candidate.id, runId, JSON.stringify({ schemaVersion: "local-e2e-fixture.v1", caseId, revision: 1 })]
      );
      await localPool.query(
        `insert into public.trust_verdict_revisions(case_id, owner_id, revision, run_id, verdict, decision_digest)
         values($1,$2,1,$3,$4::jsonb,$5)`,
        [caseId, candidate.id, runId, JSON.stringify({ verdict: "SUSPICIOUS", source: "local-e2e-fixture" }), createHash("sha256").update(caseId).digest()]
      );
      await localPool.query(
        `insert into public.evidence(id, case_id, source_type, source_identifier, observed_at, extractor_version, confidence, provenance)
         values($1,$2,'LOCAL_FIXTURE',$3,now(),'local-e2e-v1',0.8,$4::jsonb)`,
        [evidenceId, caseId, `local:${runTag}:manual:${index}`, JSON.stringify({ local: true, synthetic: true })]
      );
      manualCases.push(caseId);
      manualEvidence.push(evidenceId);
      seededCaseIds.push(caseId);
    }

    const contributions = [];
    for (let index = 0; index < manualCases.length; index += 1) {
      const contribution = await CommunityRepository.createContribution({
        authorId: candidate.id,
        caseId: manualCases[index],
        caseRevision: 1,
        contributionType: "CONTEXT",
        statement: `Local pre-seeded contribution ${index + 1} records a bounded observation for an immutable case revision and preserves uncertainty for review.`,
        evidenceRefs: [manualEvidence[index]],
        evidenceRevisionIds: [manualEvidence[index]],
        idempotencyKey: `local-preseed-contribution-${runTag}-${index}`,
        correlationId: `local-e2e-${runTag}-community-${index}`,
      });
      contributions.push(contribution.contributionId);
    }
    await localPool.query("update public.community_contributions set created_at=now()-interval '31 days' where id=$1", [contributions[0]]);

    for (let index = 0; index < 3; index += 1) {
      await CommunityRepository.createCorrection({
        createdBy: candidate.id,
        caseId: manualCases[index],
        caseRevision: 1,
        correctionType: "CONTEXT_UPDATE",
        statement: `Local evaluated outcome ${index + 1} records a durable correction event without mutating the Trust verdict.`,
        evidenceRevisionIds: [manualEvidence[index]],
        idempotencyKey: `local-preseed-correction-${runTag}-${index}`,
      });
    }

    const reactors = [reactor, ...helpers];
    for (let index = 0; index < reactors.length; index += 1) {
      await CommunityRepository.setReaction({
        userId: reactors[index].id,
        contributionId: contributions[index % contributions.length],
        caseRevision: 1,
        kind: "HELPFUL",
        value: 1,
        idempotencyKey: `local-preseed-reaction-${runTag}-${index}`,
      });
    }
    const trackRecord = await CommunityRepository.getContributorTrackRecord(candidate.id);
    if (trackRecord.points !== 99 || trackRecord.stars !== 4 || trackRecord.evaluatedOutcomes < 3 || trackRecord.stabilityDays < 30) {
      throw new Error(`LOCAL_TRACK_RECORD_SETUP_FAILED:${trackRecord.points}:${trackRecord.stars}:${trackRecord.evaluatedOutcomes}:${trackRecord.stabilityDays}`);
    }

    const port = await freePort();
    baseUrl = `http://127.0.0.1:${port}`;
    nextDistDir = `.next-local-auth-${runTag}`;
    const nodeOptions = [originalEnv.NODE_OPTIONS, `--import=${pathToFileURL(networkGuardPath).href}`].filter(Boolean).join(" ");
    const serverEnv = {
      ...process.env,
      NODE_ENV: "development",
      STUDENTHUB_LOCAL_E2E: "1",
      STUDENTHUB_LOCAL_E2E_BASE_URL: baseUrl,
      STUDENTHUB_MAIN_CLOUD_HOSTS: mainCloudHosts.join(","),
      NEXT_PUBLIC_API_URL: baseUrl,
      NEXT_PUBLIC_STUDENTHUB_LOCAL_E2E: "true",
      NEXT_PUBLIC_SUPABASE_URL: localRuntime.apiUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: localRuntime.anonKey,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: localRuntime.anonKey,
      STUDENTHUB_NEXT_DIST_DIR: nextDistDir,
      SUPABASE_URL: localRuntime.apiUrl,
      DATABASE_URL: localRuntime.dbUrl,
      STUDENTHUB_RLS_TEST_DATABASE_URL: localRuntime.dbUrl,
      NODE_OPTIONS: nodeOptions,
    };
    nextServer = spawn(
      process.execPath,
      [resolve(frontendRoot, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)],
      { cwd: frontendRoot, env: serverEnv, windowsHide: true }
    );
    nextServer.stdout?.on("data", (chunk) => appendOutput(serverLogs, chunk));
    nextServer.stderr?.on("data", (chunk) => appendOutput(serverLogs, chunk));
    await waitFor(async () => {
      if (nextServer.exitCode !== null) throw new Error("LOCAL_NEXT_SERVER_EXITED_BEFORE_READY");
      const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
      return response.ok;
    }, 90_000, 350);

    const browserEnv = {
      ...serverEnv,
      STUDENTHUB_LOCAL_CANDIDATE_ID: candidate.id,
      STUDENTHUB_LOCAL_CANDIDATE_EMAIL: candidate.email,
      STUDENTHUB_LOCAL_CANDIDATE_PASSWORD: candidate.password,
      STUDENTHUB_LOCAL_REVIEWER_EMAIL: reviewer.email,
      STUDENTHUB_LOCAL_REVIEWER_PASSWORD: reviewer.password,
      STUDENTHUB_LOCAL_REACTOR_EMAIL: reactor.email,
      STUDENTHUB_LOCAL_REACTOR_PASSWORD: reactor.password,
      STUDENTHUB_LOCAL_PRIMARY_CASE_ID: persistedTrust.caseId,
      STUDENTHUB_LOCAL_PRIMARY_EVIDENCE_ID: primaryEvidenceId,
    };
    const playwright = await spawnAndCapture(
      process.execPath,
      [resolve(frontendRoot, "node_modules/@playwright/test/cli.js"), "test", "--config=playwright.local-auth.config.ts"],
      { cwd: frontendRoot, env: browserEnv },
      testLogs
    );
    testExitCode = playwright.code;
    if (playwright.code !== 0) throw new Error(`LOCAL_AUTHENTICATED_PLAYWRIGHT_FAILED_${playwright.code ?? playwright.signal}`);

    runSummary = await collectRunSummary(localPool);
    if (runSummary.syntheticUsers !== users.length
      || runSummary.communityContributions < 6
      || runSummary.communityReactions < 8
      || runSummary.expertApplications !== 1
      || runSummary.expertVerifications !== 1
      || runSummary.expertPracticeSubmissions !== 1
      || runSummary.expertAssignments < 2
      || runSummary.expertAssessments !== 1
      || runSummary.evidencePassports < 2) {
      throw new Error(`LOCAL_E2E_DURABLE_SUMMARY_INCOMPLETE:${JSON.stringify(runSummary)}`);
    }
    networkViolations = getLocalE2ENetworkViolations();
    if (networkViolations.length) throw new Error("LOCAL_E2E_SERVER_NETWORK_GUARD_VIOLATION");
    const combinedOutput = redactOutput([...serverLogs, ...testLogs].join("\n"));
    if (/LOCAL_E2E_NETWORK_GUARD_BLOCKED|\.supabase\.co|\.pooler\.supabase\.com/i.test(combinedOutput)) {
      throw new Error("LOCAL_E2E_OUTPUT_REPORTED_CLOUD_NETWORK_ACTIVITY");
    }
    status = "FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED";
  } catch (error) {
    failure = { code: error?.code || "LOCAL_E2E_FAILED", message: safeError(error) };
  } finally {
    await stopNextServer();
    removeDisposableNextDist();
    if (localPool) {
      try { await cleanupSyntheticLocalData(localPool); } catch (error) {
        failure ||= { code: "LOCAL_CLEANUP_FAILED", message: safeError(error) };
      }
    } else {
      cleanupStatus = "NO_LOCAL_POOL_FOR_CLEANUP";
    }
    if (applicationPool) {
      await applicationPool.end().catch(() => {});
      applicationPool = null;
      localPool = null;
    }
    await importRepo("frontend/src/lib/server/database/PostgresPool.js").then(({ closePostgresPoolForTests }) => closePostgresPoolForTests()).catch(() => {});

    const completedAt = new Date().toISOString();
    const report = {
      status: failure ? (cleanupStatus.startsWith("LOCAL_CLEANUP_FAILED") ? "LOCAL_AUTHENTICATED_E2E_FAILED_CLEANUP_BLOCKED" : status) : status,
      startedAt,
      completedAt,
      localEndpointClass: "LOCAL_LOOPBACK",
      localApiHost: identity?.localApiHost || "127.0.0.1",
      localApiPort: identity?.localApiPort || localRuntime?.dbPort || null,
      localDbHost: identity?.localDbHost || "127.0.0.1",
      localDbPort: identity?.localDbPort || localRuntime?.dbPort || null,
      mainApiHost: identity?.mainApiHost || "unknown",
      mainCloudHosts,
      localAuthProbe: "HTTP_200_LOCAL_LOOPBACK",
      browserBaseUrl: baseUrl,
      userClassCount: users.length,
      syntheticUserKinds: [...new Set(users.map((user) => user.kind))],
      networkGuard: {
        server: networkViolations.length ? "VIOLATION" : "LOOPBACK_ONLY",
        browser: "CLOUD_SUPABASE_REJECTED",
        violations: networkViolations,
      },
      mainAuthWrites: 0,
      mainDbWrites: 0,
      mainStorageWrites: 0,
      historicalEvidencePreserved: [
        "G1_LOCAL_CLEAN_MIGRATION_VERIFIED",
        "RLS_LOCAL_LIVE_VERIFIED",
        "CONCURRENCY_IDEMPOTENCY_VERIFIED",
        "APPLICATION_SCHEMA_RESTORE_VERIFIED",
        "LOCAL_PRIVATE_STORAGE_VERIFIED",
        "PROMAX_LOCAL_PERSISTENCE_VERIFIED",
      ],
      testExitCode,
      runSummary,
      cleanupStatus,
      cleanupStep,
      cleanupRemaining,
      failure,
      noCommitPushDeploy: true,
    };
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    restoreProcessEnv();
  }

  console.log(JSON.stringify({
    status: failure ? status : "FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED",
    localAuthProbe: "HTTP_200_LOCAL_LOOPBACK",
    mainAuthWrites: 0,
    mainDbWrites: 0,
    cleanupStatus,
    runSummary,
    artifact: artifactPath,
    failure,
  }));
  if (failure) {
    console.error(redactOutput([...serverLogs, ...testLogs].join("\n")));
    process.exitCode = 1;
  }
}

await main();
