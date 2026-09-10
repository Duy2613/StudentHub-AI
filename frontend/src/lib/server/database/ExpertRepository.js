/**
 * StudentHub AI — ExpertRepository
 *
 * Domain-scoped expert authority with explicit assignment, revision binding,
 * conflict-of-interest checks, immutable assessments, and adjudication-only
 * quality events. Submission itself never increases reputation.
 */

import { createHash, randomUUID } from "node:crypto";
import { getPostgresPool } from "./PostgresPool.js";
import { assertCaseScope, assertCoordinator, isCanonicalUuid, scopeError } from "./CommunityExpertScope.js";
import {
  buildAssessmentContract,
  calculateQualityScore,
  canSubmitAssessment,
  detectPII,
  resolveAssessmentDisagreement,
  redactText,
} from "../../communityExpert/promaxDomain.js";

export class ExpertRepositoryError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "ExpertRepositoryError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest();
}

async function transaction(operation) {
  const pool = getPostgresPool();
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

function jsonArray(value) {
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

function sanitizeAssessment(value, depth = 0) {
  if (depth > 4) return null;
  if (typeof value === "string") return redactText(value).slice(0, 20_000);
  if (Array.isArray(value)) return value.slice(0, 100).map((entry) => sanitizeAssessment(entry, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, entry]) => [String(key).slice(0, 100), sanitizeAssessment(entry, depth + 1)]));
  }
  return value;
}

async function appendOutbox(client, { eventType, aggregateType = "EXPERT_ASSESSMENT", aggregateId, subject, payload, correlationId = "expert" }) {
  const eventId = randomUUID();
  await client.query(
    `INSERT INTO private.integration_outbox
      (event_id, integration, aggregate_type, aggregate_id, event_type,
       schema_version, occurred_at, produced_at, producer, environment,
       correlation_id, subject, classification, payload, payload_hash, status)
     VALUES ($1, 'INTERNAL', $2, $3, $4, 'expert-promax.v1',
             now(), now(), 'studenthub-expert', $5, $6, $7, 'INTERNAL', $8::jsonb, $9, 'PENDING')
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, aggregateType, aggregateId, eventType, process.env.NODE_ENV || "development", correlationId, subject, JSON.stringify(payload), digest(payload)]
  );
  return eventId;
}

export class ExpertRepository {
  static async listPublicProfiles({ limit = 50, domainCode = null } = {}) {
    const pool = getPostgresPool();
    const params = [];
    const domainPredicate = domainCode ? `WHERE ev.domain_code = $${params.push(String(domainCode).toUpperCase())} AND ev.status = 'VERIFIED' AND ev.qualification_state = 'DOMAIN_VERIFIED'` : "";
    params.push(Math.min(Math.max(Number(limit) || 50, 1), 100));
    let res;
    try {
      res = await pool.query(
        `SELECT ep.user_id AS expert_id, ep.public_title, ep.public_bio,
                coalesce(array_agg(distinct ev.domain_code) filter (where ev.status = 'VERIFIED'), '{}') AS verified_domains
           FROM public.expert_profiles ep
           LEFT JOIN private.expert_verifications ev ON ev.user_id = ep.user_id AND ev.suspended_at IS NULL AND ev.status = 'VERIFIED' AND ev.qualification_state = 'DOMAIN_VERIFIED' AND (ev.expires_at IS NULL OR ev.expires_at > now())
           ${domainPredicate}
          GROUP BY ep.user_id, ep.public_title, ep.public_bio
          ORDER BY ep.updated_at DESC, ep.user_id
          LIMIT $${params.length}`,
        params
      );
    } catch (error) {
      // The older live schema does not have Promax lifecycle columns yet.
      // A read-only projection can still show rows whose legacy verification
      // status is VERIFIED; no qualification, assignment, or assessment is
      // inferred from this compatibility branch.
      if (error?.code !== "42703") throw error;
      const legacyParams = [];
      const legacyPredicate = domainCode ? `WHERE ev.domain_code = $${legacyParams.push(String(domainCode).toUpperCase())} AND ev.status = 'VERIFIED'` : "";
      legacyParams.push(Math.min(Math.max(Number(limit) || 50, 1), 100));
      res = await pool.query(
        `SELECT ep.user_id AS expert_id, ep.public_title, ep.public_bio,
                coalesce(array_agg(distinct ev.domain_code) filter (where ev.status = 'VERIFIED'), '{}') AS verified_domains
           FROM public.expert_profiles ep
           LEFT JOIN private.expert_verifications ev ON ev.user_id = ep.user_id AND ev.status = 'VERIFIED'
           ${legacyPredicate}
          GROUP BY ep.user_id, ep.public_title, ep.public_bio
          ORDER BY ep.updated_at DESC, ep.user_id
          LIMIT $${legacyParams.length}`,
        legacyParams
      );
    }
    return res.rows.map((row) => ({
      expertId: row.expert_id,
      name: row.public_title || "Verified StudentHub expert",
      title: row.public_title || null,
      bio: row.public_bio || null,
      scopes: (Array.isArray(row.verified_domains) ? row.verified_domains : []).map((domain) => ({ domain, level: "DOMAIN_VERIFIED", isEstablished: true })),
      credentials: [],
      publications: [],
      isVerified: Array.isArray(row.verified_domains) && row.verified_domains.length > 0,
      verificationStatus: Array.isArray(row.verified_domains) && row.verified_domains.length > 0 ? "VERIFIED" : "UNVERIFIED",
      roles: [{ roleTitle: row.verified_domains?.length ? "DOMAIN_VERIFIED_EXPERT" : "MEMBER" }],
      authorityBoundaries: { warning: "Domain-scoped expert opinion does not replace official records." },
    }));
  }

  static async getPublicProfile(userId) {
    const profiles = await this.listPublicProfiles({ limit: 100 });
    return profiles.find((profile) => String(profile.expertId) === String(userId)) || null;
  }

  static async upsertProfile({ userId, publicTitle, publicBio }) {
    if (!userId) throw new Error("userId is required.");
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO public.expert_profiles (user_id, public_title, public_bio, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (user_id) DO UPDATE
       SET public_title = EXCLUDED.public_title, public_bio = EXCLUDED.public_bio, updated_at = now()
       RETURNING user_id, public_title, public_bio, updated_at`,
      [userId, publicTitle || null, publicBio || null]
    );
    return res.rows[0];
  }

  static async setDomainVerification({ userId, domainCode, status, verifiedBy = null, evidenceRef = null }) {
    if (!userId || !domainCode || !["PENDING", "VERIFIED", "REJECTED", "REVOKED"].includes(status)) throw new Error("Invalid verification parameters.");
    const pool = getPostgresPool();
    const normalizedDomain = String(domainCode).trim().toUpperCase();
    const res = await pool.query(
      `INSERT INTO private.expert_verifications (user_id, domain_code, status, qualification_state, verified_by, verified_at, evidence_ref)
       VALUES ($1, $2, $3,
               CASE WHEN $3 = 'VERIFIED' THEN 'DOMAIN_VERIFIED' WHEN $3 = 'REVOKED' THEN 'REVOKED' ELSE 'IDENTITY_CHECKED' END,
               $4, now(), $5)
       ON CONFLICT (user_id, domain_code) DO UPDATE
       SET status = EXCLUDED.status, qualification_state = EXCLUDED.qualification_state,
           verified_by = EXCLUDED.verified_by, verified_at = now(), evidence_ref = EXCLUDED.evidence_ref,
           suspended_at = CASE WHEN EXCLUDED.status = 'REVOKED' THEN now() ELSE NULL END
       RETURNING id, user_id, domain_code, status, qualification_state, revision, verified_at, suspended_at, expires_at`,
      [userId, normalizedDomain, status, verifiedBy, evidenceRef]
    );
    return res.rows[0];
  }

  static async getVerifiedDomains(userId) {
    if (!userId) return [];
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT domain_code, verified_at, evidence_ref
       FROM private.expert_verifications
       WHERE user_id = $1 AND status = 'VERIFIED' AND qualification_state = 'DOMAIN_VERIFIED'
         AND suspended_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
      [userId]
    );
    return res.rows.map((row) => row.domain_code);
  }

  static async createAssignment({ assignedBy, expertId, caseId, caseRevision, claimId = null, domainCode, expiresAt = null, idempotencyKey }) {
    if (!assignedBy || !expertId || !caseId || !domainCode || !Number.isInteger(Number(caseRevision)) || Number(caseRevision) < 1 || String(assignedBy) === String(expertId)) {
      throw new ExpertRepositoryError("ASSIGNMENT_INPUT_INVALID", "A coordinator must assign a case revision to another expert.", 400);
    }
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new ExpertRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);
    if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) throw new ExpertRepositoryError("ASSIGNMENT_EXPIRY_INVALID", "An assignment expiry must be in the future.", 400);
    const normalizedDomain = String(domainCode).trim().toUpperCase();
    const requestDigest = digest({ assignedBy, expertId, caseId, caseRevision: Number(caseRevision), claimId: claimId || null, domainCode: normalizedDomain, expiresAt: expiresAt || null });
    return transaction(async (client) => {
      await assertCoordinator(client, assignedBy, expertId);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`assignment:${assignedBy}:${idempotencyKey}`]);
      const existing = await client.query(
        `SELECT id, expert_id, case_id, case_revision, claim_id, domain_code, status,
                assigned_by, expires_at, revision, idempotency_key, request_digest, created_at
           FROM private.expert_assignments
          WHERE assigned_by = $1 AND idempotency_key = $2
          LIMIT 1`,
        [assignedBy, idempotencyKey]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest && !Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        return { ...existing.rows[0], idempotent: true };
      }
      await assertCaseScope(client, { actorId: assignedBy, caseId, caseRevision, claimId, publicOnly: true });
      const verified = await client.query(
        `SELECT status, qualification_state FROM private.expert_verifications WHERE user_id = $1 AND domain_code = $2 AND status = 'VERIFIED' AND qualification_state = 'DOMAIN_VERIFIED' AND suspended_at IS NULL AND (expires_at IS NULL OR expires_at > now()) FOR UPDATE`,
        [expertId, normalizedDomain]
      );
      if (verified.rows[0]?.status !== "VERIFIED") throw new ExpertRepositoryError("DOMAIN_NOT_VERIFIED", "The assigned expert is not verified for this domain.", 403);
      const inserted = await client.query(
        `INSERT INTO private.expert_assignments
          (id, expert_id, case_id, case_revision, claim_id, domain_code, status, assigned_by, expires_at, idempotency_key, request_digest, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'ASSIGNED', $7, $8, $9, $10, now(), now())
         RETURNING id, expert_id, case_id, case_revision, claim_id, domain_code, status, assigned_by, expires_at, revision, idempotency_key, created_at`,
        [randomUUID(), expertId, caseId, caseRevision, claimId, normalizedDomain, assignedBy, expiresAt, idempotencyKey, requestDigest]
      );
      await appendOutbox(client, {
        eventType: "EXPERT_CASE_ASSIGNED",
        aggregateType: "EXPERT_ASSIGNMENT",
        aggregateId: inserted.rows[0].id,
        subject: expertId,
        payload: {
          assignmentId: inserted.rows[0].id,
          expertId,
          caseId,
          caseRevision: Number(caseRevision),
          claimId,
          domainCode: normalizedDomain,
          status: "ASSIGNED",
        },
      });
      return { ...inserted.rows[0], idempotent: false };
    });
  }

  /**
   * Persists a complete assessment contract in one transaction.  A missing
   * assignment, revoked/out-of-domain expert, stale revision, or missing COI
   * declaration fails closed before the row is written.
   */
  static async submitAssessment({
    expertId,
    caseId,
    domainCode,
    assessment,
    confidence = 0.9,
    assignmentId = null,
    caseRevision,
    claimId = null,
    evidenceRevisionIds = [],
    conclusionWithinScope,
    reasoning,
    uncertainty = "",
    missingEvidence = [],
    coiDeclared = false,
    idempotencyKey,
    policyVersion = "expert-quality-v1",
    requireAssignment = true,
  }) {
    if (!expertId || !caseId || !domainCode || !assessment) throw new ExpertRepositoryError("ASSESSMENT_INPUT_INVALID", "expertId, caseId, domainCode, and assessment are required.", 400);
    if (!Number.isInteger(Number(caseRevision)) || Number(caseRevision) < 1) throw new ExpertRepositoryError("CASE_REVISION_REQUIRED", "An immutable case revision is required.", 400);
    caseRevision = Number(caseRevision);
    const normalizedDomain = String(domainCode).trim().toUpperCase();
    claimId = claimId ? String(claimId).trim().toLowerCase() : null;
    if (!Number.isFinite(Number(confidence)) || Number(confidence) < 0 || Number(confidence) > 1) throw new ExpertRepositoryError("ASSESSMENT_CONFIDENCE_INVALID", "Assessment confidence must be between 0 and 1.", 400);
    if (!Array.isArray(evidenceRevisionIds) || evidenceRevisionIds.length > 100) throw new ExpertRepositoryError("EVIDENCE_INPUT_INVALID", "Evidence revisions must be a bounded array.", 400);
    if (requireAssignment && !assignmentId) throw new ExpertRepositoryError("ASSIGNMENT_REQUIRED", "An assigned case revision is required before assessment.", 403);
    if (coiDeclared !== true) throw new ExpertRepositoryError("COI_DECLARATION_REQUIRED", "The expert must declare no conflict of interest before submitting.", 400);
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new ExpertRepositoryError("IDEMPOTENCY_KEY_REQUIRED", "A stable Idempotency-Key is required.", 400);

    const sanitizedAssessment = sanitizeAssessment(assessment);
    const assessmentScan = detectPII(JSON.stringify(assessment));
    if (assessmentScan.blocked) throw new ExpertRepositoryError("PRIVACY_SCAN_BLOCKED", "The assessment contains identifying content and cannot be stored.", 422);
    assessment = sanitizedAssessment;
    reasoning = reasoning ? redactText(String(reasoning).trim()) : reasoning;
    uncertainty = uncertainty ? redactText(String(uncertainty).trim()) : uncertainty;
    missingEvidence = Array.isArray(missingEvidence) ? missingEvidence.map((entry) => redactText(String(entry))).slice(0, 50) : [];

    const contract = buildAssessmentContract({
      assessmentId: null,
      expertId,
      verifiedDomain: normalizedDomain,
      assignmentId,
      caseId,
      caseRevision,
      claimId,
      evidenceRevisionIds,
      state: "SUBMITTED",
      conclusionWithinScope,
      reasoning: reasoning || assessment.reasoning || assessment.analysis,
      uncertainty,
      missingEvidence,
      coiDeclared,
      policyVersion,
    });
    // This digest intentionally contains the submitted request only. A later
    // verification change must not turn an idempotent replay of an already
    // stored assessment into a new write or erase its historical lineage.
    const requestDigest = digest({
      expertId,
      caseId,
      domainCode: normalizedDomain,
      assignmentId: assignmentId || null,
      caseRevision,
      claimId,
      evidenceRevisionIds,
      assessment,
      confidence: Number(confidence),
      contract,
    });
    return transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`assessment:${expertId}:${idempotencyKey}`]);
      const existing = await client.query(
        `SELECT *
           FROM public.expert_assessments
          WHERE expert_id = $1 AND idempotency_key = $2
          LIMIT 1`,
        [expertId, idempotencyKey]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest && !Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        await assertCaseScope(client, {
          actorId: expertId,
          caseId: existing.rows[0].case_id,
          caseRevision: Number(existing.rows[0].case_revision),
          claimId: existing.rows[0].claim_id,
          evidenceRevisionIds: jsonArray(existing.rows[0].evidence_revision_ids),
          publicOnly: true,
        });
        return { ...existing.rows[0], idempotent: true };
      }
      const verified = await client.query(
        `SELECT id, user_id, domain_code, status, qualification_state,
                revision, verified_at, expires_at, suspended_at
           FROM private.expert_verifications
          WHERE user_id = $1 AND domain_code = $2
            AND status = 'VERIFIED' AND qualification_state = 'DOMAIN_VERIFIED'
            AND suspended_at IS NULL AND (expires_at IS NULL OR expires_at > now())
          FOR UPDATE`,
        [expertId, normalizedDomain]
      );
      if (verified.rows.length === 0 || verified.rows[0].status !== "VERIFIED") throw new ExpertRepositoryError("UNVERIFIED_EXPERT_DOMAIN", `Expert ${expertId} is not verified for domain ${normalizedDomain}.`, 403);
      await assertCaseScope(client, { actorId: expertId, caseId, caseRevision, claimId, evidenceRevisionIds, publicOnly: true });

      let assignment = null;
      if (assignmentId) {
        const assigned = await client.query(
          `SELECT id, expert_id, case_id, case_revision, claim_id, domain_code, status,
                  assigned_by, conflict_of_interest, expires_at, revision
             FROM private.expert_assignments
            WHERE id = $1 AND expert_id = $2 AND case_id = $3 AND domain_code = $4
            FOR UPDATE`,
          [assignmentId, expertId, caseId, normalizedDomain]
        );
        assignment = assigned.rows[0] || null;
        if (assignment && (Number(assignment.case_revision) !== Number(caseRevision) || (assignment.claim_id || null) !== claimId)) throw scopeError('ASSIGNMENT_SCOPE_MISMATCH');
      }
      const authority = canSubmitAssessment({
        expertId,
        verifiedDomain: normalizedDomain,
        domainStatus: verified.rows[0]?.status,
        assignment,
        caseRevision,
        coiDeclared,
      });
      if (!authority.ok) throw new ExpertRepositoryError(authority.code, `Assessment rejected: ${authority.code}.`, authority.code === "CONFLICT_OF_INTEREST" ? 403 : 409);
      if (assignment.expires_at && new Date(assignment.expires_at).getTime() <= Date.now()) throw new ExpertRepositoryError("ASSIGNMENT_EXPIRED", "The assessment assignment has expired.", 409);

      const submittedAt = new Date().toISOString();
      const verificationRevision = Number(verified.rows[0].revision || 1);
      const assignmentRevision = Number(assignment.revision || 1);
      const coiDeclarationRef = `coi-${digest({ expertId, assignmentId, caseId, caseRevision, claimId, domainCode: normalizedDomain, idempotencyKey }).toString("hex")}`;
      const authoritySnapshot = {
        snapshotVersion: 1,
        expertId,
        verificationId: verified.rows[0].id,
        verificationRevision,
        verifiedDomain: normalizedDomain,
        verificationStatus: verified.rows[0].status,
        qualificationState: verified.rows[0].qualification_state,
        verificationExpiresAt: verified.rows[0].expires_at,
        verificationSuspendedAt: verified.rows[0].suspended_at,
        assignmentId: assignment.id,
        assignmentRevision,
        caseId,
        caseRevision,
        claimId,
        evidenceRevisionIds,
        coiState: "DECLARED_NO_CONFLICT",
        coiDeclarationRef,
        qualificationPolicyVersion: "expert-qualification-v1",
        submittedAt,
      };
      const authoritySnapshotDigest = digest(authoritySnapshot);

      const inserted = await client.query(
        `INSERT INTO public.expert_assessments
          (expert_id, case_id, domain_code, assessment, confidence, assignment_id,
           case_revision, claim_id, evidence_revision_ids, assessment_state,
           conclusion_within_scope, reasoning, uncertainty, missing_evidence,
           coi_declared, coi_state, coi_declaration_ref, qualification_policy_version,
           verification_id, verification_revision, verified_domain, verification_status,
           verification_qualification_state, verification_expires_at,
           verification_suspended_at, assignment_revision,
           authority_snapshot_version, authority_snapshot_digest, authority_snapshot,
           submitted_at, policy_version, idempotency_key, request_digest, created_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9::jsonb, 'SUBMITTED',
                 $10, $11, $12, $13::jsonb, true, 'DECLARED_NO_CONFLICT', $14,
                 'expert-qualification-v1', $15, $16, $17, $18, $19, $20, $21,
                 $22, 1, $23, $24::jsonb, $25, $26, $27, $28, now())
         RETURNING id, expert_id, case_id, domain_code, assessment, confidence,
                   assignment_id, case_revision, claim_id, evidence_revision_ids,
                   assessment_state, conclusion_within_scope, reasoning,
                   uncertainty, missing_evidence, coi_declared, coi_state,
                   coi_declaration_ref, qualification_policy_version,
                   verification_id, verification_revision, verified_domain,
                   verification_status, verification_qualification_state,
                   verification_expires_at, verification_suspended_at,
                   assignment_revision, authority_snapshot_version,
                   authority_snapshot_digest, authority_snapshot, submitted_at,
                   policy_version, idempotency_key, request_digest, created_at`,
        [expertId, caseId, normalizedDomain, JSON.stringify(assessment), Number(confidence), assignment.id, caseRevision, claimId, JSON.stringify(evidenceRevisionIds), conclusionWithinScope || contract.conclusionWithinScope || null, reasoning || contract.reasoning || null, uncertainty || null, JSON.stringify(missingEvidence), coiDeclarationRef, verified.rows[0].id, verificationRevision, normalizedDomain, verified.rows[0].status, verified.rows[0].qualification_state, verified.rows[0].expires_at, verified.rows[0].suspended_at, assignmentRevision, authoritySnapshotDigest, JSON.stringify(authoritySnapshot), submittedAt, policyVersion, idempotencyKey, requestDigest]
      );
      await client.query(`UPDATE private.expert_assignments SET status = 'COMPLETED', updated_at = now() WHERE id = $1`, [assignmentId]);
      await appendOutbox(client, {
        eventType: "EXPERT_ASSESSMENT_SUBMITTED",
        aggregateId: inserted.rows[0].id,
        subject: expertId,
        payload: {
          assessmentId: inserted.rows[0].id,
          assignmentId,
          caseId,
          caseRevision,
          claimId,
          evidenceRevisionIds,
          domainCode: normalizedDomain,
          verificationId: verified.rows[0].id,
          verificationRevision,
          assignmentRevision,
          authoritySnapshotVersion: 1,
          authoritySnapshotDigest: authoritySnapshotDigest.toString("hex"),
          coiState: "DECLARED_NO_CONFLICT",
          coiDeclarationRef,
          qualificationPolicyVersion: "expert-qualification-v1",
          assessmentState: "SUBMITTED",
          qualityMutation: "NONE_ON_SUBMISSION",
        },
      });
      // Deliberately no private.reputation_events insert here. Quality changes
      // only after an independent adjudication event is recorded below.
      return inserted.rows[0];
    });
  }

  static async getAssessmentsForCase(caseId) {
    if (!caseId) return [];
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT ea.id, ea.expert_id, ea.domain_code, ea.assessment, ea.confidence,
              ea.assignment_id, ea.case_revision, ea.claim_id, ea.evidence_revision_ids,
              ea.assessment_state, ea.conclusion_within_scope, ea.reasoning,
              ea.uncertainty, ea.missing_evidence, ea.coi_declared, ea.coi_state,
              ea.coi_declaration_ref, ea.qualification_policy_version,
              ea.verification_id, ea.verification_revision, ea.verified_domain,
              ea.verification_status, ea.verification_qualification_state,
              ea.verification_expires_at, ea.verification_suspended_at,
              ea.assignment_revision, ea.authority_snapshot_version,
              ea.authority_snapshot_digest, ea.authority_snapshot, ea.submitted_at,
              ea.policy_version, ea.created_at, ep.public_title
       FROM public.expert_assessments ea
       LEFT JOIN public.expert_profiles ep ON ea.expert_id = ep.user_id
       WHERE ea.case_id = $1 AND EXISTS (SELECT 1 FROM public.trust_cases tc WHERE tc.id=ea.case_id AND tc.visibility='PUBLIC')
       ORDER BY ea.created_at ASC`,
      [caseId]
    );
    return res.rows;
  }

  /**
   * Records an independent review decision for one immutable assessment. The
   * reviewer must have a separate assignment in the same case/revision and
   * verified domain. Decisions are append-only and never overwrite the
   * original assessment.
   */
  static async recordReviewDecision({ reviewerId, assessmentId, assignmentId, decision, reasoning, idempotencyKey, correlationId = "expert-review" }) {
    const normalizedDecision = String(decision || "").trim().toUpperCase();
    if (!reviewerId || !assessmentId || !assignmentId || !["AGREE", "DISAGREE", "ABSTAIN"].includes(normalizedDecision) || String(reasoning || "").trim().length < 20 || !idempotencyKey || String(idempotencyKey).length > 180) {
      throw new ExpertRepositoryError("REVIEW_DECISION_INVALID", "A review decision needs an assignment, decision, substantive reasoning, and Idempotency-Key.", 400);
    }
    if (!isCanonicalUuid(assessmentId) || !isCanonicalUuid(assignmentId)) throw new ExpertRepositoryError("REVIEW_SCOPE_INVALID", "Assessment and assignment identifiers must be canonical UUIDs.", 400);
    const reviewScan = detectPII(reasoning);
    if (reviewScan.blocked) throw new ExpertRepositoryError("PRIVACY_SCAN_BLOCKED", "The review reasoning contains identifying content and cannot be stored.", 422);
    reasoning = redactText(String(reasoning).trim());
    return transaction(async (client) => {
      const assessmentResult = await client.query(
        `SELECT id, expert_id, case_id, case_revision, claim_id, domain_code,
                evidence_revision_ids, assessment_state, conclusion_within_scope
           FROM public.expert_assessments
          WHERE id = $1
          FOR UPDATE`,
        [assessmentId]
      );
      const assessment = assessmentResult.rows[0];
      if (!assessment) throw new ExpertRepositoryError("ASSESSMENT_NOT_AVAILABLE", "The assessment is not available for independent review.", 404);
      if (String(assessment.expert_id) === String(reviewerId)) throw new ExpertRepositoryError("SELF_REVIEW_FORBIDDEN", "An expert cannot review their own assessment.", 403);
      if (!Number.isInteger(Number(assessment.case_revision))) throw new ExpertRepositoryError("ASSESSMENT_SCOPE_MISSING", "The assessment is missing an immutable case revision.", 409);

      const reviewerAssignment = await client.query(
        `SELECT id, expert_id, case_id, case_revision, claim_id, domain_code,
                status, conflict_of_interest, expires_at
           FROM private.expert_assignments
          WHERE id = $1 AND expert_id = $2 AND case_id = $3
            AND case_revision = $4
            AND claim_id IS NOT DISTINCT FROM $5::uuid
            AND domain_code = $6
          FOR UPDATE`,
        [assignmentId, reviewerId, assessment.case_id, assessment.case_revision, assessment.claim_id, assessment.domain_code]
      );
      const assignment = reviewerAssignment.rows[0];
      if (!assignment) throw new ExpertRepositoryError("REVIEW_ASSIGNMENT_REQUIRED", "An independent review assignment is required for this case revision.", 403);
      if (assignment.conflict_of_interest || (assignment.expires_at && new Date(assignment.expires_at).getTime() <= Date.now())) throw new ExpertRepositoryError("REVIEW_ASSIGNMENT_INVALID", "The reviewer assignment is conflicted or expired.", 403);
      const verification = await client.query(
        `SELECT status, qualification_state FROM private.expert_verifications
          WHERE user_id = $1 AND domain_code = $2 AND status = 'VERIFIED' AND qualification_state = 'DOMAIN_VERIFIED'
            AND suspended_at IS NULL AND (expires_at IS NULL OR expires_at > now())
          FOR UPDATE`,
        [reviewerId, assessment.domain_code]
      );
      if (!verification.rows[0]) throw new ExpertRepositoryError("DOMAIN_NOT_VERIFIED", "The reviewer is not currently verified for this domain.", 403);
      await assertCaseScope(client, {
        actorId: reviewerId,
        caseId: assessment.case_id,
        caseRevision: Number(assessment.case_revision),
        claimId: assessment.claim_id,
        evidenceRevisionIds: jsonArray(assessment.evidence_revision_ids),
        publicOnly: true,
      });

      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`expert-review:${reviewerId}:${idempotencyKey}`]);
      const requestDigest = digest({ reviewerId, assessmentId, assignmentId, decision: normalizedDecision, reasoning: String(reasoning).trim() });
      const existing = await client.query(
        `SELECT id, assessment_id, reviewer_id, assignment_id, case_id, case_revision, claim_id, decision, reasoning, request_digest, created_at
           FROM private.expert_review_decisions
          WHERE reviewer_id = $1 AND idempotency_key = $2
          LIMIT 1`,
        [reviewerId, idempotencyKey]
      );
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        const decisions = await client.query(`SELECT * FROM private.expert_review_decisions WHERE assessment_id = $1 ORDER BY created_at ASC`, [assessmentId]);
        const assessments = await client.query(
          `SELECT id, expert_id, case_id, case_revision, claim_id, assessment,
                  conclusion_within_scope, reasoning, created_at
             FROM public.expert_assessments
            WHERE case_id = $1 AND case_revision = $2 AND claim_id IS NOT DISTINCT FROM $3::uuid
            ORDER BY created_at ASC`,
          [assessment.case_id, assessment.case_revision, assessment.claim_id]
        );
        return { decision: existing.rows[0], idempotent: true, consensus: resolveAssessmentDisagreement(assessments.rows, decisions.rows) };
      }
      const priorDecision = await client.query(
        `SELECT id FROM private.expert_review_decisions WHERE reviewer_id = $1 AND assessment_id = $2 LIMIT 1`,
        [reviewerId, assessmentId]
      );
      if (priorDecision.rows[0]) throw new ExpertRepositoryError("REVIEW_ALREADY_RECORDED", "This reviewer has already recorded a decision for the assessment.", 409);
      if (!["ASSIGNED", "IN_REVIEW"].includes(String(assignment.status).toUpperCase())) throw new ExpertRepositoryError("REVIEW_ASSIGNMENT_REQUIRED", "The reviewer assignment is no longer available for a new decision.", 403);
      const inserted = await client.query(
        `INSERT INTO private.expert_review_decisions
          (id, assessment_id, reviewer_id, assignment_id, case_id, case_revision,
           claim_id, decision, reasoning, idempotency_key, request_digest, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
         RETURNING id, assessment_id, reviewer_id, assignment_id, case_id,
                   case_revision, claim_id, decision, reasoning, created_at`,
        [randomUUID(), assessmentId, reviewerId, assignmentId, assessment.case_id, assessment.case_revision, assessment.claim_id, normalizedDecision, String(reasoning).trim(), idempotencyKey, requestDigest]
      );
      await client.query(`UPDATE private.expert_assignments SET status = 'COMPLETED', updated_at = now() WHERE id = $1`, [assignmentId]);
      const assessments = await client.query(
        `SELECT id, expert_id, case_id, case_revision, claim_id, assessment,
                conclusion_within_scope, reasoning, created_at
           FROM public.expert_assessments
          WHERE case_id = $1 AND case_revision = $2 AND claim_id IS NOT DISTINCT FROM $3::uuid
          ORDER BY created_at ASC`,
        [assessment.case_id, assessment.case_revision, assessment.claim_id]
      );
      const decisions = await client.query(
        `SELECT id, assessment_id, reviewer_id, assignment_id, decision, reasoning, created_at
           FROM private.expert_review_decisions
          WHERE assessment_id = ANY($1::uuid[])
          ORDER BY created_at ASC`,
        [assessments.rows.map((row) => row.id)]
      );
      const consensus = resolveAssessmentDisagreement(assessments.rows, decisions.rows);
      await appendOutbox(client, {
        eventType: "EXPERT_REVIEW_DECISION_RECORDED",
        aggregateId: assessmentId,
        subject: reviewerId,
        correlationId,
        payload: {
          assessmentId,
          reviewDecisionId: inserted.rows[0].id,
          assignmentId,
          caseId: assessment.case_id,
          caseRevision: Number(assessment.case_revision),
          claimId: assessment.claim_id,
          decision: normalizedDecision,
          consensusState: consensus.state,
          majorityApplied: false,
        },
      });
      return { decision: inserted.rows[0], idempotent: false, consensus };
    });
  }

  static async getAssessmentConsensus({ actorId, caseId, caseRevision, claimId = null } = {}) {
    if (!actorId || !caseId || !Number.isInteger(Number(caseRevision)) || Number(caseRevision) < 1) throw new ExpertRepositoryError("CONSENSUS_SCOPE_REQUIRED", "Consensus requires an actor, case, and immutable revision.", 400);
    return transaction(async (client) => {
      await assertCaseScope(client, { actorId, caseId, caseRevision: Number(caseRevision), claimId, publicOnly: true });
      const assessments = await client.query(
        `SELECT id, expert_id, case_id, case_revision, claim_id, assessment,
                conclusion_within_scope, reasoning, created_at
           FROM public.expert_assessments
          WHERE case_id = $1 AND case_revision = $2 AND claim_id IS NOT DISTINCT FROM $3::uuid
          ORDER BY created_at ASC`,
        [caseId, Number(caseRevision), claimId]
      );
      const decisions = await client.query(
        `SELECT id, assessment_id, reviewer_id, assignment_id, decision, reasoning, created_at
           FROM private.expert_review_decisions
          WHERE assessment_id = ANY($1::uuid[])
          ORDER BY created_at ASC`,
        [assessments.rows.map((row) => row.id)]
      );
      return {
        caseId,
        caseRevision: Number(caseRevision),
        claimId,
        consensus: resolveAssessmentDisagreement(assessments.rows, decisions.rows),
        policyVersion: "expert-review-v1",
      };
    });
  }

  /** Adds one independent adjudication and returns the versioned quality profile. */
  static async recordQualityEvent({ userId, domainCode, caseId = null, caseRevision = null, claimId = null, evidenceRevisionIds = [], incidentClusterId = null, eventType = "ADJUDICATION", outcome, weight = 1, idempotencyKey, reason, policyVersion = "expert-quality-v1", actorId = null, supersedesEventId = null, correlationId = "expert-quality" }) {
    const normalizedType = String(eventType || "").toUpperCase();
    const normalizedOutcome = String(outcome || "").toUpperCase();
    if (!userId || !domainCode || !normalizedOutcome || !idempotencyKey || !reason || !actorId) throw new ExpertRepositoryError("QUALITY_EVENT_INVALID", "An adjudicated quality event needs subject, actor, domain, outcome, reason, and idempotency key.", 400);
    if (String(actorId) === String(userId)) throw new ExpertRepositoryError("INDEPENDENT_ADJUDICATOR_REQUIRED", "The subject cannot adjudicate their own quality event.", 403);
    if (!["ADJUDICATION", "REVERSE_ADJUDICATION", "MANUAL_CORRECTION"].includes(normalizedType)) throw new ExpertRepositoryError("QUALITY_EVENT_INVALID", "Quality event type is invalid.", 400);
    if (!Array.isArray(evidenceRevisionIds) || evidenceRevisionIds.length > 100) throw new ExpertRepositoryError("EVIDENCE_INPUT_INVALID", "Evidence revisions must be a bounded array.", 400);
    if (incidentClusterId !== null && (typeof incidentClusterId !== "string" || incidentClusterId.trim().length < 1 || incidentClusterId.trim().length > 180)) throw new ExpertRepositoryError("QUALITY_EVENT_INVALID", "Incident cluster identifiers must be bounded text.", 400);
    if (caseId && !Number.isInteger(Number(caseRevision))) throw new ExpertRepositoryError("QUALITY_EVENT_SCOPE_REQUIRED", "A case-bound quality event requires an immutable case revision.", 400);
    if (normalizedType !== "MANUAL_CORRECTION" && (!caseId || !Number.isInteger(Number(caseRevision)) || evidenceRevisionIds.length === 0)) throw new ExpertRepositoryError("QUALITY_EVENT_SCOPE_REQUIRED", "Adjudication must cite a case revision and evidence revision.", 400);
    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0 || Number(weight) > 10) throw new ExpertRepositoryError("QUALITY_EVENT_INVALID", "Quality event weight must be between 0 and 10.", 400);
    return transaction(async (client) => {
      if (caseId) await assertCaseScope(client, { actorId, caseId, caseRevision: Number(caseRevision), claimId, evidenceRevisionIds, publicOnly: true });
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`expert-quality:${userId}:${domainCode}:${idempotencyKey}`]);
      const requestDigest = digest({ userId, domainCode, caseId, caseRevision, claimId, evidenceRevisionIds, incidentClusterId: incidentClusterId?.trim() || null, eventType: normalizedType, outcome: normalizedOutcome, weight: Number(weight), reason: String(reason).trim(), actorId, supersedesEventId });
      const existing = await client.query(
        `SELECT id, event_type, outcome, weight, idempotency_key, request_digest, case_id, case_revision, claim_id, evidence_revision_ids, incident_cluster_id, created_at
           FROM private.expert_quality_events
          WHERE user_id = $1 AND domain_code = $2 AND idempotency_key = $3
          LIMIT 1`,
        [userId, String(domainCode).toUpperCase(), idempotencyKey]
      );
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw scopeError("IDEMPOTENCY_CONFLICT");
        const events = await client.query(`SELECT event_type, outcome, weight, idempotency_key, case_id, incident_cluster_id, created_at FROM private.expert_quality_events WHERE user_id = $1 AND domain_code = $2 ORDER BY created_at ASC`, [userId, String(domainCode).toUpperCase()]);
        return { eventId: existing.rows[0].id, idempotent: true, quality: calculateQualityScore(events.rows) };
      }
      if (normalizedType === "REVERSE_ADJUDICATION") {
        if (!supersedesEventId) throw new ExpertRepositoryError("QUALITY_REVERSAL_TARGET_REQUIRED", "A reversed adjudication must point to the prior event.", 400);
        const target = await client.query(`SELECT id FROM private.expert_quality_events WHERE id = $1 AND user_id = $2 AND domain_code = $3 FOR SHARE`, [supersedesEventId, userId, String(domainCode).toUpperCase()]);
        if (!target.rows[0]) throw new ExpertRepositoryError("QUALITY_REVERSAL_TARGET_NOT_FOUND", "The adjudication to reverse was not found for this expert/domain.", 404);
      }
      const inserted = await client.query(
        `INSERT INTO private.expert_quality_events
          (user_id, domain_code, case_id, case_revision, claim_id, incident_cluster_id, event_type,
           outcome, weight, idempotency_key, request_digest, reason, policy_version,
           actor_id, supersedes_event_id, evidence_revision_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
         RETURNING id`,
        [userId, String(domainCode).toUpperCase(), caseId, caseRevision === null ? null : Number(caseRevision), claimId, incidentClusterId?.trim() || null, normalizedType, normalizedOutcome, Number(weight), idempotencyKey, requestDigest, String(reason).trim(), policyVersion, actorId, supersedesEventId, JSON.stringify(evidenceRevisionIds)]
      );
      const events = await client.query(
        `SELECT event_type, outcome, weight, idempotency_key, case_id, incident_cluster_id, supersedes_event_id, created_at
           FROM private.expert_quality_events
          WHERE user_id = $1 AND domain_code = $2
          ORDER BY created_at ASC`,
        [userId, String(domainCode).toUpperCase()]
      );
      const quality = calculateQualityScore(events.rows);
      await appendOutbox(client, {
        eventType: "EXPERT_QUALITY_EVENT_RECORDED",
        aggregateType: "EXPERT_QUALITY_EVENT",
        aggregateId: String(inserted.rows[0].id),
        subject: userId,
        correlationId,
        payload: {
          qualityEventId: inserted.rows[0].id,
          userId,
          domainCode: String(domainCode).toUpperCase(),
          caseId,
          caseRevision: caseRevision === null ? null : Number(caseRevision),
          claimId,
          evidenceRevisionIds,
          incidentClusterId: incidentClusterId?.trim() || null,
          eventType: normalizedType,
          outcome: normalizedOutcome,
          policyVersion,
          qualityLabel: quality.label,
          sampleSize: quality.sampleSize,
        },
      });
      return { eventId: inserted.rows[0].id, idempotent: false, quality };
    });
  }

  static async getQualityProfile({ userId, domainCode, minSample = 20 }) {
    if (!userId || !domainCode) throw new ExpertRepositoryError("QUALITY_QUERY_INVALID", "Subject and domain are required.", 400);
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT event_type, outcome, weight, idempotency_key, case_id, case_revision, claim_id, evidence_revision_ids, incident_cluster_id, supersedes_event_id, created_at
         FROM private.expert_quality_events
        WHERE user_id = $1 AND domain_code = $2
        ORDER BY created_at ASC`,
      [userId, String(domainCode).toUpperCase()]
    );
    return calculateQualityScore(res.rows, { minSample });
  }
}
