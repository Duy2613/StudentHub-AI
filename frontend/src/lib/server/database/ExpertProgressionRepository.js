import { getPostgresPool } from "./PostgresPool.js";
import { calculateQualityScore } from "../../communityExpert/promaxDomain.js";

/**
 * ExpertProgressionRepository
 *
 * Implements Expert Trust Network V3 Progression Projections.
 * CRITICAL INVARIANT: expert_quality_events remains the sole source of truth.
 * Stars (1-5) and reputation scores are derived projections only and can NEVER
 * write back authority or grant qualification.
 *
 * Sufficiency threshold strictly preserves minSample = 20 independent units.
 */
export class ExpertProgressionRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async getProgression(userId, domainCode = "GENERAL") {
    if (!userId) return null;
    const normalizedDomain = String(domainCode || "GENERAL").trim().toUpperCase();
    const result = await this.pool.query(
      `SELECT * FROM public.expert_progression_projections
       WHERE user_id = $1 AND domain_code = $2`,
      [userId, normalizedDomain]
    );

    if (result.rows.length === 0) {
      // Lazy calculate if projection row does not exist yet
      return await this.recalculateProgression(userId, normalizedDomain);
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      domainCode: row.domain_code,
      adjudicatedCount: row.adjudicated_count,
      upheldCount: row.upheld_count,
      overturnedCount: row.overturned_count,
      rawQualityScore: Number(row.raw_quality_score),
      starLevel: row.star_level,
      sufficiencyState: row.sufficiency_state,
      missionsCompletedCount: row.missions_completed_count,
      lastCalculatedAt: row.last_calculated_at,
      isDerivedOnly: true,
    };
  }

  async recalculateProgression(userId, domainCode = "GENERAL") {
    if (!userId) return null;
    const normalizedDomain = String(domainCode || "GENERAL").trim().toUpperCase();

    // 1. Fetch raw quality events (the immutable source of truth)
    const eventsResult = await this.pool.query(
      `SELECT * FROM private.expert_quality_events
       WHERE user_id = $1 AND domain_code = $2
       ORDER BY created_at ASC`,
      [userId, normalizedDomain]
    );

    const normalizedEvents = (eventsResult.rows || []).map((r) => ({
      idempotencyKey: r.idempotency_key || r.idempotencyKey || r.id,
      eventType: r.event_type || r.eventType,
      outcome: r.outcome,
      weight: r.weight,
      incidentClusterId: r.incident_cluster_id || r.incidentClusterId,
      createdAt: r.created_at || r.createdAt,
    }));
    const qualityResult = calculateQualityScore(normalizedEvents, { minSample: 20 });
    const sampleSize = qualityResult.sampleSize || 0;
    const isSufficient = !qualityResult.insufficientData && sampleSize >= 20;
    const score = qualityResult.score || 0;

    // 2. Derive star level (1-5)
    let starLevel = 1;
    if (isSufficient) {
      if (score >= 0.95) starLevel = 5;
      else if (score >= 0.85) starLevel = 4;
      else if (score >= 0.70) starLevel = 3;
      else if (score >= 0.50) starLevel = 2;
      else starLevel = 1;
    }

    // 3. Count completed expert reviews / missions
    const missionsResult = await this.pool.query(
      `SELECT count(*)::int as count FROM public.expert_assessments
       WHERE expert_id = $1 AND assessment_state = 'ACCEPTED'`,
      [userId]
    );
    const missionsCompletedCount = missionsResult.rows[0]?.count || 0;

    const upheldCount = eventsResult.rows.filter(
      (e) => e.outcome === "SUPPORT" || e.outcome === "CORRECT"
    ).length;
    const overturnedCount = eventsResult.rows.filter(
      (e) => e.outcome === "CONTRADICT" || e.outcome === "INCORRECT"
    ).length;
    const sufficiencyState = isSufficient ? "SUFFICIENT" : "INSUFFICIENT_DATA";

    // 4. Upsert projection (derived projection table only)
    await this.pool.query(
      `INSERT INTO public.expert_progression_projections (
        user_id, domain_code, adjudicated_count, upheld_count, overturned_count,
        raw_quality_score, star_level, sufficiency_state, missions_completed_count,
        last_calculated_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
      ON CONFLICT (user_id, domain_code) DO UPDATE SET
        adjudicated_count = EXCLUDED.adjudicated_count,
        upheld_count = EXCLUDED.upheld_count,
        overturned_count = EXCLUDED.overturned_count,
        raw_quality_score = EXCLUDED.raw_quality_score,
        star_level = EXCLUDED.star_level,
        sufficiency_state = EXCLUDED.sufficiency_state,
        missions_completed_count = EXCLUDED.missions_completed_count,
        last_calculated_at = now(),
        updated_at = now()`,
      [
        userId,
        normalizedDomain,
        sampleSize,
        upheldCount,
        overturnedCount,
        score,
        starLevel,
        sufficiencyState,
        missionsCompletedCount,
      ]
    );

    return {
      userId,
      domainCode: normalizedDomain,
      adjudicatedCount: sampleSize,
      upheldCount,
      overturnedCount,
      rawQualityScore: score,
      starLevel,
      sufficiencyState,
      missionsCompletedCount,
      isDerivedOnly: true,
    };
  }

  async getLeaderboard({ domainCode = "GENERAL", limit = 10 } = {}) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50);
    const normalizedDomain = String(domainCode || "GENERAL").trim().toUpperCase();
    const result = await this.pool.query(
      `SELECT p.*,
              coalesce(u.raw_user_meta_data->>'full_name', 'Chuyên gia ẩn danh') as full_name
       FROM public.expert_progression_projections p
       JOIN auth.users u ON u.id = p.user_id
       WHERE p.domain_code = $1
         AND p.sufficiency_state = 'SUFFICIENT'
       ORDER BY p.star_level DESC, p.raw_quality_score DESC, p.missions_completed_count DESC
       LIMIT $2`,
      [normalizedDomain, safeLimit]
    );

    return result.rows.map((r) => ({
      userId: r.user_id,
      fullName: r.full_name,
      domainCode: r.domain_code,
      starLevel: r.star_level,
      rawQualityScore: Number(r.raw_quality_score),
      adjudicatedCount: r.adjudicated_count,
      missionsCompletedCount: r.missions_completed_count,
    }));
  }
}
