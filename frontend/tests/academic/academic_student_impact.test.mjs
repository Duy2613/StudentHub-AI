/**
 * StudentHub AI — Academic Student Impact Engine Test Suite
 * 
 * Tests:
 * 1. Cohort and Major scope isolation (Affected vs. Unaffected)
 * 2. Fine-grained Impact Levels (NONE, LOW, MEDIUM, HIGH, CRITICAL)
 * 3. English standard deficit evaluation
 * 4. Tuition fee debt impact
 * 5. Actionable personalized reason generation
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicDigitalTwin, STUDENT_IMPACT_LEVELS } from "../../src/lib/intelligence/academic/academicDigitalTwin.js";

test("▶ [ACADEMIC-IMPACT-1] Student Impact Scope Isolation", async (t) => {
  await t.test("I1.1: Student outside affected cohort evaluates to impactLevel NONE (isAffected = false)", () => {
    const studentProfile = {
      studentId: "24110001",
      cohort: 2024,
      programCode: "7480103" // SE
    };

    const rule = {
      ruleId: "RULE_K26_ONLY",
      type: "ENGLISH_STANDARD",
      affectedScope: { cohorts: ["2026"], programs: ["ALL"] },
      values: { toeicScore: 600 }
    };

    const impact = AcademicDigitalTwin.evaluateStudentImpact(studentProfile, rule);

    assert.equal(impact.isAffected, false);
    assert.equal(impact.impactLevel, STUDENT_IMPACT_LEVELS.NONE);
    assert.ok(impact.reasons[0].includes("không ảnh hưởng"));
  });

  await t.test("I1.2: Student in affected cohort with TOEIC deficit evaluates to HIGH impact", () => {
    const studentProfile = {
      studentId: "24110002",
      cohort: 2024,
      programCode: "7480103",
      englishCertificate: { type: "TOEIC", score: 450 }
    };

    const rule = {
      ruleId: "RULE_ENG_550",
      type: "ENGLISH_STANDARD",
      affectedScope: { cohorts: ["2024"], programs: ["7480103"] },
      values: { toeicScore: 550 }
    };

    const impact = AcademicDigitalTwin.evaluateStudentImpact(studentProfile, rule);

    assert.equal(impact.isAffected, true);
    assert.equal(impact.impactLevel, STUDENT_IMPACT_LEVELS.HIGH);
    assert.equal(impact.urgency, "HIGH");
    assert.ok(impact.reasons.some(r => r.includes("Chưa đạt chuẩn")));
    assert.ok(impact.requiredActions[0].includes("550"));
  });

  await t.test("I1.3: Unpaid tuition fee with imminent deadline evaluates to CRITICAL impact", () => {
    const studentProfile = {
      studentId: "24110003",
      cohort: 2024,
      programCode: "7480103",
      tuitionPaid: false
    };

    const rule = {
      ruleId: "RULE_FEE_DEADLINE",
      type: "TUITION_FEE",
      affectedScope: { cohorts: ["ALL"], programs: ["ALL"] },
      deadline: "2026-09-05",
      values: { feeAmount: 16000000 }
    };

    const impact = AcademicDigitalTwin.evaluateStudentImpact(studentProfile, rule);

    assert.equal(impact.isAffected, true);
    assert.equal(impact.impactLevel, STUDENT_IMPACT_LEVELS.CRITICAL);
    assert.equal(impact.urgency, "CRITICAL");
    assert.ok(impact.reasons.some(r => r.includes("chưa hoàn thành học phí")));
  });
});
