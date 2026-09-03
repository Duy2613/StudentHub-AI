/**
 * StudentHub AI — Academic Action Intent Contract & Security Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicActionIntent, ACTION_TYPES, EXECUTION_MODES } from "../../src/lib/intelligence/academic/academicActionIntent.js";

test("▶ [ACTION-INTENT-1] Action Intent Creation & Target Sanitization", async (t) => {
  await t.test("AI1.1: creates valid action intent with sanitized internal route", () => {
    const intent = AcademicActionIntent.createIntent({
      type: ACTION_TYPES.REGISTER,
      label: "Đăng ký học lại"
    });

    assert.equal(intent.type, "REGISTER");
    assert.equal(intent.label, "Đăng ký học lại");
    assert.equal(intent.target, "/academic?view=planner");
  });

  await t.test("AI1.2: rejects invalid action types", () => {
    assert.throws(() => {
      AcademicActionIntent.createIntent({
        type: "INVALID_ARBITRARY_ACTION",
        label: "Test"
      });
    }, /Invalid action type/);
  });

  await t.test("AI1.3: blocks dangerous URI schemes in external links", () => {
    assert.throws(() => {
      AcademicActionIntent.createIntent({
        type: ACTION_TYPES.OPEN_SOURCE,
        label: "Mở liên kết",
        target: "javascript:alert(1)",
        executionMode: EXECUTION_MODES.EXTERNAL_LINK
      });
    }, /Dangerous scheme/);
  });
});

test("▶ [ACTION-INTENT-2] Precondition Evaluation", async (t) => {
  const student = {
    earnedCredits: 115,
    cgpa: 2.85,
    tuitionPaid: true,
    completedCourses: ["SWEN330103", "DSAA230203"],
    englishCertificate: { type: "TOEIC", score: 480 }
  };

  await t.test("AI2.1: evaluates passing preconditions correctly", () => {
    const preconditions = [
      { type: "MIN_CREDITS", value: 110 },
      { type: "MIN_GPA", value: 2.5 },
      { type: "REQUIRE_TUITION_PAID" }
    ];

    const result = AcademicActionIntent.evaluatePreconditions(preconditions, student);
    assert.equal(result.met, true);
    assert.equal(result.blockedReasons.length, 0);
  });

  await t.test("AI2.2: flags unmet preconditions with explicit explanations", () => {
    const preconditions = [
      { type: "MIN_CREDITS", value: 130 },
      { type: "ENGLISH_CERTIFICATE", minScore: 550 }
    ];

    const result = AcademicActionIntent.evaluatePreconditions(preconditions, student);
    assert.equal(result.met, false);
    assert.equal(result.blockedReasons.length, 2);
    assert.ok(result.blockedReasons[0].includes("130"));
    assert.ok(result.blockedReasons[1].includes("550"));
  });
});
