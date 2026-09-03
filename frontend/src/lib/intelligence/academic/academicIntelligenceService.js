/**
 * StudentHub AI — Master Academic Intelligence Service Coordinator
 * 
 * Orchestrates the full 7-stage Academic Intelligence & Digital Twin Pipeline:
 * 1. Source Registry & Policy Check
 * 2. Safe Retrieval (Document Fetcher)
 * 3. Normalization & SHA-256 Hashing
 * 4. Immutable Snapshot Versioning (Document Snapshot Store)
 * 5. Semantic Diff & Mutation Analysis (Semantic Diff Engine)
 * 6. Academic Rule Extraction & Traceability (Academic Rule Extractor)
 * 7. Student Impact, Insights, Timeline, and Notifications (Digital Twin & Adapters)
 */

import { AcademicSourceRegistry } from "./academicSourceRegistry.js";
import { AcademicDocumentFetcher } from "./academicDocumentFetcher.js";
import { AcademicDocumentNormalizer } from "./academicDocumentNormalizer.js";
import { DocumentSnapshotStore } from "./documentSnapshotStore.js";
import { SemanticDiffEngine } from "./semanticDiffEngine.js";
import { AcademicRuleExtractor } from "./academicRuleExtractor.js";
import { AcademicDigitalTwin } from "./academicDigitalTwin.js";
import { AcademicInsightEngine } from "./academicInsightEngine.js";
import { AcademicNotificationAdapter } from "./academicNotificationAdapter.js";
import { AcademicTimelineAdapter } from "./academicTimelineAdapter.js";

export class AcademicIntelligenceService {
  /**
   * Synchronizes and processes an academic source end-to-end
   * @param {string} sourceId - Registered Source ID
   * @param {object} options - { timeoutMs, forceRefresh }
   * @returns {Promise<object>} Sync Execution Report
   */
  static async syncSource(sourceId, options = {}) {
    const source = AcademicSourceRegistry.getSource(sourceId);
    if (!source) {
      return {
        success: false,
        sourceId,
        status: "SOURCE_NOT_FOUND",
        error: `Source [${sourceId}] is not registered in AcademicSourceRegistry.`
      };
    }

    const documentId = `DOC_${source.sourceId}`;
    const previousSnapshot = DocumentSnapshotStore.getActiveSnapshot(documentId);

    // 1. Fetch document via safe fetcher
    const fetchRes = await AcademicDocumentFetcher.fetchDocument(source, {
      etag: previousSnapshot?.metadata?.etag,
      lastModified: previousSnapshot?.metadata?.lastModified,
      timeoutMs: options.timeoutMs
    });

    if (!fetchRes.success) {
      // Safe fallback to last verified state
      const fallback = DocumentSnapshotStore.serveLastVerifiedState(documentId, true);
      return {
        success: false,
        sourceId,
        documentId,
        status: "FETCH_FAILED",
        error: fetchRes.error,
        fallbackState: fallback
      };
    }

    if (fetchRes.isNotModified) {
      return {
        success: true,
        sourceId,
        documentId,
        status: "UNCHANGED",
        reason: "Server confirmed content is unchanged (HTTP 304 Not Modified).",
        activeSnapshot: previousSnapshot
      };
    }

    // 2. Normalize and compute deterministic hash
    const normalized = AcademicDocumentNormalizer.normalizeDocument(fetchRes.rawBody);

    // 3. Compare with previous snapshot hash
    if (previousSnapshot && previousSnapshot.contentHash === normalized.normalizedContentHash && !options.forceRefresh) {
      return {
        success: true,
        sourceId,
        documentId,
        status: "UNCHANGED",
        reason: "Content hash is 100% identical to active verified snapshot.",
        activeSnapshot: previousSnapshot
      };
    }

    // 4. Perform Semantic Diff
    const prevText = previousSnapshot?.normalizedText || previousSnapshot?.content || "";
    const diffResult = SemanticDiffEngine.analyzeDiff(
      { text: prevText },
      { text: normalized.normalizedText }
    );

    // 5. Version increment (v1.0 -> v2.0)
    let versionId = "v1.0";
    if (previousSnapshot?.versionId) {
      const match = previousSnapshot.versionId.match(/v(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        versionId = `v${major + 1}.0`;
      } else {
        versionId = "v2.0";
      }
    }

    // 6. Create immutable snapshot in store
    const newSnapshot = DocumentSnapshotStore.createSnapshot({
      documentId,
      versionId,
      sourceId: source.sourceId,
      sourceTier: source.sourceTier,
      canonicalUrl: source.canonicalUrl,
      title: normalized.documentCode ? `${source.name} - ${normalized.documentCode}` : source.name,
      contentHash: normalized.normalizedContentHash,
      normalizedContentHash: normalized.normalizedContentHash,
      content: normalized.rawText,
      normalizedText: normalized.normalizedText,
      metadata: {
        etag: fetchRes.etag,
        lastModified: fetchRes.lastModified,
        documentCode: normalized.documentCode,
        extractedDates: normalized.extractedDates
      },
      status: "ACTIVE"
    });

    // 7. Extract structured academic rules
    const extractedRules = AcademicRuleExtractor.extractRules(normalized, {
      source,
      diffResult
    });

    return {
      success: true,
      sourceId,
      documentId,
      status: "CHANGED",
      newSnapshot,
      previousSnapshotId: previousSnapshot?.snapshotId || null,
      semanticDiff: diffResult,
      extractedRules,
      changesCount: diffResult.semanticChangesCount || diffResult.changes?.length || 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Evaluates student academic trajectory and generates personalized insights, notifications, and timeline events
   * @param {object} studentProfile - { studentId, cohort, programCode, earnedCredits, cgpa, completedCourses, englishCertificate, tuitionPaid }
   * @param {object[]} rules - Extracted AcademicRules
   * @param {object[]} changes - Semantic changes from diffs
   * @returns {object} Personalized Student Academic Intelligence Report
   */
  static evaluateStudentTrajectory(studentProfile = {}, rules = [], changes = []) {
    const twinState = AcademicDigitalTwin.recomputeTwinState(studentProfile);

    const insights = [];
    const notifications = [];
    const timelineEvents = [];

    // 1. Process rules against student profile
    for (const rule of rules) {
      const impact = AcademicDigitalTwin.evaluateStudentImpact(studentProfile, rule);
      if (impact.isAffected && impact.impactLevel !== "NONE") {
        const insight = AcademicInsightEngine.generateInsight({
          document: { documentId: rule.ruleId, title: rule.subject },
          rule,
          studentImpact: impact,
          source: rule.source
        });
        insights.push(insight);

        const notif = AcademicNotificationAdapter.formatNotification(insight, studentProfile);
        if (notif) notifications.push(notif);

        const timelineEvent = AcademicTimelineAdapter.buildTimelineEvent({ category: rule.type, description: rule.requiredActions?.[0] }, insight);
        timelineEvents.push(timelineEvent);
      }
    }

    // 2. Process changes against student profile
    for (const change of changes) {
      const impact = AcademicDigitalTwin.evaluateStudentImpact(studentProfile, change);
      if (impact.isAffected && impact.impactLevel !== "NONE") {
        const timelineEvent = AcademicTimelineAdapter.buildTimelineEvent(change, null);
        timelineEvents.push(timelineEvent);
      }
    }

    return {
      studentId: studentProfile.studentId || "STD_ANONYMOUS",
      cohort: studentProfile.cohort || 2024,
      programCode: studentProfile.programCode || "7480103",
      digitalTwinState: twinState,
      insights,
      notifications,
      timelineEvents,
      totalInsightsCount: insights.length,
      evaluatedAt: new Date().toISOString()
    };
  }
}
