/**
 * StudentHub AI — Canonical Academic Plan Drift & Reconciliation Engine V1
 * 
 * Reconciles student-adopted study plans against authoritative live academic sources:
 * - Academic Records & Transcripts (Official grades & credits)
 * - Digital Twin & Eligibility (Authoritative milestone requirements)
 * - Profile 360 (Financial clearance & revision vectors)
 * - Academic Tasks (Canonical durable task execution state)
 * 
 * Core Invariants:
 * 1. ACTUAL > PLAN: Real academic transcript always overrides planned expectations.
 * 2. NO AUTONOMOUS REPLANNING: Engine detects drift and generates explainable recommendations,
 *    routing the student to Decision Studio without silent mutation.
 * 3. EXPLAINABILITY: Human-friendly Vietnamese explanations tied directly to course prerequisites.
 */

import {
  AcademicExecutionModel,
  EXECUTION_STATUS,
  ITEM_EXECUTION_STATUS,
  ITEM_TYPE,
  DRIFT_SEVERITY,
  DRIFT_CATEGORY,
  REPLAN_RECOMMENDATION
} from "./academicExecutionModel.js";
import { AcademicDecisionStore } from "./academicDecisionStore.js";
import { AcademicRecordsStore } from "./academicRecordsStore.js";
import { StudentDigitalTwinStore } from "./studentDigitalTwinStore.js";
import { StudentProfile360Service } from "./studentProfile360Service.js";
import { AcademicTaskStore } from "./academicTaskStore.js";
import { AcademicPrerequisiteEngine } from "./academicPrerequisiteEngine.js";

export class AcademicPlanDriftEngine {
  /**
   * Reconciles an adopted plan against live academic reality
   * @param {object} params
   * @returns {object} Immutable Execution Record with Plan vs Actual and Drift Analysis
   */
  static evaluateExecution({
    studentId,
    targetTerm = "2026-HK1",
    adoptedPlan = null,
    profile360 = null,
    digitalTwin = null,
    academicRecords = null,
    tasks = null
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[DRIFT_ENGINE_ERROR] studentId is required to evaluate execution.");
    }

    const cleanStudentId = String(studentId).trim();
    const cleanTerm = String(targetTerm).trim().toUpperCase();

    // 1. Resolve Active Adopted Plan
    const activeAdopted = adoptedPlan || AcademicDecisionStore.getActiveAdoption(cleanStudentId, cleanTerm);

    if (!activeAdopted) {
      return AcademicExecutionModel.createExecutionRecord({
        executionId: `EXEC_EMPTY_${cleanStudentId}_${cleanTerm}`,
        adoptedPlanId: "NONE",
        studentId: cleanStudentId,
        targetTerm: cleanTerm,
        planTitle: "Chưa Có Kế Hoạch Đã Chọn",
        status: EXECUTION_STATUS.NOT_STARTED,
        drift: {
          driftState: DRIFT_SEVERITY.NONE,
          driftReasons: ["Sinh viên chưa chọn kế hoạch học tập nào cho học kỳ này."],
          recommendedResponse: REPLAN_RECOMMENDATION.REPLAN,
          replanRationale: "Vui lòng truy cập Studio So Sánh & Quyết Định để chọn một phương án học kỳ phù hợp."
        }
      });
    }

    // 2. Load Live Authoritative Academic Data
    const liveProfile = profile360 || StudentProfile360Service.getProfile360(cleanStudentId);
    const liveTwin = digitalTwin || StudentDigitalTwinStore.getTwin(cleanStudentId);
    const liveRecords = academicRecords || AcademicRecordsStore.getRecordByStudentId(cleanStudentId);
    const liveTasks = tasks || AcademicTaskStore.getTasksByStudent(cleanStudentId);

    const actualCourses = liveRecords?.courses || [];
    const actualCerts = liveTwin?.certificates || [];

    // 3. Reconcile Planned Items vs Actual Reality
    const planVsActualItems = [];
    const driftReasons = [];
    const affectedItems = [];
    let maxDriftSeverity = DRIFT_SEVERITY.NONE;
    let completedCreditsCount = 0;
    let completedItemsCount = 0;

    const plannedCourses = activeAdopted.selectedCourses || [];
    const plannedActions = activeAdopted.selectedActions || [];
    const totalPlannedCount = plannedCourses.length + plannedActions.length;

    // A. Reconcile Planned Courses
    for (const plannedCourse of plannedCourses) {
      const code = String(plannedCourse.code || "").toUpperCase();
      const name = plannedCourse.name || code;
      const credits = Number(plannedCourse.credits) || 3;
      const courseInfo = AcademicPrerequisiteEngine.getCourseByCode(code);
      const downstreamCount = Number(plannedCourse.unlockedDownstreamCount) || 0;

      // Check authoritative transcript
      const matchedRecord = actualCourses.find(c => String(c.courseCode || "").toUpperCase() === code);

      let actualState = "NOT_STARTED";
      let itemStatus = ITEM_EXECUTION_STATUS.PLANNED;
      let driftDetails = null;

      if (matchedRecord) {
        const grade = String(matchedRecord.grade || "").toUpperCase();
        const isPassed = ["A", "B+", "B", "C+", "C", "D+", "D", "PASS", "DAT"].includes(grade);

        if (isPassed || matchedRecord.status === "COMPLETED") {
          actualState = `COMPLETED (${grade || "ĐẠT"})`;
          itemStatus = ITEM_EXECUTION_STATUS.COMPLETED;
          completedCreditsCount += credits;
          completedItemsCount += 1;
        } else if (grade === "F" || matchedRecord.status === "FAILED") {
          actualState = "FAILED (Điểm F)";
          itemStatus = ITEM_EXECUTION_STATUS.FAILED;

          const severity = downstreamCount > 0 ? DRIFT_SEVERITY.CRITICAL : DRIFT_SEVERITY.HIGH;
          driftDetails = {
            category: DRIFT_CATEGORY.COURSE_FAILED,
            severity,
            explanation: `Học phần ${code} (${name}) không đạt điểm qua môn (Điểm F). ${
              downstreamCount > 0
                ? `Môn này là tiên quyết của ${downstreamCount} học phần tiếp theo, gây nghẽn lộ trình tốt nghiệp.`
                : "Cần sắp xếp học lại để tích lũy đủ tín chỉ."
            }`
          };
          driftReasons.push(driftDetails.explanation);
          affectedItems.push(code);

          if (this.#isMoreSevere(severity, maxDriftSeverity)) {
            maxDriftSeverity = severity;
          }
        } else if (matchedRecord.status === "IN_PROGRESS") {
          actualState = "IN_PROGRESS (Đang học)";
          itemStatus = ITEM_EXECUTION_STATUS.IN_PROGRESS;
        }
      } else {
        // Check active task store
        const taskMatch = liveTasks.find(t => t.payload?.courseCode === code || t.title?.includes(code));
        if (taskMatch) {
          if (taskMatch.status === "COMPLETED") {
            actualState = "COMPLETED";
            itemStatus = ITEM_EXECUTION_STATUS.COMPLETED;
            completedCreditsCount += credits;
            completedItemsCount += 1;
          } else if (taskMatch.status === "IN_PROGRESS" || taskMatch.status === "CLAIMED") {
            actualState = "IN_PROGRESS";
            itemStatus = ITEM_EXECUTION_STATUS.IN_PROGRESS;
          } else if (taskMatch.status === "BLOCKED") {
            actualState = "BLOCKED";
            itemStatus = ITEM_EXECUTION_STATUS.PLANNED;
            const severity = DRIFT_SEVERITY.MEDIUM;
            driftDetails = {
              category: DRIFT_CATEGORY.WORKFLOW_BLOCKED,
              severity,
              explanation: `Quy trình đăng ký/thực hiện học phần ${code} đang bị tắc nghẽn.`
            };
            driftReasons.push(driftDetails.explanation);
            affectedItems.push(code);
            if (this.#isMoreSevere(severity, maxDriftSeverity)) {
              maxDriftSeverity = severity;
            }
          }
        } else {
          actualState = "NOT_ENROLLED";
          itemStatus = ITEM_EXECUTION_STATUS.PLANNED;
        }
      }

      planVsActualItems.push(AcademicExecutionModel.createPlanVsActualItem({
        itemCode: code,
        itemName: name,
        itemType: ITEM_TYPE.COURSE,
        credits,
        plannedState: "COMPLETED",
        actualState,
        status: itemStatus,
        isPrerequisiteFor: courseInfo?.prerequisites || [],
        driftDetails
      }));
    }

    // B. Reconcile Planned Non-Course Actions (e.g. Certificates)
    for (const actionStr of plannedActions) {
      let actualState = "NOT_STARTED";
      let itemStatus = ITEM_EXECUTION_STATUS.PLANNED;
      let driftDetails = null;

      if (actionStr.toUpperCase().includes("TOEIC")) {
        const toeicCert = actualCerts.find(c => c.type === "TOEIC");
        const currentScore = toeicCert?.score || 0;
        if (currentScore >= 550) {
          actualState = `COMPLETED (TOEIC ${currentScore})`;
          itemStatus = ITEM_EXECUTION_STATUS.COMPLETED;
          completedItemsCount += 1;
        } else {
          actualState = `IN_PROGRESS (TOEIC ${currentScore} / 550)`;
          itemStatus = ITEM_EXECUTION_STATUS.IN_PROGRESS;
        }
      } else {
        actualState = "PLANNED";
        itemStatus = ITEM_EXECUTION_STATUS.PLANNED;
      }

      planVsActualItems.push(AcademicExecutionModel.createPlanVsActualItem({
        itemCode: `ACT_${planVsActualItems.length + 1}`,
        itemName: actionStr,
        itemType: ITEM_TYPE.ACTION,
        credits: 0,
        plannedState: "COMPLETED",
        actualState,
        status: itemStatus,
        driftDetails
      }));
    }

    // 4. Staleness Revalidation Guard
    const currentProfRev = liveProfile?.profileRevision || 1;
    const currentTwinRev = liveTwin?.revision || 1;
    const isStale = AcademicDecisionStore.isAdoptionStale(activeAdopted, currentProfRev, currentTwinRev);

    // 5. Determine Overall Execution Status & Replan Recommendation
    let overallStatus = EXECUTION_STATUS.ACTIVE;
    let recommendedResponse = REPLAN_RECOMMENDATION.NO_ACTION;
    let replanRationale = "";

    if (isStale) {
      overallStatus = EXECUTION_STATUS.STALE;
      recommendedResponse = REPLAN_RECOMMENDATION.REVIEW_REQUIRED;
      replanRationale = "Hồ sơ học vụ hoặc bản sao số đã cập nhật phiên bản mới. Kế hoạch hiện tại cần được tái đánh giá.";
      driftReasons.unshift("Phiên bản hồ sơ học vụ đã thay đổi kể từ thời điểm chọn kế hoạch.");
    } else if (maxDriftSeverity === DRIFT_SEVERITY.CRITICAL) {
      overallStatus = EXECUTION_STATUS.BLOCKED;
      recommendedResponse = REPLAN_RECOMMENDATION.REPLAN;
      replanRationale = "Phát hiện học phần tiên quyết không đạt điểm qua môn, gây nghẽn lộ trình tốt nghiệp. Cần lập lại kế hoạch ngay tại Decision Studio.";
    } else if (maxDriftSeverity === DRIFT_SEVERITY.HIGH) {
      overallStatus = EXECUTION_STATUS.AT_RISK;
      recommendedResponse = REPLAN_RECOMMENDATION.ADJUST;
      replanRationale = "Kế hoạch học tập đang bị lệch tiến độ đáng kể. Khuyến nghị điều chỉnh danh mục môn học.";
    } else if (maxDriftSeverity === DRIFT_SEVERITY.MEDIUM || maxDriftSeverity === DRIFT_SEVERITY.LOW) {
      overallStatus = EXECUTION_STATUS.AT_RISK;
      recommendedResponse = REPLAN_RECOMMENDATION.CONTINUE;
      replanRationale = "Có độ lệch nhỏ nhưng vẫn trong giới hạn xử lý. Tiếp tục theo dõi tiến độ hoàn thành.";
    } else if (completedItemsCount === totalPlannedCount && totalPlannedCount > 0) {
      overallStatus = EXECUTION_STATUS.COMPLETED;
      recommendedResponse = REPLAN_RECOMMENDATION.NO_ACTION;
      replanRationale = "Đã hoàn tất 100% mục tiêu của kế hoạch học kỳ.";
    } else if (completedItemsCount === 0) {
      overallStatus = EXECUTION_STATUS.ACTIVE;
      recommendedResponse = REPLAN_RECOMMENDATION.CONTINUE;
      replanRationale = "Kế hoạch đang trong quá trình thực hiện học kỳ.";
    }

    const progressPercentage = totalPlannedCount > 0
      ? Math.round((completedItemsCount / totalPlannedCount) * 100)
      : 0;

    return AcademicExecutionModel.createExecutionRecord({
      executionId: `EXEC_${cleanStudentId}_${activeAdopted.planId}_${cleanTerm}`,
      adoptedPlanId: activeAdopted.planId,
      studentId: cleanStudentId,
      targetTerm: cleanTerm,
      planType: activeAdopted.planType,
      planTitle: activeAdopted.planTitle,
      status: overallStatus,
      baseRevisions: {
        planRevision: activeAdopted.planRevision || 1,
        profileRevision: currentProfRev,
        twinRevision: currentTwinRev,
        curriculumVersion: "2024-v1",
        catalogRevision: 1
      },
      plannedItems: planVsActualItems,
      actualItems: actualCourses,
      progress: {
        plannedTotalCredits: activeAdopted.totalCredits || 0,
        actualCompletedCredits: completedCreditsCount,
        completedItemCount: completedItemsCount,
        totalItemCount: totalPlannedCount,
        progressPercentage
      },
      drift: {
        driftState: maxDriftSeverity,
        driftScore: maxDriftSeverity === DRIFT_SEVERITY.CRITICAL ? 100 : maxDriftSeverity === DRIFT_SEVERITY.HIGH ? 75 : maxDriftSeverity === DRIFT_SEVERITY.MEDIUM ? 40 : maxDriftSeverity === DRIFT_SEVERITY.LOW ? 20 : 0,
        driftReasons,
        affectedItems,
        recommendedResponse,
        replanRationale
      },
      blockers: maxDriftSeverity === DRIFT_SEVERITY.CRITICAL ? affectedItems : [],
      nextActions: [
        "Xem chi tiết tiến độ tại Academic Execution Center",
        ...(recommendedResponse === REPLAN_RECOMMENDATION.REPLAN
          ? ["Truy cập Decision Studio để chọn phương án điều chỉnh"]
          : ["Tiếp tục hoàn tất các học phần đang diễn ra"])
      ]
    });
  }

  static #isMoreSevere(sevA, sevB) {
    const rank = {
      [DRIFT_SEVERITY.NONE]: 0,
      [DRIFT_SEVERITY.LOW]: 1,
      [DRIFT_SEVERITY.MEDIUM]: 2,
      [DRIFT_SEVERITY.HIGH]: 3,
      [DRIFT_SEVERITY.CRITICAL]: 4
    };
    return (rank[sevA] || 0) > (rank[sevB] || 0);
  }
}
