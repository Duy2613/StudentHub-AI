/**
 * StudentHub AI — Personal Digital Twin & Personal Data Vault Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { PersonalDigitalTwin, DATA_CLASSIFICATION } from "../../src/lib/personalization/PersonalDigitalTwin.js";
import { DeviceSyncEngine } from "../../src/lib/personalization/DeviceSyncEngine.js";

describe("Personal Digital Twin & Data Vault Engine", () => {
  beforeEach(() => {
    PersonalDigitalTwin.clear();
    DeviceSyncEngine.clear();
  });

  it("should construct authorized Digital Twin with explicit 5-tier data classifications", () => {
    const subjectId = "student:24110001";
    const twin = PersonalDigitalTwin.buildDigitalTwin(subjectId);

    assert.ok(twin.twinId);
    assert.strictEqual(twin.subjectId, subjectId);

    // 1. Institution Provided Data
    assert.strictEqual(twin.identity.classification, DATA_CLASSIFICATION.INSTITUTION_PROVIDED);
    assert.strictEqual(twin.identity.studentId, "24110001");
    assert.strictEqual(twin.academicContext.classification, DATA_CLASSIFICATION.INSTITUTION_PROVIDED);
    assert.ok(twin.academicContext.cgpa > 0);

    // 2. System Derived State
    assert.strictEqual(twin.eligibilityState.classification, DATA_CLASSIFICATION.SYSTEM_DERIVED);
    assert.ok(twin.eligibilityState.totalRequirementCount > 0);

    // 3. User Owned Vault State
    assert.strictEqual(twin.personalPreferences.classification, DATA_CLASSIFICATION.USER_OWNED);
    assert.ok(twin.personalPreferences.goals.length >= 1);

    // 4. Security Sensitive Context
    assert.strictEqual(twin.securityContext.classification, DATA_CLASSIFICATION.SECURITY_SENSITIVE);

    // 5. Anti-Surveillance Invariant: Ensure NO prohibited telemetry is collected
    assert.strictEqual(twin.browserHistory, undefined);
    assert.strictEqual(twin.deviceFiles, undefined);
    assert.strictEqual(twin.clipboardContents, undefined);
    assert.strictEqual(twin.keystrokes, undefined);
  });

  it("should allow user to update personal goals, study preferences, and save knowledge", () => {
    const subjectId = "student:24110001";

    const newGoals = ["Đạt chứng chỉ AWS Cloud Practitioner", "Tốt nghiệp đúng hạn 2028"];
    const updatedGoals = PersonalDigitalTwin.updatePersonalGoals(subjectId, newGoals);
    assert.deepStrictEqual(updatedGoals, newGoals);

    const savedItem = PersonalDigitalTwin.saveKnowledgeItem(subjectId, {
      title: "Quy chế miễn môn tiếng Anh theo điểm IELTS 6.5",
      topic: "academic.certification"
    });

    assert.ok(savedItem.savedId.startsWith("save_"));
    const allSaved = PersonalDigitalTwin.getSavedKnowledge(subjectId);
    assert.strictEqual(allSaved.length, 1);
    assert.strictEqual(allSaved[0].title, "Quy chế miễn môn tiếng Anh theo điểm IELTS 6.5");
  });

  it("should generate GDPR compliant personal data export", () => {
    const subjectId = "student:24110001";
    const exportData = PersonalDigitalTwin.exportPersonalVault(subjectId);

    assert.strictEqual(exportData.exportMetadata.subjectId, subjectId);
    assert.strictEqual(exportData.exportMetadata.complianceStandard, "GDPR_ARTICLE_20_PORTABILITY");
    assert.ok(exportData.personalDigitalTwin);
    assert.ok(Array.isArray(exportData.savedKnowledgeVault));
  });
});
