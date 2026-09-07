// frontend/src/lib/community/CanonicalAnnouncementService.js
//
// Canonical identity hashing, community report deduplication, and
// mutation idempotency service for StudentHub AI.
//
// Enforces:
// 1. Canonical announcement identity hashing: SHA-256(schoolId + canonicalUrl + normalizedTitle)
// 2. Aggregation: Groups N duplicate/near-duplicate reports into ONE event entity + N related reports ("27 báo cáo tương tự")
// 3. Client mutation idempotency (clientMutationId):
//    - Replay with identical payload -> returns cached result without double incrementing
//    - Replay with differing payload -> throws 409 conflict

import crypto from "node:crypto";

export class CanonicalAnnouncementError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "CanonicalAnnouncementError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Normalizes URL by removing tracking params, hashes, and trailing slashes.
 */
export function normalizeCanonicalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.hash = "";
    // Remove typical tracking queries
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "ref", "gidzl"];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    // Normalize path: lowercase and remove trailing slash if not root
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;
    return parsed.toString().toLowerCase();
  } catch {
    // If not a full URL, do basic string normalization
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Normalizes title by lowercasing, stripping leading tags/prefixes, excessive whitespace and punctuation.
 */
export function normalizeTitle(title) {
  if (!title || typeof title !== "string") return "";
  let cleaned = title
    .normalize("NFC")
    .toLowerCase();

  // Strip leading tags like [HCMUTE], [THÔNG BÁO], (TB), etc.
  cleaned = cleaned.replace(/^(\s*\[[^\]]+\]|\s*\([^)]+\)|\s*thông báo[:\s\-]*)+/gi, "");

  return cleaned
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // replace punctuation with spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim(); // trim leading/trailing spaces
}

/**
 * Generates deterministic SHA-256 canonical identity hash for an announcement.
 */
export function generateCanonicalHash({ schoolId = "", canonicalUrl = "", title = "", content = "" }) {
  const normSchool = String(schoolId || "").trim().toUpperCase();
  const normUrl = normalizeCanonicalUrl(canonicalUrl);
  const normTitle = normalizeTitle(title);
  const contentSnippet = String(content || "").trim().slice(0, 200).toLowerCase().replace(/\s+/g, " ");

  const identityString = `${normSchool}|${normUrl}|${normTitle}|${contentSnippet}`;
  return crypto.createHash("sha256").update(identityString, "utf8").digest("hex");
}

/**
 * Aggregates raw observations/notices into canonical event clusters.
 * Transforms 27 scattered reports into ONE event + 27 related reports.
 */
export function aggregateObservations(rawObservations = []) {
  if (!Array.isArray(rawObservations)) return [];

  const clusters = new Map();

  for (const obs of rawObservations) {
    if (!obs) continue;

    // Determine cluster key
    let clusterKey;
    if (obs.canonicalId) {
      clusterKey = obs.canonicalId;
    } else if (obs.canonicalUrl || obs.url) {
      clusterKey = generateCanonicalHash({
        schoolId: obs.schoolId || obs.institution || "GENERAL",
        canonicalUrl: obs.canonicalUrl || obs.url,
        title: obs.title || "",
      });
    } else {
      // Group by normalized topic + title, or normalized statement similarity
      const normTitle = normalizeTitle(obs.title || obs.topic || obs.statement || "");
      const schoolPrefix = (obs.schoolId || obs.institution || "COMMUNITY").toUpperCase();
      clusterKey = crypto.createHash("sha256").update(`${schoolPrefix}:${normTitle}`).digest("hex");
    }

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, {
        canonicalId: clusterKey,
        title: obs.title || String(obs.topic || "Sự kiện cộng đồng").replaceAll("_", " "),
        topic: obs.topic || "GENERAL",
        schoolId: obs.schoolId || obs.institution || "HCMUTE",
        canonicalUrl: normalizeCanonicalUrl(obs.canonicalUrl || obs.url || ""),
        primaryStatement: obs.statement || obs.content || "",
        caseScope: obs.caseScope || null,
        moderationStatus: obs.moderationStatus || "VERIFIED",
        freshnessStatus: obs.freshnessStatus || "ACTIVE",
        firstReportedAt: obs.submittedAt || obs.observedAt || obs.createdAt || new Date().toISOString(),
        lastReportedAt: obs.submittedAt || obs.observedAt || obs.createdAt || new Date().toISOString(),
        relatedReports: [],
        evidenceRefs: new Set(),
        cohorts: new Set(),
      });
    }

    const cluster = clusters.get(clusterKey);
    const obsTime = obs.submittedAt || obs.observedAt || obs.createdAt;
    if (obsTime) {
      if (new Date(obsTime) < new Date(cluster.firstReportedAt)) cluster.firstReportedAt = obsTime;
      if (new Date(obsTime) > new Date(cluster.lastReportedAt)) cluster.lastReportedAt = obsTime;
    }

    // Accumulate evidence references
    if (Array.isArray(obs.evidenceRefs)) {
      for (const ref of obs.evidenceRefs) {
        if (ref) cluster.evidenceRefs.add(ref);
      }
    }
    // Detect cohort mentions (e.g. K21, K22, K23, K24, K25, K26)
    const text = `${obs.statement || ""} ${obs.title || ""} ${obs.context || ""}`;
    const cohortMatches = text.match(/\bK\d{2}\b/gi);
    if (cohortMatches) {
      for (const c of cohortMatches) cluster.cohorts.add(c.toUpperCase());
    }

    cluster.relatedReports.push({
      observationId: obs.observationId || obs.id || `rep_${cluster.relatedReports.length + 1}`,
      statement: obs.statement || obs.content || "",
      authorName: obs.authorName || obs.author?.name || "Sinh viên ẩn danh",
      submittedAt: obs.submittedAt || obs.observedAt || obs.createdAt || new Date().toISOString(),
      evidenceRefs: obs.evidenceRefs || [],
    });
  }

  // Finalize aggregated array
  return Array.from(clusters.values()).map((cluster) => {
    const reportCount = cluster.relatedReports.length;
    let aggregationStatus = "SINGLE_SIGNAL";
    if (reportCount >= 10) aggregationStatus = "MAJOR_INCIDENT_CONSENSUS";
    else if (reportCount >= 3) aggregationStatus = "CONFIRMED_COMMUNITY_TREND";

    return {
      canonicalId: cluster.canonicalId,
      title: cluster.title,
      topic: cluster.topic,
      schoolId: cluster.schoolId,
      canonicalUrl: cluster.canonicalUrl,
      statement: cluster.primaryStatement,
      caseScope: cluster.caseScope,
      moderationStatus: cluster.moderationStatus,
      freshnessStatus: cluster.freshnessStatus,
      firstReportedAt: cluster.firstReportedAt,
      lastReportedAt: cluster.lastReportedAt,
      relatedReportCount: reportCount,
      aggregationLabel: reportCount > 1 ? `${reportCount} báo cáo tương tự` : "1 báo cáo",
      aggregationStatus,
      evidenceRefs: Array.from(cluster.evidenceRefs),
      cohorts: Array.from(cluster.cohorts),
      relatedReports: cluster.relatedReports,
    };
  });
}

/**
 * In-memory / process-durable idempotency store for mutations
 */
const mutationStore = new Map();
const MUTATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

function computePayloadFingerprint(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload || {})).digest("hex");
}

/**
 * Processes a community mutation (vote, confirmation, report) with clientMutationId idempotency protection.
 *
 * Rules:
 * - Same clientMutationId + same payload -> returns cached response (idempotent: true)
 * - Same clientMutationId + different payload -> throws 409 conflict
 * - New clientMutationId -> executes executor(), stores result, returns response (idempotent: false)
 */
export async function executeIdempotentMutation({ clientMutationId, actorId, actionType, payload, executor }) {
  if (!clientMutationId || typeof clientMutationId !== "string") {
    throw new CanonicalAnnouncementError("CLIENT_MUTATION_ID_REQUIRED", "clientMutationId is required for durable mutations.", 400);
  }

  const normalizedId = clientMutationId.trim();
  const payloadFingerprint = computePayloadFingerprint({ actorId, actionType, payload });
  const cacheKey = `${actorId || "anon"}:${normalizedId}`;

  // Prune expired
  const now = Date.now();
  for (const [k, v] of mutationStore.entries()) {
    if (v.expiresAt <= now) mutationStore.delete(k);
  }

  const existing = mutationStore.get(cacheKey);
  if (existing) {
    if (existing.payloadFingerprint !== payloadFingerprint) {
      throw new CanonicalAnnouncementError(
        "MUTATION_IDEMPOTENCY_CONFLICT",
        "The clientMutationId has already been used with a differing mutation payload.",
        409
      );
    }
    return {
      result: existing.result,
      idempotent: true,
      clientMutationId: normalizedId,
    };
  }

  // Execute actual mutation
  const result = await executor();

  mutationStore.set(cacheKey, {
    payloadFingerprint,
    result,
    createdAt: now,
    expiresAt: now + MUTATION_TTL_MS,
  });

  return {
    result,
    idempotent: false,
    clientMutationId: normalizedId,
  };
}

export function resetMutationStoreForTests() {
  mutationStore.clear();
}
