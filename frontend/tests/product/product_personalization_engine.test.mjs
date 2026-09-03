/**
 * StudentHub AI — Personalization & Multi-Audience Context Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { PersonalizationEngine, PERSONA_TYPE } from "../../src/lib/personalization/PersonalizationEngine.js";
import { PersonalDigitalTwin } from "../../src/lib/personalization/PersonalDigitalTwin.js";
import { SecurityPrincipal } from "../../src/lib/security/core/SecurityPrincipal.js";

describe("Personalization & Context Engine", () => {
  beforeEach(() => {
    PersonalizationEngine.clear();
    PersonalDigitalTwin.clear();
  });

  it("should infer correct persona based on academic progress and role", () => {
    // 1. New Student (earnedCredits < 30)
    const newStudentTwin = { academicContext: { earnedCredits: 16 } };
    const pNew = PersonalizationEngine.inferPersona(newStudentTwin, null);
    assert.strictEqual(pNew, PERSONA_TYPE.NEW_STUDENT);

    // 2. Senior Student (earnedCredits >= 100)
    const seniorStudentTwin = { academicContext: { earnedCredits: 112 } };
    const pSenior = PersonalizationEngine.inferPersona(seniorStudentTwin, null);
    assert.strictEqual(pSenior, PERSONA_TYPE.SENIOR_STUDENT);

    // 3. Expert Role
    const expertPrincipal = new SecurityPrincipal({ subjectId: "expert:01", roles: ["expert"] });
    const pExpert = PersonalizationEngine.inferPersona(seniorStudentTwin, expertPrincipal);
    assert.strictEqual(pExpert, PERSONA_TYPE.EXPERT);
  });

  it("should compile explainable Command Center Context with Grounded Actions", () => {
    const subjectId = "student:24110001";
    const context = PersonalizationEngine.compileCommandCenterContext(subjectId, null);

    assert.ok(context.commandCenterId);
    assert.strictEqual(context.subjectId, subjectId);
    assert.ok(context.digitalTwinSummary.cgpa > 0);
    assert.ok(context.todaySchedule.length >= 1);

    // Grounded Next Best Action explainability check
    assert.ok(context.nextBestAction.whyAmISeeingThis.length > 10);
    assert.ok(context.nextBestAction.supportingEvidence.length > 5);
    assert.ok(context.nextBestAction.confidence >= 0.80);
  });

  it("should update and reset personalization settings safely", () => {
    const subjectId = "student:24110001";

    const updated = PersonalizationEngine.updatePreferences(subjectId, { compactMode: true });
    assert.strictEqual(updated.compactMode, true);

    const resetRes = PersonalizationEngine.resetPersonalization(subjectId);
    assert.strictEqual(resetRes.success, true);

    const fresh = PersonalizationEngine.getPreferences(subjectId);
    assert.strictEqual(fresh.compactMode, false);
  });
});
