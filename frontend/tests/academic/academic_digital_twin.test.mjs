/**
 * StudentHub AI — Authoritative Student Academic Digital Twin Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { StudentDigitalTwinModel } from "../../src/lib/intelligence/academic/studentDigitalTwinModel.js";
import { StudentDigitalTwinStore } from "../../src/lib/intelligence/academic/studentDigitalTwinStore.js";

const TWIN_TEST_STORAGE = path.resolve(process.cwd(), ".data", "test_student_digital_twins.json");

test("▶ [DIGITAL-TWIN-1] Model Invariants & Consistency Validation", async (t) => {
  await t.test("DT1.1: creates valid normalized Student Digital Twin", () => {
    const twin = StudentDigitalTwinModel.createDigitalTwin({
      studentId: "24110001",
      fullName: "Nguyễn Văn Duy",
      cohort: 2024,
      earnedCredits: 115,
      totalRequiredCredits: 150,
      cgpa: 2.85,
      courses: [{ courseCode: "SWEN330103", isPassed: true }],
      certificates: [{ type: "TOEIC", score: 480 }]
    });

    assert.equal(twin.studentId, "24110001");
    assert.equal(twin.remainingCredits, 35);
    assert.equal(twin.isThesisEligible, true);
    assert.equal(twin.isGraduationReady, false);
  });

  await t.test("DT1.2: rejects invalid CGPA outside [0.0, 4.0]", () => {
    assert.throws(() => {
      StudentDigitalTwinModel.createDigitalTwin({
        studentId: "24110001",
        cgpa: 4.85
      });
    }, /Invalid CGPA/);
  });

  await t.test("DT1.3: rejects impossible cohort numbers", () => {
    assert.throws(() => {
      StudentDigitalTwinModel.createDigitalTwin({
        studentId: "24110001",
        cohort: 1899
      });
    }, /Impossible cohort/);
  });
});

test("▶ [DIGITAL-TWIN-2] Durable Store & Student Boundary Isolation", async (t) => {
  StudentDigitalTwinStore.setStoragePath(TWIN_TEST_STORAGE);
  StudentDigitalTwinStore.resetStore();

  const twinA = {
    studentId: "24110001",
    fullName: "Sinh Viên A",
    cohort: 2024,
    earnedCredits: 115,
    cgpa: 2.85,
    revision: 1
  };

  const twinB = {
    studentId: "24110002",
    fullName: "Sinh Viên B",
    cohort: 2024,
    earnedCredits: 140,
    cgpa: 3.50,
    revision: 1
  };

  await t.test("DT2.1: saves and retrieves distinct twins for distinct students", () => {
    StudentDigitalTwinStore.saveTwin(twinA);
    StudentDigitalTwinStore.saveTwin(twinB);

    const retrievedA = StudentDigitalTwinStore.getTwin("24110001");
    const retrievedB = StudentDigitalTwinStore.getTwin("24110002");

    assert.equal(retrievedA.fullName, "Sinh Viên A");
    assert.equal(retrievedB.fullName, "Sinh Viên B");
    assert.equal(retrievedA.earnedCredits, 115);
    assert.equal(retrievedB.earnedCredits, 140);
  });

  await t.test("DT2.2: rehydrates twins from durable storage across restarts", () => {
    StudentDigitalTwinStore.rehydrate();

    const retrievedA = StudentDigitalTwinStore.getTwin("24110001");
    assert.ok(retrievedA);
    assert.equal(retrievedA.cgpa, 2.85);
  });

  await t.test("DT2.3: rejects stale twin revision overwrite", () => {
    const staleTwinA = {
      ...twinA,
      revision: 0,
      fullName: "Stale Overwrite"
    };

    assert.throws(() => {
      StudentDigitalTwinStore.saveTwin(staleTwinA);
    }, /STALE_TWIN_REVISION/);
  });

  // Cleanup
  StudentDigitalTwinStore.resetStore();
});
