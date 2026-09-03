/**
 * StudentHub AI — Authoritative Source Registry & Provenance Quality Engine
 * 
 * Implements Tier 1 to Tier 4 governance:
 * - Tier 1: Gold / Official (University, Government, Ministries, Police, Human-verified)
 * - Tier 2: Corroborated (Reputable media, Multi-source confirmed public community)
 * - Tier 3: Unverified (Anonymous post, user screenshot, unverified discussion)
 * - Tier 4: Synthetic (Adversarial edge cases, OCR degradation, augmentation)
 */

export const SOURCE_TIERS = {
  TIER_1_OFFICIAL: {
    id: "TIER_1_OFFICIAL",
    label: "Nguồn Chính Thức (Gold / Official)",
    baseReliability: 0.98,
    authorityWeight: 1.0,
    requiresCorroboration: false,
    allowGoldDataset: true,
  },
  TIER_2_CORROBORATED: {
    id: "TIER_2_CORROBORATED",
    label: "Nguồn Xác Minh Độc Lập (Corroborated)",
    baseReliability: 0.78,
    authorityWeight: 0.8,
    requiresCorroboration: true,
    minIndependentSources: 2,
    allowGoldDataset: false,
  },
  TIER_3_UNVERIFIED: {
    id: "TIER_3_UNVERIFIED",
    label: "Nguồn Cộng Đồng Chưa Kiểm Chứng (Unverified)",
    baseReliability: 0.40,
    authorityWeight: 0.4,
    requiresCorroboration: true,
    allowGoldDataset: false,
  },
  TIER_4_SYNTHETIC: {
    id: "TIER_4_SYNTHETIC",
    label: "Dữ Liệu Thử Nghiệm / Tấn Công (Synthetic / Red-Team)",
    baseReliability: 0.20,
    authorityWeight: 0.1,
    isSynthetic: true,
    allowGoldDataset: false,
  },
};

export const CLAIM_TYPES = {
  FACT: "FACT",                               // Thông tin xác thực có căn cứ công văn
  OFFICIAL_INFORMATION: "OFFICIAL_INFORMATION", // Thông báo chính thức từ nhà trường/cơ quan
  OPINION: "OPINION",                         // Ý kiến / cảm nhận cá nhân sinh viên
  ALLEGATION: "ALLEGATION",                   // Cáo buộc chưa qua đối chất
  RUMOR: "RUMOR",                             // Tin đồn truyền miệng
  USER_REPORT: "USER_REPORT",                 // Báo cáo hiện trường từ người dùng
  INFERRED_INFORMATION: "INFERRED_INFORMATION", // Suy luận từ mô hình AI
  UNKNOWN: "UNKNOWN",                         // Chưa xác định
};

export const FRESHNESS_POLICIES = {
  EMERGENCY: { decayUnit: "hours", halfLife: 2, maxValidityHours: 12 },
  TRAFFIC_SAFETY: { decayUnit: "hours", halfLife: 6, maxValidityHours: 24 },
  ANNOUNCEMENT: { decayUnit: "days", halfLife: 30, maxValidityHours: 365 },
  TEACHER_REVIEW: { decayUnit: "months", halfLife: 6, maxValidityHours: 720 },
  REGULATION: { decayUnit: "indefinite", halfLife: 365, maxValidityHours: null },
};

/**
 * 6-Question Provenance Evaluator
 * Evaluates whether a record satisfies the 6-question provenance standard.
 */
export function evaluateDataProvenance(record) {
  const checks = {
    hasPublisher: Boolean(record?.publisher && record.publisher.trim().length > 0),
    hasSourceOrigin: Boolean(record?.source_url || record?.source_domain),
    hasRetrievalTimestamp: Boolean(record?.retrieved_at || record?.published_at),
    hasValidityRange: Boolean(record?.valid_from !== undefined || record?.valid_to !== undefined || record?.valid_until !== undefined),
    hasCorroboration: Boolean(record?.corroboration_sources && record.corroboration_sources.length > 0),
    hasContentHash: Boolean(record?.content_hash || record?.evidence_doc_id),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const isGoldEligible = checks.hasPublisher && checks.hasSourceOrigin && checks.hasRetrievalTimestamp;

  return {
    checks,
    passedCount,
    totalChecks: 6,
    isGoldEligible,
    provenanceScore: Number((passedCount / 6).toFixed(2)),
  };
}

/**
 * Freshness Decay Calculator
 */
export function calculateFreshnessScore(publishedAt, policyType = "ANNOUNCEMENT") {
  if (!publishedAt) return { score: 0.5, status: "AGING" };

  const policy = FRESHNESS_POLICIES[policyType] || FRESHNESS_POLICIES.ANNOUNCEMENT;
  const now = new Date().getTime();
  const pubTime = new Date(publishedAt).getTime();
  const diffHours = Math.max(0, (now - pubTime) / (1000 * 60 * 60));

  if (policy.maxValidityHours && diffHours > policy.maxValidityHours) {
    return { score: 0.1, status: "EXPIRED", ageHours: diffHours };
  }

  // Exponential decay
  const halfLifeHours = policy.decayUnit === "days" ? policy.halfLife * 24 : policy.decayUnit === "months" ? policy.halfLife * 30 * 24 : policy.halfLife;
  const decayScore = Math.exp((-Math.LN2 * diffHours) / Math.max(1, halfLifeHours));

  let status = "FRESH";
  if (decayScore < 0.4) status = "STALE";
  else if (decayScore < 0.75) status = "AGING";

  return {
    score: Number(decayScore.toFixed(3)),
    status,
    ageHours: Math.round(diffHours),
  };
}
