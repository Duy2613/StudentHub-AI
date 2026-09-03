/**
 * StudentHub AI — ExpertRepository
 * 
 * Manages verified expert profiles, scoped domain verifications,
 * expert assessments on Trust cases, and reputation events.
 * 
 * INVARIANTS:
 * - Scoped authority: Experts can only submit assessments for domains where they are VERIFIED.
 * - Server-controlled verification: Verification status is stored in private.expert_verifications.
 * - Expert opinion is distinct from objective evidence.
 */

import { getPostgresPool } from "./PostgresPool.js";

export class ExpertRepository {
  /**
   * Upserts public expert profile.
   */
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

  /**
   * Server-controlled domain verification (Internal/Admin only).
   */
  static async setDomainVerification({ userId, domainCode, status, verifiedBy = null, evidenceRef = null }) {
    if (!userId || !domainCode || !["PENDING", "VERIFIED", "REJECTED", "REVOKED"].includes(status)) {
      throw new Error("Invalid verification parameters.");
    }
    const pool = getPostgresPool();
    const res = await pool.query(
      `INSERT INTO private.expert_verifications (user_id, domain_code, status, verified_by, verified_at, evidence_ref)
       VALUES ($1, $2, $3, $4, now(), $5)
       ON CONFLICT (user_id, domain_code) DO UPDATE
       SET status = EXCLUDED.status, verified_by = EXCLUDED.verified_by, verified_at = now(), evidence_ref = EXCLUDED.evidence_ref
       RETURNING user_id, domain_code, status, verified_at`,
      [userId, domainCode, status, verifiedBy, evidenceRef]
    );
    return res.rows[0];
  }

  /**
   * Retrieves verified domains for an expert.
   */
  static async getVerifiedDomains(userId) {
    if (!userId) return [];
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT domain_code, verified_at, evidence_ref
       FROM private.expert_verifications
       WHERE user_id = $1 AND status = 'VERIFIED'`,
      [userId]
    );
    return res.rows.map((r) => r.domain_code);
  }

  /**
   * Submits an assessment on a Trust Case.
   * STRICT AUTHORITY CHECK: Rejects submission if expert is not VERIFIED in the specified domain.
   */
  static async submitAssessment({ expertId, caseId, domainCode, assessment, confidence = 0.9 }) {
    if (!expertId || !caseId || !domainCode || !assessment) {
      throw new Error("expertId, caseId, domainCode, and assessment are required.");
    }

    const pool = getPostgresPool();

    // 1. Check verified authority scope in private.expert_verifications
    const verified = await pool.query(
      `SELECT status FROM private.expert_verifications WHERE user_id = $1 AND domain_code = $2`,
      [expertId, domainCode]
    );

    if (verified.rows.length === 0 || verified.rows[0].status !== "VERIFIED") {
      throw new Error(`UNVERIFIED_EXPERT_DOMAIN: Expert ${expertId} is not verified for domain ${domainCode}.`);
    }

    // 2. Insert assessment into public.expert_assessments
    const res = await pool.query(
      `INSERT INTO public.expert_assessments (expert_id, case_id, domain_code, assessment, confidence, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (expert_id, case_id, domain_code) DO UPDATE
       SET assessment = EXCLUDED.assessment, confidence = EXCLUDED.confidence, created_at = now()
       RETURNING id, expert_id, case_id, domain_code, assessment, confidence, created_at`,
      [expertId, caseId, domainCode, JSON.stringify(assessment), confidence]
    );

    // 3. Record reputation event
    await pool.query(
      `INSERT INTO private.reputation_events (user_id, domain_code, event_type, delta, reason, actor_id, created_at)
       VALUES ($1, $2, 'ASSESSMENT_SUBMITTED', 1.0, 'Substantive assessment on Trust Case', $1, now())`,
      [expertId, domainCode]
    );

    return res.rows[0];
  }

  /**
   * Retrieves assessments attached to a Trust Case.
   */
  static async getAssessmentsForCase(caseId) {
    if (!caseId) return [];
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT ea.id, ea.expert_id, ea.domain_code, ea.assessment, ea.confidence, ea.created_at,
              ep.public_title
       FROM public.expert_assessments ea
       LEFT JOIN public.expert_profiles ep ON ea.expert_id = ep.user_id
       WHERE ea.case_id = $1
       ORDER BY ea.created_at ASC`,
      [caseId]
    );
    return res.rows;
  }
}
