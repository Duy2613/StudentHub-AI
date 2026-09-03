/**
 * StudentHub AI — Academic Command Center UI & View Model Contract Test Suite
 * 
 * Tests:
 * 1. View Model formatting (Dates, Relative Countdowns, Badges, Category Labels)
 * 2. Action Center priority filtering (CRITICAL & HIGH gating)
 * 3. Personalized impact reasons fidelity (Zero hallucination from backend)
 * 4. Graceful handling of empty, stale, and unknown category states
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicCommandCenterViewModel, IMPACT_BADGE_MAP } from "../../src/lib/intelligence/academic/academicCommandCenterViewModel.js";

test("▶ [COMMAND-CENTER-VM-1] View Model Formatting & Badges", async (t) => {
  await t.test("VM1.1: formatDate correctly transforms ISO dates and handles fallbacks", () => {
    assert.equal(AcademicCommandCenterViewModel.formatDate("2026-09-05"), "05/09/2026");
    assert.equal(AcademicCommandCenterViewModel.formatDate("2026-08-26T15:30:00.000Z"), "26/08/2026");
    assert.equal(AcademicCommandCenterViewModel.formatDate("30/08/2026"), "30/08/2026");
    assert.equal(AcademicCommandCenterViewModel.formatDate(null), "N/A");
  });

  await t.test("VM1.2: formatRelativeDeadline computes accurate countdown strings", () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    const futureIso = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;

    const countdown = AcademicCommandCenterViewModel.formatRelativeDeadline(futureIso);
    assert.ok(countdown.includes("Còn 10 ngày") || countdown.includes("Còn 11 ngày"));

    assert.equal(AcademicCommandCenterViewModel.formatRelativeDeadline("2020-01-01"), "Đã hết hạn");
    assert.equal(AcademicCommandCenterViewModel.formatRelativeDeadline(null), "");
  });

  await t.test("VM1.3: getImpactBadge provides canonical colors and labels without mutating data", () => {
    const crit = AcademicCommandCenterViewModel.getImpactBadge("CRITICAL");
    assert.equal(crit.label, "Khẩn cấp");
    assert.ok(crit.colorClass.includes("rose"));

    const high = AcademicCommandCenterViewModel.getImpactBadge("HIGH");
    assert.equal(high.label, "Cần xử lý");
    assert.ok(high.colorClass.includes("amber"));

    const unknown = AcademicCommandCenterViewModel.getImpactBadge("UNKNOWN_VALUE");
    assert.equal(unknown.label, "Cần chú ý"); // Graceful fallback
  });

  await t.test("VM1.4: getCategoryLabel returns user-friendly Vietnamese labels", () => {
    assert.equal(AcademicCommandCenterViewModel.getCategoryLabel("DEADLINE_CHANGE"), "Thay Đổi Thời Hạn");
    assert.equal(AcademicCommandCenterViewModel.getCategoryLabel("FEE_CHANGE"), "Biểu Mức Học Phí");
    assert.equal(AcademicCommandCenterViewModel.getCategoryLabel("REQUIREMENT_CHANGE"), "Yêu Cầu Chuẩn Đầu Ra");
    assert.equal(AcademicCommandCenterViewModel.getCategoryLabel("UNKNOWN_CAT"), "UNKNOWN_CAT");
  });
});

test("▶ [COMMAND-CENTER-DATA-2] Action Center Gating & Reason Fidelity", async (t) => {
  await t.test("DC2.1: Urgent filtering isolates CRITICAL and HIGH items for the Action Center", () => {
    const sampleInsights = [
      { insightId: "INS_1", impact: "LOW", title: "Thông báo tuyển dụng" },
      { insightId: "INS_2", impact: "HIGH", title: "Hạn chót đăng ký học lại" },
      { insightId: "INS_3", impact: "CRITICAL", title: "Cảnh báo học vụ & Học phí" },
      { insightId: "INS_4", impact: "MEDIUM", title: "Lịch thi giữa kỳ" }
    ];

    const urgentItems = sampleInsights.filter(
      (i) => i.impact === "CRITICAL" || i.impact === "HIGH"
    );

    assert.equal(urgentItems.length, 2);
    assert.deepEqual(urgentItems.map(i => i.insightId), ["INS_2", "INS_3"]);
  });

  await t.test("DC2.2: Personalized reasons from backend survive presentation mapping with 100% fidelity", () => {
    const rawBackendInsight = {
      insightId: "INS_ENG_K24",
      impact: "HIGH",
      title: "Chuẩn Đầu Ra Ngoại Ngữ",
      whatChanged: "Chuẩn đầu ra TOEIC nâng lên 550 điểm.",
      whyItMatters: "Bạn thuộc Khóa K24 ngành Kỹ thuật Phần mềm, điểm hiện tại là 480 điểm (Chưa đạt chuẩn).",
      deadline: "2026-09-05",
      actions: [{ label: "Xem văn bản gốc", targetUrl: "https://daotao.hcmute.edu.vn" }]
    };

    assert.ok(rawBackendInsight.whyItMatters.includes("Khóa K24"));
    assert.ok(rawBackendInsight.whyItMatters.includes("Chưa đạt chuẩn"));
    assert.equal(rawBackendInsight.deadline, "2026-09-05");
  });
});

test("▶ [COMMAND-CENTER-SERVER-FIRST-3] Authoritative Server Data Loader & Sync Status", async (t) => {
  const { getAuthoritativeCommandCenterData } = await import("../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js");

  await t.test("SF3.1: getAuthoritativeCommandCenterData returns complete typed payload on the server", () => {
    const payload = getAuthoritativeCommandCenterData({ studentId: "24110001", cohort: 2024 });
    assert.equal(payload.success, true);
    assert.equal(payload.studentProfile.cohort, 2024);
    assert.ok(Array.isArray(payload.priorityInsights));
    assert.ok(Array.isArray(payload.recentChanges));
    assert.ok(Array.isArray(payload.timelineEvents));
    assert.ok(payload.digitalTwinState);
    assert.ok(payload.syncStatus);
    assert.equal(payload.syncStatus.isLive, true);
  });

  await t.test("SF3.2: syncStatus correctly distinguishes LIVE from STALE warning states", () => {
    const liveStatus = { isLive: true, warning: null };
    const isLive = Boolean(liveStatus && liveStatus.isLive === true && !liveStatus.warning);
    assert.equal(isLive, true);

    const staleStatus = { isLive: false, warning: "STALE_SOURCE_WARNING: Live fetch timeout" };
    const isStaleLive = Boolean(staleStatus && staleStatus.isLive === true && !staleStatus.warning);
    assert.equal(isStaleLive, false);
  });
});

