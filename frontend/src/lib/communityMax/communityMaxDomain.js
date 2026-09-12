/**
 * StudentHub AI — Community Max domain contract.
 *
 * This module is storage-agnostic and safe to use from route tests. It keeps
 * epistemic intent, source independence, revision/freshness, disagreement,
 * summaries, ranking, consent, correction, and data-candidate decisions
 * separate from Trust V5 and Expert authority.
 */

import { canonicalizeSource, detectPII, redactText } from "../communityExpert/promaxDomain.js";

export const COMMUNITY_MAX_CONTRACT_VERSION = "community-max.v1";
export const COMMUNITY_MAX_RANKING_POLICY_VERSION = "community-max-ranking-v1";

export const EPISTEMIC_INTENTS = Object.freeze([
  "DIRECT_EXPERIENCE",
  "FOUND_SOURCE",
  "NEEDS_VERIFICATION",
  "SUPPORTING_EVIDENCE",
  "CONTRADICTING_EVIDENCE",
  "CONTEXT",
  "CRITIQUE",
]);

export const CLAIM_DISCUSSION_ACTIONS = Object.freeze([
  "SUPPORT",
  "CHALLENGE",
  "ADD_EVIDENCE",
  "REQUEST_SOURCE",
  "ADD_CONTEXT",
  "REQUEST_EXPERT",
  "REQUEST_VERIFICATION",
]);

export const SOURCE_STATES = Object.freeze([
  "AVAILABLE",
  "UPDATED",
  "UNAVAILABLE",
  "RETRACTED",
  "UNKNOWN",
]);

export const FRESHNESS_STATES = Object.freeze([
  "FRESH",
  "AGING",
  "STALE",
  "SOURCE_RETRACTED",
  "CONTEXT_CHANGED",
  "UNKNOWN",
]);

export const VERIFICATION_STATES = Object.freeze([
  "LINKED",
  "PENDING",
  "OUTDATED",
  "NEW_VERIFICATION_REQUIRED",
]);

export const EXPERT_REQUEST_STATES = Object.freeze([
  "QUEUED",
  "ELIGIBLE",
  "ASSIGNED",
  "COMPLETED",
  "DECLINED",
]);

export const REVIEW_CANDIDATE_STATES = Object.freeze([
  "OPEN",
  "ASSIGNED",
  "IN_REVIEW",
  "ADJUDICATED",
  "DISMISSED",
]);

export const COMMUNITY_MAX_RANKING_WEIGHTS = Object.freeze({
  relevance: 0.40,
  evidenceQuality: 0.25,
  verificationFreshness: 0.15,
  sourceIndependence: 0.10,
  independentHelpfulness: 0.10,
});

const CONTRIBUTION_INTENTS = new Set(EPISTEMIC_INTENTS);
const DISCUSSION_ACTIONS = new Set(CLAIM_DISCUSSION_ACTIONS);
const URL_PROTOCOLS = new Set(["http:", "https:"]);
const TRACKING_QUERY_KEY = /^(utm_|fbclid|gclid|msclkid|dclid)/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SOURCE_COUNT = 20;
const MAX_EVIDENCE_ID_COUNT = 40;
const MAX_DISCUSSION_COUNT = 500;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function boundedText(value, max, fallback = "") {
  const normalized = text(value);
  return normalized ? normalized.slice(0, max) : fallback;
}

function boundedNumber(value, fallback = 0) {
  const candidate = Number(value);
  return Number.isFinite(candidate) ? Math.min(1, Math.max(0, candidate)) : fallback;
}

function integer(value, fallback = null) {
  const candidate = Number(value);
  return Number.isInteger(candidate) && candidate >= 1 ? candidate : fallback;
}

function uniqueStrings(values, max = MAX_EVIDENCE_ID_COUNT) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => text(value)).filter(Boolean))].slice(0, max);
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127;
}

function isPrivateHostname(hostname) {
  const value = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!value || value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local") || value.endsWith(".internal")) return true;
  if (isPrivateIpv4(value)) return true;
  if (value === "::1" || value === "0:0:0:0:0:0:0:1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) return true;
  if (value.startsWith("::ffff:") && isPrivateIpv4(value.slice(7))) return true;
  return false;
}

export function isCanonicalUuid(value) {
  return UUID_PATTERN.test(String(value || ""));
}

/**
 * URL validation is intentionally conservative. The server never fetches a
 * submitted URL as part of this contract, but rejecting private/credentialed
 * locators at the boundary prevents them from becoming future SSRF inputs.
 */
export function isSafePublicUrl(value) {
  const raw = text(value);
  if (!raw || raw.length > 4000) return false;
  try {
    const parsed = new URL(raw);
    if (!URL_PROTOCOLS.has(parsed.protocol) || parsed.username || parsed.password || isPrivateHostname(parsed.hostname)) return false;
    if (parsed.port && !["80", "443"].includes(parsed.port)) return false;
    if (parsed.hostname.includes("%") || parsed.hostname.includes("@")) return false;
    return Boolean(parsed.hostname && parsed.hostname.includes("."));
  } catch {
    return false;
  }
}

export function normalizePublicUrl(value) {
  if (!isSafePublicUrl(value)) return null;
  const parsed = new URL(text(value));
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING_QUERY_KEY.test(key)) parsed.searchParams.delete(key);
  }
  return parsed.toString().replace(/\/$/, "");
}

export function normalizeEpistemicIntent(value, fallback = "DIRECT_EXPERIENCE") {
  const normalized = text(value).toUpperCase().replace(/[ -]+/g, "_");
  return CONTRIBUTION_INTENTS.has(normalized) ? normalized : fallback;
}

export function intentToContributionType(intent) {
  return normalizeEpistemicIntent(intent);
}

export function validateComposerInput(input = {}) {
  const errors = [];
  const intent = normalizeEpistemicIntent(input.intent || input.contributionType, "");
  const statement = boundedText(input.statement || input.content, 20_000);
  const title = boundedText(input.title, 200);
  const sourceRefs = Array.isArray(input.sourceRefs || input.evidenceRefs) ? (input.sourceRefs || input.evidenceRefs).slice(0, MAX_SOURCE_COUNT) : [];
  const evidenceIds = uniqueStrings(input.evidenceRevisionIds || input.evidenceIds);
  const normalizedSources = [];

  if (!intent) errors.push({ code: "COMMUNITY_MAX_INTENT_INVALID", field: "intent" });
  if (statement.length < 20 || statement.length > 20_000) errors.push({ code: "COMMUNITY_MAX_STATEMENT_INVALID", field: "statement" });
  if (title.length > 200) errors.push({ code: "COMMUNITY_MAX_TITLE_INVALID", field: "title" });
  if (input.caseId && !isCanonicalUuid(input.caseId)) errors.push({ code: "COMMUNITY_MAX_CASE_ID_INVALID", field: "caseId" });
  if (input.claimId && !isCanonicalUuid(input.claimId)) errors.push({ code: "COMMUNITY_MAX_CLAIM_ID_INVALID", field: "claimId" });
  if (input.caseRevision !== undefined && integer(input.caseRevision) === null) errors.push({ code: "COMMUNITY_MAX_CASE_REVISION_INVALID", field: "caseRevision" });
  if (intent && ["FOUND_SOURCE", "SUPPORTING_EVIDENCE", "CONTRADICTING_EVIDENCE"].includes(intent) && sourceRefs.length === 0 && evidenceIds.length === 0) {
    errors.push({ code: "COMMUNITY_MAX_EVIDENCE_REQUIRED", field: "sourceRefs" });
  }
  if (Array.isArray(input.evidenceRevisionIds || input.evidenceIds) && (input.evidenceRevisionIds || input.evidenceIds).length > MAX_EVIDENCE_ID_COUNT) {
    errors.push({ code: "COMMUNITY_MAX_EVIDENCE_LIMIT", field: "evidenceRevisionIds" });
  }
  if (Array.isArray(input.sourceRefs || input.evidenceRefs) && (input.sourceRefs || input.evidenceRefs).length > MAX_SOURCE_COUNT) {
    errors.push({ code: "COMMUNITY_MAX_SOURCE_LIMIT", field: "sourceRefs" });
  }

  for (const source of sourceRefs) {
    const sourceValue = typeof source === "string" ? { url: source } : source && typeof source === "object" ? source : {};
    const safeUrl = normalizePublicUrl(sourceValue.url || sourceValue.canonicalUrl);
    if (!safeUrl) {
      errors.push({ code: "COMMUNITY_MAX_SOURCE_URL_REJECTED", field: "sourceRefs" });
      continue;
    }
    const canonical = canonicalizeSource({ ...sourceValue, url: safeUrl });
    normalizedSources.push({
      url: safeUrl,
      canonicalUrl: safeUrl,
      publisher: boundedText(sourceValue.publisher || sourceValue.domain, 300).toLowerCase() || null,
      originalSource: normalizePublicUrl(sourceValue.originalSource || sourceValue.originalUrl || sourceValue.originUrl),
      contentDigest: /^[0-9a-f]{64}$/i.test(text(sourceValue.contentDigest || sourceValue.hash)) ? text(sourceValue.contentDigest || sourceValue.hash).toLowerCase() : null,
      independenceKey: boundedText(canonical.independenceKey || safeUrl, 1000).toLowerCase(),
      sourceState: SOURCE_STATES.includes(String(sourceValue.sourceState || "UNKNOWN").toUpperCase()) ? String(sourceValue.sourceState || "UNKNOWN").toUpperCase() : "UNKNOWN",
    });
  }

  const metadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {};
  const privacy = detectPII([statement, text(input.ocrText), text(input.qrContent)].filter(Boolean).join("\n"), metadata);
  if (privacy.blocked) errors.push({ code: "COMMUNITY_MAX_PRIVACY_BLOCKED", field: "statement" });

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      intent: intent || null,
      contributionType: intent || null,
      title: title || null,
      statement: redactText(statement),
      caseId: isCanonicalUuid(input.caseId) ? String(input.caseId).toLowerCase() : null,
      caseRevision: integer(input.caseRevision),
      claimId: isCanonicalUuid(input.claimId) ? String(input.claimId).toLowerCase() : null,
      evidenceRevisionIds: evidenceIds,
      sourceRefs: normalizedSources,
    },
    privacy: {
      hasPII: privacy.hasPII,
      blocked: privacy.blocked,
      findings: privacy.findings,
      policyVersion: privacy.policyVersion,
    },
  };
}

export function validateClaimDiscussionInput(input = {}) {
  const errors = [];
  const action = text(input.action).toUpperCase().replace(/[ -]+/g, "_");
  const body = boundedText(input.body || input.content, 10_000);
  const contributionRevision = integer(input.contributionRevision || input.revision);
  const evidenceReferenceIds = uniqueStrings(input.evidenceReferenceIds || input.sourceReferenceIds);
  if (!isCanonicalUuid(input.contributionId)) errors.push({ code: "COMMUNITY_MAX_CONTRIBUTION_ID_INVALID", field: "contributionId" });
  if (input.claimId && !isCanonicalUuid(input.claimId)) errors.push({ code: "COMMUNITY_MAX_CLAIM_ID_INVALID", field: "claimId" });
  if (!contributionRevision) errors.push({ code: "COMMUNITY_MAX_REVISION_REQUIRED", field: "contributionRevision" });
  if (!DISCUSSION_ACTIONS.has(action)) errors.push({ code: "COMMUNITY_MAX_DISCUSSION_ACTION_INVALID", field: "action" });
  if (body.length < 10 || body.length > 10_000) errors.push({ code: "COMMUNITY_MAX_DISCUSSION_BODY_INVALID", field: "body" });
  if (evidenceReferenceIds.length > MAX_EVIDENCE_ID_COUNT) errors.push({ code: "COMMUNITY_MAX_EVIDENCE_LIMIT", field: "evidenceReferenceIds" });
  const privacy = detectPII(body);
  if (privacy.blocked) errors.push({ code: "COMMUNITY_MAX_PRIVACY_BLOCKED", field: "body" });
  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      contributionId: isCanonicalUuid(input.contributionId) ? String(input.contributionId).toLowerCase() : null,
      claimId: isCanonicalUuid(input.claimId) ? String(input.claimId).toLowerCase() : null,
      contributionRevision,
      action: DISCUSSION_ACTIONS.has(action) ? action : null,
      body: redactText(body),
      evidenceReferenceIds,
    },
    privacy: { ...privacy, findings: privacy.findings },
  };
}

export function normalizeSourceForCommunity(source = {}) {
  const safeUrl = normalizePublicUrl(source.url || source.canonicalUrl);
  if (!safeUrl) return { ok: false, code: "COMMUNITY_MAX_SOURCE_URL_REJECTED" };
  const canonical = canonicalizeSource({ ...source, url: safeUrl });
  return {
    ok: true,
    source: {
      url: safeUrl,
      canonicalUrl: safeUrl,
      publisher: boundedText(source.publisher || source.domain, 300).toLowerCase() || null,
      independenceKey: boundedText(canonical.independenceKey || safeUrl, 1000).toLowerCase(),
      contentDigest: /^[0-9a-f]{64}$/i.test(text(source.contentDigest || source.hash)) ? text(source.contentDigest || source.hash).toLowerCase() : null,
      sourceState: SOURCE_STATES.includes(text(source.sourceState).toUpperCase()) ? text(source.sourceState).toUpperCase() : "UNKNOWN",
      authority: "UNVERIFIED_COMMUNITY_SOURCE",
    },
  };
}

export function buildSourceIndependenceProjection(sources = []) {
  const normalized = [];
  for (const source of Array.isArray(sources) ? sources.slice(0, MAX_SOURCE_COUNT) : []) {
    const result = normalizeSourceForCommunity(source);
    if (result.ok) normalized.push({ ...result.source, id: text(source.id) || null });
  }
  const groups = new Map();
  for (const source of normalized) {
    const key = source.independenceKey || source.publisher || source.canonicalUrl;
    const existing = groups.get(key) || { independenceKey: key, publisher: source.publisher, sourceIds: [], sourceCount: 0, sourceStates: [] };
    existing.sourceCount += 1;
    if (source.id) existing.sourceIds.push(source.id);
    existing.sourceStates.push(source.sourceState);
    groups.set(key, existing);
  }
  const clusters = [...groups.values()].map((group) => ({
    ...group,
    sourceStates: [...new Set(group.sourceStates)],
  }));
  return {
    totalSources: normalized.length,
    independentSourceFamilies: clusters.length,
    clusters,
    sourceAuthority: "COMMUNITY_SIGNAL_ONLY",
    interpretation: clusters.length > 1 ? "MULTIPLE_INDEPENDENCE_KEYS_DETECTED" : normalized.length ? "SINGLE_OR_UNCERTAIN_SOURCE_FAMILY" : "NO_SAFE_SOURCES",
    isTruthVerdict: false,
  };
}

export function deriveVerificationFreshness({
  currentRevision,
  boundRevision,
  sourceStates = [],
  lastCheckedAt = null,
  verifiedAt = null,
  now = Date.now(),
  freshWindowMs = 30 * 86_400_000,
  agingWindowMs = 7 * 86_400_000,
} = {}) {
  const current = integer(currentRevision);
  const bound = integer(boundRevision);
  const states = (Array.isArray(sourceStates) ? sourceStates : []).map((value) => text(value).toUpperCase());
  const checked = Date.parse(lastCheckedAt || verifiedAt || "");
  let state = "UNKNOWN";
  let reason = "NO_VERIFICATION_TIMESTAMP";
  if (bound && current && bound !== current) {
    state = "CONTEXT_CHANGED";
    reason = "CONTRIBUTION_REVISION_CHANGED";
  } else if (states.includes("RETRACTED")) {
    state = "SOURCE_RETRACTED";
    reason = "SOURCE_RETRACTED";
  } else if (states.includes("UNAVAILABLE")) {
    state = "STALE";
    reason = "SOURCE_UNAVAILABLE";
  } else if (Number.isFinite(checked)) {
    const age = Math.max(0, now - checked);
    if (age <= agingWindowMs) {
      state = "FRESH";
      reason = "RECENTLY_CHECKED";
    } else if (age <= freshWindowMs) {
      state = "AGING";
      reason = "CHECK_OLDER_THAN_PREFERRED_WINDOW";
    } else {
      state = "STALE";
      reason = "CHECK_OUTSIDE_FRESHNESS_WINDOW";
    }
  }
  return {
    state,
    reason,
    ageDays: Number.isFinite(checked) ? Math.floor(Math.max(0, now - checked) / 86_400_000) : null,
    checkedAt: Number.isFinite(checked) ? new Date(checked).toISOString() : null,
    isAuthoritative: false,
  };
}

export function buildRevisionBinding({ contributionId, contributionRevision, claimId = null, caseId = null, caseRevision = null } = {}) {
  return {
    contributionId: isCanonicalUuid(contributionId) ? String(contributionId).toLowerCase() : null,
    contributionRevision: integer(contributionRevision),
    claimId: isCanonicalUuid(claimId) ? String(claimId).toLowerCase() : null,
    caseId: isCanonicalUuid(caseId) ? String(caseId).toLowerCase() : null,
    caseRevision: integer(caseRevision),
    immutable: true,
  };
}

export function isVerificationOutdated({ boundRevision, currentRevision, sourceStates = [], freshnessState = null } = {}) {
  const state = text(freshnessState).toUpperCase();
  return integer(boundRevision) !== integer(currentRevision) || ["RETRACTED", "UNAVAILABLE"].some((value) => sourceStates.map((item) => text(item).toUpperCase()).includes(value)) || ["STALE", "SOURCE_RETRACTED", "CONTEXT_CHANGED"].includes(state);
}

export function detectHighValueDisagreement({ supportSignals = [], challengeSignals = [], sourceStates = [], evidenceStates = [], discussionCount = 0 } = {}) {
  const supportCount = Math.max(0, Number(supportSignals?.length) || 0);
  const challengeCount = Math.max(0, Number(challengeSignals?.length) || 0);
  const sourceConflict = sourceStates.map((value) => text(value).toUpperCase()).some((value) => ["RETRACTED", "UNAVAILABLE", "UPDATED"].includes(value));
  const evidenceConflict = evidenceStates.map((value) => text(value).toUpperCase()).includes("CONTRADICTORY") || evidenceStates.map((value) => text(value).toUpperCase()).includes("MIXED");
  const hasTwoSidedSignal = supportCount > 0 && challengeCount > 0;
  const highValue = hasTwoSidedSignal || evidenceConflict || sourceConflict;
  const priority = Math.min(100, (hasTwoSidedSignal ? 45 : 0) + (evidenceConflict ? 30 : 0) + (sourceConflict ? 20 : 0) + (Number(discussionCount) > 3 ? 5 : 0));
  const signalIds = [...supportSignals, ...challengeSignals].map((signal) => text(typeof signal === "string" ? signal : signal?.id)).filter(Boolean).slice(0, 40);
  return {
    highValue,
    priority,
    supportCount,
    challengeCount,
    reasonCodes: [
      ...(hasTwoSidedSignal ? ["SUPPORT_AND_CHALLENGE_PRESENT"] : []),
      ...(evidenceConflict ? ["EVIDENCE_STATES_DISAGREE"] : []),
      ...(sourceConflict ? ["SOURCE_STATE_CHANGED"] : []),
    ],
    signalIds,
    isTruthVerdict: false,
    nextAction: highValue ? "QUEUE_REVIEW_OR_EXPERT_REQUEST" : "CONTINUE_EVIDENCE_COLLECTION",
  };
}

function safeSnippet(value, max = 180) {
  const cleaned = redactText(text(value)).replace(/\s+/g, " ").trim();
  return cleaned.slice(0, max);
}

export function buildGroundedDiscussionSummary({ discussions = [], sources = [], contributionRevision = null, now = Date.now() } = {}) {
  const visibleDiscussions = (Array.isArray(discussions) ? discussions : [])
    .filter((item) => item && text(item.status || "PUBLISHED").toUpperCase() === "PUBLISHED")
    .slice(0, MAX_DISCUSSION_COUNT);
  const citedDiscussionIds = visibleDiscussions.map((item) => text(item.id)).filter(isCanonicalUuid).slice(0, 100);
  const citedSourceIds = (Array.isArray(sources) ? sources : []).map((item) => text(item.id)).filter(isCanonicalUuid).slice(0, 100);
  const counts = visibleDiscussions.reduce((result, item) => {
    const action = text(item.action).toUpperCase();
    result[action] = (result[action] || 0) + 1;
    return result;
  }, {});
  const examples = visibleDiscussions.slice(0, 3).map((item) => `${text(item.action).toUpperCase()}: ${safeSnippet(item.body)}`).filter((item) => item.length > 2);
  const countText = Object.entries(counts).map(([key, count]) => `${key}=${count}`).join(", ") || "no typed positions recorded";
  const exampleText = examples.length ? ` Examples: ${examples.join(" | ")}` : " No substantive discussion has been recorded yet.";
  return {
    label: "AI DISCUSSION SUMMARY",
    summaryText: `Grounded Community discussion for revision ${integer(contributionRevision) || "unknown"}: ${countText}.${exampleText}`.slice(0, 12_000),
    discussionIds: citedDiscussionIds,
    sourceReferenceIds: citedSourceIds,
    policyVersion: COMMUNITY_MAX_CONTRACT_VERSION,
    providerStatus: "RULE_GROUNDED",
    generatedAt: new Date(now).toISOString(),
    finalVerdict: false,
    isAuthoritative: false,
    authorityOwner: "TRUST_V5",
    caveat: "This is a cited discussion summary, not a Trust verdict or Expert determination.",
  };
}

export function buildTransparentCommunityRanking(candidates = [], now = Date.now()) {
  const normalized = (Array.isArray(candidates) ? candidates : []).map((candidate, index) => {
    const values = {
      relevance: boundedNumber(candidate.relevance, 0),
      evidenceQuality: boundedNumber(candidate.evidenceQuality, 0),
      verificationFreshness: boundedNumber(candidate.verificationFreshness, 0),
      sourceIndependence: boundedNumber(candidate.sourceIndependence, 0),
      independentHelpfulness: boundedNumber(candidate.independentHelpfulness, 0),
    };
    const score = Object.entries(COMMUNITY_MAX_RANKING_WEIGHTS).reduce((sum, [key, weight]) => sum + values[key] * weight, 0);
    return {
      id: text(candidate.id) || `candidate-${index + 1}`,
      score: Number((score * 100).toFixed(2)),
      factors: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value.toFixed(4))])),
      reasons: Object.entries(values).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key, value]) => `${key}:${value.toFixed(2)}`),
      policyVersion: COMMUNITY_MAX_RANKING_POLICY_VERSION,
      rankedAt: new Date(now).toISOString(),
      isTruthVerdict: false,
      isAuthoritative: false,
    };
  });
  return normalized.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function deriveCampusProjection(input = {}) {
  const consented = input.consent === true || text(input.consentState).toUpperCase() === "CONSENTED";
  const visibility = text(input.visibility).toUpperCase() === "PUBLIC" ? "PUBLIC" : "PRIVATE";
  const fields = {
    institutionId: isCanonicalUuid(input.institutionId) ? String(input.institutionId).toLowerCase() : null,
    universityLabel: boundedText(input.universityLabel, 240) || null,
    faculty: boundedText(input.faculty, 240) || null,
    major: boundedText(input.major, 240) || null,
    topic: boundedText(input.topic, 240) || null,
  };
  const hasContext = Object.values(fields).some(Boolean);
  return {
    ok: consented && hasContext,
    visibility: consented ? visibility : "PRIVATE",
    consentState: consented ? "CONSENTED" : "REVOKED",
    publicProjection: consented && visibility === "PUBLIC" ? fields : null,
    ownerProjection: consented ? fields : null,
    inferred: false,
    authority: "COMMUNITY_CONTEXT_ONLY",
  };
}

export function buildRiskSignalFingerprintInput({ riskType, signalType, sourceDigest, topic } = {}) {
  return {
    riskType: boundedText(riskType, 120).toUpperCase() || "UNKNOWN",
    signalType: boundedText(signalType, 120).toUpperCase() || "UNKNOWN",
    sourceDigest: /^[0-9a-f]{64}$/i.test(text(sourceDigest)) ? text(sourceDigest).toLowerCase() : null,
    topic: boundedText(topic, 240).toLowerCase() || null,
    rawContentIncluded: false,
    piiIncluded: false,
  };
}

export function buildCorrectionQualitySignal({ correctionType } = {}) {
  return {
    integrity: "RECORDED",
    correctionType: boundedText(correctionType, 80).toUpperCase() || "SELF_CORRECTION",
    pointDelta: 0,
    affectsTrustVerdict: false,
    affectsExpertAuthority: false,
  };
}

export function buildDataCandidate({ contributionId, contributionRevision, candidateType } = {}) {
  return {
    contributionId: isCanonicalUuid(contributionId) ? String(contributionId).toLowerCase() : null,
    contributionRevision: integer(contributionRevision),
    candidateType: boundedText(candidateType, 80).toUpperCase() || "QUALITY_EVENT",
    consentState: "NOT_PROVIDED",
    licenseState: "UNKNOWN",
    annotationState: "UNANNOTATED",
    adjudicationState: "NOT_REQUESTED",
    trainingEligible: false,
    privacySanitized: true,
    automaticTraining: false,
  };
}

export function communityAuthorityBoundary() {
  return Object.freeze({
    canWriteTrustVerdict: false,
    canWriteTrustEvidence: false,
    canWriteEvidencePassport: false,
    canGrantExpertAuthority: false,
    canSetVoteWeight: false,
    canSetTruthFromPopularity: false,
    canTurnBelieveIntoVerified: false,
    canTrainAutomatically: false,
    authorityOwner: "TRUST_V5",
  });
}
