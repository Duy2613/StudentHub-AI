import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { CommunityRepository } from "../../src/lib/server/database/CommunityRepository.js";
import { ExpertRepository } from "../../src/lib/server/database/ExpertRepository.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { buildTrustDecisionEvent } from "../../src/lib/server/integrations/LabbeBridge.js";
import { LabbeOutboxService } from "../../src/lib/server/integrations/LabbeOutboxService.js";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const disposableDatabaseUrl = configureDisposableDatabase();
const liveGate = disposableLiveGate();

after(async () => {
  if (disposableDatabaseUrl) await getPostgresPool().end();
});

test("LOCAL G3 LIVE: idempotency, concurrent writers, authority revocation, and outbox leases", liveGate, async () => {
  const pool = getPostgresPool();
  const expertId = crypto.randomUUID();
  const coordinatorId = crypto.randomUUID();
  const reactorId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const correlationId = `g3-${caseId}`;
  const contributionKey = `g3-contribution-${caseId}`;
  const reactionKey = `g3-reaction-${caseId}`;
  const assignmentKey = `g3-assignment-${caseId}`;
  const assessmentKey = `g3-assessment-${caseId}`;
  let contributionId = null;
  let outboxEventId = null;

  try {
    await pool.query(
      `INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
       VALUES ($1, 'authenticated', 'authenticated', $2, now(), now()),
              ($3, 'authenticated', 'authenticated', $4, now(), now()),
              ($5, 'authenticated', 'authenticated', $6, now(), now())`,
      [
        expertId, `g3-expert-${expertId}@studenthub.test`,
        coordinatorId, `g3-coordinator-${coordinatorId}@studenthub.test`,
        reactorId, `g3-reactor-${reactorId}@studenthub.test`,
      ]
    );
    await pool.query(
      `INSERT INTO private.user_roles (user_id, role_id)
       SELECT $1, id FROM private.roles WHERE code = 'ADMIN'`,
      [coordinatorId]
    );
    await pool.query(
      `INSERT INTO public.trust_cases (id, owner_id, state, visibility)
       VALUES ($1, $2, 'SUSPICIOUS', 'PUBLIC')`,
      [caseId, expertId]
    );
    await pool.query(
      `INSERT INTO public.trust_runs (id, case_id, owner_id, status, pipeline_version, started_at)
       VALUES ($1, $2, $3, 'COMPLETED', 'trust.v5.g3-live', now())`,
      [runId, caseId, expertId]
    );
    await pool.query(
      `INSERT INTO public.trust_case_revisions (case_id, owner_id, revision, run_id, state, snapshot)
       VALUES ($1, $2, 1, $3, 'SUSPICIOUS', '{"source":"g3-local-concurrency"}'::jsonb)`,
      [caseId, expertId, runId]
    );

    const contributionInput = {
      authorId: expertId,
      caseId,
      caseRevision: 1,
      contributionType: "CONTEXT",
      statement: "This durable local fixture records a bounded community signal.",
      idempotencyKey: contributionKey,
      correlationId,
    };
    const contributionResults = await Promise.all([
      CommunityRepository.createContribution(contributionInput),
      CommunityRepository.createContribution(contributionInput),
    ]);
    contributionId = contributionResults[0].contributionId;
    assert.equal(contributionResults[1].contributionId, contributionId);
    assert.deepEqual(contributionResults.map((entry) => entry.idempotent === true).sort(), [false, true]);
    const contributionCount = await pool.query(
      `SELECT count(*)::int AS count FROM public.community_contributions WHERE id = $1 AND author_id = $2 AND idempotency_key = $3`,
      [contributionId, expertId, contributionKey]
    );
    assert.equal(contributionCount.rows[0].count, 1);
    const qualityEventCount = await pool.query(
      `SELECT count(*)::int AS count FROM private.community_quality_events
        WHERE subject_id = $1 AND event_type = 'CONTRIBUTION_PUBLISHED' AND idempotency_key = $2`,
      [expertId, `contribution:${contributionId}:published`]
    );
    assert.equal(qualityEventCount.rows[0].count, 1);
    const contributionOutboxCount = await pool.query(
      `SELECT count(*)::int AS count FROM private.integration_outbox
        WHERE integration = 'INTERNAL' AND aggregate_id = $1 AND event_type = 'COMMUNITY_CONTRIBUTION_PUBLISHED' AND correlation_id = $2`,
      [contributionId, correlationId]
    );
    assert.equal(contributionOutboxCount.rows[0].count, 1);

    await assert.rejects(
      () => CommunityRepository.createContribution({ ...contributionInput, statement: "This is a different durable request body." }),
      (error) => error?.code === "IDEMPOTENCY_CONFLICT"
    );

    const reactionResults = await Promise.all([
      CommunityRepository.setReaction({ userId: reactorId, contributionId, caseRevision: 1, kind: "HELPFUL", value: 1, idempotencyKey: reactionKey }),
      CommunityRepository.setReaction({ userId: reactorId, contributionId, caseRevision: 1, kind: "HELPFUL", value: 1, idempotencyKey: reactionKey }),
    ]);
    assert.deepEqual(reactionResults.map((entry) => entry.idempotent).sort(), [false, true]);
    const reactionEventCount = await pool.query(
      `SELECT count(*)::int AS count FROM private.community_reaction_events WHERE user_id = $1 AND idempotency_key = $2`,
      [reactorId, reactionKey]
    );
    assert.equal(reactionEventCount.rows[0].count, 1);

    await ExpertRepository.upsertProfile({ userId: expertId, publicTitle: "G3 Local Expert", publicBio: "A durable local assurance fixture." });
    await ExpertRepository.setDomainVerification({ userId: expertId, domainCode: "CYBERSECURITY", status: "VERIFIED", verifiedBy: coordinatorId, evidenceRef: "local:g3" });
    const assignmentResults = await Promise.all([
      ExpertRepository.createAssignment({ assignedBy: coordinatorId, expertId, caseId, caseRevision: 1, domainCode: "CYBERSECURITY", idempotencyKey: assignmentKey }),
      ExpertRepository.createAssignment({ assignedBy: coordinatorId, expertId, caseId, caseRevision: 1, domainCode: "CYBERSECURITY", idempotencyKey: assignmentKey }),
    ]);
    assert.equal(assignmentResults[0].id, assignmentResults[1].id);
    assert.deepEqual(assignmentResults.map((entry) => entry.idempotent).sort(), [false, true]);
    const assignmentId = assignmentResults[0].id;
    const assignmentCount = await pool.query(
      `SELECT count(*)::int AS count FROM private.expert_assignments WHERE id = $1 AND assigned_by = $2 AND idempotency_key = $3`,
      [assignmentId, coordinatorId, assignmentKey]
    );
    assert.equal(assignmentCount.rows[0].count, 1);

    const assessmentInput = {
      expertId,
      caseId,
      domainCode: "CYBERSECURITY",
      assessment: { analysis: "The local fixture remains within the verified domain scope.", recommendedAction: "MONITOR" },
      confidence: 0.91,
      assignmentId,
      caseRevision: 1,
      coiDeclared: true,
      idempotencyKey: assessmentKey,
    };
    const assessmentResults = await Promise.all([
      ExpertRepository.submitAssessment(assessmentInput),
      ExpertRepository.submitAssessment(assessmentInput),
    ]);
    assert.equal(assessmentResults[0].id, assessmentResults[1].id);
    assert.deepEqual(assessmentResults.map((entry) => entry.idempotent === true).sort(), [false, true]);
    const assessmentId = assessmentResults[0].id;
    const assessmentCount = await pool.query(
      `SELECT count(*)::int AS count FROM public.expert_assessments WHERE id = $1 AND expert_id = $2 AND idempotency_key = $3`,
      [assessmentId, expertId, assessmentKey]
    );
    assert.equal(assessmentCount.rows[0].count, 1);
    const assessmentOutboxCount = await pool.query(
      `SELECT count(*)::int AS count FROM private.integration_outbox
        WHERE integration = 'INTERNAL' AND aggregate_id = $1 AND event_type = 'EXPERT_ASSESSMENT_SUBMITTED'`,
      [assessmentId]
    );
    assert.equal(assessmentOutboxCount.rows[0].count, 1);

    await ExpertRepository.setDomainVerification({ userId: expertId, domainCode: "CYBERSECURITY", status: "REVOKED", verifiedBy: coordinatorId, evidenceRef: "local:g3-revoked" });
    const replay = await ExpertRepository.submitAssessment(assessmentInput);
    assert.equal(replay.id, assessmentId);
    assert.equal(replay.idempotent, true);
    await assert.rejects(
      () => ExpertRepository.submitAssessment({ ...assessmentInput, idempotencyKey: `${assessmentKey}-after-revocation` }),
      (error) => error?.code === "UNVERIFIED_EXPERT_DOMAIN"
    );

    const shadowEnv = { ...process.env, STUDENTHUB_LABBE_MODE: "SHADOW", STUDENTHUB_LABBE_BASE_URL: "", STUDENTHUB_LABBE_TOKEN: "", STUDENTHUB_LABBE_SCOPE: "" };
    const event = buildTrustDecisionEvent({
      caseId,
      caseRevision: 1,
      runId,
      pipelineResult: { pipelineStatus: "COMPLETED", finalDecision: { security: "ALLOW", truth: "SUPPORTED", action: "MONITOR" } },
      correlationId: `g3-outbox-${caseId}`,
      env: shadowEnv,
    });
    assert.ok(event);
    outboxEventId = event.event_id;
    await pool.query(
      `INSERT INTO private.integration_outbox
        (event_id, integration, aggregate_type, aggregate_id, event_type, schema_version,
         occurred_at, produced_at, producer, environment, correlation_id, causation_id,
         subject, classification, payload, payload_hash, status)
       VALUES ($1, 'LABBE', 'TRUST_CASE', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, 'PENDING')`,
      [
        event.event_id, caseId, event.event_type, event.schema_version, event.occurred_at, event.produced_at,
        event.producer, event.environment, event.correlation_id, event.causation_id, event.subject,
        event.classification, JSON.stringify(event.payload), Buffer.from(event.payload_hash, "hex"),
      ]
    );
    const dispatchResults = await Promise.all([
      LabbeOutboxService.dispatchOne({ pool, env: shadowEnv }),
      LabbeOutboxService.dispatchOne({ pool, env: shadowEnv }),
    ]);
    assert.ok(dispatchResults.some((entry) => entry.state === "SHADOW"));
    assert.ok(dispatchResults.some((entry) => entry.state === "IDLE"));
    const firstLease = await pool.query(`SELECT status, lease_count, shadow_count FROM private.integration_outbox WHERE event_id = $1`, [outboxEventId]);
    assert.equal(firstLease.rows[0].status, "SHADOW");
    assert.equal(Number(firstLease.rows[0].lease_count), 1);
    assert.equal(Number(firstLease.rows[0].shadow_count), 1);

    await pool.query(`UPDATE private.integration_outbox SET status = 'IN_FLIGHT', leased_until = now() - interval '1 second', lease_token = null WHERE event_id = $1`, [outboxEventId]);
    const recovery = await LabbeOutboxService.dispatchOne({ pool, env: shadowEnv });
    assert.equal(recovery.state, "SHADOW");
    const recoveredLease = await pool.query(`SELECT status, lease_count, shadow_count FROM private.integration_outbox WHERE event_id = $1`, [outboxEventId]);
    assert.equal(recoveredLease.rows[0].status, "SHADOW");
    assert.equal(Number(recoveredLease.rows[0].lease_count), 2);
    assert.equal(Number(recoveredLease.rows[0].shadow_count), 2);
  } finally {
    if (outboxEventId) await pool.query(`DELETE FROM private.integration_outbox WHERE event_id = $1`, [outboxEventId]).catch(() => {});
    // Community/Expert lineage is append-only by design and remains in the
    // disposable database for post-run inspection; no main data is touched.
  }
});
