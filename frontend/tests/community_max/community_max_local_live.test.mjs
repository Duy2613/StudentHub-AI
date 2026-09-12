import assert from "node:assert/strict";
import crypto from "node:crypto";
import test, { after } from "node:test";

const databaseUrl = process.env.STUDENTHUB_RLS_TEST_DATABASE_URL || process.env.DATABASE_URL;
const liveGate = databaseUrl ? undefined : { skip: "LOCAL_COMMUNITY_MAX_DATABASE_REQUIRED" };
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_SSL = "disable";
}

const { CommunityRepository } = await import("../../src/lib/server/database/CommunityRepository.js");
const { CommunityMaxRepository } = await import("../../src/lib/server/database/CommunityMaxRepository.js");
const { getPostgresPool } = await import("../../src/lib/server/database/PostgresPool.js");

after(async () => {
  if (databaseUrl) await getPostgresPool().end();
});

test("LOCAL COMMUNITY MAX: waves 1-3 durable flow and authority boundaries", liveGate, async () => {
  const pool = getPostgresPool();
  const ownerId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const moderatorId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const claimId = crypto.randomUUID();
  const evidenceId = crypto.randomUUID();
  const repo = new CommunityMaxRepository(pool);

  await pool.query(
    `INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
     VALUES ($1, 'authenticated', 'authenticated', $2, now(), now()),
            ($3, 'authenticated', 'authenticated', $4, now(), now()),
            ($5, 'authenticated', 'authenticated', $6, now(), now())`,
    [ownerId, `${ownerId}@community-max.local`, memberId, `${memberId}@community-max.local`, moderatorId, `${moderatorId}@community-max.local`]
  );
  await pool.query(`INSERT INTO private.user_roles (user_id, role_id) SELECT $1, id FROM private.roles WHERE code = 'ADMIN'`, [moderatorId]);
  await pool.query(`INSERT INTO public.trust_cases (id, owner_id, state, visibility) VALUES ($1, $2, 'DISPUTED', 'PUBLIC')`, [caseId, ownerId]);
  await pool.query(`INSERT INTO public.trust_runs (id, case_id, owner_id, status, pipeline_version, started_at) VALUES ($1, $2, $3, 'COMPLETED', 'community-max-local', now())`, [runId, caseId, ownerId]);
  await pool.query(`INSERT INTO public.trust_case_revisions (case_id, owner_id, revision, run_id, state, snapshot) VALUES ($1, $2, 1, $3, 'DISPUTED', '{}'::jsonb)`, [caseId, ownerId, runId]);
  await pool.query(`INSERT INTO public.claims (id, creator_id, statement, status) VALUES ($1, $2, 'The published process has a materially delayed review step.', 'OPEN')`, [claimId, ownerId]);
  await pool.query(`INSERT INTO public.evidence (id, case_id, source_type, source_identifier, observed_at, extractor_version, confidence, provenance) VALUES ($1, $2, 'PUBLIC_WEB', 'https://example.edu/policy', now(), 'community-max-test', 0.8, '{}'::jsonb)`, [evidenceId, caseId]);
  await pool.query(`INSERT INTO public.claim_sources (claim_id, evidence_id, relation) VALUES ($1, $2, 'SUPPORTS')`, [claimId, evidenceId]);

  const contribution = await CommunityRepository.createContribution({
    authorId: ownerId,
    caseId,
    caseRevision: 1,
    claimId,
    contributionType: "DIRECT_EXPERIENCE",
    statement: "This local Community Max fixture records a revision-bound experience.",
    idempotencyKey: `community-max-contribution-${caseId}`,
  });
  const contributionId = contribution.contributionId;

  const sourceInput = {
    createdBy: ownerId,
    contributionId,
    contributionRevision: 1,
    sources: [{ url: "https://example.edu/policy?utm_campaign=discarded" }],
    idempotencyKey: `community-max-source-${caseId}`,
  };
  const firstSources = await repo.attachSourceReferences(sourceInput);
  const replaySources = await repo.attachSourceReferences(sourceInput);
  assert.equal(firstSources.sources.length, 1);
  assert.equal(replaySources.sources[0].id, firstSources.sources[0].id);
  assert.equal((await repo.listSourceReferences({ actorId: memberId, contributionId, contributionRevision: 1 })).independence.totalSources, 1);

  const discussionInput = {
    authorId: memberId,
    contributionId,
    contributionRevision: 1,
    claimId,
    action: "CHALLENGE",
    body: "The source needs a second check because the process date may have changed.",
    idempotencyKey: `community-max-discussion-${caseId}`,
  };
  const discussion = await repo.createClaimDiscussion(discussionInput);
  const discussionReplay = await repo.createClaimDiscussion(discussionInput);
  assert.equal(discussionReplay.idempotent, true);
  assert.equal((await repo.listClaimDiscussions({ actorId: ownerId, contributionId, contributionRevision: 1, claimId })).length, 1);

  const verification = await repo.requestVerification({ actorId: memberId, contributionId, contributionRevision: 1, sourceReferenceIds: [firstSources.sources[0].id] });
  assert.equal(verification.verification.verificationState, "PENDING");
  assert.equal(verification.nextAction, "CANONICAL_TRUST_FLOW_REQUIRED");
  assert.equal(verification.trustMutation, false);

  const summary = await repo.createDiscussionSummary({ actorId: memberId, contributionId, contributionRevision: 1 });
  assert.equal(summary.summary.providerStatus, "RULE_GROUNDED");
  assert.equal(summary.summary.finalVerdict, false);
  assert.deepEqual(summary.summary.discussionIds, [discussion.discussion.id]);

  const review = await repo.createReviewCandidate({
    actorId: memberId,
    contributionId,
    contributionRevision: 1,
    claimId,
    supportSignals: [{ id: "support-signal" }],
    challengeSignals: [{ id: discussion.discussion.id }],
    evidenceStates: ["MIXED"],
    idempotencyKey: `community-max-review-${caseId}`,
  });
  assert.equal(review.queueOnly, true);
  assert.ok(review.candidateId);

  const expertRequest = await repo.createExpertRequest({
    requesterId: memberId,
    contributionId,
    contributionRevision: 1,
    claimId,
    domainCode: "ACADEMIC_POLICY",
    reason: "Please review the policy scope and revision lineage.",
    idempotencyKey: `community-max-expert-${caseId}`,
  });
  assert.equal(expertRequest.status, "QUEUED");
  assert.equal(expertRequest.queueOnly, true);

  const campus = await repo.upsertCampusContext({
    actorId: ownerId,
    contributionId,
    contributionRevision: 1,
    universityLabel: "HCMUTE",
    faculty: "Engineering",
    visibility: "PRIVATE",
    consent: true,
  });
  assert.equal(campus.campus.consentState, "CONSENTED");
  assert.equal((await repo.getCampusContext({ actorId: ownerId, contributionId, contributionRevision: 1 })).inferred, false);

  const risk = await repo.clusterRiskSignal({ actorId: memberId, contributionId, contributionRevision: 1, riskType: "SOURCE_RETRACTION", signalType: "REVIEW_REQUIRED", topic: "policy" });
  assert.equal(risk.private, true);
  assert.equal(risk.rawContentIncluded, false);
  assert.equal(risk.piiIncluded, false);
  const dataCandidate = await repo.createDataCandidate({ actorId: ownerId, contributionId, contributionRevision: 1, candidateType: "CORRECTION_EXAMPLE" });
  assert.equal(dataCandidate.trainingEligible, false);
  assert.equal(dataCandidate.automaticTraining, false);

  const sourceState = await repo.updateSourceState({ actorId: moderatorId, sourceReferenceId: firstSources.sources[0].id, sourceState: "RETRACTED", reason: "Verification worker marked the source as retracted." });
  assert.equal(sourceState.trustMutation, false);
  const stale = await repo.getVerificationProjection({ actorId: memberId, contributionId, contributionRevision: 1 });
  assert.equal(stale.freshnessState, "SOURCE_RETRACTED");

  const correctionText = "This local correction records a changed process detail for this revision.";
  const correctionPreview = CommunityRepository.previewContribution({ caseId, caseRevision: 1, claimId, contributionType: "DIRECT_EXPERIENCE", statement: correctionText, evidenceRefs: [] });
  const correction = await repo.createCorrection({
    actorId: ownerId,
    contributionId,
    expectedRevision: 1,
    correctionType: "SELF_CORRECTION",
    statement: correctionText,
    caseId,
    caseRevision: 1,
    claimId,
    privacyConfirmed: true,
    previewDigest: correctionPreview.previewDigest,
    idempotencyKey: `community-max-correction-${caseId}`,
  });
  assert.equal(correction.previousRevision, 1);
  assert.equal(correction.newRevision, 2);
  assert.equal(correction.qualitySignal.pointDelta, 0);

  const notification = await pool.query(`SELECT count(*)::int AS count FROM public.notifications WHERE owner_id = $1 AND subject_type = 'COMMUNITY_SOURCE' AND subject_id = $2`, [ownerId, firstSources.sources[0].id]);
  assert.equal(notification.rows[0].count, 1);
  const trustWrites = await pool.query(`SELECT state, visibility FROM public.trust_cases WHERE id = $1`, [caseId]);
  assert.equal(trustWrites.rows[0].state, "DISPUTED");
  assert.equal(trustWrites.rows[0].visibility, "PUBLIC");
});
