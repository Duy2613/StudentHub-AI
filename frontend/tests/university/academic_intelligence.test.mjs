/**
 * StudentHub AI — University Knowledge & Academic Intelligence Source-Backed Test Suite
 * 
 * Enforces Source-to-Rule Verification Protocol:
 * Tests are categorized into:
 * - [REAL_SOURCE_VERIFICATION]: Validates rules directly against QĐ 3116/QĐ-ĐHSPKT (22/08/2025) and FIT documents.
 * - [DOCUMENT_BACKED_TEST]: Validates end-to-end proof chain from document clause to code execution.
 * - [TEMPORAL_TEST]: Validates cohort isolation (K23 vs K26) and regulatory transition without retroactive harm.
 * - [HARD_NEGATIVE_TEST]: Explicitly rejects outdated rules, false prerequisites, and forum rumors.
 * - [UNIT_TEST]: Validates pure mathematical and graph algorithms.
 * - [REGRESSION_TEST]: Verifies that new regulations do not break historical cohort resolution.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { HCMUTE_UNIVERSITY_PROFILE } from "../../src/lib/intelligence/academic/hcmuteKnowledgeGraph.js";
import { getCurriculumForStudent, HCMUTE_VERSIONED_CURRICULA } from "../../src/lib/intelligence/academic/versionedCurricula.js";
import { AcademicRuleEngine } from "../../src/lib/intelligence/academic/academicRuleEngine.js";
import { AcademicTruthEngine, RULE_VERIFICATION_STATUSES, HCMUTE_OFFICIAL_DOCUMENTS } from "../../src/lib/intelligence/academic/academicTruthEngine.js";
import { WhatIfEngine } from "../../src/lib/intelligence/academic/whatIfEngine.js";
import { AnnouncementEngine } from "../../src/lib/intelligence/academic/announcementEngine.js";
import { AcademicRadarEngine } from "../../src/lib/intelligence/academic/academicRadarEngine.js";

console.log("======================================================================");
console.log("🏛️ STUDENTHUB AI — SOURCE-BACKED ACADEMIC TRUTH TEST SUITE (HCMUTE)");
console.log("======================================================================");

describe("[REAL_SOURCE_VERIFICATION] Protocol 1: QĐ 3116/QĐ-ĐHSPKT (22/08/2025) Official Regulation Proofs", () => {
  it("should verify active QĐ 3116/2025 replaces superseded QĐ 3811/2024", () => {
    const doc3116 = HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025;
    const doc3811 = HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3811_2024;

    assert.strictEqual(doc3116.status, "ACTIVE");
    assert.strictEqual(doc3116.replaces, "DOC_QD_3811_2024");
    assert.strictEqual(doc3811.status, "SUPERSEDED");
    assert.strictEqual(doc3811.replacedBy, "DOC_QD_3116_2025");
  });

  it("should retrieve verified Credit Limit rule with clause proof (Điều 14, Khoản 2)", () => {
    const proof = AcademicTruthEngine.getRuleWithProof("RULE_CREDIT_SEM_NORMAL");
    assert.ok(proof);
    assert.strictEqual(proof.minCredits, 12);
    assert.strictEqual(proof.maxCredits, 24);
    assert.strictEqual(proof.verificationStatus, RULE_VERIFICATION_STATUSES.VERIFIED);
    assert.ok(proof.pageClause.includes("Điều 14"));
  });

  it("should retrieve verified Warning rules with clause proof (Điều 16, Khoản 1 & 2)", () => {
    const sem1Proof = AcademicTruthEngine.getRuleWithProof("RULE_ACADEMIC_WARNING_SEM1");
    const dropProof = AcademicTruthEngine.getRuleWithProof("RULE_FORCED_ACADEMIC_DROP");

    assert.ok(sem1Proof);
    assert.strictEqual(sem1Proof.verificationStatus, RULE_VERIFICATION_STATUSES.VERIFIED);
    assert.ok(sem1Proof.pageClause.includes("Điều 16"));
    assert.strictEqual(dropProof.maxConsecutiveWarnings, 3);
  });
});

describe("[DOCUMENT_BACKED_TEST] Protocol 2: End-to-End Rule Execution with Provenance", () => {
  it("should execute evaluateSemesterCreditBounds and return exact QĐ 3116 document citation", () => {
    const res = AcademicRuleEngine.evaluateSemesterCreditBounds(18, 2.50);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.verification_status, RULE_VERIFICATION_STATUSES.VERIFIED);
    assert.ok(res.source_document.includes("3116"));
    assert.ok(res.page_clause.includes("Điều 14"));
  });

  it("should execute evaluateAcademicWarning under QĐ 3116 thresholds (Sem 1 < 0.80, Sem N < 1.00)", () => {
    // Semester 1 with GPA 0.85 -> Safe under QĐ 3116 (threshold is 0.80)
    const sem1Safe = AcademicRuleEngine.evaluateAcademicWarning({
      semesterIndex: 1,
      semesterGpa: 0.85,
      cumulativeGpa: 0.85,
      debtCredits: 0
    });
    assert.strictEqual(sem1Safe.isWarningTriggered, false);
    assert.strictEqual(sem1Safe.status, "NORMAL");

    // Semester 1 with GPA 0.75 -> Triggers warning under QĐ 3116
    const sem1Warn = AcademicRuleEngine.evaluateAcademicWarning({
      semesterIndex: 1,
      semesterGpa: 0.75,
      cumulativeGpa: 0.75,
      debtCredits: 0
    });
    assert.strictEqual(sem1Warn.isWarningTriggered, true);
    assert.strictEqual(sem1Warn.status, "ACADEMIC_WARNING");

    // Semester 2 with GPA 0.95 -> Triggers warning under QĐ 3116 (threshold is 1.00)
    const sem2Warn = AcademicRuleEngine.evaluateAcademicWarning({
      semesterIndex: 2,
      semesterGpa: 0.95,
      cumulativeGpa: 1.50,
      debtCredits: 3
    });
    assert.strictEqual(sem2Warn.isWarningTriggered, true);
  });

  it("should execute evaluateThesisEligibility and cite FIT curriculum Section 4.2", () => {
    const res = AcademicRuleEngine.evaluateThesisEligibility({
      earnedCredits: 115,
      cumulativeGpa: 2.85,
      completedCourses: ["SWEN330103", "INTR430103", "DSAA230203"]
    });
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.verification_status, RULE_VERIFICATION_STATUSES.VERIFIED);
    assert.ok(res.page_clause.includes("Mục 4.2"));
  });
});

describe("[TEMPORAL_TEST] Protocol 3: Cohort Version Isolation & Regulatory Transitions", () => {
  it("should isolate K23 (TOEIC 450) from K26 (TOEIC 550 / B2) without cross-contamination", () => {
    const k23 = getCurriculumForStudent("7480103", 2023);
    const k26 = getCurriculumForStudent("7480103", 2026);

    assert.strictEqual(k23.version.graduationConditions.englishLevel, "TOEIC 450");
    assert.strictEqual(k26.version.graduationConditions.englishLevel, "TOEIC 550 / B2 International");
  });

  it("should detect document changes and identify affected rules when regulations are updated", () => {
    const change = AcademicTruthEngine.detectDocumentChange("DOC_QD_3811_2024", "DOC_QD_3116_2025");
    assert.strictEqual(change.hasChanged, true);
    assert.strictEqual(change.newDocument, "QĐ 3116/2025");
    assert.ok(change.affectedRulesCount >= 0);
  });
});

describe("[HARD_NEGATIVE_TEST] Protocol 4: Rejection of Misinformation & Outdated Regulations", () => {
  it("should REJECT forum claim that C++ alone qualifies for Graduation Thesis", () => {
    // Community claim: "Chỉ cần học xong C++ là làm được luận văn"
    const result = AcademicRuleEngine.evaluateThesisEligibility({
      earnedCredits: 30, // Way below 110
      cumulativeGpa: 3.8,
      completedCourses: ["PROG130103"]
    });

    assert.strictEqual(result.eligible, false);
    assert.ok(result.reasons.some(r => r.includes("Chưa đủ số tín chỉ")));
  });

  it("should flag generic unverified assumption that all programs require exactly 150 credits", () => {
    const unverifiedRule = AcademicTruthEngine.getRuleWithProof("RULE_UNVERIFIED_GENERIC_150_CREDITS_ALL_PROGRAMS");
    assert.ok(unverifiedRule);
    assert.strictEqual(unverifiedRule.verificationStatus, RULE_VERIFICATION_STATUSES.UNVERIFIED);
    assert.strictEqual(unverifiedRule.isAuthorityVerified, false);
    assert.ok(unverifiedRule.proofSummary.includes("CẢNH BÁO"));
  });

  it("should REJECT applying outdated superseded warning thresholds to active evaluations", () => {
    // Under old superseded rule, semester 1 GPA 0.90 triggered warning (< 1.00).
    // Under active QĐ 3116, semester 1 GPA 0.90 is SAFE (threshold is 0.80).
    const evaluation = AcademicRuleEngine.evaluateAcademicWarning({
      semesterIndex: 1,
      semesterGpa: 0.90,
      cumulativeGpa: 0.90,
      debtCredits: 0
    });
    assert.strictEqual(evaluation.isWarningTriggered, false, "Active QĐ 3116 threshold 0.80 must prevail over old 1.00");
  });
});

describe("[UNIT_TEST] Protocol 5: Deterministic Graph & Scheduler Algorithms", () => {
  it("should compute BFS transitive closure for bottleneck simulation", () => {
    const impact = WhatIfEngine.simulateCourseFailure("PROG130103");
    assert.strictEqual(impact.found, true);
    assert.strictEqual(impact.bottleneckLevel, "CRITICAL_BOTTLENECK");
    assert.strictEqual(impact.blocksThesis, true);
    assert.ok(impact.totalDownstreamBlockedCount >= 4);
  });

  it("should compute announcement diffs between two versions", () => {
    const v1 = { deadline: "2026-08-30", location: "A1-302" };
    const v2 = { deadline: "2026-09-02", location: "A1-405" };
    const diff = AnnouncementEngine.computeAnnouncementDiff(v1, v2);
    assert.strictEqual(diff.has_changed, true);
    assert.strictEqual(diff.diff_status, "MODIFIED");
  });
});

describe("[REGRESSION_TEST] Protocol 6: Non-destructive Upgrade Verification", () => {
  it("should ensure historical 2024 graduation rules remain unmodified for K24 cohort", () => {
    const k24 = getCurriculumForStudent("7480103", 2024);
    assert.strictEqual(k24.version.graduationConditions.englishLevel, "TOEIC 500");
    assert.strictEqual(k24.totalCredits, 150);
  });
});
