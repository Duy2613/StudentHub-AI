/**
 * StudentHub AI — Master Academic Live-Sync & Fraud/Risk Intelligence Bridge
 * 
 * Orchestrates the complete end-to-end trustworthy intelligence pipeline:
 * 1. Live Source Watcher & SLA Monitoring
 * 2. Immutable Snapshot Store & SHA-256 Provenance
 * 3. Parser Integrity & Disguised Error Page Guard
 * 4. Fraud & Risk Intelligence Engine (9-D Risk Vector + Hard Rules)
 * 5. Semantic Diff Engine (Cosmetic vs Semantic separation)
 * 6. Rule Dependency DAG & Invalidation Protocol
 * 7. Human Review Gate (Reviewer Approval / Rejection)
 * 8. Academic Digital Twin & Cohort-Scoped Impact Recomputation
 */

import { LiveSourceWatcher, SOURCE_TRUST_TIERS } from "../academic/liveSourceWatcher.js";
import { DocumentSnapshotStore } from "../academic/documentSnapshotStore.js";
import { ParserIntegrityGuard, INGESTION_SAFETY_STATES } from "../academic/parserIntegrityGuard.js";
import { FraudRiskEngine, FRAUD_DECISIONS } from "./fraudRiskEngine.js";
import { SemanticDiffEngine } from "../academic/semanticDiffEngine.js";
import { RuleDependencyDAG, RULE_LIFECYCLE_STATES } from "../academic/ruleDependencyDAG.js";
import { AcademicDigitalTwin } from "../academic/academicDigitalTwin.js";

export class AcademicFraudLiveSyncBridge {
  /**
   * Processes an incoming document/crawled payload through the full 8-stage verification pipeline
   * @param {object} input - { source, rawBody, incomingHeaders, previousDoc, studentProfile }
   * @returns {object} End-to-End Pipeline Execution Report
   */
  static async processIngestionPipeline(input = {}) {
    const {
      source = { sourceId: "SRC_UNKNOWN", sourceTier: "TIER_4_UNKNOWN", url: "" },
      rawBody = "",
      incomingHeaders = {},
      previousDoc = {},
      studentProfile = null
    } = input;

    const pipelineStages = [];
    const executionTimestamp = new Date().toISOString();

    // -------------------------------------------------------------
    // STAGE 1: Live-Sync Conditional Check
    // -------------------------------------------------------------
    const syncEval = LiveSourceWatcher.evaluateConditionalFetch(source, {
      ...incomingHeaders,
      rawBody
    });
    pipelineStages.push({ stage: "1_LIVE_SYNC", result: syncEval });

    if (syncEval.status === "UNCHANGED") {
      return {
        pipelineStatus: "UNCHANGED",
        finalDecision: FRAUD_DECISIONS.VERIFIED_OFFICIAL,
        summary: syncEval.reason,
        stages: pipelineStages
      };
    }

    if (syncEval.quarantineRequired) {
      const staleFallback = DocumentSnapshotStore.serveLastVerifiedState(source.sourceId, true);
      return {
        pipelineStatus: "QUARANTINED",
        finalDecision: FRAUD_DECISIONS.QUARANTINED,
        summary: "Sự cố mạng hoặc server lỗi. Chuyển sang chế độ Quarantine.",
        staleFallback,
        stages: pipelineStages
      };
    }

    // -------------------------------------------------------------
    // STAGE 2: Raw Body & Parser Integrity Guard
    // -------------------------------------------------------------
    const rawSafety = ParserIntegrityGuard.inspectRawContentSafety(rawBody);
    pipelineStages.push({ stage: "2_PARSER_INTEGRITY", result: rawSafety });

    if (rawSafety.stopIngestion) {
      const staleFallback = DocumentSnapshotStore.serveLastVerifiedState(source.sourceId, true);
      return {
        pipelineStatus: "QUARANTINED",
        finalDecision: FRAUD_DECISIONS.QUARANTINED,
        summary: rawSafety.reason,
        staleFallback,
        stages: pipelineStages
      };
    }

    // -------------------------------------------------------------
    // STAGE 3: Fraud & Risk Intelligence Analysis
    // -------------------------------------------------------------
    const fraudEval = FraudRiskEngine.evaluateRisk({
      url: source.url,
      text: rawBody,
      metadata: {
        sourceTier: source.sourceTier || "TIER_4_UNKNOWN",
        claimedIssuer: source.name || ""
      }
    });
    pipelineStages.push({ stage: "3_FRAUD_RISK_ENGINE", result: fraudEval });

    if (fraudEval.decision === FRAUD_DECISIONS.BLOCKED || fraudEval.decision === FRAUD_DECISIONS.HIGH_RISK) {
      return {
        pipelineStatus: "BLOCKED",
        finalDecision: fraudEval.decision,
        summary: `Chặn nạp do phát hiện rủi ro giả mạo cao (Overall Risk: ${fraudEval.overallRisk}).`,
        fraudAssessment: fraudEval,
        stages: pipelineStages
      };
    }

    // -------------------------------------------------------------
    // STAGE 4: Immutable Snapshot Creation
    // -------------------------------------------------------------
    const contentHash = LiveSourceWatcher.computeContentHash(rawBody);
    const snapshot = {
      snapshotId: `SNAP_${source.sourceId}_${Date.now()}`,
      sourceId: source.sourceId,
      retrievedAt: executionTimestamp,
      contentLength: Buffer.byteLength(rawBody, "utf8"),
      contentHash,
      sourceTier: source.sourceTier,
      origin: "REAL_EXTERNAL_SOURCE",
      verificationStatus: fraudEval.overallRisk < 0.20 ? "VERIFIED" : "PENDING_REVIEW"
    };
    pipelineStages.push({ stage: "4_SNAPSHOT_CREATED", result: snapshot });

    // -------------------------------------------------------------
    // STAGE 5: Semantic Diff Analysis
    // -------------------------------------------------------------
    const diffEval = SemanticDiffEngine.analyzeDiff(previousDoc, { text: rawBody });
    pipelineStages.push({ stage: "5_SEMANTIC_DIFF", result: diffEval });

    if (!diffEval.hasChanged) {
      return {
        pipelineStatus: "COSMETIC_ONLY",
        finalDecision: FRAUD_DECISIONS.VERIFIED_OFFICIAL,
        summary: "Phát hiện biến thiên định dạng nhưng không thay đổi quy tắc học thuật.",
        stages: pipelineStages
      };
    }

    // -------------------------------------------------------------
    // STAGE 6: Rule Dependency DAG & Invalidation
    // -------------------------------------------------------------
    const dagImpact = RuleDependencyDAG.traceDocumentImpact(source.sourceId || "DOC_QD_3116");
    pipelineStages.push({ stage: "6_RULE_DEPENDENCY_DAG", result: dagImpact });

    // -------------------------------------------------------------
    // STAGE 7: Human Review Gate Holding
    // -------------------------------------------------------------
    const candidateHolding = {
      candidateId: `CANDIDATE_${source.sourceId}_${Date.now()}`,
      status: RULE_LIFECYCLE_STATES.CANDIDATE,
      requiresHumanReview: dagImpact.requiresHumanReviewGate || fraudEval.requiresHumanReview,
      humanReviewStatus: "PENDING_APPROVAL",
      reasons: diffEval.changes.map(c => `${c.field}: ${c.oldValue} -> ${c.newValue}`)
    };
    pipelineStages.push({ stage: "7_HUMAN_REVIEW_GATE", result: candidateHolding });

    // -------------------------------------------------------------
    // STAGE 8: Academic Digital Twin Impact Projection
    // -------------------------------------------------------------
    let studentImpact = null;
    if (studentProfile) {
      studentImpact = AcademicDigitalTwin.evaluateStudentImpact(studentProfile, {
        changeId: candidateHolding.candidateId,
        affectedProgram: "7480103",
        affectedCohort: "2026",
        field: diffEval.changes[0]?.field || "ENGLISH_EXIT_STANDARD",
        oldValue: diffEval.changes[0]?.oldValue || "TOEIC 550",
        newValue: diffEval.changes[0]?.newValue || "TOEIC 600",
        effectiveDate: executionTimestamp
      });
      pipelineStages.push({ stage: "8_DIGITAL_TWIN_IMPACT", result: studentImpact });
    }

    return {
      pipelineStatus: "CANDIDATE_HELD_FOR_REVIEW",
      finalDecision: FRAUD_DECISIONS.VERIFIED_UPDATED,
      summary: "Biến thiên học thuật hợp lệ từ nguồn chính thống. Đã sinh Candidate và gửi tới Human Review Gate.",
      snapshot,
      diff: diffEval,
      dagImpact,
      candidate: candidateHolding,
      studentImpact,
      stages: pipelineStages
    };
  }
}
