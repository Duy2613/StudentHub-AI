/**
 * StudentHub AI — CommunityRepository
 *
 * The repository is the durable Community write boundary. Legacy forum
 * posts/votes remain available for compatibility, while Promax contributions
 * use claim/revision binding, privacy proof, reaction history, and an
 * internal outbox in one transaction.
 */

import { createHash, createHmac, randomUUID } from "node:crypto";
import { getPostgresPool } from "./PostgresPool.js";
import { assertCaseScope, isCanonicalUuid, scopeError } from "./CommunityExpertScope.js";
import {
  analyzeReactionIntegrity,
  canonicalizeSource,
  calculateCommunityTrackRecord,
  canAppeal,
  createPreview,
  detectPII,
  rankCommunityContribution,
  redactText,
  REACTION_KINDS,
  resolveAssessmentDisagreement,
  transitionState,
  validateContributionInput,
} from "../../communityExpert/promaxDomain.js";

export class CommunityRepositoryError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "CommunityRepositoryError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function json(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest();
}

export function communityThreadPseudonym(contributionId, authorId) {
  const secret = process.env.CAPABILITY_SECRET || process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("A server secret is required for Community thread pseudonyms.");
  }
  const rootSecret = secret || "studenthub-community-pseudonym-test-only";
  const scopedKey = createHmac("sha256", rootSecret).update("studenthub/community/thread-pseudonym/v1").digest();
  const digestText = createHmac("sha256", scopedKey)
    .update(`${String(contributionId || "").toLowerCase()}:${String(authorId || "").toLowerCase()}`)
    .digest("hex");
  return `Người tham gia ${digestText.slice(0, 10).toUpperCase()}`;
}

function transaction(operation) {
  const pool = getPostgresPool();
  return pool.connect().then(async (client) => {
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
  });
}

function contributionDTO(row, now = Date.now(), viewerId = null) {
  if (!row) return null;
  const evidence = json(row.evidence_payload || row.evidence_revision_ids);
  const sourceRefs = json(row.source_refs);
  const linkedCaseRevision = row.case_revision == null ? Number.NaN : Number(row.case_revision);
  const latestCaseRevision = row.latest_case_revision == null ? Number.NaN : Number(row.latest_case_revision);
  const communitySignalAt = Date.parse(row.latest_community_signal_at || "");
  const trustRunStartedAt = Date.parse(row.latest_trust_run_started_at || "");
  let trustFreshness = "UNKNOWN";
  let trustFreshnessReason = "TRUST_RUN_UNAVAILABLE";
  if (Number.isInteger(latestCaseRevision) && Number.isInteger(linkedCaseRevision)) {
    if (latestCaseRevision > linkedCaseRevision) {
      trustFreshness = "STALE";
      trustFreshnessReason = "CASE_REVISION_ADVANCED";
    } else if (latestCaseRevision < linkedCaseRevision) {
      trustFreshness = "STALE";
      trustFreshnessReason = "CASE_REVISION_UNAVAILABLE";
    } else if (Number.isFinite(trustRunStartedAt) && Number.isFinite(communitySignalAt)) {
      if (communitySignalAt > trustRunStartedAt) {
        trustFreshness = "STALE";
        trustFreshnessReason = "COMMUNITY_UPDATED_AFTER_TRUST";
      } else {
        trustFreshness = "CURRENT";
        trustFreshnessReason = "CASE_AND_COMMUNITY_CURRENT";
      }
    }
  }
  const rank = rankCommunityContribution({
    relevance: Number(row.relevance ?? 0.5),
    evidence,
    observedAt: row.observed_at || row.created_at,
    independentHelpfulness: Number(row.independent_helpfulness ?? 0),
    authorDomainReliability: Number(row.author_domain_reliability ?? 0.5),
    reviewState: row.review_state,
  }, now);
  return {
    postId: row.id,
    contributionId: row.id,
    caseScope: { caseId: row.case_id, caseRevision: Number(row.case_revision) },
    trustFreshness,
    trustFreshnessReason,
    latestCaseRevision: Number.isInteger(latestCaseRevision) ? latestCaseRevision : null,
    latestTrustRunAt: row.latest_trust_run_at ? new Date(row.latest_trust_run_at).toISOString() : null,
    latestCommunitySignalAt: row.latest_community_signal_at ? new Date(row.latest_community_signal_at).toISOString() : null,
    canRequestExpert: Boolean(viewerId && String(row.trust_owner_id || "").toLowerCase() === String(viewerId).toLowerCase()),
    claimId: row.claim_id || null,
    contributionType: row.contribution_type,
    content: row.public_statement,
    statement: row.public_statement,
    title: row.title || null,
    evidenceRefs: sourceRefs,
    sources: row.source_url ? [{ url: row.source_url, publisher: row.source_publisher || null }] : [],
    evidenceRevisionIds: json(row.evidence_revision_ids),
    commentCount: Number(row.comment_count || 0),
    publicationState: row.publication_state,
    evidenceState: row.evidence_state,
    reviewState: row.review_state,
    revision: Number(row.revision || 1),
    sourceClusterId: row.source_cluster_id || null,
    reactions: {
      helpful: Number(row.helpful_count || 0),
      addEvidence: Number(row.add_evidence_count || 0),
      challenge: Number(row.challenge_count || 0),
      insufficientInformation: Number(row.insufficient_information_count || 0),
      reportAbuse: Number(row.report_abuse_count || 0),
    },
    ranking: rank,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function commentDTO(row, authorId) {
  if (!row) return null;
  return {
    commentId: row.id,
    contributionId: row.contribution_id,
    parentCommentId: row.parent_comment_id || null,
    depth: Number(row.depth || 0),
    content: row.status === "PUBLISHED" ? row.content : "Bình luận đã được ẩn.",
    status: row.status,
    authorLabel: communityThreadPseudonym(row.contribution_id, authorId),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

async function appendOutbox(client, { eventType, aggregateId, aggregateType = "COMMUNITY_CONTRIBUTION", subject, payload, correlationId = "community" }) {
  const eventId = randomUUID();
  await client.query(
    `INSERT INTO private.integration_outbox
      (event_id, integration, aggregate_type, aggregate_id, event_type,
       schema_version, occurred_at, produced_at, producer, environment,
       correlation_id, subject, classification, payload, payload_hash, status)
     VALUES ($1, 'INTERNAL', $2, $3, $4, 'community-promax.v1',
             now(), now(), 'studenthub-community', $5, $6, $7, 'PUBLIC', $8::jsonb, $9, 'PENDING')
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, aggregateType, aggregateId, eventType, process.env.NODE_ENV || "development", correlationId, subject, JSON.stringify(payload), digest(payload)]
  );
  return eventId;
}

async function appendQualityEvent(client, {
  subjectId,
  actorId = null,
  contributionId = null,
  caseId = null,
  caseRevision = null,
  eventType,
  pointDelta = 0,
  reason,
  idempotencyKey,
}) {
  const requestDigest = digest({ subjectId, actorId, contributionId, caseId, caseRevision, eventType, pointDelta, reason });
  const existing = await client.query(
    `SELECT request_digest FROM private.community_quality_events
      WHERE subject_id = $1 AND idempotency_key = $2
      LIMIT 1`,
    [subjectId, idempotencyKey]
  );
  if (existing.rows[0]) {
    if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
    return;
  }
  await client.query(
    `INSERT INTO private.community_quality_events
      (subject_id, actor_id, contribution_id, case_id, case_revision,
       event_type, point_delta, reason, idempotency_key, request_digest, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())`,
    [subjectId, actorId, contributionId, caseId, caseRevision, eventType, pointDelta, String(reason || "community quality event").slice(0, 1000), idempotencyKey, requestDigest]
  );
}

async function appendAppealQualityCorrection(client, { appeal, reviewerId, review }) {
  if (!appeal?.assessment_id || review?.decision !== "OVERTURN") return null;
  const assessmentResult = await client.query(
    `SELECT id, expert_id, domain_code, case_id, case_revision, claim_id,
            evidence_revision_ids
       FROM public.expert_assessments
      WHERE id = $1
      FOR SHARE`,
    [appeal.assessment_id]
  );
  const assessment = assessmentResult.rows[0];
  if (!assessment) return null;
  const domainCode = String(assessment.domain_code || "").toUpperCase();
  const targetResult = await client.query(
    `SELECT id, outcome, weight
       FROM private.expert_quality_events
      WHERE user_id = $1 AND domain_code = $2
        AND case_id = $3 AND case_revision = $4
        AND event_type = 'ADJUDICATION'
        AND supersedes_event_id IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      FOR SHARE`,
    [assessment.expert_id, domainCode, assessment.case_id, assessment.case_revision]
  );
  const target = targetResult.rows[0] || null;
  const eventType = target ? "REVERSE_ADJUDICATION" : "MANUAL_CORRECTION";
  const outcome = target?.outcome || "MIXED";
  const idempotencyKey = `appeal:${appeal.id}:quality:${review.id}`;
  const reason = `Independent appeal ${review.id} overturned assessment ${assessment.id}; correction is append-only and does not mutate Trust.`;
  const evidenceRevisionIds = json(assessment.evidence_revision_ids);
  const requestDigest = digest({
    userId: assessment.expert_id,
    domainCode,
    caseId: assessment.case_id,
    caseRevision: Number(assessment.case_revision),
    claimId: assessment.claim_id || null,
    evidenceRevisionIds,
    eventType,
    outcome,
    reviewerId,
    appealId: appeal.id,
    reviewId: review.id,
    supersedesEventId: target?.id || null,
  });
  const inserted = await client.query(
    `INSERT INTO private.expert_quality_events
      (user_id, domain_code, case_id, case_revision, claim_id,
       event_type, outcome, weight, idempotency_key, request_digest,
       reason, policy_version, actor_id, supersedes_event_id,
       evidence_revision_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
             'expert-quality-v1', $12, $13, $14::jsonb)
     ON CONFLICT (user_id, domain_code, idempotency_key) DO NOTHING
     RETURNING id, event_type, outcome, supersedes_event_id`,
    [assessment.expert_id, domainCode, assessment.case_id, Number(assessment.case_revision), assessment.claim_id || null, eventType, outcome, Number(target?.weight || 1), idempotencyKey, requestDigest, reason, reviewerId, target?.id || null, JSON.stringify(evidenceRevisionIds)]
  );
  return inserted.rows[0] || { idempotent: true, eventType, outcome, supersedes_event_id: target?.id || null };
}

async function upsertSourceCluster(client, sourceData) {
  if (!sourceData?.canonicalUrl && !sourceData?.contentDigest) return null;
  const digestHex = /^[0-9a-fA-F]{64}$/.test(sourceData.contentDigest || "") ? sourceData.contentDigest : null;
  await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`source-cluster:${digestHex || `${sourceData.independenceKey}:${sourceData.canonicalUrl}`}`]);
  const existingCluster = digestHex
    ? await client.query(
      `SELECT id FROM public.community_source_clusters
        WHERE content_digest = decode($1, 'hex')
        FOR UPDATE`,
      [digestHex]
    )
    : { rows: [] };
  if (existingCluster.rows[0]) {
    const touched = await client.query(
      `UPDATE public.community_source_clusters
          SET source_count = source_count + 1, updated_at = now()
        WHERE id = $1
        RETURNING id`,
      [existingCluster.rows[0].id]
    );
    return touched.rows[0]?.id || null;
  }
  const cluster = await client.query(
    `INSERT INTO public.community_source_clusters
       (canonical_locator, publisher, independence_key, content_digest, source_count, updated_at)
     VALUES ($1, $2, $3,
             CASE WHEN $4 ~ '^[0-9a-fA-F]{64}$' THEN decode($4, 'hex') ELSE NULL END,
             1, now())
     ON CONFLICT (canonical_locator, independence_key)
       DO UPDATE SET source_count = public.community_source_clusters.source_count + 1,
                     updated_at = now()
     RETURNING id`,
    [sourceData.canonicalUrl || sourceData.contentDigest, sourceData.publisher || null, sourceData.independenceKey, sourceData.contentDigest || ""]
  );
  return cluster.rows[0]?.id || null;
}

export class CommunityRepository {
  /** Creates a legacy forum post with server-derived author ID. */
  static async createPost({ authorId, title, content, status = "PUBLISHED" }) {
    if (!authorId || !title || !content) throw new Error("authorId, title, and content are required.");
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.posts (author_id, title, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING id, author_id, title, content, status, created_at`,
      [authorId, String(title).trim(), String(content).trim(), status]
    );
    return res.rows[0];
  }

  /** Lists legacy published forum posts. */
  static async listPosts({ limit = 20, offset = 0, authorId = null } = {}) {
    const pool = getPostgresPool();
    let query = `SELECT id, author_id, title, content, status, created_at FROM public.posts WHERE status = 'PUBLISHED'`;
    const params = [];
    if (authorId) {
      params.push(authorId);
      query += ` AND author_id = $${params.length}`;
    }
    params.push(Math.min(limit, 50), Math.max(offset, 0));
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  /** Adds a legacy comment with server-derived author. */
  static async addComment({ postId, authorId, body, content }) {
    const textContent = content || body;
    if (!postId || !authorId || !textContent) throw new Error("postId, authorId, and content are required.");
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.comments (post_id, author_id, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'PUBLISHED', now(), now())
       RETURNING id, post_id, author_id, content, status, created_at`,
      [postId, authorId, String(textContent).trim()]
    );
    return res.rows[0];
  }

  /** Legacy ±1 vote compatibility. Promax reactions use setReaction below. */
  static async votePost({ userId, postId, direction, value }) {
    const voteVal = value !== undefined ? value : direction;
    if (!userId || !postId || ![-1, 1].includes(voteVal)) throw new Error("userId, postId, and value (+1 or -1) are required.");
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.votes (post_id, user_id, value, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (post_id, user_id) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()
       RETURNING post_id, user_id, value`,
      [postId, userId, voteVal]
    );
    return res.rows[0];
  }

  /** Follows an Evidence Passport for material updates. */
  static async followPassport({ ownerId, passportId }) {
    if (!ownerId || !passportId) throw new Error("ownerId and passportId are required.");
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.case_follows (owner_id, passport_id, created_at)
       VALUES ($1, $2, now())
       ON CONFLICT (owner_id, passport_id) DO NOTHING
       RETURNING owner_id, passport_id, created_at`,
      [ownerId, passportId]
    );
    return res.rows[0] || { ownerId, passportId, followed: true };
  }

  static previewContribution(input = {}) {
    return createPreview(input);
  }

  /** Persists a redacted contribution and its internal outbox event atomically. */
  static async createContribution({
    authorId,
    caseId,
    caseRevision,
    claimId = null,
    contributionType = "DIRECT_EXPERIENCE",
    statement,
    evidenceRefs = [],
    evidenceRevisionIds = [],
    metadata = {},
    ocrText = "",
    qrContent = "",
    source = null,
    idempotencyKey,
    correlationId = "community",
  }) {
    if (!authorId) throw new CommunityRepositoryError("AUTHENTICATION_REQUIRED", "Authenticated author is required.", 401);
    const validation = validateContributionInput({ caseId, caseRevision, claimId, contributionType, statement, evidenceRefs });
    if (!validation.ok) throw new CommunityRepositoryError(validation.code, `Invalid contribution fields: ${validation.errors.join(", ")}.`, 400);
    caseId = validation.value.caseId.toLowerCase();
    caseRevision = validation.value.caseRevision;
    claimId = validation.value.claimId;
    contributionType = validation.value.contributionType;
    statement = validation.value.statement;
    evidenceRefs = validation.value.evidenceRefs;
    evidenceRevisionIds = Array.isArray(evidenceRevisionIds) ? [...new Set(evidenceRevisionIds.map((id) => String(id).toLowerCase()))].slice(0, 100) : [];
    const scanInput = [statement, ocrText, qrContent, source?.url, source?.canonicalUrl].filter((value) => typeof value === "string" && value.trim()).join("\n");
    const scan = detectPII(scanInput.slice(0, 80_000), { ...(metadata || {}), ...(source?.metadata || {}), ...(qrContent ? { qrData: qrContent } : {}) });
    const sourcePii = detectPII([source?.url, source?.canonicalUrl].filter((value) => typeof value === "string").join("\n"));
    if (scan.blocked || sourcePii.hasPII) throw new CommunityRepositoryError("PRIVACY_SCAN_BLOCKED", "The contribution contains identifying content and cannot be published.", 422);
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new CommunityRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
    const redactedStatement = redactText(String(statement).trim());
    const sourceData = source ? canonicalizeSource(source) : null;
    if ((source?.url || source?.canonicalUrl) && !sourceData?.canonicalUrl) throw new CommunityRepositoryError("COMMUNITY_SOURCE_URL_INVALID", "A public source must use a valid HTTP or HTTPS URL without embedded credentials.", 400);
    const finalPrivacyFindings = scan.findings;
    const contentDigest = digest({ caseId, caseRevision, claimId, contributionType, redactedStatement, evidenceRefs, evidenceRevisionIds, source: sourceData, ocrDigest: redactText(ocrText).slice(0, 20_000), qrContent: redactText(qrContent).slice(0, 4_000), privacyFindings: finalPrivacyFindings });

    return transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`contribution:${authorId}:${idempotencyKey}`]);
      const existing = await client.query(
        `SELECT * FROM public.community_contributions WHERE author_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [authorId, idempotencyKey]
      );
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].content_digest).equals(contentDigest)) throw scopeError('IDEMPOTENCY_CONFLICT');
        return { ...contributionDTO(existing.rows[0]), idempotent: true };
      }
      // The Community statement is published only after explicit preview and
      // confirmation.  Its linked Trust case can remain private: the case id,
      // raw case text, and private evidence are not included in the DTO.
      await assertCaseScope(client, { actorId: authorId, caseId, caseRevision, claimId, evidenceRevisionIds, publicOnly: false });

      const sourceClusterId = await upsertSourceCluster(client, sourceData);
      const inserted = await client.query(
        `INSERT INTO public.community_contributions
          (author_id, case_id, case_revision, claim_id, contribution_type,
           publication_state, evidence_state, review_state, statement,
           public_statement, evidence_revision_ids, source_refs, source_cluster_id,
           content_digest, privacy_findings, idempotency_key, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'PUBLISHED', 'UNKNOWN', 'UNASSIGNED',
                 $6, $6, $7::jsonb, $8::jsonb, $9, $10, $11::jsonb, $12, now(), now())
         RETURNING *`,
        [authorId, caseId, caseRevision, claimId, contributionType, redactedStatement, JSON.stringify(evidenceRevisionIds), JSON.stringify(evidenceRefs), sourceClusterId, contentDigest, JSON.stringify(finalPrivacyFindings), idempotencyKey]
      );
      const row = inserted.rows[0];
      await client.query(
        `INSERT INTO public.community_contribution_revisions
          (contribution_id, revision, statement, public_statement, evidence_revision_ids,
           source_refs, content_digest, privacy_findings, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9, now())`,
        [row.id, Number(row.revision || 1), redactedStatement, redactedStatement, JSON.stringify(evidenceRevisionIds), JSON.stringify(evidenceRefs), contentDigest, JSON.stringify(finalPrivacyFindings), authorId]
      );
      await appendQualityEvent(client, {
        subjectId: authorId,
        actorId: authorId,
        contributionId: row.id,
        caseId,
        caseRevision,
        eventType: "CONTRIBUTION_PUBLISHED",
        pointDelta: 10,
        reason: "Durable contribution passed the publication privacy gate.",
        idempotencyKey: `contribution:${row.id}:published`,
      });
      await appendOutbox(client, {
        eventType: "COMMUNITY_CONTRIBUTION_PUBLISHED",
        aggregateId: row.id,
        subject: authorId,
        correlationId,
        payload: {
          contributionId: row.id,
          caseId,
          caseRevision,
          claimId,
          contributionType,
          publicationState: row.publication_state,
          evidenceState: row.evidence_state,
          reviewState: row.review_state,
          contentDigest: contentDigest.toString("hex"),
        },
      });
      return contributionDTO(row);
    });
  }

  /**
   * Creates an immutable contribution revision.  The current projection is
   * updated only after the new revision is recorded, and an expected revision
   * prevents a stale browser tab from overwriting newer evidence.
   */
  static async editContribution({
    authorId,
    contributionId,
    expectedRevision,
    caseId = null,
    caseRevision = null,
    claimId = null,
    statement,
    evidenceRefs = [],
    evidenceRevisionIds = [],
    metadata = {},
    ocrText = "",
    qrContent = "",
    source = null,
    contributionType,
    privacyConfirmed = false,
    previewDigest,
    correlationId = "community-edit",
  }) {
    if (!authorId || !isCanonicalUuid(contributionId) || !Number.isInteger(Number(expectedRevision)) || Number(expectedRevision) < 1) {
      throw new CommunityRepositoryError("EDIT_INPUT_INVALID", "A contribution ID and expected revision are required.", 400);
    }
    const preview = createPreview({ caseId, caseRevision, claimId, statement, evidenceRefs, evidenceRevisionIds, metadata, ocrText, qrContent, source, contributionType });
    if (privacyConfirmed !== true || !previewDigest || previewDigest !== preview.previewDigest) {
      throw new CommunityRepositoryError("PREVIEW_CONFIRMATION_REQUIRED", "Confirm the current privacy preview before editing.", 409);
    }
    if (preview.state !== "PREVIEW_READY") throw new CommunityRepositoryError("PRIVACY_SCAN_BLOCKED", "The edited contribution contains identifying content and cannot be published.", 422);
    const validation = preview.validation;
    if (!validation.ok) throw new CommunityRepositoryError(validation.code, `Invalid contribution fields: ${validation.errors.join(", ")}.`, 400);
    caseId = validation.value.caseId.toLowerCase();
    caseRevision = validation.value.caseRevision;
    claimId = validation.value.claimId;
    evidenceRefs = validation.value.evidenceRefs;
    evidenceRevisionIds = Array.isArray(evidenceRevisionIds) ? [...new Set(evidenceRevisionIds.map((id) => String(id).toLowerCase()))].slice(0, 100) : [];
    const redactedStatement = redactText(String(statement).trim());
    const sourceData = source ? canonicalizeSource(source) : null;
    const contentDigest = digest({ caseId, caseRevision, claimId, contributionId, expectedRevision: Number(expectedRevision), redactedStatement, evidenceRefs, evidenceRevisionIds, source: sourceData, ocrDigest: redactText(ocrText).slice(0, 20_000), qrContent: redactText(qrContent).slice(0, 4_000), privacyFindings: preview.scan.findings });

    return transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`contribution-edit:${authorId}:${contributionId}`]);
      const currentResult = await client.query(
        `SELECT c.*, tc.visibility
           FROM public.community_contributions c
           JOIN public.trust_cases tc ON tc.id = c.case_id
          WHERE c.id = $1
          FOR UPDATE OF c`,
        [contributionId]
      );
      const current = currentResult.rows[0];
      if (!current || current.author_id !== authorId) throw new CommunityRepositoryError("CONTRIBUTION_NOT_AVAILABLE", "Only the contribution owner can create a revision.", 404);
      const alreadyApplied = await client.query(
        `SELECT c.* FROM public.community_contributions c
          WHERE c.id = $1 AND c.content_digest = $2
          LIMIT 1`,
        [contributionId, contentDigest]
      );
      if (alreadyApplied.rows[0]) return contributionDTO(alreadyApplied.rows[0]);
      if (Number(current.revision) !== Number(expectedRevision)) throw new CommunityRepositoryError("STALE_REVISION", "The contribution changed; reload before editing.", 409);
      if (caseId && String(current.case_id) !== String(caseId)) throw scopeError("EDIT_SCOPE_MISMATCH");
      if (caseRevision !== null && Number(current.case_revision) !== Number(caseRevision)) throw scopeError("EDIT_SCOPE_MISMATCH");
      if (claimId !== null && String(current.claim_id || "") !== String(claimId || "")) throw scopeError("EDIT_SCOPE_MISMATCH");
      if (!["PUBLISHED", "EDITED", "MODERATED"].includes(String(current.publication_state).toUpperCase())) throw new CommunityRepositoryError("CONTRIBUTION_NOT_EDITABLE", "This contribution is not editable in its current state.", 409);
      const transition = transitionState("publication", current.publication_state, "EDITED");
      if (!transition.ok) throw new CommunityRepositoryError(transition.code, "The contribution cannot transition to an edited revision.", 409);
      await assertCaseScope(client, {
        actorId: authorId,
        caseId: current.case_id,
        caseRevision: current.case_revision,
        claimId: current.claim_id,
        evidenceRevisionIds,
        publicOnly: current.visibility === "PUBLIC",
      });
      const sourceClusterId = await upsertSourceCluster(client, sourceData);
      const nextRevision = Number(current.revision) + 1;
      await client.query(
        `INSERT INTO public.community_contribution_revisions
          (contribution_id, revision, statement, public_statement, evidence_revision_ids,
           source_refs, content_digest, privacy_findings, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9, now())`,
        [contributionId, nextRevision, redactedStatement, redactedStatement, JSON.stringify(evidenceRevisionIds), JSON.stringify(evidenceRefs), contentDigest, JSON.stringify(preview.scan.findings), authorId]
      );
      const updated = await client.query(
        `UPDATE public.community_contributions
            SET contribution_type = COALESCE($2, contribution_type),
                publication_state = 'EDITED', evidence_state = 'UNKNOWN',
                review_state = 'UNASSIGNED', revision = $3,
                statement = $4, public_statement = $4,
                evidence_revision_ids = $5::jsonb, source_refs = $6::jsonb,
                source_cluster_id = $7, content_digest = $8,
                privacy_findings = $9::jsonb, updated_at = now()
          WHERE id = $1
          RETURNING *`,
        [contributionId, contributionType ? String(contributionType).toUpperCase() : null, nextRevision, redactedStatement, JSON.stringify(evidenceRevisionIds), JSON.stringify(evidenceRefs), sourceClusterId, contentDigest, JSON.stringify(preview.scan.findings)]
      );
      const row = updated.rows[0];
      await appendQualityEvent(client, {
        subjectId: authorId,
        actorId: authorId,
        contributionId,
        caseId: row.case_id,
        caseRevision: Number(row.case_revision),
        eventType: "CONTRIBUTION_REVISED",
        pointDelta: 0,
        reason: "A new immutable contribution revision was published for re-review.",
        idempotencyKey: `contribution:${contributionId}:revision:${nextRevision}`,
      });
      await appendOutbox(client, {
        eventType: "COMMUNITY_CONTRIBUTION_REVISION_CREATED",
        aggregateId: contributionId,
        subject: authorId,
        correlationId,
        payload: {
          contributionId,
          caseId: row.case_id,
          caseRevision: Number(row.case_revision),
          claimId: row.claim_id,
          revision: nextRevision,
          evidenceRevisionIds,
          contentDigest: contentDigest.toString("hex"),
          publicationState: "EDITED",
          requiresRereview: true,
        },
      });
      return contributionDTO(row);
    });
  }

  static async listContributionRevisions({ actorId, contributionId } = {}) {
    if (!actorId || !isCanonicalUuid(contributionId)) throw new CommunityRepositoryError("REVISION_SCOPE_INVALID", "A canonical contribution ID is required.", 400);
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT r.id, r.contribution_id, r.revision, r.public_statement,
              r.evidence_revision_ids, r.source_refs, r.privacy_findings,
              r.created_by, r.created_at, c.author_id, tc.visibility
         FROM public.community_contribution_revisions r
         JOIN public.community_contributions c ON c.id = r.contribution_id
         JOIN public.trust_cases tc ON tc.id = c.case_id
        WHERE r.contribution_id = $1
          AND (tc.visibility = 'PUBLIC' OR c.author_id = $2)
        ORDER BY r.revision DESC`,
      [contributionId, actorId]
    );
    return result.rows.map((revision) => {
      const row = { ...revision };
      delete row.author_id;
      delete row.visibility;
      delete row.created_by;
      return {
        ...row,
        revision: Number(row.revision),
        evidenceRevisionIds: json(row.evidence_revision_ids),
        evidenceRefs: json(row.source_refs),
        privacyFindings: json(row.privacy_findings),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      };
    });
  }

  static async listContributions({ caseId = null, claimId = null, limit = 50, sort = "relevant", now = Date.now(), viewerId = null } = {}) {
    const pool = getPostgresPool();
    const params = [];
    let where = `WHERE c.publication_state = 'PUBLISHED'`;
    if (caseId) { params.push(caseId); where += ` AND c.case_id = $${params.length}`; }
    if (claimId) { params.push(claimId); where += ` AND c.claim_id = $${params.length}`; }
    params.push(Math.min(Math.max(Number(limit) || 50, 1), 100));
    const res = await pool.query(
      `SELECT c.*, tc.owner_id AS trust_owner_id,
              latest_revision.revision AS latest_case_revision,
              latest_run.started_at AS latest_trust_run_started_at,
              latest_run.completed_at AS latest_trust_run_at,
              latest_community.changed_at AS latest_community_signal_at,
              source.canonical_locator AS source_url, source.publisher AS source_publisher,
              (SELECT count(*)::int FROM public.community_comments cm
                WHERE cm.contribution_id = c.id AND cm.status = 'PUBLISHED') AS comment_count,
              coalesce(reaction_counts.helpful_count, 0)::int AS helpful_count,
              coalesce(reaction_counts.add_evidence_count, 0)::int AS add_evidence_count,
              coalesce(reaction_counts.challenge_count, 0)::int AS challenge_count,
              coalesce(reaction_counts.insufficient_information_count, 0)::int AS insufficient_information_count,
              coalesce(reaction_counts.report_abuse_count, 0)::int AS report_abuse_count
         FROM public.community_contributions c
         JOIN public.trust_cases tc ON tc.id = c.case_id
         LEFT JOIN public.community_source_clusters source ON source.id = c.source_cluster_id
         LEFT JOIN LATERAL (
           SELECT revision FROM public.trust_case_revisions
            WHERE case_id = c.case_id ORDER BY revision DESC LIMIT 1
         ) latest_revision ON true
         LEFT JOIN LATERAL (
           SELECT started_at, completed_at FROM public.trust_runs
            WHERE case_id = c.case_id AND status = 'COMPLETED' AND completed_at IS NOT NULL
            ORDER BY completed_at DESC, started_at DESC LIMIT 1
         ) latest_run ON true
         LEFT JOIN LATERAL (
           SELECT max(updated_at) AS changed_at FROM public.community_contributions
            WHERE case_id = c.case_id AND publication_state = 'PUBLISHED'
         ) latest_community ON true
         LEFT JOIN LATERAL (
           SELECT sum(value) FILTER (WHERE kind = 'HELPFUL') AS helpful_count,
                  sum(value) FILTER (WHERE kind = 'ADD_EVIDENCE') AS add_evidence_count,
                  sum(value) FILTER (WHERE kind = 'CHALLENGE') AS challenge_count,
                  sum(value) FILTER (WHERE kind = 'INSUFFICIENT_INFORMATION') AS insufficient_information_count,
                  sum(value) FILTER (WHERE kind = 'REPORT_ABUSE') AS report_abuse_count
             FROM public.community_reactions WHERE contribution_id = c.id
         ) reaction_counts ON true
         ${where}
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $${params.length}`,
      params
    );
    const rows = res.rows.map((row) => contributionDTO(row, now, viewerId));
    const normalizedSort = String(sort || "relevant").toLowerCase();
    if (normalizedSort === "recent" || normalizedSort === "recently_updated") {
      rows.sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0));
    } else if (normalizedSort === "needs_review" || normalizedSort === "review") {
      const priority = (value) => ["CONFLICT", "NEEDS_THIRD_REVIEW", "IN_REVIEW", "ASSIGNED", "UNASSIGNED"].indexOf(value);
      rows.sort((a, b) => {
        const aPriority = priority(a.reviewState);
        const bPriority = priority(b.reviewState);
        return (aPriority < 0 ? 99 : aPriority) - (bPriority < 0 ? 99 : bPriority) || Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0);
      });
    } else {
      rows.sort((a, b) => Number(b.ranking?.score || 0) - Number(a.ranking?.score || 0) || Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
    }
    return rows;
  }

  static async listComments({ contributionId, limit = 500 } = {}) {
    if (!isCanonicalUuid(contributionId)) throw new CommunityRepositoryError("CONTRIBUTION_ID_INVALID", "A published Community contribution is required.", 400);
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT cm.id, cm.contribution_id, cm.parent_comment_id, cm.author_id, cm.content, cm.depth, cm.status, cm.created_at
         FROM public.community_comments cm
         JOIN public.community_contributions c ON c.id = cm.contribution_id
         JOIN public.trust_case_revisions tr ON tr.case_id = c.case_id AND tr.revision = c.case_revision
        WHERE c.id = $1 AND c.publication_state = 'PUBLISHED'
          AND cm.status IN ('PUBLISHED', 'DELETED', 'MODERATED')
        ORDER BY cm.created_at ASC, cm.id ASC
        LIMIT $2`,
      [contributionId, Math.min(Math.max(Number(limit) || 500, 1), 1000)]
    );
    const nodes = new Map(result.rows.map((row) => [row.id, {
      commentId: row.id,
      parentCommentId: row.parent_comment_id || null,
      depth: Number(row.depth || 0),
      content: row.status === "PUBLISHED" ? row.content : "Bình luận đã được ẩn.",
      status: row.status,
      authorLabel: communityThreadPseudonym(row.contribution_id, row.author_id),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      replies: [],
    }]));
    const roots = [];
    for (const comment of nodes.values()) {
      const parent = comment.parentCommentId ? nodes.get(comment.parentCommentId) : null;
      if (parent) parent.replies.push(comment);
      else roots.push(comment);
    }
    return roots;
  }

  static async createComment({ authorId, contributionId, parentCommentId = null, content, idempotencyKey, correlationId = "community-comment" } = {}) {
    const normalizedContent = String(content || "").trim();
    const normalizedParentId = parentCommentId ? String(parentCommentId).toLowerCase() : null;
    if (!isCanonicalUuid(authorId) || !isCanonicalUuid(contributionId) || (normalizedParentId && !isCanonicalUuid(normalizedParentId))) {
      throw new CommunityRepositoryError("COMMENT_SCOPE_INVALID", "A valid author, contribution, and optional reply target are required.", 400);
    }
    if (normalizedContent.length < 1 || normalizedContent.length > 4000) throw new CommunityRepositoryError("COMMENT_CONTENT_INVALID", "Comments must be between 1 and 4000 characters.", 400);
    if (!idempotencyKey || String(idempotencyKey).trim().length < 1 || String(idempotencyKey).length > 180) throw new CommunityRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
    const scan = detectPII(normalizedContent);
    if (scan.blocked) throw new CommunityRepositoryError("PRIVACY_SCAN_BLOCKED", "The comment contains identifying content and cannot be published.", 422);
    const safeContent = redactText(normalizedContent);
    const requestDigest = digest({ authorId, contributionId, parentCommentId: normalizedParentId, content: safeContent });

    return transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`community-comment:${authorId}:${idempotencyKey}`]);
      const existing = await client.query(
        `SELECT id, contribution_id, parent_comment_id, content, depth, status, created_at, request_digest
           FROM public.community_comments WHERE author_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [authorId, idempotencyKey]
      );
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        return { ...commentDTO(existing.rows[0], authorId), idempotent: true };
      }
      const contribution = await client.query(
        `SELECT c.id, c.case_id, c.case_revision, c.publication_state
           FROM public.community_contributions c
          WHERE c.id = $1 FOR SHARE`,
        [contributionId]
      );
      const post = contribution.rows[0];
      if (!post || post.publication_state !== "PUBLISHED") throw new CommunityRepositoryError("CONTRIBUTION_NOT_AVAILABLE", "This contribution is not available for discussion.", 404);
      const trustRevision = await client.query(
        `SELECT 1 FROM public.trust_case_revisions WHERE case_id = $1 AND revision = $2 LIMIT 1`,
        [post.case_id, post.case_revision]
      );
      if (!trustRevision.rows[0]) throw scopeError("CASE_REVISION_UNAVAILABLE", 404);

      let depth = 0;
      if (normalizedParentId) {
        const parent = await client.query(
          `SELECT depth, status FROM public.community_comments
            WHERE id = $1 AND contribution_id = $2 FOR SHARE`,
          [normalizedParentId, contributionId]
        );
        if (!parent.rows[0] || parent.rows[0].status !== "PUBLISHED") throw new CommunityRepositoryError("COMMENT_REPLY_TARGET_INVALID", "Replies must target a visible comment in this thread.", 404);
        depth = Number(parent.rows[0].depth) + 1;
        if (depth > 3) throw new CommunityRepositoryError("COMMENT_THREAD_DEPTH_LIMIT", "Replies can nest up to three levels.", 422);
      }
      const inserted = await client.query(
        `INSERT INTO public.community_comments
          (contribution_id, parent_comment_id, author_id, content, depth, status, idempotency_key, request_digest)
         VALUES ($1, $2, $3, $4, $5, 'PUBLISHED', $6, $7)
         RETURNING id, contribution_id, parent_comment_id, content, depth, status, created_at`,
        [contributionId, normalizedParentId, authorId, safeContent, depth, idempotencyKey, requestDigest]
      );
      const row = inserted.rows[0];
      await appendOutbox(client, {
        eventType: "COMMUNITY_COMMENT_CREATED",
        aggregateId: contributionId,
        aggregateType: "COMMUNITY_CONTRIBUTION",
        subject: authorId,
        correlationId,
        payload: { contributionId, commentId: row.id, parentCommentId: normalizedParentId, depth },
      });
      return { ...commentDTO(row, authorId), authorLabel: communityThreadPseudonym(contributionId, authorId) };
    });
  }

  static async getContributorTrackRecord(userId) {
    if (!isCanonicalUuid(userId)) throw new CommunityRepositoryError("CONTRIBUTOR_ID_INVALID", "A durable contributor identity is required.", 400);
    const pool = getPostgresPool();
    const summaryResult = await pool.query(
      `WITH authored AS (
         SELECT c.id, c.case_id, c.evidence_revision_ids, c.created_at, c.updated_at
           FROM public.community_contributions c
          WHERE c.author_id = $1 AND c.publication_state = 'PUBLISHED'
       ), reaction_stats AS (
         SELECT a.id,
                count(*) filter (where r.kind = 'HELPFUL' and r.value = 1)::int AS helpful_count,
                count(*) filter (where r.kind = 'CHALLENGE' and r.value = 1)::int AS challenge_count
           FROM authored a
           LEFT JOIN public.community_reactions r ON r.contribution_id = a.id
          GROUP BY a.id
       )
       SELECT count(*)::int AS published_contributions,
              count(*) filter (where jsonb_array_length(a.evidence_revision_ids) > 0)::int AS evidence_linked_contributions,
              count(distinct a.case_id)::int AS distinct_cases,
              coalesce((select sum(helpful_count) from reaction_stats), 0)::int AS helpful_reactions,
              coalesce((select sum(challenge_count) from reaction_stats), 0)::int AS challenge_reactions,
              min(a.created_at) AS first_activity_at,
              max(a.updated_at) AS last_activity_at,
              coalesce((select count(*) from private.community_quality_events qe
                 where qe.subject_id = $1
                   and qe.event_type in ('CORRECTION_RECORDED','MODERATION_RECORDED','MANUAL_CORRECTION')), 0)::int AS evaluated_outcomes,
              exists (select 1 from private.community_quality_events qe
                 where qe.subject_id = $1
                   and qe.event_type = 'MODERATION_RECORDED'
                   and qe.point_delta < 0) AS sanctions_active
         FROM authored a`,
      [userId]
    );
    const ledgerResult = await pool.query(
      `SELECT count(*)::int AS quality_event_count
         FROM private.community_quality_events
        WHERE subject_id = $1`,
      [userId]
    );
    const row = summaryResult.rows[0] || {};
    const summary = {
      publishedContributions: Number(row.published_contributions || 0),
      evidenceLinkedContributions: Number(row.evidence_linked_contributions || 0),
      distinctCases: Number(row.distinct_cases || 0),
      helpfulReactions: Number(row.helpful_reactions || 0),
      challengeReactions: Number(row.challenge_reactions || 0),
      qualityEventCount: Number(ledgerResult.rows[0]?.quality_event_count || 0),
      evaluatedOutcomes: Number(row.evaluated_outcomes || 0),
      stabilityDays: Number.isFinite(Date.parse(row.first_activity_at)) && Number.isFinite(Date.parse(row.last_activity_at))
        ? Math.max(0, Math.floor((Date.parse(row.last_activity_at) - Date.parse(row.first_activity_at)) / 86_400_000))
        : 0,
      lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at).toISOString() : null,
      sanctionsActive: row.sanctions_active === true,
    };
    return {
      ...calculateCommunityTrackRecord(summary),
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  static async getContribution(contributionId, { viewerId = null } = {}) {
    if (!contributionId) return null;
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT c.*, tc.owner_id AS trust_owner_id,
              latest_revision.revision AS latest_case_revision,
              latest_run.started_at AS latest_trust_run_started_at,
              latest_run.completed_at AS latest_trust_run_at,
              latest_community.changed_at AS latest_community_signal_at,
              source.canonical_locator AS source_url, source.publisher AS source_publisher,
              (SELECT count(*)::int FROM public.community_comments cm
                WHERE cm.contribution_id = c.id AND cm.status = 'PUBLISHED') AS comment_count,
              coalesce(reaction_counts.helpful_count, 0)::int AS helpful_count,
              coalesce(reaction_counts.add_evidence_count, 0)::int AS add_evidence_count,
              coalesce(reaction_counts.challenge_count, 0)::int AS challenge_count,
              coalesce(reaction_counts.insufficient_information_count, 0)::int AS insufficient_information_count,
              coalesce(reaction_counts.report_abuse_count, 0)::int AS report_abuse_count
         FROM public.community_contributions c
         JOIN public.trust_cases tc ON tc.id = c.case_id
         LEFT JOIN public.community_source_clusters source ON source.id = c.source_cluster_id
         LEFT JOIN LATERAL (
           SELECT revision FROM public.trust_case_revisions
            WHERE case_id = c.case_id ORDER BY revision DESC LIMIT 1
         ) latest_revision ON true
         LEFT JOIN LATERAL (
           SELECT started_at, completed_at FROM public.trust_runs
            WHERE case_id = c.case_id AND status = 'COMPLETED' AND completed_at IS NOT NULL
            ORDER BY completed_at DESC, started_at DESC LIMIT 1
         ) latest_run ON true
         LEFT JOIN LATERAL (
           SELECT max(updated_at) AS changed_at FROM public.community_contributions
            WHERE case_id = c.case_id AND publication_state = 'PUBLISHED'
         ) latest_community ON true
         LEFT JOIN LATERAL (
           SELECT sum(value) FILTER (WHERE kind = 'HELPFUL') AS helpful_count,
                  sum(value) FILTER (WHERE kind = 'ADD_EVIDENCE') AS add_evidence_count,
                  sum(value) FILTER (WHERE kind = 'CHALLENGE') AS challenge_count,
                  sum(value) FILTER (WHERE kind = 'INSUFFICIENT_INFORMATION') AS insufficient_information_count,
                  sum(value) FILTER (WHERE kind = 'REPORT_ABUSE') AS report_abuse_count
             FROM public.community_reactions WHERE contribution_id = c.id
         ) reaction_counts ON true
        WHERE c.id = $1 AND c.publication_state = 'PUBLISHED'`,
      [contributionId]
    );
    return contributionDTO(res.rows[0] || null, Date.now(), viewerId);
  }

  /**
   * Read-only bridge consumed by Trust views. Community rows are signals that
   * may be compared with evidence; they never become the canonical Trust
   * verdict and the DTO intentionally omits author identity fields.
   */
  static async listEvidenceSignalsForTrust({ caseId, caseRevision, claimId = null, limit = 100 } = {}) {
    if (!isCanonicalUuid(caseId) || !Number.isInteger(Number(caseRevision)) || Number(caseRevision) < 1 || (claimId && !isCanonicalUuid(claimId))) {
      throw new CommunityRepositoryError("TRUST_SIGNAL_SCOPE_REQUIRED", "Trust signals require an immutable case revision.", 400);
    }
    claimId = claimId ? String(claimId).toLowerCase() : null;
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT c.*, coalesce(sum(cr.value) filter (where cr.kind = 'HELPFUL'), 0)::int AS helpful_count,
              coalesce(sum(cr.value) filter (where cr.kind = 'ADD_EVIDENCE'), 0)::int AS add_evidence_count,
              coalesce(sum(cr.value) filter (where cr.kind = 'CHALLENGE'), 0)::int AS challenge_count,
              coalesce(sum(cr.value) filter (where cr.kind = 'INSUFFICIENT_INFORMATION'), 0)::int AS insufficient_information_count,
              coalesce(sum(cr.value) filter (where cr.kind = 'REPORT_ABUSE'), 0)::int AS report_abuse_count
         FROM public.community_contributions c
         LEFT JOIN public.community_reactions cr ON cr.contribution_id = c.id
        WHERE c.case_id = $1 AND c.case_revision = $2
          AND c.claim_id IS NOT DISTINCT FROM $3::uuid
          AND c.publication_state = 'PUBLISHED'
        GROUP BY c.id
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $4`,
      [caseId, Number(caseRevision), claimId, Math.min(Math.max(Number(limit) || 100, 1), 200)]
    );
    return res.rows.map((row) => ({
      ...contributionDTO(row),
      signalType: "COMMUNITY_CONTRIBUTION",
      authority: "NON_AUTHORITATIVE",
      authoritative: false,
      trustVerdictMutation: false,
    }));
  }

  static async setReaction({ userId, contributionId, claimId = null, caseRevision, kind, value = 1, idempotencyKey, expectedRevision = null }) {
    if (!REACTION_KINDS.includes(String(kind).toUpperCase()) || !Number.isInteger(caseRevision) || (expectedRevision !== null && !Number.isInteger(expectedRevision))) throw scopeError('REACTION_SCOPE_REQUIRED', 400);
    if (claimId && !isCanonicalUuid(claimId)) throw scopeError('CLAIM_ID_INVALID', 400);
    claimId = claimId ? String(claimId).toLowerCase() : null;
    if (!userId || !contributionId || !kind || ![-1, 1].includes(Number(value))) throw new CommunityRepositoryError("REACTION_INPUT_INVALID", "A reaction, contribution, and value are required.", 400);
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new CommunityRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
    return transaction(async (client) => {
      const contribution = await client.query(
        `SELECT c.id, c.author_id, c.case_id, c.case_revision, c.claim_id, c.revision, c.publication_state
           FROM public.community_contributions c
          WHERE c.id = $1
          FOR UPDATE OF c`,
        [contributionId]
      );
      const row = contribution.rows[0];
      if (!row) throw new CommunityRepositoryError("CONTRIBUTION_NOT_FOUND", "Contribution is not available.", 404);
      if (row.publication_state !== "PUBLISHED") throw new CommunityRepositoryError("CONTRIBUTION_NOT_AVAILABLE", "Only a published contribution can receive reactions.", 404);
      if (String(row.author_id).toLowerCase() === String(userId).toLowerCase()) throw new CommunityRepositoryError("SELF_REACTION_FORBIDDEN", "Authors cannot use their own reactions to change a contribution track record.", 403);
      if (Number(row.case_revision) !== caseRevision || (row.claim_id || null) !== claimId) throw scopeError('REACTION_SCOPE_MISMATCH');
      // A published Community contribution is public independently of the
      // source Trust case visibility. Verify that its bound revision exists,
      // without disclosing the private case to the reacting participant.
      const boundRevision = await client.query(
        `SELECT 1 FROM public.trust_case_revisions WHERE case_id = $1 AND revision = $2 LIMIT 1`,
        [row.case_id, caseRevision]
      );
      if (!boundRevision.rows[0]) throw scopeError("CASE_REVISION_UNAVAILABLE", 404);
      const normalizedKind = String(kind).toUpperCase();
      const requestDigest = digest({ userId, contributionId, claimId, caseRevision, kind: normalizedKind, value });
      // Serialize the bounded current reaction as well as the request key.
      // This prevents two different retries from racing into the partial
      // claim/revision uniqueness constraint.
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`reaction-state:${userId}:${claimId || contributionId}:${caseRevision}:${normalizedKind}`]);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`reaction:${userId}:${idempotencyKey}`]);
      if (expectedRevision !== null && Number(expectedRevision) !== Number(row.revision)) throw new CommunityRepositoryError("STALE_REVISION", "The contribution changed; reload before reacting.", 409);
      const existingEvent = await client.query(`SELECT event_id, request_digest FROM private.community_reaction_events WHERE user_id = $1 AND idempotency_key = $2`, [userId, idempotencyKey]);
      if (existingEvent.rows[0]) {
        if (!Buffer.from(existingEvent.rows[0].request_digest).equals(requestDigest)) throw scopeError('IDEMPOTENCY_CONFLICT');
        return { reactionId: existingEvent.rows[0].event_id, idempotent: true, kind, value: Number(value) };
      }
      const reactionHistory = await client.query(
        `SELECT user_id AS actor_id, contribution_id, kind, value,
                idempotency_key, created_at
           FROM private.community_reaction_events
          WHERE contribution_id = $1
          ORDER BY created_at DESC
          LIMIT 200`,
        [contributionId]
      );
      const integrity = analyzeReactionIntegrity({
        reactions: [
          ...reactionHistory.rows,
          {
            actorId: userId,
            contributionId,
            kind: normalizedKind,
            value: Number(value),
            idempotencyKey,
            targetAuthorId: row.author_id,
            createdAt: new Date().toISOString(),
          },
        ],
        contributions: [{ id: contributionId, publicationState: row.publication_state }],
      });
      const event = await client.query(
        `INSERT INTO private.community_reaction_events
          (user_id, contribution_id, claim_id, case_revision, kind, value, idempotency_key, request_digest)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING event_id`,
        [userId, contributionId, claimId || row.claim_id || null, caseRevision ?? row.case_revision, normalizedKind, Number(value), idempotencyKey, requestDigest]
      );
      const currentReaction = claimId
        ? await client.query(
          `SELECT id FROM public.community_reactions
            WHERE user_id = $1 AND claim_id = $2 AND case_revision = $3 AND kind = $4
            FOR UPDATE`,
          [userId, claimId, caseRevision, normalizedKind]
        )
        : await client.query(
          `SELECT id FROM public.community_reactions
            WHERE user_id = $1 AND contribution_id = $2 AND kind = $3
            FOR UPDATE`,
          [userId, contributionId, normalizedKind]
        );
      const reaction = currentReaction.rows[0]
        ? await client.query(
          `UPDATE public.community_reactions
              SET contribution_id = $2, claim_id = $3, case_revision = $4,
                  value = $5, idempotency_key = $6, updated_at = now()
            WHERE id = $1
            RETURNING id, kind, value, updated_at`,
          [currentReaction.rows[0].id, contributionId, claimId || row.claim_id || null, caseRevision ?? row.case_revision, Number(value), idempotencyKey]
        )
        : await client.query(
          `INSERT INTO public.community_reactions (user_id, contribution_id, claim_id, case_revision, kind, value, idempotency_key, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
           ON CONFLICT (user_id, contribution_id, kind) DO UPDATE SET value = EXCLUDED.value, claim_id = EXCLUDED.claim_id, case_revision = EXCLUDED.case_revision, idempotency_key = EXCLUDED.idempotency_key, updated_at = now()
           RETURNING id, kind, value, updated_at`,
          [userId, contributionId, claimId || row.claim_id || null, caseRevision ?? row.case_revision, normalizedKind, Number(value), idempotencyKey]
        );
      await appendOutbox(client, {
        eventType: "COMMUNITY_REACTION_RECORDED",
        aggregateId: contributionId,
        subject: userId,
        payload: {
          contributionId,
          caseId: row.case_id,
          caseRevision,
          claimId: claimId || row.claim_id || null,
          kind: normalizedKind,
          value: Number(value),
          eventId: event.rows[0].event_id,
          integrityStatus: integrity.status,
          integritySignals: integrity.signals,
          automaticAction: integrity.automaticAction,
          trustMutation: false,
        },
      });
      await appendQualityEvent(client, {
        subjectId: row.author_id,
        actorId: userId,
        contributionId,
        caseId: row.case_id,
        caseRevision: Number(row.case_revision),
        eventType: "REACTION_RECORDED",
        pointDelta: 0,
        reason: `A community ${normalizedKind} reaction was recorded; reactions remain non-authoritative signals.`,
        idempotencyKey: `reaction:${event.rows[0].event_id}`,
      });
      return { ...reaction.rows[0], eventId: event.rows[0].event_id, integrity, idempotent: false };
    });
  }

  static async createAppeal({ requesterId, caseId, caseRevision, claimId = null, assessmentId = null, reason, supersedesAppealId = null, idempotencyKey }) {
    if (!requesterId || !caseId || !Number.isInteger(Number(caseRevision)) || Number(caseRevision) < 1 || !reason || String(reason).trim().length < 20) throw new CommunityRepositoryError("APPEAL_INPUT_INVALID", "An appeal needs a case revision and a reason of at least 20 characters.", 400);
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new CommunityRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
    if (!isCanonicalUuid(caseId) || (claimId && !isCanonicalUuid(claimId)) || (assessmentId && !isCanonicalUuid(assessmentId)) || (supersedesAppealId && !isCanonicalUuid(supersedesAppealId))) throw new CommunityRepositoryError("APPEAL_SCOPE_INVALID", "Appeal identifiers must be canonical UUIDs.", 400);
    caseId = String(caseId).toLowerCase();
    claimId = claimId ? String(claimId).toLowerCase() : null;
    assessmentId = assessmentId ? String(assessmentId).toLowerCase() : null;
    supersedesAppealId = supersedesAppealId ? String(supersedesAppealId).toLowerCase() : null;
    const requestDigest = digest({ requesterId, caseId, caseRevision: Number(caseRevision), claimId, assessmentId, reason: String(reason).trim(), supersedesAppealId });
    return transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`appeal:${requesterId}:${idempotencyKey}`]);
      const existing = await client.query(`SELECT id, case_id, case_revision, claim_id, assessment_id, requester_id, reason, status, request_digest, created_at FROM public.case_appeals WHERE requester_id = $1 AND idempotency_key = $2 LIMIT 1`, [requesterId, idempotencyKey]);
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest && !Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        return { ...existing.rows[0], idempotent: true };
      }
      if (assessmentId) {
        const assessment = await client.query(`SELECT id, expert_id, assignment_id, assessment_state FROM public.expert_assessments WHERE id = $1 AND case_id=$2 AND case_revision=$3 AND claim_id IS NOT DISTINCT FROM $4::uuid`, [assessmentId, caseId, caseRevision, claimId]);
        if (!assessment.rows[0]) throw scopeError('ASSESSMENT_NOT_AVAILABLE', 404);
        const reviewerRows = await client.query(`SELECT reviewer_id FROM private.expert_review_decisions WHERE assessment_id = $1 ORDER BY created_at ASC`, [assessmentId]);
        const reviewState = resolveAssessmentDisagreement([assessment.rows[0]], reviewerRows.rows);
        const reviewerIds = reviewerRows.rows.map((row) => row.reviewer_id);
        const appealCheck = canAppeal({ requesterId, assessmentExpertId: assessment.rows[0].expert_id, assignmentReviewerId: reviewerIds[0], currentReviewState: reviewerRows.rows.length ? reviewState.state : "UNASSIGNED" });
        if (!appealCheck.ok || reviewerIds.some((reviewerId) => String(reviewerId) === String(requesterId))) {
          throw new CommunityRepositoryError(appealCheck.code || "SELF_APPEAL_FORBIDDEN", "The appealed assessor or reviewer cannot close their own appeal.", appealCheck.code === "SELF_APPEAL_FORBIDDEN" ? 403 : 409);
        }
      }
      await assertCaseScope(client, { actorId: requesterId, caseId, caseRevision, claimId });
      if (supersedesAppealId) {
        const prior = await client.query(`SELECT id, case_id, case_revision, requester_id FROM public.case_appeals WHERE id = $1 FOR SHARE`, [supersedesAppealId]);
        if (!prior.rows[0] || prior.rows[0].case_id !== caseId || Number(prior.rows[0].case_revision) !== Number(caseRevision) || prior.rows[0].requester_id !== requesterId) throw new CommunityRepositoryError("APPEAL_CHAIN_INVALID", "A superseding appeal must belong to the same requester and case revision.", 409);
      }
      const inserted = await client.query(
        `INSERT INTO public.case_appeals (case_id, case_revision, claim_id, assessment_id, requester_id, reason, idempotency_key, request_digest, status, supersedes_appeal_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9, now(), now())
         RETURNING id, case_id, case_revision, claim_id, assessment_id, requester_id, reason, status, created_at`,
        [caseId, caseRevision, claimId, assessmentId, requesterId, String(reason).trim(), idempotencyKey, requestDigest, supersedesAppealId]
      );
      await appendOutbox(client, {
        eventType: "COMMUNITY_APPEAL_CREATED",
        aggregateId: inserted.rows[0].id,
        aggregateType: "CASE_APPEAL",
        subject: requesterId,
        payload: {
          appealId: inserted.rows[0].id,
          caseId,
          caseRevision: Number(caseRevision),
          claimId,
          assessmentId,
          status: "OPEN",
        },
      });
      return { ...inserted.rows[0], idempotent: false };
    });
  }

  static async reviewAppeal({ reviewerId, appealId, decision, reason, idempotencyKey, correlationId = "appeal-review" }) {
    const normalizedDecision = String(decision || "").trim().toUpperCase();
    if (!reviewerId || !isCanonicalUuid(appealId) || !["UPHOLD", "OVERTURN", "REQUEST_EVIDENCE"].includes(normalizedDecision) || String(reason || "").trim().length < 20 || !idempotencyKey || String(idempotencyKey).length > 180) {
      throw new CommunityRepositoryError("APPEAL_REVIEW_INPUT_INVALID", "An appeal review needs a valid decision, substantive reason, and Idempotency-Key.", 400);
    }
    const reviewScan = detectPII(reason);
    if (reviewScan.blocked) throw new CommunityRepositoryError("PRIVACY_SCAN_BLOCKED", "The appeal review contains identifying content and cannot be stored.", 422);
    const normalizedReason = redactText(String(reason).trim());
    return transaction(async (client) => {
      const role = await client.query(
        `SELECT 1 FROM private.user_roles ur JOIN private.roles r ON r.id = ur.role_id
          WHERE ur.user_id = $1 AND ur.revoked_at IS NULL AND r.code = 'ADMIN'`,
        [reviewerId]
      );
      if (!role.rows[0]) throw new CommunityRepositoryError("APPEALS_REVIEWER_REQUIRED", "An authorized independent appeal reviewer is required.", 403);
      const appealResult = await client.query(
        `SELECT ca.id, ca.case_id, ca.case_revision, ca.claim_id, ca.assessment_id,
                ca.requester_id, ca.reason AS appeal_reason, ca.status,
                ea.expert_id
           FROM public.case_appeals ca
           LEFT JOIN public.expert_assessments ea ON ea.id = ca.assessment_id
          WHERE ca.id = $1
          FOR UPDATE OF ca`,
        [appealId]
      );
      const appeal = appealResult.rows[0];
      if (!appeal) throw new CommunityRepositoryError("APPEAL_NOT_FOUND", "The appeal is not available.", 404);
      if (String(appeal.requester_id).toLowerCase() === String(reviewerId).toLowerCase() || (appeal.expert_id && String(appeal.expert_id).toLowerCase() === String(reviewerId).toLowerCase())) throw new CommunityRepositoryError("SELF_APPEAL_REVIEW_FORBIDDEN", "The requester or challenged expert cannot review this appeal.", 403);
      const requestDigest = digest({ reviewerId, appealId, decision: normalizedDecision, reason: normalizedReason });
      const existing = await client.query(`SELECT id, appeal_id, reviewer_id, decision, reason, request_digest, created_at FROM private.case_appeal_reviews WHERE reviewer_id = $1 AND idempotency_key = $2 LIMIT 1`, [reviewerId, idempotencyKey]);
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        return { appeal, review: existing.rows[0], idempotent: true };
      }
      if (!["OPEN", "IN_REVIEW"].includes(String(appeal.status).toUpperCase())) throw new CommunityRepositoryError("APPEAL_NOT_REVIEWABLE", "This appeal is already closed or superseded.", 409);
      await assertCaseScope(client, { actorId: reviewerId, caseId: appeal.case_id, caseRevision: Number(appeal.case_revision), claimId: appeal.claim_id, publicOnly: true });
      const priorReviewers = await client.query(`SELECT reviewer_id FROM private.case_appeal_reviews WHERE appeal_id = $1 ORDER BY created_at ASC`, [appealId]);
      if (priorReviewers.rows.some((row) => String(row.reviewer_id).toLowerCase() === String(reviewerId).toLowerCase())) throw new CommunityRepositoryError("APPEAL_REVIEW_ALREADY_RECORDED", "This reviewer has already reviewed the appeal.", 409);
      const review = await client.query(
        `INSERT INTO private.case_appeal_reviews
          (appeal_id, case_id, case_revision, reviewer_id, decision, reason,
           idempotency_key, request_digest, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
         RETURNING id, appeal_id, case_id, case_revision, reviewer_id, decision, reason, created_at`,
        [appealId, appeal.case_id, appeal.case_revision, reviewerId, normalizedDecision, normalizedReason, idempotencyKey, requestDigest]
      );
      const nextStatus = normalizedDecision === "REQUEST_EVIDENCE" ? "IN_REVIEW" : normalizedDecision === "OVERTURN" ? "RESOLVED" : "REJECTED";
      const updated = await client.query(
        `UPDATE public.case_appeals
            SET status = $2,
                resolved_by = CASE WHEN $2 IN ('RESOLVED','REJECTED') THEN $3 ELSE resolved_by END,
                resolution = CASE WHEN $2 IN ('RESOLVED','REJECTED') THEN $4 ELSE resolution END,
                resolution_reason = CASE WHEN $2 IN ('RESOLVED','REJECTED') THEN $5 ELSE resolution_reason END,
                resolved_at = CASE WHEN $2 IN ('RESOLVED','REJECTED') THEN now() ELSE resolved_at END,
                updated_at = now()
          WHERE id = $1
          RETURNING id, case_id, case_revision, claim_id, assessment_id, requester_id, reason, status, resolution, resolution_reason, resolved_by, resolved_at, created_at, updated_at`,
        [appealId, nextStatus, reviewerId, normalizedDecision, normalizedReason]
      );
      const qualityCorrection = await appendAppealQualityCorrection(client, {
        appeal,
        reviewerId,
        review: review.rows[0],
      });
      await appendOutbox(client, {
        eventType: "COMMUNITY_APPEAL_REVIEWED",
        aggregateId: appealId,
        aggregateType: "CASE_APPEAL",
        subject: appeal.requester_id,
        correlationId,
        payload: {
          appealId,
          reviewId: review.rows[0].id,
          reviewerId,
          caseId: appeal.case_id,
          caseRevision: Number(appeal.case_revision),
          claimId: appeal.claim_id,
          decision: normalizedDecision,
          status: nextStatus,
          qualityCorrection,
          trustMutation: false,
        },
      });
      return { appeal: updated.rows[0], review: review.rows[0], idempotent: false };
    });
  }

  static async createCorrection({ createdBy, caseId, caseRevision, claimId = null, correctionType, statement, evidenceRevisionIds = [], idempotencyKey }) {
    const allowed = ["EVIDENCE_UPDATE", "SOURCE_RETRACTION", "CLAIM_SPLIT", "CLAIM_MERGE", "CONTEXT_UPDATE"];
    if (!createdBy || !caseId || !Number.isInteger(Number(caseRevision)) || !allowed.includes(String(correctionType).toUpperCase()) || String(statement || "").trim().length < 20) {
      throw new CommunityRepositoryError("CORRECTION_INPUT_INVALID", "A correction must bind a case revision, type, and substantive statement.", 400);
    }
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new CommunityRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
    if (!isCanonicalUuid(caseId) || (claimId && !isCanonicalUuid(claimId))) throw new CommunityRepositoryError("CORRECTION_SCOPE_INVALID", "Correction identifiers must be canonical UUIDs.", 400);
    caseId = String(caseId).toLowerCase();
    claimId = claimId ? String(claimId).toLowerCase() : null;
    evidenceRevisionIds = Array.isArray(evidenceRevisionIds) ? [...new Set(evidenceRevisionIds.map((id) => String(id).toLowerCase()))].slice(0, 100) : [];
    const scan = detectPII(statement);
    if (scan.blocked) throw new CommunityRepositoryError("PRIVACY_SCAN_BLOCKED", "The correction contains identifying content and cannot be published.", 422);
    const requestDigest = digest({ createdBy, caseId, caseRevision: Number(caseRevision), claimId, correctionType: String(correctionType).toUpperCase(), statement: redactText(String(statement).trim()), evidenceRevisionIds });
    return transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`correction:${createdBy}:${idempotencyKey}`]);
      const existing = await client.query(`SELECT id, case_id, case_revision, claim_id, correction_type, statement, evidence_revision_ids, created_by, request_digest, created_at FROM public.case_corrections WHERE created_by = $1 AND idempotency_key = $2 LIMIT 1`, [createdBy, idempotencyKey]);
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest && !Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        return { ...existing.rows[0], idempotent: true };
      }
      await assertCaseScope(client, { actorId: createdBy, caseId, caseRevision, claimId, evidenceRevisionIds, publicOnly: true });
      const res = await client.query(
        `INSERT INTO public.case_corrections
          (case_id, case_revision, claim_id, correction_type, statement, evidence_revision_ids, created_by, idempotency_key, request_digest, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, now())
         RETURNING id, case_id, case_revision, claim_id, correction_type, statement, evidence_revision_ids, created_by, created_at`,
        [caseId, caseRevision, claimId, String(correctionType).toUpperCase(), redactText(String(statement).trim()), JSON.stringify(evidenceRevisionIds), createdBy, idempotencyKey, requestDigest]
      );
      await appendOutbox(client, {
        eventType: "COMMUNITY_CORRECTION_CREATED",
        aggregateId: res.rows[0].id,
        aggregateType: "COMMUNITY_CORRECTION",
        subject: createdBy,
        payload: {
          correctionId: res.rows[0].id,
          caseId,
          caseRevision: Number(caseRevision),
          claimId,
          correctionType: String(correctionType).toUpperCase(),
          evidenceRevisionIds,
          trustMutation: false,
        },
      });
      await appendQualityEvent(client, {
        subjectId: createdBy,
        actorId: createdBy,
        caseId,
        caseRevision: Number(caseRevision),
        eventType: "CORRECTION_RECORDED",
        pointDelta: 0,
        reason: "A durable community correction was recorded for later quality evaluation; it does not mutate Trust.",
        idempotencyKey: `correction:${res.rows[0].id}:quality`,
      });
      return { ...res.rows[0], idempotent: false };
    });
  }
}
