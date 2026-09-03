import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentIdentityModel } from "../../src/lib/intelligence/academic/studentIdentityModel.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";
import { StudentIdentityService } from "../../src/lib/intelligence/academic/studentIdentityService.js";
import { AcademicRecordsModel } from "../../src/lib/intelligence/academic/academicRecordsModel.js";
import { AcademicRecordsStore } from "../../src/lib/intelligence/academic/academicRecordsStore.js";
import { StudentDigitalTwinStore } from "../../src/lib/intelligence/academic/studentDigitalTwinStore.js";
import { StudentAcademicSyncBridge } from "../../src/lib/intelligence/academic/studentAcademicSyncBridge.js";
import { AcademicEligibilityEngine } from "../../src/lib/intelligence/academic/academicEligibilityEngine.js";
import { AcademicWorkflowService } from "../../src/lib/intelligence/academic/academicWorkflowService.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "../../src/lib/intelligence/academic/academicNotificationOrchestrator.js";

describe("Authoritative Student Identity & Records Full E2E Chain V1", () => {
  beforeEach(() => {
    StudentIdentityStore.clear();
    AcademicRecordsStore.clear();
    StudentDigitalTwinStore.clear();
    AcademicTaskStore.resetStore();
    AcademicNotificationStore.clear();
  });

  it("should execute the unified full-cycle chain: Auth -> Identity -> Records -> Twin -> Eligibility -> Workflow -> Notification", () => {
    // 1. Authenticate user and register authoritative identity
    const authSession = {
      user: {
        id: "auth_supabase_user_e2e",
        email: "24110099@student.hcmute.edu.vn"
      }
    };

    const identity = StudentIdentityModel.createIdentity({
      studentId: "24110099",
      authUserId: authSession.user.id,
      fullName: "Đặng Thị E2E",
      institutionalEmail: authSession.user.email,
      cohort: 2024,
      programCode: "7480103",
      programName: "Kỹ thuật Phần mềm",
      faculty: "Khoa Công Nghệ Thông Tin"
    });
    StudentIdentityStore.saveIdentity(identity);

    // Verify service resolves identity from session
    const resolvedIdentity = StudentIdentityService.resolveIdentity(authSession);
    assert.strictEqual(resolvedIdentity.studentId, "24110099");

    // 2. Authoritative academic records
    const records = AcademicRecordsModel.createRecord({
      studentId: "24110099",
      totalRequiredCredits: 150,
      courses: [
        { courseCode: "SWEN330103", credits: 4, grade10: 9.0, isPassed: true },
        { courseCode: "INTR430103", credits: 3, grade10: 8.5, isPassed: true },
        { courseCode: "DSAA230203", credits: 4, grade10: 8.0, isPassed: true }
      ],
      certifications: [
        { type: "TOEIC", score: 550, verificationStatus: "VERIFIED" }
      ],
      tuition: {
        remainingDebt: 0
      }
    });
    AcademicRecordsStore.saveRecord(records);

    // 3. Sync to Digital Twin
    const twin = StudentAcademicSyncBridge.syncTwin("24110099");
    assert.strictEqual(twin.earnedCredits, 11);
    assert.strictEqual(twin.certificates[0].score, 550);

    // 4. Eligibility Evaluation
    const eligibility = AcademicEligibilityEngine.evaluateEligibility(twin);
    assert.ok(eligibility);
    assert.strictEqual(eligibility.eligible, false); // only 11 credits
    assert.strictEqual(eligibility.status, "PARTIALLY_ELIGIBLE");

    // 5. Generate Workflow Action Plans & Tasks
    const mockInsight = {
      insightId: "INS_IDENTITY_E2E_01",
      title: "Hạn chót đăng ký khóa luận tốt nghiệp K24",
      deadline: "10/09/2026",
      impact: "HIGH",
      whatChanged: "Thời hạn mở đến 10/09/2026.",
      whyItMatters: "Yêu cầu hoàn tất hồ sơ."
    };

    const { tasks } = AcademicWorkflowService.generateActionPlansForStudent(
      identity,
      [mockInsight],
      []
    );
    assert.strictEqual(tasks.length, 1);
    const task = tasks[0];

    // 6. Schedule Reminders via Notification Orchestrator
    const reminders = AcademicNotificationOrchestrator.scheduleTaskReminders({ task, insight: mockInsight });
    assert.ok(reminders.length >= 3);

    // 7. Auto-cancellation when task completed
    for (const step of task.steps) {
      AcademicWorkflowService.completeStep(task.taskId, step.stepId, identity.studentId);
    }

    const finalTask = AcademicTaskStore.getTask(task.taskId);
    assert.strictEqual(finalTask.status, "COMPLETED");

    const activeNotifs = AcademicNotificationStore.getNotificationsByTask(task.taskId)
      .filter(n => n.status === "SCHEDULED" || n.status === "QUEUED");
    assert.strictEqual(activeNotifs.length, 0);
  });
});
