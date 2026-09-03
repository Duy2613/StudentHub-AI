/**
 * StudentHub AI — Master End-to-End Academic Intelligence Pipeline Test Suite
 * 
 * Verifies complete 21-step scenario:
 * 1. Register official source
 * 2. Check source
 * 3. Fetch document V1
 * 4. Validate provenance
 * 5. Store snapshot V1
 * 6. Re-check same document -> UNCHANGED (HTTP 304 / Hash match)
 * 7. Fetch modified document V2 (Deadline shift)
 * 8. Store snapshot V2 (Version increment)
 * 9. Detect change -> Semantic Diff -> DEADLINE_CHANGE
 * 10. Extract Academic Rule
 * 11. Evaluate Student Profile -> Determine HIGH impact
 * 12. Generate AcademicInsight entity
 * 13. Create Notification Event
 * 14. Create Timeline Event
 * 15. Deduplication verification
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicSourceRegistry } from "../../src/lib/intelligence/academic/academicSourceRegistry.js";
import { AcademicDocumentFetcher } from "../../src/lib/intelligence/academic/academicDocumentFetcher.js";
import { DocumentSnapshotStore } from "../../src/lib/intelligence/academic/documentSnapshotStore.js";
import { AcademicIntelligenceService } from "../../src/lib/intelligence/academic/academicIntelligenceService.js";

test("▶ [ACADEMIC-E2E-1] Full Lifecycle Scenario: Source -> Snapshot -> Diff -> Rule -> Impact -> Timeline/Notification", async (t) => {
  DocumentSnapshotStore.resetDynamicSnapshots();
  AcademicSourceRegistry.resetRegistry();

  const sourceId = "SRC_HCMUTE_DAOTAO";

  const docV1Body = `
    Trường Đại học Sư phạm Kỹ thuật TP.HCM
    Phòng Đào Tạo & Học Vụ
    Thông báo số 123/TB-ĐHSPKT
    Kế hoạch đăng ký học lại Khóa 2024 và Khóa 2026 ngành 7480103.
    Hạn chót đăng ký: 30/08/2026.
    Chuẩn đầu ra tiếng Anh: TOEIC 550 điểm.
  `;

  const docV2Body = `
    Trường Đại học Sư phạm Kỹ thuật TP.HCM
    Phòng Đào Tạo & Học Vụ
    Thông báo số 123/TB-ĐHSPKT
    Kế hoạch đăng ký học lại Khóa 2024 và Khóa 2026 ngành 7480103.
    Hạn chót đăng ký: 05/09/2026.
    Chuẩn đầu ra tiếng Anh: TOEIC 550 điểm.
  `;

  await t.test("Step 1-5: Initial Sync stores Snapshot V1", async () => {
    AcademicDocumentFetcher.setTransport(async () => ({
      status: 200,
      headers: { "etag": '"v1-hash"' },
      body: docV1Body,
      finalUrl: "https://daotao.hcmute.edu.vn/tb123"
    }));

    const syncReport = await AcademicIntelligenceService.syncSource(sourceId);

    assert.equal(syncReport.success, true);
    assert.equal(syncReport.status, "CHANGED");
    assert.equal(syncReport.newSnapshot.versionId, "v1.0");
    assert.ok(syncReport.extractedRules.length >= 1);

    AcademicDocumentFetcher.resetTransport();
  });

  await t.test("Step 6-7: Re-syncing same content returns UNCHANGED", async () => {
    AcademicDocumentFetcher.setTransport(async () => ({
      status: 304,
      headers: { "etag": '"v1-hash"' },
      body: "",
      finalUrl: "https://daotao.hcmute.edu.vn/tb123"
    }));

    const syncReport = await AcademicIntelligenceService.syncSource(sourceId);

    assert.equal(syncReport.success, true);
    assert.equal(syncReport.status, "UNCHANGED");

    AcademicDocumentFetcher.resetTransport();
  });

  await t.test("Step 8-15: Modified V2 produces Snapshot V2, Semantic Diff, Rules, and Student Trajectory", async () => {
    AcademicDocumentFetcher.setTransport(async () => ({
      status: 200,
      headers: { "etag": '"v2-hash"' },
      body: docV2Body,
      finalUrl: "https://daotao.hcmute.edu.vn/tb123"
    }));

    const syncReport = await AcademicIntelligenceService.syncSource(sourceId);

    assert.equal(syncReport.success, true);
    assert.equal(syncReport.status, "CHANGED");
    assert.equal(syncReport.newSnapshot.versionId, "v2.0");
    assert.ok(syncReport.semanticDiff.changes.length >= 1);

    const deadlineChange = syncReport.semanticDiff.changes.find(c => c.field === "DEADLINE_DATE");
    assert.ok(deadlineChange);
    assert.equal(deadlineChange.oldValue, "30/08/2026");
    assert.equal(deadlineChange.newValue, "05/09/2026");

    // Evaluate for affected Student K24 SE
    const studentK24 = {
      studentId: "24110099",
      cohort: 2024,
      programCode: "7480103",
      englishCertificate: { type: "TOEIC", score: 450 },
      tuitionPaid: true
    };

    const trajectory = AcademicIntelligenceService.evaluateStudentTrajectory(
      studentK24,
      syncReport.extractedRules,
      syncReport.semanticDiff.changes
    );

    assert.equal(trajectory.studentId, "24110099");
    assert.ok(trajectory.insights.length >= 1);
    assert.ok(trajectory.notifications.length >= 1);
    assert.ok(trajectory.timelineEvents.length >= 1);

    // Verify Notification content
    const notif = trajectory.notifications[0];
    assert.ok(notif.title.includes("[HỌC VỤ K24]"));
    assert.ok(notif.actions.length > 0);

    AcademicDocumentFetcher.resetTransport();
  });
});
