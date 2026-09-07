// frontend/tests/community/canonical_announcement_dedup.test.mjs

import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateCanonicalHash,
  normalizeCanonicalUrl,
  normalizeTitle,
  aggregateObservations,
  executeIdempotentMutation,
  resetMutationStoreForTests,
  CanonicalAnnouncementError,
} from "../../src/lib/community/CanonicalAnnouncementService.js";

beforeEach(() => {
  resetMutationStoreForTests();
});

test("Canonical URL & Title normalization", () => {
  const rawUrl1 = "https://online.hcmute.edu.vn/ThongBao/ChiTiet?id=123&utm_source=facebook&utm_medium=cpc#top";
  const rawUrl2 = "https://online.hcmute.edu.vn/ThongBao/ChiTiet?id=123";

  const norm1 = normalizeCanonicalUrl(rawUrl1);
  const norm2 = normalizeCanonicalUrl(rawUrl2);

  assert.equal(norm1, norm2, "URLs with tracking parameters and hash fragments normalize to the same canonical URL");
  assert.equal(norm1, "https://online.hcmute.edu.vn/thongbao/chitiet?id=123");

  const title1 = "  [THÔNG BÁO] Lỗi Hệ Thống Đăng Ký Học Phần Đợt 2!  ";
  const title2 = "Thông báo: lỗi hệ thống đăng ký học phần đợt 2";
  assert.equal(normalizeTitle(title1), normalizeTitle(title2), "Titles with differing casing, brackets, and extra spaces normalize identically");
});

test("Deterministic canonical identity hash generation", () => {
  const hashA = generateCanonicalHash({
    schoolId: "HCMUTE",
    canonicalUrl: "https://online.hcmute.edu.vn/thongbao?id=99",
    title: "Lịch thi học kỳ 2 năm học 2025-2026",
    content: "Chi tiết lịch thi chính thức các môn học đại cương...",
  });

  const hashB = generateCanonicalHash({
    schoolId: "hcmute",
    canonicalUrl: "https://online.hcmute.edu.vn/thongbao?id=99&utm_source=share",
    title: "[HCMUTE] LỊCH THI HỌC KỲ 2 NĂM HỌC 2025-2026!",
    content: "Chi tiết lịch thi chính thức các môn học đại cương...",
  });

  assert.equal(hashA, hashB, "Different representations of the same announcement yield the exact same SHA-256 canonical hash");
});

test("Aggregation: 27 student reports aggregated into ONE canonical event + 27 related reports", () => {
  const rawReports = [];
  for (let i = 1; i <= 27; i++) {
    rawReports.push({
      observationId: `obs_reg_${i}`,
      title: "Lỗi cổng đăng ký học phần",
      topic: "COURSE_REGISTRATION",
      statement: `K24 báo cáo: Không thể nhấn lưu TKB lúc 08:15 (sinh viên thứ ${i})`,
      schoolId: "HCMUTE",
      canonicalUrl: "https://online.hcmute.edu.vn/dang-ky-mon-hoc",
      submittedAt: new Date(Date.now() - (28 - i) * 60000).toISOString(),
      evidenceRefs: [`ev_screenshot_${i}.png`],
    });
  }

  // Also add 2 unrelated reports
  rawReports.push({
    observationId: "obs_lib_1",
    title: "Thư viện mở cửa tăng ca mùa thi",
    topic: "CAMPUS_SERVICE",
    statement: "Thư viện khu A mở đến 22:00 cho sinh viên ôn tập",
    schoolId: "HCMUTE",
    canonicalUrl: "https://lib.hcmute.edu.vn/tin-tuc/tang-ca",
  });

  const aggregated = aggregateObservations(rawReports);

  // Must aggregate into 2 canonical clusters, not 29 individual cards!
  assert.equal(aggregated.length, 2, "29 raw reports must collapse into 2 distinct canonical events");

  const registrationIncident = aggregated.find((item) => item.topic === "COURSE_REGISTRATION");
  assert.ok(registrationIncident, "Aggregated course registration incident must exist");
  assert.equal(registrationIncident.relatedReportCount, 27, "Must report exactly 27 aggregated reports");
  assert.equal(registrationIncident.aggregationLabel, "27 báo cáo tương tự");
  assert.equal(registrationIncident.aggregationStatus, "MAJOR_INCIDENT_CONSENSUS");
  assert.ok(registrationIncident.cohorts.includes("K24"), "Must detect K24 cohort involvement");
  assert.equal(registrationIncident.relatedReports.length, 27, "Must preserve all 27 underlying reports");
  assert.equal(registrationIncident.evidenceRefs.length, 27, "Must consolidate all 27 evidence references");
});

test("Mutation Idempotency: Replaying same clientMutationId returns identical result without re-executing", async () => {
  let executionCount = 0;
  const executor = async () => {
    executionCount++;
    return { confirmationId: "conf_123", status: "RECORDED", vote: "UPVOTE" };
  };

  const clientMutationId = "mut-uuid-987654";
  const payload = { targetId: "canonical-evt-1", action: "CONFIRM" };

  // First execution
  const first = await executeIdempotentMutation({
    clientMutationId,
    actorId: "user_a",
    actionType: "COMMUNITY_CONFIRMATION",
    payload,
    executor,
  });

  assert.equal(first.idempotent, false, "Initial call must not be idempotent replay");
  assert.equal(executionCount, 1, "Executor must be called once");
  assert.equal(first.result.status, "RECORDED");

  // Replay identical mutation
  const replay = await executeIdempotentMutation({
    clientMutationId,
    actorId: "user_a",
    actionType: "COMMUNITY_CONFIRMATION",
    payload,
    executor,
  });

  assert.equal(replay.idempotent, true, "Replayed call must report idempotent: true");
  assert.equal(executionCount, 1, "Executor must NOT be called again (counter remains 1)");
  assert.deepEqual(replay.result, first.result, "Replayed call returns exact same result object");

  // Conflicting payload with same clientMutationId must throw 409
  await assert.rejects(
    async () => {
      await executeIdempotentMutation({
        clientMutationId,
        actorId: "user_a",
        actionType: "COMMUNITY_CONFIRMATION",
        payload: { targetId: "canonical-evt-DIFFERENT", action: "DOWNVOTE" },
        executor,
      });
    },
    (err) => {
      assert.ok(err instanceof CanonicalAnnouncementError);
      assert.equal(err.code, "MUTATION_IDEMPOTENCY_CONFLICT");
      assert.equal(err.statusCode, 409);
      return true;
    },
    "Replaying same clientMutationId with different payload must throw 409 conflict"
  );
});
