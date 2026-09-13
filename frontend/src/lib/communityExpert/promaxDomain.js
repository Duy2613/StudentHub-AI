/**
 * StudentHub AI — Community + Expert Promax domain contract.
 *
 * This module is deliberately storage agnostic.  It is the single contract
 * used by the durable repositories and by tests to keep state, privacy,
 * ranking, qualification, and reputation decisions deterministic.
 */

export const PUBLICATION_STATES = Object.freeze([
  "DRAFT",
  "PRIVACY_SCAN_PENDING",
  "PREVIEW_READY",
  "PUBLISHED",
  "EDITED",
  "WITHDRAWN",
  "MODERATED",
  "BLOCKED",
]);

export const EVIDENCE_STATES = Object.freeze([
  "UNKNOWN",
  "INSUFFICIENT",
  "SUPPORTING",
  "CONTRADICTORY",
  "MIXED",
  "STALE",
  "SUPERSEDED",
]);

export const REVIEW_STATES = Object.freeze([
  "UNASSIGNED",
  "ASSIGNED",
  "IN_REVIEW",
  "CONFLICT",
  "NEEDS_THIRD_REVIEW",
  "RESOLVED",
  "APPEALED",
  "SUPERSEDED",
]);

export const QUALIFICATION_STATES = Object.freeze([
  "APPLICANT",
  "IDENTITY_CHECKED",
  "QUIZ_PASSED",
  "PRACTICE_REVIEW",
  "TRAINEE",
  "DOMAIN_VERIFIED",
  "SUSPENDED",
  "EXPIRED",
  "REVOKED",
]);

export const CONTRIBUTION_TYPES = Object.freeze([
  "DIRECT_EXPERIENCE",
  "FOUND_SOURCE",
  "NEEDS_VERIFICATION",
  "SUPPORTING_EVIDENCE",
  "CONTRADICTING_EVIDENCE",
  "CONTEXT",
  "CRITIQUE",
]);

export const REACTION_KINDS = Object.freeze([
  "HELPFUL",
  "ADD_EVIDENCE",
  "CHALLENGE",
  "INSUFFICIENT_INFORMATION",
  "REPORT_ABUSE",
]);

export const EXPERT_ROLES = Object.freeze([
  "MEMBER",
  "EVALUATED_CONTRIBUTOR",
  "TRAINEE_REVIEWER",
  "DOMAIN_VERIFIED_EXPERT",
  "COORDINATOR_APPEALS_REVIEWER",
]);

export const RANKING_POLICY_VERSION = "community-ranking-v1";
export const REPUTATION_POLICY_VERSION = "expert-quality-v1";
export const DISAGREEMENT_STATES = Object.freeze(["UNASSIGNED", "CONFLICT", "NEEDS_THIRD_REVIEW", "RESOLVED", "UNRESOLVED"]);

export const RANKING_WEIGHTS = Object.freeze({
  relevance: 0.45,
  evidenceQuality: 0.30,
  temporalValidity: 0.10,
  independentHelpfulness: 0.10,
  authorDomainReliability: 0.05,
});

const MATERIAL_CONTRIBUTIONS = new Set([
  "DIRECT_EXPERIENCE",
  "FOUND_SOURCE",
  "NEEDS_VERIFICATION",
  "SUPPORTING_EVIDENCE",
  "CONTRADICTING_EVIDENCE",
]);

const TRANSITIONS = Object.freeze({
  publication: Object.freeze({
    DRAFT: ["PRIVACY_SCAN_PENDING", "BLOCKED"],
    PRIVACY_SCAN_PENDING: ["PREVIEW_READY", "BLOCKED"],
    PREVIEW_READY: ["PUBLISHED", "BLOCKED"],
    PUBLISHED: ["EDITED", "WITHDRAWN", "MODERATED"],
    EDITED: ["PRIVACY_SCAN_PENDING", "BLOCKED"],
    MODERATED: ["PUBLISHED", "WITHDRAWN", "BLOCKED"],
    BLOCKED: ["DRAFT"],
    WITHDRAWN: ["EDITED"],
  }),
  evidence: Object.freeze({
    UNKNOWN: ["INSUFFICIENT", "SUPPORTING", "CONTRADICTORY", "MIXED", "STALE", "SUPERSEDED"],
    INSUFFICIENT: ["SUPPORTING", "CONTRADICTORY", "MIXED", "STALE", "SUPERSEDED"],
    SUPPORTING: ["MIXED", "STALE", "SUPERSEDED"],
    CONTRADICTORY: ["MIXED", "STALE", "SUPERSEDED"],
    MIXED: ["SUPPORTING", "CONTRADICTORY", "STALE", "SUPERSEDED"],
    STALE: ["SUPPORTING", "CONTRADICTORY", "MIXED", "SUPERSEDED"],
    SUPERSEDED: [],
  }),
  review: Object.freeze({
    UNASSIGNED: ["ASSIGNED"],
    ASSIGNED: ["IN_REVIEW", "CONFLICT"],
    IN_REVIEW: ["RESOLVED", "CONFLICT", "NEEDS_THIRD_REVIEW"],
    CONFLICT: ["NEEDS_THIRD_REVIEW", "RESOLVED"],
    NEEDS_THIRD_REVIEW: ["RESOLVED", "CONFLICT"],
    RESOLVED: ["APPEALED", "SUPERSEDED"],
    APPEALED: ["IN_REVIEW", "RESOLVED", "NEEDS_THIRD_REVIEW"],
    SUPERSEDED: [],
  }),
  qualification: Object.freeze({
    APPLICANT: ["IDENTITY_CHECKED", "SUSPENDED", "REVOKED"],
    IDENTITY_CHECKED: ["QUIZ_PASSED", "PRACTICE_REVIEW", "SUSPENDED", "REVOKED"],
    QUIZ_PASSED: ["PRACTICE_REVIEW", "SUSPENDED", "REVOKED"],
    PRACTICE_REVIEW: ["TRAINEE", "SUSPENDED", "REVOKED"],
    TRAINEE: ["DOMAIN_VERIFIED", "PRACTICE_REVIEW", "SUSPENDED", "REVOKED"],
    DOMAIN_VERIFIED: ["SUSPENDED", "EXPIRED", "REVOKED"],
    SUSPENDED: ["DOMAIN_VERIFIED", "EXPIRED", "REVOKED"],
    EXPIRED: ["APPLICANT", "IDENTITY_CHECKED", "REVOKED"],
    REVOKED: ["APPLICANT"],
  }),
});

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function boundedNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

export function transitionState(machine, current, next) {
  const key = text(machine).toLowerCase();
  const from = text(current).toUpperCase();
  const to = text(next).toUpperCase();
  const transitions = TRANSITIONS[key];
  if (!transitions || !Object.hasOwn(transitions, from)) {
    return { ok: false, code: "STATE_MACHINE_UNKNOWN", machine: key, current: from, next: to };
  }
  if (from === to) return { ok: true, machine: key, current: from, next: to, idempotent: true };
  if (!transitions[from].includes(to)) {
    return { ok: false, code: "STATE_TRANSITION_INVALID", machine: key, current: from, next: to };
  }
  return { ok: true, machine: key, current: from, next: to, idempotent: false };
}

export function isMaterialContribution(type) {
  return MATERIAL_CONTRIBUTIONS.has(text(type).toUpperCase());
}

export function validateContributionInput(input = {}) {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const caseId = text(value.caseId || value.caseScope?.caseId);
  const caseRevision = Number(value.caseRevision ?? value.caseScope?.caseRevision);
  const contributionType = text(value.contributionType || "DIRECT_EXPERIENCE").toUpperCase();
  const statement = text(value.statement || value.content);
  const claimId = text(value.claimId);
  const evidenceRefs = Array.isArray(value.evidenceRefs)
    ? value.evidenceRefs.map((entry) => text(typeof entry === "string" ? entry : entry?.id)).filter(Boolean).slice(0, 50)
    : [];
  const errors = [];
  if (!caseId || caseId.length > 160) errors.push("caseId");
  if (!Number.isInteger(caseRevision) || caseRevision < 1) errors.push("caseRevision");
  if (!CONTRIBUTION_TYPES.includes(contributionType)) errors.push("contributionType");
  if (statement.length < 20 || statement.length > 20_000) errors.push("statement");
  if (isMaterialContribution(contributionType) && !claimId) errors.push("claimId");
  return {
    ok: errors.length === 0,
    code: errors.length ? "CONTRIBUTION_INPUT_INVALID" : null,
    errors,
    value: {
      caseId,
      caseRevision,
      claimId: claimId || null,
      contributionType,
      statement,
      evidenceRefs,
    },
  };
}

const PII_PATTERNS = Object.freeze([
  ["EMAIL", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["PHONE", /(?<!\d)(?:\+?84|0)(?:[ .-]?\d){8,10}(?!\d)/g],
  ["STUDENT_ID", /\b(?:SV|MSV|MSSV|STUDENT[-_ ]?ID)[:# -]*[A-Z0-9-]{5,20}\b/gi],
  ["BANK_ACCOUNT", /\b(?:TK|STK|ACCOUNT|BANK|T[AÀ]I\s*KHO[AẢ]N(?:\s+NG[AÂ]N\s+H[AÀ]NG)?|SỐ\s*T[AÀ]I\s*KHO[AẢ]N|SO\s+TAI\s+KHOAN)[ :#-]*\d{8,20}\b/giu],
  ["IDENTITY_DOCUMENT", /\b(?:CCCD|CMND|PASSPORT|ID\s*CARD)[ :#-]*[A-Z0-9-]{6,20}\b/gi],
  ["QR_DATA", /\b(?:QR|QRCODE|QR\s*DATA)[:=][^\s]{6,}\b/gi],
  // Require a numeric street token after the address marker. A bare English
  // "so ..." sentence is ordinary discussion text, not an address. Keeping
  // the numeric boundary preserves concrete address blocking while avoiding
  // false positives in legitimate Community/Expert discussion.
  ["PRECISE_ADDRESS", /\b(?:số|so|street|st\.?|đường|duong|ngõ|ngo|phường|phuong|quận|quan|district)[ .:#-]+(?=[0-9][A-Z0-9À-ỹ .,#/-]{4,80}\b)[A-Z0-9À-ỹ .,#/-]{5,80}\b/giu],
]);

function metadataFindings(metadata = {}) {
  const findings = [];
  if (metadata?.imageVisibleIdentifiers === true || metadata?.ocrContainsIdentity === true) findings.push("IMAGE_VISIBLE_IDENTIFIER");
  if (metadata?.locationMetadata === true || metadata?.exifLocation === true) findings.push("LOCATION_METADATA");
  if (metadata?.qrData) findings.push("QR_DATA");
  if (metadata?.identityDocument === true) findings.push("IDENTITY_DOCUMENT");
  if (metadata?.bankAccount) findings.push("BANK_ACCOUNT");
  return findings;
}

export function detectPII(value, metadata = {}) {
  const source = text(value);
  const findings = [];
  for (const [type, pattern] of PII_PATTERNS) {
    const matches = source.match(pattern);
    if (matches?.length) findings.push({ type, count: matches.length });
  }
  for (const type of metadataFindings(metadata)) {
    const existing = findings.find((entry) => entry.type === type);
    if (existing) existing.count += 1;
    else findings.push({ type, count: 1 });
  }
  return {
    hasPII: findings.length > 0,
    findings,
    blocked: findings.some(({ type }) => ["IDENTITY_DOCUMENT", "IMAGE_VISIBLE_IDENTIFIER", "QR_DATA", "LOCATION_METADATA", "PRECISE_ADDRESS", "BANK_ACCOUNT"].includes(type)),
    policyVersion: "privacy-scan-v1",
  };
}

export function redactText(value) {
  let output = String(value ?? "");
  for (const [type, pattern] of PII_PATTERNS) {
    output = output.replace(pattern, `[REDACTED_${type}]`);
  }
  return output;
}

function canonicalizeLocator(value) {
  const raw = text(value);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw.toLowerCase().replace(/\/$/, "");
  }
}

export function canonicalizeSource(source = {}) {
  const rawUrl = text(source.url || source.canonicalUrl);
  const canonicalUrl = canonicalizeLocator(rawUrl);
  const publisher = text(source.publisher || source.domain).toLowerCase();
  const contentDigest = text(source.contentDigest || source.hash).toLowerCase();
  // A syndication/original-source hint is stronger than the account or
  // publisher that reposted it.  When no hint exists, keep the publisher or
  // canonical URL as an explicit, conservative independence key.
  const originalSource = canonicalizeLocator(source.originalSource || source.originalUrl || source.originUrl);
  const syndicationChain = Array.isArray(source.syndicationChain)
    ? source.syndicationChain.map((entry) => canonicalizeLocator(typeof entry === "string" ? entry : entry?.url || entry?.publisher)).filter(Boolean).slice(0, 20)
    : [];
  const independenceKey = text(source.independenceKey || originalSource || syndicationChain[0] || publisher || canonicalUrl).toLowerCase();
  return { canonicalUrl, publisher, contentDigest, originalSource, syndicationChain, independenceKey };
}

export function clusterSource(source = {}) {
  const canonical = canonicalizeSource(source);
  const basis = canonical.contentDigest || canonical.canonicalUrl || `${canonical.publisher}:${canonical.independenceKey}`;
  return {
    ...canonical,
    sourceClusterKey: `${canonical.independenceKey}|${basis}`.slice(0, 500),
    isIndependentFrom: (other) => {
      const candidate = canonicalizeSource(other);
      if (canonical.contentDigest && candidate.contentDigest && canonical.contentDigest === candidate.contentDigest) return false;
      return canonical.independenceKey !== candidate.independenceKey;
    },
  };
}

function evidenceQuality(candidate = {}) {
  const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];
  if (evidence.length === 0) return boundedNumber(candidate.evidenceQuality, 0);
  let total = 0;
  for (const item of evidence) {
    const relationship = text(item.relationship || item.relation).toUpperCase();
    const provenance = boundedNumber(item.provenanceQuality ?? item.provenance, 0.5);
    const sourceType = boundedNumber(item.sourceTypeQuality ?? item.sourceQuality, 0.5);
    const freshness = boundedNumber(item.freshness ?? item.temporalValidity, 0.5);
    const independence = boundedNumber(item.independence, 0.5);
    const context = boundedNumber(item.contextCompleteness ?? item.context, 0.5);
    const relationshipScore = relationship === "SUPPORTS" || relationship === "SUPPORTING" ? 1 : relationship === "CONTRADICTS" || relationship === "CONTRADICTORY" ? 0.8 : 0.45;
    total += relationshipScore * 0.25 + provenance * 0.25 + sourceType * 0.2 + freshness * 0.15 + independence * 0.1 + context * 0.05;
  }
  return boundedNumber(total / evidence.length, 0);
}

function temporalValidity(candidate = {}, now) {
  const explicit = candidate.temporalValidity;
  if (explicit !== undefined) return boundedNumber(explicit, 0);
  const observedAt = Date.parse(candidate.observedAt || candidate.createdAt || "");
  if (!Number.isFinite(observedAt)) return 0.5;
  const ageDays = Math.max(0, (now - observedAt) / 86_400_000);
  return Math.exp(-ageDays / 365);
}

export function rankCommunityContribution(candidate = {}, now = Date.now()) {
  const relevance = boundedNumber(candidate.relevance, 0);
  const quality = evidenceQuality(candidate);
  const temporal = temporalValidity(candidate, now);
  const helpful = boundedNumber(candidate.independentHelpfulness ?? candidate.helpfulness, 0);
  const reliability = boundedNumber(candidate.authorDomainReliability ?? candidate.authorReliability, 0.5);
  const score = RANKING_WEIGHTS.relevance * relevance
    + RANKING_WEIGHTS.evidenceQuality * quality
    + RANKING_WEIGHTS.temporalValidity * temporal
    + RANKING_WEIGHTS.independentHelpfulness * helpful
    + RANKING_WEIGHTS.authorDomainReliability * reliability;
  const reasons = [];
  if (relevance >= 0.7) reasons.push("Highly relevant to this claim");
  if (quality >= 0.7) reasons.push("Contains stronger source-linked evidence");
  if (temporal >= 0.7) reasons.push("Recently observed or updated");
  if (candidate.reviewState && ["UNASSIGNED", "ASSIGNED", "IN_REVIEW", "CONFLICT", "NEEDS_THIRD_REVIEW"].includes(String(candidate.reviewState).toUpperCase())) {
    reasons.push("Needs additional review");
  }
  if (reasons.length === 0) reasons.push("Relevant community signal; Trust remains authoritative");
  return {
    score: Number(score.toFixed(6)),
    policyVersion: RANKING_POLICY_VERSION,
    reasons,
    components: {
      relevance: Number(relevance.toFixed(6)),
      evidenceQuality: Number(quality.toFixed(6)),
      temporalValidity: Number(temporal.toFixed(6)),
      independentHelpfulness: Number(helpful.toFixed(6)),
      authorDomainReliability: Number(reliability.toFixed(6)),
    },
  };
}

export const COMMUNITY_TRACK_RECORD_POLICY_VERSION = "community-track-record-v1";
export const COMMUNITY_EXPERT_CANDIDATE_THRESHOLD = 100;
export const COMMUNITY_TRACK_RECORD_POLICY = Object.freeze({
  version: COMMUNITY_TRACK_RECORD_POLICY_VERSION,
  maxPoints: 100,
  points: Object.freeze({
    publishedContribution: 10,
    evidenceLinkedContribution: 5,
    distinctCase: 2,
    independentHelpfulReaction: 2,
    challengePenalty: 1,
  }),
  stars: Object.freeze({
    thresholds: Object.freeze([0, 20, 40, 60, 80, 100]),
    fiveStarMinimumEvaluatedOutcomes: 3,
    fiveStarMinimumStabilityDays: 30,
    recentActivityWindowDays: 180,
    sanctionsBlockFiveStars: true,
  }),
});

function recentActivityFor(summary, now) {
  if (typeof summary.recentActivity === "boolean") return summary.recentActivity;
  const lastActivity = Date.parse(summary.lastActivityAt || summary.last_activity_at || "");
  const asOf = Date.parse(summary.asOf || summary.as_of || "") || now;
  if (!Number.isFinite(lastActivity)) return false;
  return asOf >= lastActivity && asOf - lastActivity <= COMMUNITY_TRACK_RECORD_POLICY.stars.recentActivityWindowDays * 86_400_000;
}

/**
 * Calculates the contributor projection from server-owned counters. Reactions
 * are quality signals, never truth votes, and a candidate flag only opens the
 * human-controlled qualification path.
 */
export function calculateCommunityTrackRecord(summary = {}, { now = Date.now() } = {}) {
  const publishedContributions = Math.max(0, Number(summary.publishedContributions) || 0);
  const evidenceLinkedContributions = Math.max(0, Number(summary.evidenceLinkedContributions) || 0);
  const distinctCases = Math.max(0, Number(summary.distinctCases) || 0);
  const helpfulReactions = Math.max(0, Number(summary.helpfulReactions) || 0);
  const challengeReactions = Math.max(0, Number(summary.challengeReactions) || 0);
  const qualityEventCount = Math.max(0, Number(summary.qualityEventCount) || 0);
  const evaluatedOutcomes = Math.max(0, Number(summary.evaluatedOutcomes ?? summary.evaluated_outcomes) || 0);
  const stabilityDays = Math.max(0, Number(summary.stabilityDays ?? summary.stability_days) || 0);
  const sanctionsActive = Boolean(summary.sanctionsActive ?? summary.sanctions_active);
  const recentActivity = recentActivityFor(summary, now);
  const components = {
    contribution: Math.min(50, publishedContributions * COMMUNITY_TRACK_RECORD_POLICY.points.publishedContribution),
    evidence: Math.min(25, evidenceLinkedContributions * COMMUNITY_TRACK_RECORD_POLICY.points.evidenceLinkedContribution),
    breadth: Math.min(10, distinctCases * COMMUNITY_TRACK_RECORD_POLICY.points.distinctCase),
    helpfulness: Math.min(20, helpfulReactions * COMMUNITY_TRACK_RECORD_POLICY.points.independentHelpfulReaction),
    challengePenalty: Math.min(15, challengeReactions * COMMUNITY_TRACK_RECORD_POLICY.points.challengePenalty),
  };
  const points = Math.max(0, Math.min(100, components.contribution + components.evidence + components.breadth + components.helpfulness - components.challengePenalty));
  const baseStars = Math.min(5, Math.floor(points / 20));
  const starGateReasons = [];
  if (baseStars >= 5 && evaluatedOutcomes < COMMUNITY_TRACK_RECORD_POLICY.stars.fiveStarMinimumEvaluatedOutcomes) starGateReasons.push("EVALUATED_OUTCOMES_REQUIRED");
  if (baseStars >= 5 && stabilityDays < COMMUNITY_TRACK_RECORD_POLICY.stars.fiveStarMinimumStabilityDays) starGateReasons.push("STABILITY_WINDOW_REQUIRED");
  if (baseStars >= 5 && !recentActivity) starGateReasons.push("RECENT_ACTIVITY_REQUIRED");
  if (baseStars >= 5 && COMMUNITY_TRACK_RECORD_POLICY.stars.sanctionsBlockFiveStars && sanctionsActive) starGateReasons.push("ACTIVE_SANCTION_BLOCKS_FIVE_STARS");
  const stars = starGateReasons.length > 0 ? Math.min(4, baseStars) : baseStars;
  const expertCandidate = points >= COMMUNITY_EXPERT_CANDIDATE_THRESHOLD
    && stars === 5
    && publishedContributions >= 3
    && evidenceLinkedContributions >= 2
    && evaluatedOutcomes >= COMMUNITY_TRACK_RECORD_POLICY.stars.fiveStarMinimumEvaluatedOutcomes
    && stabilityDays >= COMMUNITY_TRACK_RECORD_POLICY.stars.fiveStarMinimumStabilityDays
    && recentActivity
    && !sanctionsActive;
  return {
    points,
    stars,
    baseStars,
    maxPoints: 100,
    expertCandidate,
    qualificationGate: expertCandidate ? "HUMAN_QUALIFICATION_REQUIRED" : "COMMUNITY_TRACK_RECORD_IN_PROGRESS",
    policyVersion: COMMUNITY_TRACK_RECORD_POLICY_VERSION,
    qualityEventCount,
    evaluatedOutcomes,
    stabilityDays,
    sanctionsActive,
    recentActivity,
    starGate: {
      eligibleForFiveStars: starGateReasons.length === 0,
      reasons: starGateReasons,
      policy: COMMUNITY_TRACK_RECORD_POLICY.stars,
    },
    components,
    authority: "NON_AUTHORITATIVE",
    trustVerdictMutation: false,
  };
}

export const COMMUNITY_REACTION_INTEGRITY_POLICY_VERSION = "community-reaction-integrity-v1";

function reactionTime(row, fallback) {
  const parsed = Date.parse(row?.createdAt || row?.created_at || "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Detects coordinated reaction patterns as review signals. It never decides
 * guilt, subtracts points, hides content, or creates a sanction by itself.
 */
export function analyzeReactionIntegrity({ reactions = [], contributions = [], actorStates = [], now = Date.now(), burstWindowMs = 3_600_000, burstThreshold = 12 } = {}) {
  const rows = Array.isArray(reactions) ? reactions.filter((row) => row && typeof row === "object") : [];
  const signals = [];
  const tupleCounts = new Map();
  const idempotencyCounts = new Map();
  const actorTimes = new Map();
  const contributionById = new Map((Array.isArray(contributions) ? contributions : []).filter(Boolean).map((row) => [String(row.id || row.contributionId), row]));
  const stateByActor = new Map((Array.isArray(actorStates) ? actorStates : []).filter(Boolean).map((row) => [String(row.actorId || row.userId), row]));

  for (const row of rows) {
    const actorId = String(row.actorId || row.userId || "unknown");
    const contributionId = String(row.contributionId || row.contribution_id || "unknown");
    const kind = text(row.kind || "").toUpperCase();
    const tuple = `${actorId}|${contributionId}|${kind}`;
    tupleCounts.set(tuple, (tupleCounts.get(tuple) || 0) + 1);
    if (row.idempotencyKey || row.idempotency_key) {
      const key = String(row.idempotencyKey || row.idempotency_key);
      idempotencyCounts.set(`${actorId}|${key}`, (idempotencyCounts.get(`${actorId}|${key}`) || 0) + 1);
    }
    const timestamp = reactionTime(row, now);
    if (!actorTimes.has(actorId)) actorTimes.set(actorId, []);
    actorTimes.get(actorId).push(timestamp);

    const contribution = contributionById.get(contributionId);
    const publicationState = text(contribution?.publicationState || contribution?.publication_state).toUpperCase();
    if (contribution && publicationState && !["PUBLISHED", "EDITED"].includes(publicationState)) {
      signals.push({ code: "REACTION_TARGET_NOT_ACTIVE", actorId, contributionId });
    }
    const actorState = stateByActor.get(actorId);
    if (actorState?.suspendedAt || actorState?.suspended_at || text(actorState?.status).toUpperCase() === "SUSPENDED") {
      signals.push({ code: "REACTION_FROM_SUSPENDED_ACTOR", actorId, contributionId });
    }
  }

  for (const [tuple, count] of tupleCounts) {
    if (count > 1) signals.push({ code: "DUPLICATE_REACTION_TUPLE", tuple, count });
  }
  for (const [key, count] of idempotencyCounts) {
    if (count > 1) signals.push({ code: "DUPLICATE_REACTION_IDEMPOTENCY", key, count });
  }

  const actorClusters = new Map();
  for (const row of rows) {
    const cluster = row.identityClusterKey || row.identity_cluster_key;
    if (!cluster) continue;
    const actorId = String(row.actorId || row.userId || "unknown");
    if (!actorClusters.has(String(cluster))) actorClusters.set(String(cluster), new Set());
    actorClusters.get(String(cluster)).add(actorId);
  }
  for (const [identityClusterKey, actorIds] of actorClusters) {
    if (actorIds.size > 1) signals.push({ code: "MULTIPLE_ACCOUNTS_IDENTITY_CLUSTER", identityClusterKey, actorIds: [...actorIds].sort() });
  }

  for (const [actorId, timestamps] of actorTimes) {
    const recent = timestamps.filter((timestamp) => now - timestamp <= burstWindowMs);
    if (recent.length > burstThreshold) signals.push({ code: "REACTION_BURST", actorId, count: recent.length, windowMs: burstWindowMs });
  }

  const helpfulEdges = new Map();
  for (const row of rows) {
    if (text(row.kind).toUpperCase() !== "HELPFUL") continue;
    const actorId = String(row.actorId || row.userId || "unknown");
    const targetAuthorId = String(row.targetAuthorId || row.target_author_id || "");
    if (!targetAuthorId || targetAuthorId === actorId) continue;
    const edge = `${actorId}|${targetAuthorId}`;
    helpfulEdges.set(edge, reactionTime(row, now));
  }
  for (const [edge, timestamp] of helpfulEdges) {
    const [from, to] = edge.split("|");
    const reverse = helpfulEdges.get(`${to}|${from}`);
    if (reverse !== undefined && Math.abs(timestamp - reverse) <= burstWindowMs) {
      signals.push({ code: "RECIPROCAL_HELPFUL_RING_SIGNAL", actorIds: [from, to].sort() });
    }
  }

  const uniqueSignals = [...new Map(signals.map((signal) => [JSON.stringify(signal), signal])).values()];
  return {
    status: uniqueSignals.length ? "ABUSE_SIGNAL" : "CLEAN",
    abuseSignal: uniqueSignals.length > 0,
    automaticAction: "NONE",
    reviewRequired: uniqueSignals.length > 0,
    signals: uniqueSignals,
    policyVersion: COMMUNITY_REACTION_INTEGRITY_POLICY_VERSION,
  };
}

export function calculateQualityScore(events = [], { minSample = 20 } = {}) {
  const unique = new Map();
  for (const event of Array.isArray(events) ? events : []) {
    const key = text(event.idempotencyKey || event.eventId || `${event.caseId || "case"}:${event.createdAt || "event"}`);
    if (!key || unique.has(key)) continue;
    unique.set(key, event);
  }
  // Correlated claims from one incident count as one weighted unit.  The
  // caller supplies an incident cluster when it is known; unrelated cases
  // retain their own evidence weight.  Scaling the whole cluster preserves a
  // compensating reversal while keeping uncertainty honest.
  const clusterBuckets = new Map();
  for (const [key, event] of unique.entries()) {
    const cluster = text(event.incidentClusterId || event.incident_cluster_id);
    if (!cluster) continue;
    const weight = Math.max(0, Number(event.weight ?? 1) || 0);
    if (!clusterBuckets.has(cluster)) clusterBuckets.set(cluster, []);
    clusterBuckets.get(cluster).push({ key, weight });
  }
  const effectiveWeights = new Map();
  for (const entries of clusterBuckets.values()) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    const factor = total > 1 ? 1 / total : 1;
    for (const entry of entries) effectiveWeights.set(entry.key, entry.weight * factor);
  }
  let alpha = 2;
  let beta = 2;
  for (const [key, event] of unique.entries()) {
    const eventType = String(event.eventType || "").toUpperCase();
    if (!eventType.includes("ADJUDICATION") && eventType !== "MANUAL_CORRECTION") continue;
    const weight = effectiveWeights.has(key) ? effectiveWeights.get(key) : Math.max(0, Number(event.weight ?? 1) || 0);
    const outcome = text(event.outcome).toUpperCase();
    const reversed = eventType === "REVERSE_ADJUDICATION";
    if (["SUPPORT", "CORRECT", "ACCEPT", "POSITIVE"].includes(outcome)) { if (reversed) beta += weight; else alpha += weight; }
    else if (["CONTRADICT", "INCORRECT", "REJECT", "NEGATIVE"].includes(outcome)) { if (reversed) alpha += weight; else beta += weight; }
  }
  const sampleUnits = new Set();
  for (const [key, event] of unique.entries()) {
    const type = String(event.eventType || "").toUpperCase();
    if (type.includes("ADJUDICATION") || type === "MANUAL_CORRECTION") sampleUnits.add(text(event.incidentClusterId || event.incident_cluster_id) || key);
  }
  const sampleSize = sampleUnits.size;
  const score = alpha / (alpha + beta);
  const standardError = Math.sqrt((score * (1 - score)) / Math.max(1, alpha + beta + 1));
  return {
    score: Number(score.toFixed(6)),
    lowerBound: Number(Math.max(0, score - 1.96 * standardError).toFixed(6)),
    upperBound: Number(Math.min(1, score + 1.96 * standardError).toFixed(6)),
    sampleSize,
    insufficientData: sampleSize < minSample,
    label: sampleSize < minSample ? "INSUFFICIENT_DATA" : score >= 0.8 ? "RELIABLE" : score >= 0.6 ? "MIXED" : "UNRELIABLE",
    policyVersion: REPUTATION_POLICY_VERSION,
  };
}

export function canSubmitAssessment({ expertId, reviewerId, verifiedDomain, domainStatus, assignment, caseRevision, assessmentRevision, coiDeclared }) {
  if (!expertId || !verifiedDomain || String(domainStatus).toUpperCase() !== "VERIFIED") return { ok: false, code: "DOMAIN_NOT_VERIFIED" };
  if (!assignment || !["ASSIGNED", "IN_REVIEW"].includes(String(assignment.status).toUpperCase())) return { ok: false, code: "ASSIGNMENT_REQUIRED" };
  if (String(assignment.expertId || assignment.expert_id) !== String(expertId)) return { ok: false, code: "ASSIGNMENT_SUBJECT_MISMATCH" };
  if (assignment.caseRevision !== undefined && Number(assignment.caseRevision) !== Number(caseRevision)) return { ok: false, code: "STALE_CASE_REVISION" };
  if (assignment.conflictOfInterest || assignment.conflict_of_interest || coiDeclared === false) return { ok: false, code: "CONFLICT_OF_INTEREST" };
  if (reviewerId && String(reviewerId) === String(expertId)) return { ok: false, code: "SELF_REVIEW_FORBIDDEN" };
  if (assessmentRevision !== undefined && Number(assessmentRevision) !== Number(caseRevision)) return { ok: false, code: "STALE_CASE_REVISION" };
  return { ok: true, code: null };
}

export function buildAssessmentContract(input = {}) {
  const assessmentId = text(input.assessmentId || input.id);
  const expertId = text(input.expertId || input.expert_id);
  const domain = text(input.verifiedDomain || input.domainCode || input.domain_code).toUpperCase();
  const caseId = text(input.caseId || input.case_id);
  const caseRevision = Number(input.caseRevision ?? input.case_revision);
  const claimId = text(input.claimId || input.claim_id) || null;
  const evidenceRevisionIds = Array.isArray(input.evidenceRevisionIds || input.evidence_revision_ids)
    ? [...new Set((input.evidenceRevisionIds || input.evidence_revision_ids).map(text).filter(Boolean))].slice(0, 100)
    : [];
  return {
    assessmentId,
    expertId,
    verifiedDomain: domain,
    assignmentId: text(input.assignmentId || input.assignment_id) || null,
    caseId,
    caseRevision,
    claimId,
    evidenceRevisionIds,
    state: text(input.state || input.assessmentState || "SUBMITTED").toUpperCase(),
    conclusionWithinScope: text(input.conclusionWithinScope || input.conclusion_within_scope),
    reasoning: text(input.reasoning || input.assessment?.reasoning || input.assessment?.analysis),
    uncertainty: text(input.uncertainty),
    missingEvidence: Array.isArray(input.missingEvidence || input.missing_evidence) ? [...(input.missingEvidence || input.missing_evidence)].map(text).filter(Boolean).slice(0, 50) : [],
    coiDeclared: input.coiDeclared ?? input.coi_declared ?? false,
    coiState: text(input.coiState || input.coi_state || "LEGACY_UNKNOWN").toUpperCase(),
    coiDeclarationRef: text(input.coiDeclarationRef || input.coi_declaration_ref) || null,
    verificationId: text(input.verificationId || input.verification_id) || null,
    verificationRevision: input.verificationRevision ?? input.verification_revision ?? null,
    verificationStatus: text(input.verificationStatus || input.verification_status).toUpperCase() || null,
    verificationQualificationState: text(input.verificationQualificationState || input.verification_qualification_state).toUpperCase() || null,
    assignmentRevision: input.assignmentRevision ?? input.assignment_revision ?? null,
    qualificationPolicyVersion: text(input.qualificationPolicyVersion || input.qualification_policy_version || "expert-qualification-v1"),
    authoritySnapshotVersion: input.authoritySnapshotVersion ?? input.authority_snapshot_version ?? 0,
    authoritySnapshotDigest: text(input.authoritySnapshotDigest || input.authority_snapshot_digest) || null,
    authoritySnapshot: input.authoritySnapshot || input.authority_snapshot || null,
    submittedAt: input.submittedAt || input.submitted_at || null,
    createdAt: input.createdAt || input.created_at || null,
    policyVersion: text(input.policyVersion || input.policy_version || REPUTATION_POLICY_VERSION),
  };
}

export function createPreview({ statement, metadata, ocrText, qrContent, source, caseId, caseRevision, claimId, contributionType, evidenceRefs, evidenceRevisionIds } = {}) {
  const scanInput = [statement, ocrText, qrContent].filter((value) => typeof value === "string" && value.trim()).join("\n");
  const boundedScanInput = scanInput.slice(0, 80_000);
  const scan = detectPII(boundedScanInput, { ...(metadata || {}), ...(source?.metadata || {}), ...(qrContent ? { qrData: qrContent } : {}) });
  const redactedStatement = redactText(statement);
  const validation = validateContributionInput({ statement, caseId, caseRevision, claimId, contributionType, evidenceRefs });
  const normalizedEvidenceRevisionIds = Array.isArray(evidenceRevisionIds) ? [...new Set(evidenceRevisionIds.map(text).filter(Boolean))].slice(0, 100) : [];
  const normalizedSource = source && typeof source === "object" ? canonicalizeSource(source) : null;
  return {
    state: scan.blocked ? "BLOCKED" : "PREVIEW_READY",
    publicationState: scan.blocked ? "BLOCKED" : "PREVIEW_READY",
    validation,
    scan,
    redactedStatement,
    previewDigest: JSON.stringify({ redactedStatement, caseId, caseRevision, claimId: claimId || null, contributionType: contributionType || "DIRECT_EXPERIENCE", evidenceRefs: evidenceRefs || [], evidenceRevisionIds: normalizedEvidenceRevisionIds, source: normalizedSource, ocrDigest: redactText(ocrText || "").slice(0, 20_000), qrContent: redactText(qrContent || "").slice(0, 4_000), privacyFindings: scan.findings }),
    policyVersion: "privacy-scan-v1",
  };
}

export function canAppeal({ requesterId, assessmentExpertId, assignmentReviewerId, currentReviewState }) {
  if (!requesterId) return { ok: false, code: "AUTHENTICATION_REQUIRED" };
  if (String(requesterId) === String(assessmentExpertId) || String(requesterId) === String(assignmentReviewerId)) return { ok: false, code: "SELF_APPEAL_FORBIDDEN" };
  if (!["RESOLVED", "CONFLICT", "NEEDS_THIRD_REVIEW"].includes(text(currentReviewState).toUpperCase())) return { ok: false, code: "APPEAL_STATE_INVALID" };
  return { ok: true, code: null };
}

export function resolveAssessmentDisagreement(assessments = [], reviewDecisions = []) {
  const rows = Array.isArray(assessments) ? assessments : [];
  const decisions = Array.isArray(reviewDecisions) ? reviewDecisions : [];
  const conclusionFor = (row) => text(
    row?.conclusionWithinScope
      || row?.conclusion_within_scope
      || row?.assessment?.conclusion
      || row?.assessment?.claimStatus
      || row?.assessment?.verdict
      || row?.assessment?.analysis
  );
  // Keep the full text for audit/readback, but compare a compact normalized
  // key so whitespace/case changes do not manufacture a conflict.
  const conclusionKeys = new Set(rows.map((row) => conclusionFor(row).toLocaleLowerCase().replace(/\s+/g, " ")).filter(Boolean));
  const hasConflictingAssessments = conclusionKeys.size > 1;
  const hasReviewerDisagreement = decisions.some((decision) => String(decision?.decision || "").toUpperCase() === "DISAGREE");
  const independentReviewers = new Set(decisions.map((decision) => String(decision?.reviewer_id || decision?.reviewerId || "")).filter(Boolean));
  const unresolved = hasConflictingAssessments || hasReviewerDisagreement;
  const state = rows.length === 0
    ? "UNASSIGNED"
    : unresolved
      ? (independentReviewers.size >= 2 ? "NEEDS_THIRD_REVIEW" : "CONFLICT")
      : "RESOLVED";
  return {
    state,
    unresolved: state === "CONFLICT" || state === "NEEDS_THIRD_REVIEW" || state === "UNRESOLVED",
    assessments: rows.map((row) => ({ assessmentId: row.id || row.assessmentId, expertId: row.expert_id || row.expertId, conclusion: row.conclusion_within_scope || row.conclusionWithinScope || row.assessment?.conclusion || row.assessment?.analysis || null })),
    reviewDecisions: decisions.map((row) => ({ decisionId: row.id || row.decisionId, reviewerId: row.reviewer_id || row.reviewerId, decision: String(row.decision || "").toUpperCase(), reasoning: row.reasoning || null })),
    majorityApplied: false,
    nextAction: state === "CONFLICT" || state === "NEEDS_THIRD_REVIEW" ? "REQUEST_INDEPENDENT_THIRD_REVIEW" : null,
  };
}
