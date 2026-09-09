/**
 * Client-safe presentation aggregation for Community Intelligence.
 *
 * This module intentionally does not import the server-only
 * CanonicalAnnouncementService. The browser only needs a deterministic view
 * grouping key; canonical identity hashing and mutation idempotency remain
 * server-owned in CanonicalAnnouncementService.js.
 */

function normalizeCanonicalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "ref", "gidzl"]
      .forEach((param) => parsed.searchParams.delete(param));
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    parsed.pathname = pathname;
    return parsed.toString().toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function normalizeTitle(title) {
  if (!title || typeof title !== "string") return "";
  return title
    .normalize("NFC")
    .toLowerCase()
    .replace(/^(\s*\[[^\]]+\]|\s*\([^)]+\)|\s*thông báo[:\s\-]*)+/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function presentationClusterKey(observation) {
  if (observation.canonicalId) return String(observation.canonicalId);

  const school = String(observation.schoolId || observation.institution || "COMMUNITY").trim().toUpperCase();
  const title = normalizeTitle(observation.title || observation.topic || observation.statement || "");
  if (observation.canonicalUrl || observation.url) {
    return `${school}|${normalizeCanonicalUrl(observation.canonicalUrl || observation.url)}|${title}`;
  }
  return `${school}|${title}`;
}

/**
 * Groups observations for display only. Server-provided canonicalId remains
 * authoritative whenever present; fallback keys are not verdict identities.
 */
export function aggregateObservationsForPresentation(rawObservations = []) {
  if (!Array.isArray(rawObservations)) return [];

  const clusters = new Map();
  for (const observation of rawObservations) {
    if (!observation || typeof observation !== "object") continue;

    const clusterKey = presentationClusterKey(observation);
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, {
        canonicalId: clusterKey,
        title: observation.title || String(observation.topic || "Sự kiện cộng đồng").replaceAll("_", " "),
        topic: observation.topic || "GENERAL",
        schoolId: observation.schoolId || observation.institution || "HCMUTE",
        canonicalUrl: normalizeCanonicalUrl(observation.canonicalUrl || observation.url || ""),
        primaryStatement: observation.statement || observation.content || "",
        caseScope: observation.caseScope || null,
        moderationStatus: observation.moderationStatus || "VERIFIED",
        freshnessStatus: observation.freshnessStatus || "ACTIVE",
        firstReportedAt: observation.submittedAt || observation.observedAt || observation.createdAt || new Date().toISOString(),
        lastReportedAt: observation.submittedAt || observation.observedAt || observation.createdAt || new Date().toISOString(),
        relatedReports: [],
        evidenceRefs: new Set(),
        cohorts: new Set(),
      });
    }

    const cluster = clusters.get(clusterKey);
    const observedAt = observation.submittedAt || observation.observedAt || observation.createdAt;
    if (observedAt) {
      if (new Date(observedAt) < new Date(cluster.firstReportedAt)) cluster.firstReportedAt = observedAt;
      if (new Date(observedAt) > new Date(cluster.lastReportedAt)) cluster.lastReportedAt = observedAt;
    }

    if (Array.isArray(observation.evidenceRefs)) {
      observation.evidenceRefs.forEach((reference) => {
        if (reference) cluster.evidenceRefs.add(reference);
      });
    }

    const text = `${observation.statement || ""} ${observation.title || ""} ${observation.context || ""}`;
    const cohortMatches = text.match(/\bK\d{2}\b/gi) || [];
    cohortMatches.forEach((cohort) => cluster.cohorts.add(cohort.toUpperCase()));

    cluster.relatedReports.push({
      observationId: observation.observationId || observation.id || `rep_${cluster.relatedReports.length + 1}`,
      statement: observation.statement || observation.content || "",
      authorName: observation.authorName || observation.author?.name || "Sinh viên ẩn danh",
      submittedAt: observedAt || new Date().toISOString(),
      evidenceRefs: observation.evidenceRefs || [],
    });
  }

  return Array.from(clusters.values()).map((cluster) => {
    const reportCount = cluster.relatedReports.length;
    const aggregationStatus = reportCount >= 10
      ? "MAJOR_INCIDENT_CONSENSUS"
      : reportCount >= 3
        ? "CONFIRMED_COMMUNITY_TREND"
        : "SINGLE_SIGNAL";

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
