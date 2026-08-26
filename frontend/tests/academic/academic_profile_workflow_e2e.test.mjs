import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model } from "../../src/lib/intelligence/academic/studentProfile360Model.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";
import { StudentProfile360Service } from "../../src/lib/intelligence/academic/studentProfile360Service.js";
import { StudentAcademicSyncBridge } from "../../src/lib/intelligence/academic/studentAcademicSyncBridge.js";
import { StudentDigitalTwinStore } from "../../src/lib/intelligence/academic/studentDigitalTwinStore.js";
import { AcademicEligibilityEngine } from "../../src/lib/intelligence/academic/academicEligibilityEngine.js";
import { AcademicWorkflowService } from "../../src/lib/intelligence/academic/academicWorkflowService.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "../../src/lib/intelligence/academic/academicNotificationOrchestrator.js";

describe("Academic Profile 360 Full E2E & Restart Recovery Loop V1", () => {
  beforeEach(() => {
    StudentProfile360Store.clear();
    StudentDigitalTwinStore.clear();
    AcademicTaskStore.clear();
    AcademicNotificationStore.clear();
  });

  it("should execute full golden loop and preserve complete state across simulated restart", () => {
    // 1. Build authoritative profile 360
    const profile = StudentProfile360Model.createProfile({
      identity: {
        studentId: "24110001",
        fullName: "Nguyễn Văn Duy",
        institutionalEmail: "24110001@student.hcmute.edu.vn",
        cohort: 2024,
        programCode: "7480103",
        programName: "Kỹ thuật Phần mềm",
        faculty: "Khoa Công Nghệ Thông Tin"
      },
      records: {
        totalRequiredCredits: 150,
        courses: [
          { courseCode: "MATH1411", credits: 3, grade10: 8.5, isPassed: true },
          { courseCode: "SWEN3301", credits: 4, grade10: 9.0, isPassed: true }
        ],
        certifications: [
          { type: "TOEIC", score: 650, verificationStatus: "VERIFIED" }
        ],
        tuition: {
          remainingDebt: 0
        }
      },
      profileRevision: 10
    });
    StudentProfile360Store.saveProfile(profile);

    // 2. Sync to Digital Twin
    const twin = StudentAcademicSyncBridge.syncTwin("24110001", profile);
    assert.strictEqual(twin.evaluatedAgainstProfileRevision, 10);

    // 3. Evaluate Eligibility
    const eligibility = AcademicEligibilityEngine.evaluateEligibility(twin);
    assert.ok(eligibility);

    // 4. Workflow Task Generation
    const mockInsight = {
      insightId: "INS_PROFILE_E2E_01",
      title: "Nộp hồ sơ xét tốt nghiệp đợt 2",
      deadline: "05/09/2026",
      impact: "HIGH",
      whatChanged: "Hạn chót mở đến 05/09/2026.",
      whyItMatters: "Yêu cầu hoàn tất hồ sơ."
    };

    const { tasks } = AcademicWorkflowService.generateActionPlansForStudent(
      profile.identity,
      [mockInsight],
      []
    );
    assert.strictEqual(tasks.length, 1);
    const task = tasks[0];

    // 5. Schedule Notifications
    const reminders = AcademicNotificationOrchestrator.scheduleTaskReminders({ task, insight: mockInsight });
    assert.ok(reminders.length >= 3);

    // 6. Simulate Server Restart and Rehydration
    StudentProfile360Store.rehydrate();
    StudentDigitalTwinStore.rehydrate();
    AcademicTaskStore.rehydrate();
    AcademicNotificationStore.rehydrate();

    // 7. Verify all rehydrated states remain coherent
    const rehydratedProfile = StudentProfile360Store.getProfileByStudentId("24110001");
    assert.ok(rehydratedProfile);
    assert.strictEqual(rehydratedProfile.profileRevision, 10);
    assert.strictEqual(rehydratedProfile.academicSummary.earnedCredits, 7);

    const rehydratedTwin = StudentDigitalTwinStore.getTwin("24110001");
    assert.ok(rehydratedTwin);
    assert.strictEqual(rehydratedTwin.evaluatedAgainstProfileRevision, 10);

    const rehydratedTask = AcademicTaskStore.getTask(task.taskId);
    assert.ok(rehydratedTask);
    assert.strictEqual(rehydratedTask.taskId, task.taskId);

    const rehydratedNotifs = AcademicNotificationStore.getNotificationsByTask(task.taskId);
    assert.ok(rehydratedNotifs.length >= 3);
  });
});
