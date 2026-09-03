/**
 * StudentHub AI — Academic Eligibility Engine Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicEligibilityEngine, ELIGIBILITY_STATUS, REQUIREMENT_TYPES } from "../../src/lib/intelligence/academic/academicEligibilityEngine.js";
import { StudentDigitalTwinModel } from "../../src/lib/intelligence/academic/studentDigitalTwinModel.js";

test("▶ [ELIGIBILITY-1] Typed Requirement Evaluation & Explainability", async (t) => {
  const eligibleTwin = StudentDigitalTwinModel.createDigitalTwin({
    studentId: "24110001",
    earnedCredits: 120,
    cgpa: 2.85,
    certificates: [{ type: "TOEIC", score: 600 }],
    tuitionPaid: true
  });

  const missingToeicTwin = StudentDigitalTwinModel.createDigitalTwin({
    studentId: "24110002",
    earnedCredits: 120,
    cgpa: 2.85,
    certificates: [{ type: "TOEIC", score: 480 }],
    tuitionPaid: true
  });

  await t.test("EE1.1: evaluates fully satisfied profile as ELIGIBLE", () => {
    const result = AcademicEligibilityEngine.evaluateEligibility(eligibleTwin);
    assert.equal(result.status, ELIGIBILITY_STATUS.ELIGIBLE);
    assert.equal(result.eligible, true);
    assert.equal(result.missingRequirements.length, 0);
    assert.ok(result.studentFacingExplanation.includes("đầy đủ"));
  });

  await t.test("EE1.2: evaluates student with TOEIC 480/550 as PARTIALLY_ELIGIBLE with clear explanation", () => {
    const result = AcademicEligibilityEngine.evaluateEligibility(missingToeicTwin);
    assert.equal(result.status, ELIGIBILITY_STATUS.PARTIALLY_ELIGIBLE);
    assert.equal(result.eligible, false);
    assert.ok(result.missingRequirements.length > 0);
    assert.ok(result.studentFacingExplanation.includes("TOEIC"));
    assert.ok(result.studentFacingExplanation.includes("480/550"));
  });

  await t.test("EE1.3: evaluates missing prerequisite courses accurately", () => {
    const customRule = {
      ruleId: "RULE_THESIS_DEFENSE",
      requirements: [
        { type: REQUIREMENT_TYPES.COURSE_COMPLETED, courses: ["SWEN330103", "SWEN430203"], label: "Hoàn thành đồ án chuyên ngành" }
      ]
    };

    const twinWithPartialCourses = StudentDigitalTwinModel.createDigitalTwin({
      studentId: "24110003",
      earnedCredits: 110,
      cgpa: 2.5,
      courses: [{ courseCode: "SWEN330103", isPassed: true }]
    });

    const result = AcademicEligibilityEngine.evaluateEligibility(twinWithPartialCourses, customRule);
    assert.equal(result.status, ELIGIBILITY_STATUS.NOT_ELIGIBLE);
    assert.ok(result.studentFacingExplanation.includes("SWEN430203"));
  });

  await t.test("EE1.4: handles null digital twin fail-closed with INSUFFICIENT_DATA", () => {
    const result = AcademicEligibilityEngine.evaluateEligibility(null);
    assert.equal(result.status, ELIGIBILITY_STATUS.INSUFFICIENT_DATA);
    assert.equal(result.eligible, false);
  });
});
