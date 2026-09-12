/**
 * StudentHub AI — Community Max durable boundary.
 *
 * This repository is intentionally separate from Auth, Trust V5, Expert
 * authority, and the existing Community Promax repository. It only stores
 * additive Community projections and queues. All identifiers, revisions,
 * privacy decisions, and idempotency checks are server-owned.
 */

import { createHash } from "node:crypto";
import { getPostgresPool } from "./PostgresPool.js";
import { CommunityRepository } from "./CommunityRepository.js";
import { isCanonicalUuid } from "./CommunityExpertScope.js";
import {
  buildCorrectionQualitySignal,
  buildDataCandidate,
  buildGroundedDiscussionSummary,
  buildRiskSignalFingerprintInput,
  buildSourceIndependenceProjection,
  deriveCampusProjection,
  deriveVerificationFreshness,
  detectHighValueDisagreement,
  isSafePublicUrl,
  normalizeSourceForCommunity,
  validateClaimDiscussionInput,
  validateComposerInput,
} from "../../communityMax/communityMaxDomain.js";
import { detectPII, redactText } from "../../communityExpert/promaxDomain.js";

export class CommunityMaxRepositoryError extends Error {
  constructor(code, message, statusCode = 400, details = {}) {
    super(message);
    this.name = "CommunityMaxRepositoryError";
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = message;
    this.details = details;
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest();
}

function digestHex(value) {
  return digest(value).toString("hex");
}

function sameDigest(value, expected) {
  if (!value || !expected) return false;
  const actual = Buffer.isBuffer(value)
    ? value
    : typeof value === "string" && value.startsWith("\\x")
      ? Buffer.from(value.slice(2), "hex")
      : Buffer.from(value);
  return actual.equals(expected);
}

function normalizedActor(actorId) {
  if (!isCanonicalUuid(actorId)) throw new CommunityMaxRepositoryError("AUTHENTICATION_REQUIRED", "An authenticated Community identity is required.", 401);
  return String(actorId).toLowerCase();
}

function normalizedIdempotency(value) {
  const key = String(value || "").trim();
  if (!key || key.length > 180) throw new CommunityMaxRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
  return key;
}

function revision(value) {
  const candidate = Number(value);
  if (!Number.isInteger(candidate) || candidate < 1) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_REVISION_REQUIRED", "An immutable Community revision is required.", 400);
  return candidate;
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function jsonIds(value, max = 100) {
  return [...new Set(asArray(value).map((item) => String(item || "").trim().toLowerCase()).filter(isCanonicalUuid))].slice(0, max);
}

function sourceDTO(row) {
  return {
    id: row.id,
    contributionId: row.contribution_id,
    contributionRevision: Number(row.contribution_revision),
    sourceClusterId: row.source_cluster_id || null,
    sourceUrl: row.source_url,
    canonicalUrl: row.canonical_url,
    publisher: row.publisher || null,
    independenceKey: row.independence_key,
    sourceState: row.source_state,
    clusterSourceCount: row.cluster_source_count === null || row.cluster_source_count === undefined ? null : Number(row.cluster_source_count),
    publishedAt: toIso(row.published_at),
    firstSeenAt: toIso(row.first_seen_at),
    lastCheckedAt: toIso(row.last_checked_at),
    createdAt: toIso(row.created_at),
    authority: "UNVERIFIED_COMMUNITY_SOURCE",
    isTruthVerdict: false,
  };
}

function discussionDTO(row) {
  return {
    id: row.id,
    contributionId: row.contribution_id,
    claimId: row.claim_id || null,
    contributionRevision: Number(row.contribution_revision),
    action: row.action,
    body: row.body,
    evidenceReferenceIds: jsonIds(row.evidence_reference_ids),
    status: row.status,
    createdAt: toIso(row.created_at),
    authorLabel: "COMMUNITY_MEMBER",
    isAuthoritative: false,
  };
}

function verificationDTO(row) {
  if (!row) return null;
  return {
    id: row.id,
    contributionId: row.contribution_id,
    contributionRevision: Number(row.contribution_revision),
    claimId: row.claim_id || null,
    trustCaseId: row.trust_case_id,
    trustCaseRevision: Number(row.trust_case_revision),
    sourceReferenceIds: jsonIds(row.source_reference_ids),
    verificationState: row.verification_state,
    freshnessState: row.freshness_state,
    freshnessReason: row.freshness_reason || null,
    lastCheckedAt: toIso(row.last_checked_at),
    verifiedAt: toIso(row.verified_at),
    authorityOwner: "TRUST_V5",
    isAuthoritative: false,
    trustMutation: false,
  };
}

function summaryDTO(row) {
  if (!row) return null;
  return {
    id: row.id,
    contributionId: row.contribution_id,
    contributionRevision: Number(row.contribution_revision),
    label: "AI DISCUSSION SUMMARY",
    summaryText: row.summary_text,
    discussionIds: jsonIds(row.discussion_ids),
    sourceReferenceIds: jsonIds(row.source_reference_ids),
    policyVersion: row.policy_version,
    providerStatus: row.provider_status,
    finalVerdict: false,
    isAuthoritative: false,
    authorityOwner: "TRUST_V5",
    createdAt: toIso(row.created_at),
  };
}

function campusDTO(row, { includeFields = true } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    contributionId: row.contribution_id,
    contributionRevision: Number(row.contribution_revision),
    ...(includeFields ? {
      institutionId: row.institution_id || null,
      universityLabel: row.university_label || null,
      faculty: row.faculty || null,
      major: row.major || null,
      topic: row.topic || null,
    } : {}),
    visibility: row.visibility,
    consentState: row.consent_state,
    consentedAt: toIso(row.consented_at),
    inferred: false,
    authority: "COMMUNITY_CONTEXT_ONLY",
    isTruthVerdict: false,
  };
}

function passportDTO(row, events) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    currentStatus: row.current_status,
    revision: Number(row.revision),
    demo: row.demo === true,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    events: events.map((event) => ({
      id: event.id,
      revision: Number(event.revision),
      eventType: event.event_type,
      provenanceClass: event.provenance_class,
      summary: event.summary,
      previousStatus: event.previous_status,
      newStatus: event.new_status,
      material: event.material === true,
      changeReason: event.change_reason || null,
      sourceReferences: asArray(event.source_references),
      occurredAt: toIso(event.occurred_at),
    })),
    authorityOwner: "TRUST_V5",
    readOnly: true,
    isAuthoritative: true,
    communityMutation: false,
  };
}

async function transaction(pool, operation) {
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

async function assertContributionScope(queryable, { actorId = null, contributionId, contributionRevision, claimId = null, publicRead = false } = {}) {
  if (!isCanonicalUuid(contributionId)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CONTRIBUTION_ID_INVALID", "A canonical Community contribution ID is required.", 400);
  const safeRevision = revision(contributionRevision);
  const result = await queryable.query(
    `SELECT c.id, c.author_id, c.case_id, c.case_revision, c.claim_id, c.revision,
            c.publication_state, tc.visibility
       FROM public.community_contributions c
       JOIN public.trust_cases tc ON tc.id = c.case_id
      WHERE c.id = $1
      LIMIT 1`,
    [String(contributionId).toLowerCase()]
  );
  const row = result.rows[0];
  const actor = actorId ? String(actorId).toLowerCase() : null;
  const owner = Boolean(actor && actor === String(row?.author_id || "").toLowerCase());
  const publicVisible = row?.visibility === "PUBLIC" && ["PUBLISHED", "EDITED", "MODERATED"].includes(String(row?.publication_state || "").toUpperCase());
  if (!row || (!publicVisible && !owner)) {
    throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CONTRIBUTION_NOT_AVAILABLE", "The Community contribution is not available in this scope.", 404);
  }
  if (publicRead && !publicVisible && !owner) {
    throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CONTRIBUTION_NOT_AVAILABLE", "The Community contribution is not available in this scope.", 404);
  }
  if (claimId && (!isCanonicalUuid(claimId) || String(row.claim_id || "").toLowerCase() !== String(claimId).toLowerCase())) {
    throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CLAIM_SCOPE_MISMATCH", "The claim is not bound to this Community contribution.", 409);
  }
  const revisionResult = await queryable.query(
    `SELECT id, revision FROM public.community_contribution_revisions
      WHERE contribution_id = $1 AND revision = $2
      LIMIT 1`,
    [row.id, safeRevision]
  );
  if (!revisionResult.rows[0]) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_REVISION_NOT_FOUND", "The immutable Community revision is not available.", 404);
  return { ...row, contributionRevision: safeRevision, owner, publicVisible };
}

async function upsertSourceCluster(client, source) {
  const digestValue = source.contentDigest && /^[0-9a-f]{64}$/i.test(source.contentDigest) ? source.contentDigest : null;
  if (digestValue) {
    const exact = await client.query(
      `SELECT id FROM public.community_source_clusters
        WHERE content_digest = decode($1, 'hex') AND independence_key = $2
        LIMIT 1`,
      [digestValue, source.independenceKey]
    );
    if (exact.rows[0]) {
      await client.query(`UPDATE public.community_source_clusters SET source_count = source_count + 1, updated_at = now() WHERE id = $1`, [exact.rows[0].id]);
      return exact.rows[0].id;
    }
  }
  const inserted = await client.query(
    `INSERT INTO public.community_source_clusters
      (canonical_locator, publisher, independence_key, content_digest, source_count, updated_at)
     VALUES ($1, $2, $3,
             CASE WHEN $4 ~ '^[0-9a-fA-F]{64}$' THEN decode($4, 'hex') ELSE NULL END,
             1, now())
     ON CONFLICT (canonical_locator, independence_key)
       DO UPDATE SET source_count = public.community_source_clusters.source_count + 1,
                     updated_at = now()
     RETURNING id`,
    [source.canonicalUrl, source.publisher || null, source.independenceKey, digestValue || ""]
  );
  return inserted.rows[0]?.id || null;
}

export class CommunityMaxRepository {
  constructor(pool = null) {
    this.pool = pool;
  }

  db() {
    return this.pool || getPostgresPool();
  }

  async createClaimDiscussion({ authorId, contributionId, contributionRevision, claimId, action, body, evidenceReferenceIds = [], idempotencyKey }) {
    const actor = normalizedActor(authorId);
    const validation = validateClaimDiscussionInput({ contributionId, contributionRevision, claimId, action, body, evidenceReferenceIds });
    if (!validation.ok) throw new CommunityMaxRepositoryError(validation.errors[0]?.code || "COMMUNITY_MAX_DISCUSSION_INVALID", "The claim discussion could not pass the safety and scope checks.", 400);
    if (!isCanonicalUuid(claimId)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CLAIM_REQUIRED", "A canonical claim is required for claim-level discussion.", 400);
    const key = normalizedIdempotency(idempotencyKey);
    const normalized = validation.normalized;
    const requestDigest = digest({ actor, ...normalized });
    return transaction(this.db(), async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`community-max:discussion:${actor}:${key}`]);
      const existing = await client.query(
        `SELECT * FROM public.community_claim_discussions WHERE author_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [actor, key]
      );
      if (existing.rows[0]) {
        if (!sameDigest(existing.rows[0].request_digest, requestDigest)) throw new CommunityMaxRepositoryError("IDEMPOTENCY_CONFLICT", "This request key was already used with different content.", 409);
        return { discussion: discussionDTO(existing.rows[0]), idempotent: true, isAuthoritative: false };
      }
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision, claimId });
      const inserted = await client.query(
        `INSERT INTO public.community_claim_discussions
          (contribution_id, claim_id, contribution_revision, author_id, action, body,
           evidence_reference_ids, privacy_findings, status, idempotency_key, request_digest)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, 'PUBLISHED', $9, $10)
         RETURNING *`,
        [scope.id, scope.claim_id, normalized.contributionRevision, actor, normalized.action, normalized.body, JSON.stringify(normalized.evidenceReferenceIds), JSON.stringify(validation.privacy.findings || []), key, requestDigest]
      );
      return { discussion: discussionDTO(inserted.rows[0]), idempotent: false, isAuthoritative: false, trustMutation: false };
    });
  }

  async listClaimDiscussions({ actorId = null, contributionId, contributionRevision, claimId = null } = {}) {
    const actor = actorId && isCanonicalUuid(actorId) ? String(actorId).toLowerCase() : null;
    const pool = this.db();
    await assertContributionScope(pool, { actorId: actor, contributionId, contributionRevision, claimId, publicRead: true });
    const params = [String(contributionId).toLowerCase(), Number(contributionRevision)];
    let claimFilter = "";
    if (claimId) {
      params.push(String(claimId).toLowerCase());
      claimFilter = `AND d.claim_id = $${params.length}`;
    }
    params.push(actor);
    const result = await pool.query(
      `SELECT d.id, d.contribution_id, d.claim_id, d.contribution_revision,
              d.action, d.body, d.evidence_reference_ids, d.status, d.created_at
         FROM public.community_claim_discussions d
         JOIN public.community_contributions c ON c.id = d.contribution_id
         JOIN public.trust_cases tc ON tc.id = c.case_id
        WHERE d.contribution_id = $1
          AND d.contribution_revision = $2
          ${claimFilter}
          AND d.status = 'PUBLISHED'
          AND (tc.visibility = 'PUBLIC' OR c.author_id = $${params.length})
        ORDER BY d.created_at ASC
        LIMIT 500`,
      params
    );
    return result.rows.map(discussionDTO);
  }

  async attachSourceReferences({ createdBy, contributionId, contributionRevision, sources = [], idempotencyKey }) {
    const actor = normalizedActor(createdBy);
    const key = normalizedIdempotency(idempotencyKey);
    if (!Array.isArray(sources) || sources.length < 1 || sources.length > 20) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_LIMIT", "Attach between one and twenty safe public sources.", 400);
    const normalizedSources = [];
    for (const source of sources) {
      if (source?.originalSource || source?.originalUrl || source?.originUrl) {
        const original = source.originalSource || source.originalUrl || source.originUrl;
        if (!isSafePublicUrl(original)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_URL_REJECTED", "Only safe public HTTP(S) source references may be submitted.", 422);
      }
      const normalized = normalizeSourceForCommunity(source);
      if (!normalized.ok) throw new CommunityMaxRepositoryError(normalized.code, "Only safe public HTTP(S) source references may be submitted.", 422);
      normalizedSources.push({ ...normalized.source, sourceState: "UNKNOWN" });
    }
    const requestDigest = digest({ actor, contributionId, contributionRevision: Number(contributionRevision), sources: normalizedSources });
    return transaction(this.db(), async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`community-max:sources:${actor}:${key}`]);
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision });
      const output = [];
      for (const [index, source] of normalizedSources.entries()) {
        const sourceKey = `${key}:${index + 1}`.slice(0, 180);
        const existingByKey = await client.query(
          `SELECT sr.*, sc.source_count AS cluster_source_count
             FROM public.community_source_references sr
             LEFT JOIN public.community_source_clusters sc ON sc.id = sr.source_cluster_id
            WHERE sr.created_by = $1 AND sr.idempotency_key = $2
            LIMIT 1`,
          [actor, sourceKey]
        );
        if (existingByKey.rows[0]) {
          if (existingByKey.rows[0].request_digest && !sameDigest(existingByKey.rows[0].request_digest, requestDigest)) throw new CommunityMaxRepositoryError("IDEMPOTENCY_CONFLICT", "This source request key was already used with different content.", 409);
          output.push(sourceDTO(existingByKey.rows[0]));
          continue;
        }
        const existingCanonical = await client.query(
          `SELECT sr.*, sc.source_count AS cluster_source_count
             FROM public.community_source_references sr
             LEFT JOIN public.community_source_clusters sc ON sc.id = sr.source_cluster_id
            WHERE sr.contribution_id = $1 AND sr.contribution_revision = $2 AND sr.canonical_url = $3
            LIMIT 1`,
          [scope.id, Number(contributionRevision), source.canonicalUrl]
        );
        if (existingCanonical.rows[0]) {
          output.push(sourceDTO(existingCanonical.rows[0]));
          continue;
        }
        const clusterId = await upsertSourceCluster(client, source);
        const inserted = await client.query(
          `INSERT INTO public.community_source_references
            (contribution_id, contribution_revision, source_cluster_id, created_by,
             source_url, canonical_url, publisher, independence_key, content_digest,
             source_state, idempotency_key, request_digest)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                   CASE WHEN $9 ~ '^[0-9a-fA-F]{64}$' THEN decode($9, 'hex') ELSE NULL END,
                   'UNKNOWN', $10, $11)
           ON CONFLICT (contribution_id, contribution_revision, canonical_url) DO NOTHING
           RETURNING *`,
          [scope.id, Number(contributionRevision), clusterId, actor, source.url, source.canonicalUrl, source.publisher, source.independenceKey, source.contentDigest || "", sourceKey, requestDigest]
        );
        if (inserted.rows[0]) {
          output.push(sourceDTO({ ...inserted.rows[0], cluster_source_count: null }));
          continue;
        }
        const sameSource = await client.query(
          `SELECT sr.*, sc.source_count AS cluster_source_count
             FROM public.community_source_references sr
             LEFT JOIN public.community_source_clusters sc ON sc.id = sr.source_cluster_id
            WHERE sr.contribution_id = $1 AND sr.contribution_revision = $2 AND sr.canonical_url = $3
            LIMIT 1`,
          [scope.id, Number(contributionRevision), source.canonicalUrl]
        );
        if (!sameSource.rows[0]) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_STORE_FAILED", "The source reference could not be stored securely.", 503);
        await client.query(
          `UPDATE public.community_source_clusters
              SET source_count = greatest(1, source_count - 1), updated_at = now()
            WHERE id = $1`,
          [clusterId]
        );
        output.push(sourceDTO(sameSource.rows[0]));
      }
      const independence = buildSourceIndependenceProjection(output);
      return { sources: output, independence, contributionId: scope.id, contributionRevision: Number(contributionRevision), isAuthoritative: false };
    });
  }

  async listSourceReferences({ actorId = null, contributionId, contributionRevision } = {}) {
    const actor = actorId && isCanonicalUuid(actorId) ? String(actorId).toLowerCase() : null;
    const pool = this.db();
    await assertContributionScope(pool, { actorId: actor, contributionId, contributionRevision, publicRead: true });
    const result = await pool.query(
      `SELECT sr.*, sc.source_count AS cluster_source_count
         FROM public.community_source_references sr
         JOIN public.community_contributions c ON c.id = sr.contribution_id
         JOIN public.trust_cases tc ON tc.id = c.case_id
         LEFT JOIN public.community_source_clusters sc ON sc.id = sr.source_cluster_id
        WHERE sr.contribution_id = $1 AND sr.contribution_revision = $2
          AND (tc.visibility = 'PUBLIC' OR c.author_id = $3)
        ORDER BY sr.created_at ASC`,
      [String(contributionId).toLowerCase(), Number(contributionRevision), actor]
    );
    const sources = result.rows.map(sourceDTO);
    const history = sources.length
      ? (await pool.query(
        `SELECT e.id, e.source_reference_id, e.previous_state, e.next_state, e.reason, e.actor_type, e.created_at
           FROM public.community_source_change_events e
          WHERE e.source_reference_id = ANY($1::uuid[])
          ORDER BY e.created_at ASC`,
        [sources.map((source) => source.id)]
      )).rows.map((row) => ({ id: row.id, sourceReferenceId: row.source_reference_id, previousState: row.previous_state, nextState: row.next_state, reason: row.reason, actorType: row.actor_type, createdAt: toIso(row.created_at) }))
      : [];
    return { sources, independence: buildSourceIndependenceProjection(sources), history, isAuthoritative: false };
  }

  async updateSourceState({ actorId, sourceReferenceId, sourceState, reason, actorType = "VERIFICATION_WORKER" }) {
    const actor = normalizedActor(actorId);
    if (!isCanonicalUuid(sourceReferenceId)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_ID_INVALID", "A canonical source reference ID is required.", 400);
    const nextState = String(sourceState || "").trim().toUpperCase();
    if (!["AVAILABLE", "UPDATED", "UNAVAILABLE", "RETRACTED", "UNKNOWN"].includes(nextState)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_STATE_INVALID", "The source state is not supported.", 400);
    if (!["MODERATOR", "VERIFICATION_WORKER", "SYSTEM"].includes(String(actorType).toUpperCase())) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_ACTOR_INVALID", "The source-state actor is not supported.", 403);
    const safeReason = redactText(String(reason || "Source state changed.").trim()).slice(0, 1000) || "Source state changed.";
    return transaction(this.db(), async (client) => {
      const selected = await client.query(
        `SELECT sr.*, c.author_id, c.case_id, c.case_revision
           FROM public.community_source_references sr
           JOIN public.community_contributions c ON c.id = sr.contribution_id
          WHERE sr.id = $1
          FOR UPDATE`,
        [String(sourceReferenceId).toLowerCase()]
      );
      const source = selected.rows[0];
      if (!source) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_NOT_FOUND", "The source reference is not available.", 404);
      if (String(source.author_id).toLowerCase() === actor) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_ACTOR_INVALID", "Source status requires an independent moderator or verification worker.", 403);
      const previousState = source.source_state;
      if (previousState === nextState) return { source: sourceDTO(source), changed: false, trustMutation: false };
      const updated = await client.query(
        `UPDATE public.community_source_references
            SET source_state = $1, last_checked_at = now(), updated_at = now()
          WHERE id = $2
          RETURNING *`,
        [nextState, source.id]
      );
      const event = await client.query(
        `INSERT INTO public.community_source_change_events
          (source_reference_id, previous_state, next_state, reason, actor_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [source.id, previousState, nextState, safeReason, String(actorType).toUpperCase()]
      );
      const freshnessState = nextState === "RETRACTED" ? "SOURCE_RETRACTED" : nextState === "UNAVAILABLE" ? "STALE" : "UNKNOWN";
      await client.query(
        `UPDATE public.community_verification_projections
            SET verification_state = 'OUTDATED', freshness_state = $1,
                freshness_reason = $2, updated_at = now()
          WHERE contribution_id = $3 AND contribution_revision = $4`,
        [freshnessState, `SOURCE_STATE_${nextState}`, source.contribution_id, Number(source.contribution_revision)]
      );
      if (["RETRACTED", "UNAVAILABLE"].includes(nextState)) {
        await client.query(
          `INSERT INTO public.notifications
            (owner_id, notification_type, subject_type, subject_id,
             material_change_revision, title, body)
           VALUES ($1, 'COMMUNITY_SOURCE_STATE_CHANGED', 'COMMUNITY_SOURCE', $2, $3,
                   'Community source status changed',
                   'A source attached to your Community revision needs a fresh review.')
           ON CONFLICT DO NOTHING`,
          [source.author_id, String(source.id), Number(source.contribution_revision)]
        );
      }
      return {
        source: sourceDTO({ ...updated.rows[0], cluster_source_count: null }),
        change: { id: event.rows[0].id, previousState, nextState, reason: safeReason, actorType: String(actorType).toUpperCase(), createdAt: toIso(event.rows[0].created_at) },
        changed: true,
        trustMutation: false,
      };
    });
  }

  async requestVerification({ actorId, contributionId, contributionRevision, sourceReferenceIds = [] }) {
    const actor = normalizedActor(actorId);
    const safeRevision = revision(contributionRevision);
    const requestedSourceIds = jsonIds(sourceReferenceIds, 20);
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision: safeRevision });
      if (requestedSourceIds.length) {
        const sourceRows = await client.query(
          `SELECT id FROM public.community_source_references
            WHERE contribution_id = $1 AND contribution_revision = $2 AND id = ANY($3::uuid[])`,
          [scope.id, safeRevision, requestedSourceIds]
        );
        if (sourceRows.rows.length !== requestedSourceIds.length) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SOURCE_SCOPE_MISMATCH", "A source reference is not bound to this contribution revision.", 409);
      }
      const sources = await client.query(
        `SELECT id, source_state, last_checked_at
           FROM public.community_source_references
          WHERE contribution_id = $1 AND contribution_revision = $2
          ORDER BY created_at ASC`,
        [scope.id, safeRevision]
      );
      const sourceIds = requestedSourceIds.length ? requestedSourceIds : sources.rows.map((row) => row.id);
      const checkedAt = sources.rows
        .map((row) => row.last_checked_at)
        .filter(Boolean)
        .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] || null;
      const freshness = deriveVerificationFreshness({
        currentRevision: scope.revision,
        boundRevision: safeRevision,
        sourceStates: sources.rows.map((row) => row.source_state),
        lastCheckedAt: checkedAt,
      });
      const existing = await client.query(
        `SELECT * FROM public.community_verification_projections
          WHERE contribution_id = $1 AND contribution_revision = $2 AND trust_case_id = $3
          LIMIT 1`,
        [scope.id, safeRevision, scope.case_id]
      );
      if (existing.rows[0]) return { verification: verificationDTO(existing.rows[0]), idempotent: true, nextAction: "CANONICAL_TRUST_FLOW_REQUIRED", trustMutation: false };
      const verificationState = freshness.state === "CONTEXT_CHANGED" ? "NEW_VERIFICATION_REQUIRED" : "PENDING";
      const inserted = await client.query(
        `INSERT INTO public.community_verification_projections
          (contribution_id, contribution_revision, claim_id, trust_case_id,
           trust_case_revision, source_reference_ids, verification_state,
           freshness_state, freshness_reason, last_checked_at, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, NULL, NULL)
         RETURNING *`,
        [scope.id, safeRevision, scope.claim_id, scope.case_id, Number(scope.case_revision), JSON.stringify(sourceIds), verificationState, freshness.state, freshness.reason]
      );
      return { verification: verificationDTO(inserted.rows[0]), idempotent: false, nextAction: "CANONICAL_TRUST_FLOW_REQUIRED", trustMutation: false };
    });
  }

  async getVerificationProjection({ actorId = null, contributionId, contributionRevision } = {}) {
    const actor = actorId && isCanonicalUuid(actorId) ? String(actorId).toLowerCase() : null;
    const pool = this.db();
    await assertContributionScope(pool, { actorId: actor, contributionId, contributionRevision, publicRead: true });
    const result = await pool.query(
      `SELECT v.*
         FROM public.community_verification_projections v
         JOIN public.community_contributions c ON c.id = v.contribution_id
         JOIN public.trust_cases tc ON tc.id = c.case_id
        WHERE v.contribution_id = $1 AND v.contribution_revision = $2
          AND (tc.visibility = 'PUBLIC' OR c.author_id = $3)
        ORDER BY v.updated_at DESC LIMIT 1`,
      [String(contributionId).toLowerCase(), Number(contributionRevision), actor]
    );
    return verificationDTO(result.rows[0] || null);
  }

  async createReviewCandidate({ actorId, contributionId, contributionRevision, claimId = null, supportSignals = [], challengeSignals = [], sourceStates = [], evidenceStates = [], discussionCount = 0, idempotencyKey }) {
    const actor = normalizedActor(actorId);
    const key = normalizedIdempotency(idempotencyKey);
    const disagreement = detectHighValueDisagreement({ supportSignals, challengeSignals, sourceStates, evidenceStates, discussionCount });
    if (!disagreement.highValue) return { eligible: false, disagreement, queueOnly: true, isAuthoritative: false };
    const requestDigest = digest({ actor, contributionId, contributionRevision: Number(contributionRevision), claimId, reasonCodes: disagreement.reasonCodes, signalIds: disagreement.signalIds, supportCount: disagreement.supportCount, challengeCount: disagreement.challengeCount });
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision, claimId });
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`community-max:review:${scope.id}:${contributionRevision}`]);
      const existingByKey = await client.query(`SELECT * FROM private.community_review_candidates WHERE idempotency_key = $1 LIMIT 1`, [key]);
      if (existingByKey.rows[0]) {
        if (!sameDigest(existingByKey.rows[0].request_digest, requestDigest)) throw new CommunityMaxRepositoryError("IDEMPOTENCY_CONFLICT", "This request key was already used with different content.", 409);
        return { candidateId: existingByKey.rows[0].id, status: existingByKey.rows[0].status, priority: Number(existingByKey.rows[0].priority), idempotent: true, queueOnly: true, isAuthoritative: false };
      }
      const existing = await client.query(
        `SELECT * FROM private.community_review_candidates
          WHERE contribution_id = $1 AND contribution_revision = $2 AND candidate_type = 'HIGH_VALUE_DISAGREEMENT'
          LIMIT 1`,
        [scope.id, Number(contributionRevision)]
      );
      if (existing.rows[0]) return { candidateId: existing.rows[0].id, status: existing.rows[0].status, priority: Number(existing.rows[0].priority), idempotent: true, queueOnly: true, isAuthoritative: false };
      const inserted = await client.query(
        `INSERT INTO private.community_review_candidates
          (contribution_id, contribution_revision, claim_id, candidate_type, priority, signals, status, idempotency_key, request_digest)
         VALUES ($1, $2, $3, 'HIGH_VALUE_DISAGREEMENT', $4, $5::jsonb, 'OPEN', $6, $7)
         RETURNING id, status, priority`,
        [scope.id, Number(contributionRevision), scope.claim_id, disagreement.priority, JSON.stringify({ reasonCodes: disagreement.reasonCodes, signalIds: disagreement.signalIds, supportCount: disagreement.supportCount, challengeCount: disagreement.challengeCount }), key, requestDigest]
      );
      return { candidateId: inserted.rows[0].id, status: inserted.rows[0].status, priority: Number(inserted.rows[0].priority), idempotent: false, queueOnly: true, isAuthoritative: false, trustMutation: false };
    });
  }

  async createExpertRequest({ requesterId, contributionId, contributionRevision, claimId = null, domainCode, reason, priority = 0, idempotencyKey }) {
    const actor = normalizedActor(requesterId);
    const key = normalizedIdempotency(idempotencyKey);
    const domain = String(domainCode || "").trim().toUpperCase().slice(0, 120);
    const safeReason = String(reason || "").trim().slice(0, 4000);
    if (!/^[A-Z0-9][A-Z0-9:_-]{0,119}$/.test(domain) || safeReason.length < 10) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_EXPERT_REQUEST_INVALID", "An Expert request needs a safe domain and a substantive reason.", 400);
    const privacy = detectPII(safeReason);
    if (privacy.blocked) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_PRIVACY_BLOCKED", "The request contains identifying content and cannot be queued.", 422);
    const sanitizedReason = redactText(safeReason).slice(0, 4000);
    const requestDigest = digest({ actor, contributionId, contributionRevision: Number(contributionRevision), claimId, domain, reason: sanitizedReason, priority: Math.min(100, Math.max(0, Number(priority) || 0)) });
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision, claimId });
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`community-max:expert-request:${actor}:${key}`]);
      const existing = await client.query(`SELECT * FROM private.community_expert_requests WHERE requester_id = $1 AND idempotency_key = $2 LIMIT 1`, [actor, key]);
      if (existing.rows[0]) {
        if (!sameDigest(existing.rows[0].request_digest, requestDigest)) throw new CommunityMaxRepositoryError("IDEMPOTENCY_CONFLICT", "This request key was already used with different content.", 409);
        return { requestId: existing.rows[0].id, status: existing.rows[0].status, queueOnly: true, idempotent: true, isAuthoritative: false };
      }
      const inserted = await client.query(
        `INSERT INTO private.community_expert_requests
          (contribution_id, contribution_revision, claim_id, requester_id, domain_code,
           reason, privacy_sanitized, priority, status, idempotency_key, request_digest)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, 'QUEUED', $8, $9)
         RETURNING id, status, priority`,
        [scope.id, Number(contributionRevision), scope.claim_id, actor, domain, sanitizedReason, Math.min(100, Math.max(0, Number(priority) || 0)), key, requestDigest]
      );
      return { requestId: inserted.rows[0].id, status: inserted.rows[0].status, priority: Number(inserted.rows[0].priority), queueOnly: true, idempotent: false, isAuthoritative: false, expertAuthorityMutation: false };
    });
  }

  async getEvidencePassport({ actorId, caseId }) {
    const actor = normalizedActor(actorId);
    if (!isCanonicalUuid(caseId)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CASE_ID_INVALID", "A canonical Trust case ID is required.", 400);
    const pool = this.db();
    const passport = await pool.query(
      `SELECT * FROM public.evidence_passports
        WHERE owner_id = $1 AND subject_type = 'TRUST_CASE' AND subject_id = $2
        LIMIT 1`,
      [actor, String(caseId).toLowerCase()]
    );
    if (!passport.rows[0]) return null;
    const events = await pool.query(
      `SELECT * FROM public.evidence_passport_events WHERE passport_id = $1 ORDER BY revision ASC`,
      [passport.rows[0].id]
    );
    return passportDTO(passport.rows[0], events.rows);
  }

  async createDiscussionSummary({ actorId = null, contributionId, contributionRevision }) {
    const actor = actorId && isCanonicalUuid(actorId) ? String(actorId).toLowerCase() : null;
    const safeRevision = revision(contributionRevision);
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision: safeRevision, publicRead: true });
      const existing = await client.query(
        `SELECT * FROM public.community_discussion_summaries
          WHERE contribution_id = $1 AND contribution_revision = $2 AND policy_version = 'community-max.v1'
          LIMIT 1`,
        [scope.id, safeRevision]
      );
      if (existing.rows[0]) return { summary: summaryDTO(existing.rows[0]), idempotent: true };
      const discussions = await client.query(
        `SELECT d.id, d.action, d.body, d.status
           FROM public.community_claim_discussions d
          WHERE d.contribution_id = $1 AND d.contribution_revision = $2 AND d.status = 'PUBLISHED'
          ORDER BY d.created_at ASC LIMIT 500`,
        [scope.id, safeRevision]
      );
      const sources = await client.query(
        `SELECT id FROM public.community_source_references
          WHERE contribution_id = $1 AND contribution_revision = $2
          ORDER BY created_at ASC LIMIT 100`,
        [scope.id, safeRevision]
      );
      const summary = buildGroundedDiscussionSummary({ discussions: discussions.rows, sources: sources.rows, contributionRevision: safeRevision });
      const inserted = await client.query(
        `INSERT INTO public.community_discussion_summaries
          (contribution_id, contribution_revision, summary_text, discussion_ids,
           source_reference_ids, policy_version, provider_status, is_authoritative)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, false)
         ON CONFLICT (contribution_id, contribution_revision, policy_version) DO NOTHING
         RETURNING *`,
        [scope.id, safeRevision, summary.summaryText, JSON.stringify(summary.discussionIds), JSON.stringify(summary.sourceReferenceIds), summary.policyVersion, summary.providerStatus]
      );
      const row = inserted.rows[0] || (await client.query(`SELECT * FROM public.community_discussion_summaries WHERE contribution_id = $1 AND contribution_revision = $2 AND policy_version = $3 LIMIT 1`, [scope.id, safeRevision, summary.policyVersion])).rows[0];
      return { summary: summaryDTO(row), idempotent: !inserted.rows[0], grounded: true, isAuthoritative: false };
    });
  }

  async getDiscussionSummary({ actorId = null, contributionId, contributionRevision }) {
    const actor = actorId && isCanonicalUuid(actorId) ? String(actorId).toLowerCase() : null;
    const pool = this.db();
    await assertContributionScope(pool, { actorId: actor, contributionId, contributionRevision, publicRead: true });
    const result = await pool.query(
      `SELECT s.* FROM public.community_discussion_summaries s
         JOIN public.community_contributions c ON c.id = s.contribution_id
         JOIN public.trust_cases tc ON tc.id = c.case_id
        WHERE s.contribution_id = $1 AND s.contribution_revision = $2
          AND (tc.visibility = 'PUBLIC' OR c.author_id = $3)
        ORDER BY s.created_at DESC LIMIT 1`,
      [String(contributionId).toLowerCase(), Number(contributionRevision), actor]
    );
    return summaryDTO(result.rows[0] || null);
  }

  async upsertCampusContext({ actorId, contributionId, contributionRevision, institutionId = null, universityLabel = null, faculty = null, major = null, topic = null, visibility = "PRIVATE", consent = false, consentState = null }) {
    const actor = normalizedActor(actorId);
    const safeRevision = revision(contributionRevision);
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision: safeRevision });
      const existingResult = await client.query(`SELECT * FROM public.community_campus_contexts WHERE contribution_id = $1 AND contribution_revision = $2 FOR UPDATE`, [scope.id, safeRevision]);
      const existing = existingResult.rows[0] || null;
      if (existing && String(existing.created_by).toLowerCase() !== actor) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CAMPUS_OWNER_REQUIRED", "Only the context creator can change campus context consent.", 403);
      const explicitConsent = consent === true || String(consentState || "").toUpperCase() === "CONSENTED";
      const revoked = String(consentState || "").toUpperCase() === "REVOKED" || (consent === false && !explicitConsent);
      if (revoked && !existing) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CAMPUS_CONSENT_REQUIRED", "Explicit consent is required before campus context can be stored.", 422);
      if (revoked) {
        const updated = await client.query(
          `UPDATE public.community_campus_contexts
              SET visibility = 'PRIVATE', consent_state = 'REVOKED', consented_at = NULL,
                  university_label = NULL, faculty = NULL, major = NULL, topic = NULL, updated_at = now()
            WHERE id = $1 RETURNING *`,
          [existing.id]
        );
        return { campus: campusDTO(updated.rows[0]), revoked: true, inferred: false, isAuthoritative: false };
      }
      const projection = deriveCampusProjection({ institutionId, universityLabel, faculty, major, topic, visibility, consent: true });
      if (!projection.ok) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CAMPUS_CONTEXT_INVALID", "Campus context needs explicit consent and at least one context field.", 422);
      const values = projection.ownerProjection;
      const privacy = detectPII(Object.values(values).filter(Boolean).join("\n"));
      if (privacy.blocked) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_PRIVACY_BLOCKED", "Campus context contains identifying content and cannot be stored.", 422);
      const safeValues = {
        ...values,
        universityLabel: redactText(values.universityLabel || "") || null,
        faculty: redactText(values.faculty || "") || null,
        major: redactText(values.major || "") || null,
        topic: redactText(values.topic || "") || null,
      };
      const saved = existing
        ? await client.query(
          `UPDATE public.community_campus_contexts
              SET institution_id = $1, university_label = $2, faculty = $3, major = $4,
                  topic = $5, visibility = $6, consent_state = 'CONSENTED',
                  consented_at = now(), updated_at = now()
            WHERE id = $7 RETURNING *`,
          [safeValues.institutionId, safeValues.universityLabel, safeValues.faculty, safeValues.major, safeValues.topic, projection.visibility, existing.id]
        )
        : await client.query(
          `INSERT INTO public.community_campus_contexts
            (contribution_id, contribution_revision, institution_id, university_label,
             faculty, major, topic, visibility, consent_state, consented_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONSENTED', now(), $9)
           RETURNING *`,
          [scope.id, safeRevision, safeValues.institutionId, safeValues.universityLabel, safeValues.faculty, safeValues.major, safeValues.topic, projection.visibility, actor]
        );
      return { campus: campusDTO(saved.rows[0]), revoked: false, inferred: false, isAuthoritative: false };
    });
  }

  async getCampusContext({ actorId = null, contributionId, contributionRevision }) {
    const actor = actorId && isCanonicalUuid(actorId) ? String(actorId).toLowerCase() : null;
    const pool = this.db();
    await assertContributionScope(pool, { actorId: actor, contributionId, contributionRevision, publicRead: true });
    const result = await pool.query(
      `SELECT cc.* FROM public.community_campus_contexts cc
         JOIN public.community_contributions c ON c.id = cc.contribution_id
         JOIN public.trust_cases tc ON tc.id = c.case_id
        WHERE cc.contribution_id = $1 AND cc.contribution_revision = $2
          AND ((cc.visibility = 'PUBLIC' AND cc.consent_state = 'CONSENTED' AND tc.visibility = 'PUBLIC')
               OR cc.created_by = $3)
        LIMIT 1`,
      [String(contributionId).toLowerCase(), Number(contributionRevision), actor]
    );
    return campusDTO(result.rows[0] || null);
  }

  async clusterRiskSignal({ actorId, contributionId, contributionRevision, riskType, signalType, sourceDigest = null, topic = null, severity = 0, confidence = 0 }) {
    const actor = normalizedActor(actorId);
    const safeRevision = revision(contributionRevision);
    const signal = buildRiskSignalFingerprintInput({ riskType, signalType, sourceDigest, topic });
    if (signal.riskType === "UNKNOWN" && signal.signalType === "UNKNOWN") throw new CommunityMaxRepositoryError("COMMUNITY_MAX_RISK_SIGNAL_INVALID", "A typed safety signal is required.", 400);
    const fingerprint = digestHex(signal);
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId, contributionRevision: safeRevision });
      const cluster = await client.query(
        `INSERT INTO private.community_risk_clusters
          (fingerprint, risk_type, severity, occurrence_count, confidence, status)
         VALUES ($1, $2, $3, 1, $4, 'OPEN')
         ON CONFLICT (fingerprint) DO UPDATE
           SET occurrence_count = private.community_risk_clusters.occurrence_count + 1,
               severity = greatest(private.community_risk_clusters.severity, EXCLUDED.severity),
               confidence = greatest(private.community_risk_clusters.confidence, EXCLUDED.confidence),
               updated_at = now()
         RETURNING id, occurrence_count, severity, confidence, status`,
        [fingerprint, signal.riskType, Math.min(100, Math.max(0, Number(severity) || 0)), Math.min(1, Math.max(0, Number(confidence) || 0))]
      );
      await client.query(
        `INSERT INTO private.community_risk_cluster_members
          (cluster_id, contribution_id, contribution_revision, signal_type)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [cluster.rows[0].id, scope.id, safeRevision, signal.signalType]
      );
      return {
        clusterId: cluster.rows[0].id,
        occurrenceCount: Number(cluster.rows[0].occurrence_count),
        severity: Number(cluster.rows[0].severity),
        confidence: Number(cluster.rows[0].confidence),
        status: cluster.rows[0].status,
        private: true,
        rawContentIncluded: false,
        piiIncluded: false,
        isAuthoritative: false,
      };
    });
  }

  async createCorrection({ actorId, contributionId, expectedRevision, correctionType, statement, caseId = null, caseRevision = null, claimId = null, evidenceRefs = [], evidenceRevisionIds = [], metadata = {}, ocrText = "", qrContent = "", source = null, contributionType = null, privacyConfirmed = false, previewDigest, idempotencyKey }) {
    const actor = normalizedActor(actorId);
    const key = normalizedIdempotency(idempotencyKey);
    const normalizedType = String(correctionType || "").trim().toUpperCase();
    if (!["SELF_CORRECTION", "ADD_SOURCE", "WITHDRAW_CLAIM", "CONTEXT_UPDATE"].includes(normalizedType)) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CORRECTION_TYPE_INVALID", "The correction type is not supported.", 400);
    if (String(statement || "").trim().length < 20) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CORRECTION_INVALID", "A correction needs at least twenty characters.", 400);
    const pool = this.db();
    const currentResult = await pool.query(
      `SELECT c.* FROM public.community_contributions c WHERE c.id = $1 AND c.author_id = $2 LIMIT 1`,
      [String(contributionId || "").toLowerCase(), actor]
    );
    const current = currentResult.rows[0];
    if (!current) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_CONTRIBUTION_NOT_AVAILABLE", "Only the contribution owner can create a correction.", 404);
    const safeExpectedRevision = revision(expectedRevision);
    const requestDigest = digest({ actor, contributionId: current.id, expectedRevision: safeExpectedRevision, correctionType: normalizedType, statement: redactText(String(statement).trim()), caseId, caseRevision, claimId, evidenceRefs, evidenceRevisionIds });
    const existing = await pool.query(
      `SELECT * FROM public.community_correction_records WHERE created_by = $1 AND idempotency_key = $2 LIMIT 1`,
      [actor, key]
    );
    if (existing.rows[0]) {
      if (!sameDigest(existing.rows[0].request_digest, requestDigest)) throw new CommunityMaxRepositoryError("IDEMPOTENCY_CONFLICT", "This request key was already used with different content.", 409);
      return { correctionId: existing.rows[0].id, previousRevision: Number(existing.rows[0].previous_revision), newRevision: Number(existing.rows[0].new_revision), idempotent: true, qualitySignal: existing.rows[0].quality_signal, isAuthoritative: false };
    }
    let saved;
    try {
      saved = await CommunityRepository.editContribution({
        authorId: actor,
        contributionId: current.id,
        expectedRevision: safeExpectedRevision,
        caseId: caseId || current.case_id,
        caseRevision: caseRevision ?? current.case_revision,
        claimId: claimId ?? current.claim_id,
        statement,
        evidenceRefs,
        evidenceRevisionIds,
        metadata,
        ocrText,
        qrContent,
        source,
        contributionType: contributionType || current.contribution_type,
        privacyConfirmed,
        previewDigest,
        correlationId: "community-max-correction",
      });
    } catch (error) {
      const afterRace = await pool.query(`SELECT * FROM public.community_correction_records WHERE created_by = $1 AND idempotency_key = $2 LIMIT 1`, [actor, key]);
      if (afterRace.rows[0] && sameDigest(afterRace.rows[0].request_digest, requestDigest)) {
        return { correctionId: afterRace.rows[0].id, previousRevision: Number(afterRace.rows[0].previous_revision), newRevision: Number(afterRace.rows[0].new_revision), idempotent: true, qualitySignal: afterRace.rows[0].quality_signal, isAuthoritative: false };
      }
      throw error;
    }
    const qualitySignal = buildCorrectionQualitySignal({ correctionType: normalizedType });
    const inserted = await pool.query(
      `INSERT INTO public.community_correction_records
        (contribution_id, previous_revision, new_revision, correction_type, statement,
         quality_signal, created_by, idempotency_key, request_digest)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
       ON CONFLICT (created_by, idempotency_key) DO NOTHING
       RETURNING id, previous_revision, new_revision, quality_signal`,
      [current.id, safeExpectedRevision, Number(saved.revision), normalizedType, redactText(String(statement).trim()).slice(0, 5000), JSON.stringify(qualitySignal), actor, key, requestDigest]
    );
    const result = inserted.rows[0] || (await pool.query(`SELECT id, previous_revision, new_revision, quality_signal FROM public.community_correction_records WHERE created_by = $1 AND idempotency_key = $2 LIMIT 1`, [actor, key])).rows[0];
    await pool.query(
      `UPDATE public.community_verification_projections
          SET verification_state = 'OUTDATED', freshness_state = 'CONTEXT_CHANGED',
              freshness_reason = 'CONTRIBUTION_REVISION_CHANGED', updated_at = now()
        WHERE contribution_id = $1 AND contribution_revision < $2`,
      [current.id, Number(saved.revision)]
    ).catch(() => {});
    return {
      correctionId: result.id,
      previousRevision: Number(result.previous_revision),
      newRevision: Number(result.new_revision),
      qualitySignal: result.quality_signal,
      idempotent: !inserted.rows[0],
      isAuthoritative: false,
      trustMutation: false,
      expertAuthorityMutation: false,
    };
  }

  async createDataCandidate({ actorId, contributionId, contributionRevision, candidateType }) {
    const actor = normalizedActor(actorId);
    const safeRevision = revision(contributionRevision);
    const candidate = buildDataCandidate({ contributionId, contributionRevision: safeRevision, candidateType });
    if (!candidate.contributionId || !candidate.contributionRevision) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_DATA_CANDIDATE_INVALID", "A canonical contribution revision is required.", 400);
    return transaction(this.db(), async (client) => {
      const scope = await assertContributionScope(client, { actorId: actor, contributionId: candidate.contributionId, contributionRevision: safeRevision });
      const inserted = await client.query(
        `INSERT INTO private.community_data_candidates
          (contribution_id, contribution_revision, candidate_type, consent_state,
           license_state, annotation_state, adjudication_state, training_eligible,
           privacy_sanitized)
         VALUES ($1, $2, $3, 'NOT_PROVIDED', 'UNKNOWN', 'UNANNOTATED', 'NOT_REQUESTED', false, true)
         ON CONFLICT (contribution_id, contribution_revision, candidate_type) DO NOTHING
         RETURNING id, candidate_type, training_eligible, privacy_sanitized`,
        [scope.id, safeRevision, candidate.candidateType]
      );
      const row = inserted.rows[0] || (await client.query(`SELECT id, candidate_type, training_eligible, privacy_sanitized FROM private.community_data_candidates WHERE contribution_id = $1 AND contribution_revision = $2 AND candidate_type = $3 LIMIT 1`, [scope.id, safeRevision, candidate.candidateType])).rows[0];
      return {
        candidateId: row.id,
        candidateType: row.candidate_type,
        trainingEligible: row.training_eligible === true,
        privacySanitized: row.privacy_sanitized === true,
        automaticTraining: false,
        idempotent: !inserted.rows[0],
        isAuthoritative: false,
      };
    });
  }

  static validateComposer(input = {}) {
    return validateComposerInput(input);
  }
}
