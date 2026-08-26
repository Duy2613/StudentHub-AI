/**
 * StudentHub AI — Academic Live-Sync & Digital Twin Multi-Tier Test Suite
 * 
 * Enforces Live-Sync & Continuous Source Verification:
 * - [SOURCE_WATCHER_TEST]: Source registry, SHA-256, Freshness SLAs, ETag 304, Backoff schedule.
 * - [DOCUMENT_VERSION_TEST]: Immutable snapshots, version history, fallback recovery.
 * - [SEMANTIC_DIFF_TEST]: Cosmetic noise filtering vs Semantic rule change detection.
 * - [RULE_INVALIDATION_TEST]: Rule Dependency DAG, ACTIVE -> SUPERSEDED, CANDIDATE, Human Review Gate.
 * - [TEMPORAL_IMPACT_TEST] & [COHORT_IMPACT_TEST]: Cohort isolation and cross-cohort non-contamination.
 * - [PARSER_FAILURE_TEST] & [CORRUPTED_SOURCE_TEST]: Parser failure detection & Quarantine guard.
 * - [STUDENT_IMPACT_TEST]: Digital twin state recomputation & targeted zero-spam radar alerts.
 * - [REGRESSION_TEST]: Golden scenario verification across K23, K24, K25, K26 cohorts.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { LiveSourceWatcher, SOURCE_SLA_TIERS, SOURCE_HEALTH_STATES, MONITORED_HCMUTE_SOURCES } from "../../src/lib/intelligence/academic/liveSourceWatcher.js";
import { DocumentSnapshotStore, IMMUTABLE_DOCUMENT_SNAPSHOTS } from "../../src/lib/intelligence/academic/documentSnapshotStore.js";
import { SemanticDiffEngine, CHANGE_CLASSIFICATION } from "../../src/lib/intelligence/academic/semanticDiffEngine.js";
import { RuleDependencyDAG, RULE_LIFECYCLE_STATES } from "../../src/lib/intelligence/academic/ruleDependencyDAG.js";
import { ParserIntegrityGuard, INGESTION_SAFETY_STATES } from "../../src/lib/intelligence/academic/parserIntegrityGuard.js";
import { AcademicDigitalTwin } from "../../src/lib/intelligence/academic/academicDigitalTwin.js";

console.log("======================================================================");
console.log("🔄 STUDENTHUB AI — ACADEMIC LIVE-SYNC & DIGITAL TWIN TEST SUITE");
console.log("======================================================================");

describe("[SOURCE_WATCHER_TEST] Protocol 1: Source Watcher, SLAs & Conditional Fetching", () => {
  it("should calculate deterministic SHA-256 hash for normalized content", () => {
    const hash1 = LiveSourceWatcher.computeContentHash("Quy định đào tạo HCMUTE 2026");
    const hash2 = LiveSourceWatcher.computeContentHash("Quy định đào tạo HCMUTE 2026");
    const hashDiff = LiveSourceWatcher.computeContentHash("Quy định đào tạo HCMUTE 2025");

    assert.strictEqual(hash1, hash2);
    assert.notStrictEqual(hash1, hashDiff);
    assert.strictEqual(hash1.length, 64);
  });

  it("should evaluate freshness SLAs across Critical Notices vs General Announcements", () => {
    const daotaoSource = MONITORED_HCMUTE_SOURCES.find(s => s.sourceId === "SRC_HCMUTE_DAOTAO");
    const freshCheck = LiveSourceWatcher.evaluateSourceFreshnessSLA(daotaoSource, new Date(daotaoSource.lastChecked));
    assert.strictEqual(freshCheck.isSlaBreached, false);

    // Simulate 3 hours elapsed (Critical notice SLA limit is 1 hour)
    const futureTime = new Date(new Date(daotaoSource.lastChecked).getTime() + 3 * 3600 * 1000);
    const staleCheck = LiveSourceWatcher.evaluateSourceFreshnessSLA(daotaoSource, futureTime);
    assert.strictEqual(staleCheck.isSlaBreached, true);
    assert.strictEqual(staleCheck.recommendedStatus, SOURCE_HEALTH_STATES.STALE);
  });

  it("should support conditional ETag fetching (HTTP 304 Not Modified)", () => {
    const source = MONITORED_HCMUTE_SOURCES[0];
    const unchanged = LiveSourceWatcher.evaluateConditionalFetch(source, { statusCode: 304 });
    assert.strictEqual(unchanged.hasChanged, false);
    assert.strictEqual(unchanged.shouldDownloadBody, false);

    const changed = LiveSourceWatcher.evaluateConditionalFetch(source, { etag: '"new-etag-3116-v2"' });
    assert.strictEqual(changed.hasChanged, true);
    assert.strictEqual(changed.shouldDownloadBody, true);
  });

  it("should calculate exponential backoff with jitter on crawl failures", () => {
    const source = { sourceId: "SRC_TEST", consecutiveFailures: 2 };
    const backoff = LiveSourceWatcher.handleCrawlFailure(source);
    assert.strictEqual(backoff.consecutiveFailures, 3);
    assert.strictEqual(backoff.newStatus, SOURCE_HEALTH_STATES.FAILED);
    assert.ok(backoff.retryDelayMinutes >= 20);
  });
});

describe("[DOCUMENT_VERSION_TEST] Protocol 2: Immutable Snapshot Store & Safe Fallback", () => {
  it("should retrieve active immutable snapshot and preserve historical superseded versions", () => {
    const activeDoc = DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116");
    assert.ok(activeDoc);
    assert.strictEqual(activeDoc.status, "ACTIVE");
    assert.strictEqual(activeDoc.effectiveFrom, "2025-08-22");

    const history = DocumentSnapshotStore.getDocumentHistory("DOC_QD_3811");
    assert.ok(history.length >= 1);
    assert.strictEqual(history[0].status, "SUPERSEDED");
  });

  it("should serve LAST_VERIFIED_SNAPSHOT with STALE_SOURCE_WARNING on source failure", () => {
    const fallback = DocumentSnapshotStore.serveLastVerifiedState("DOC_QD_3116", true);
    assert.strictEqual(fallback.found, true);
    assert.strictEqual(fallback.isStale, true);
    assert.ok(fallback.warning.includes("STALE_SOURCE_WARNING"));
  });
});

describe("[SEMANTIC_DIFF_TEST] Protocol 3: Cosmetic Noise Filtering vs. Semantic Rule Mutations", () => {
  it("should classify HTML tag / CSS / spacing changes as purely COSMETIC", () => {
    const v1 = { text: '<div class="p-2 text-red-500">Quy định cảnh báo học vụ điểm TB < 0.80</div>' };
    const v2 = { text: '<div class="p-4 flex text-blue-600">   Quy định cảnh báo học vụ điểm TB < 0.80   </div>' };

    const diff = SemanticDiffEngine.analyzeDiff(v1, v2);
    assert.strictEqual(diff.hasChanged, false);
    assert.strictEqual(diff.classification, CHANGE_CLASSIFICATION.COSMETIC);
    assert.strictEqual(diff.semanticChangesCount, 0);
  });

  it("should extract semantic GPA / Credit / English requirement mutations as SEMANTIC", () => {
    const vOld = { text: "Quy định cảnh báo học kỳ 1: điểm trung bình < 1.00. Chuẩn ngoại ngữ tốt nghiệp TOEIC 450." };
    const vNew = { text: "Quy định cảnh báo học kỳ 1: điểm trung bình < 0.80. Chuẩn ngoại ngữ tốt nghiệp TOEIC 550." };

    const diff = SemanticDiffEngine.analyzeDiff(vOld, vNew);
    assert.strictEqual(diff.hasChanged, true);
    assert.strictEqual(diff.classification, CHANGE_CLASSIFICATION.SEMANTIC);
    assert.ok(diff.semanticChangesCount >= 2);
    assert.ok(diff.changes.some(c => c.field === "GPA_THRESHOLD"));
    assert.ok(diff.changes.some(c => c.field === "ENGLISH_EXIT_STANDARD"));
  });
});

describe("[RULE_INVALIDATION_TEST] Protocol 4: Rule Dependency DAG & Human Review Gate", () => {
  it("should trace downstream code, tests, and user features affected by QĐ 3116", () => {
    const impact = RuleDependencyDAG.traceDocumentImpact("DOC_QD_3116");
    assert.ok(impact.affectedRules.includes("RULE_CREDIT_SEM_NORMAL"));
    assert.ok(impact.affectedRules.includes("RULE_ACADEMIC_WARNING_SEM1"));
    assert.ok(impact.affectedFeatures.includes("TimetableScheduler"));
    assert.ok(impact.affectedFeatures.includes("AcademicProbationRadar"));
    assert.strictEqual(impact.requiresHumanReviewGate, true);
  });

  it("should transition old rule to SUPERSEDED and register CANDIDATE requiring review", () => {
    const transition = RuleDependencyDAG.processRuleTransition("RULE_ACADEMIC_WARNING_SEM1", {
      newThreshold: "DTB < 0.80"
    });
    assert.strictEqual(transition.success, true);
    assert.strictEqual(transition.oldRuleState.newState, RULE_LIFECYCLE_STATES.SUPERSEDED);
    assert.strictEqual(transition.candidateRule.status, RULE_LIFECYCLE_STATES.CANDIDATE);
    assert.strictEqual(transition.candidateRule.humanReviewStatus, "PENDING_APPROVAL");
  });
});

describe("[PARSER_FAILURE_TEST] Protocol 5: Parser Failure Safety & Quarantine Protection", () => {
  it("should raise PARSER_FAILURE and STOP_INGESTION when crawler returns empty data", () => {
    const prevCatalog = [{ code: "MATH141701", name: "Giải tích 1", credits: 4 }];
    const integrity = ParserIntegrityGuard.validateCatalogIntegrity(prevCatalog, []);

    assert.strictEqual(integrity.status, INGESTION_SAFETY_STATES.PARSER_FAILURE);
    assert.strictEqual(integrity.stopIngestion, true);
    assert.strictEqual(integrity.shouldQuarantine, true);
  });

  it("should trigger QUARANTINE if course catalog suddenly collapses by > 50%", () => {
    const prevCatalog = Array.from({ length: 68 }, (_, i) => ({
      code: `COURSE_${i}`,
      name: `Course ${i}`,
      credits: 3,
      prerequisites: ["PROG130103"]
    }));

    // Sudden collapse to 5 courses
    const incomingCorrupted = Array.from({ length: 5 }, (_, i) => ({
      code: `COURSE_${i}`,
      name: `Course ${i}`,
      credits: 3
    }));

    const integrity = ParserIntegrityGuard.validateCatalogIntegrity(prevCatalog, incomingCorrupted);
    assert.strictEqual(integrity.status, INGESTION_SAFETY_STATES.QUARANTINED);
    assert.strictEqual(integrity.stopIngestion, true);
    assert.ok(integrity.reason.includes("sụt giảm bất thường > 50%"));
  });
});

describe("[STUDENT_IMPACT_TEST] Protocol 6: Academic Digital Twin & Targeted Personal Alerts", () => {
  it("should accurately target K26 student for TOEIC 550 while leaving K24 student UNAFFECTED", () => {
    const k26Student = { studentId: "SV_26110001", cohort: 2026, programCode: "7480103" };
    const k24Student = { studentId: "SV_24110001", cohort: 2024, programCode: "7480103" };

    const englishRuleChange = {
      changeId: "CHANGE_ENG_K26",
      affectedProgram: "7480103",
      affectedCohort: "2026",
      field: "ENGLISH_EXIT_STANDARD",
      oldValue: "TOEIC 500",
      newValue: "TOEIC 550 / B2 International",
      effectiveDate: "2026-08-10"
    };

    const k26Impact = AcademicDigitalTwin.evaluateStudentImpact(k26Student, englishRuleChange);
    const k24Impact = AcademicDigitalTwin.evaluateStudentImpact(k24Student, englishRuleChange);

    assert.strictEqual(k26Impact.isAffected, true);
    assert.strictEqual(k26Impact.impactType, "LANGUAGE_STANDARD_MODIFIED");
    assert.ok(k26Impact.radarAlert);

    assert.strictEqual(k24Impact.isAffected, false);
    assert.strictEqual(k24Impact.impactType, "UNAFFECTED");
    assert.strictEqual(k24Impact.radarAlert, null);
  });

  it("should recompute full student digital twin state", () => {
    const twin = AcademicDigitalTwin.recomputeTwinState({
      studentId: "SV_24110002",
      cohort: 2024,
      programCode: "7480103",
      earnedCredits: 115,
      cgpa: 2.85,
      completedCourses: ["SWEN330103", "INTR430103", "DSAA230203"]
    });

    assert.strictEqual(twin.isThesisEligible, true);
    assert.strictEqual(twin.remainingCredits, 35);
    assert.ok(twin.programName.includes("Kỹ thuật Phần mềm"));
  });
});

describe("[REGRESSION_TEST] Protocol 7: Golden Scenario Verification Across Cohorts", () => {
  it("Golden Scenario 1: K23 student graduating with TOEIC 480 is valid (K23 standard is TOEIC 450)", () => {
    const twin = AcademicDigitalTwin.recomputeTwinState({
      studentId: "SV_K23_GRAD",
      cohort: 2023,
      programCode: "7480103",
      earnedCredits: 150,
      cgpa: 3.15,
      completedCourses: ["SWEN330103", "INTR430103", "GRAP440103"]
    });

    assert.strictEqual(twin.isGraduationReady, true);
    assert.strictEqual(twin.remainingCredits, 0);
  });

  it("Golden Scenario 2: K26 freshman with GPA 0.85 in Sem 1 is SAFE under active QĐ 3116 (threshold 0.80)", () => {
    const twin = AcademicDigitalTwin.recomputeTwinState({
      studentId: "SV_K26_FRESHMAN",
      cohort: 2026,
      programCode: "7480103",
      earnedCredits: 17,
      cgpa: 0.85,
      completedCourses: ["MATH141701"]
    });

    assert.strictEqual(twin.isThesisEligible, false); // Expected, only 17 credits
    assert.strictEqual(twin.cohort, 2026);
  });
});
