// frontend/tests/academic/academic_source_deadline_reminder.test.mjs

import test from "node:test";
import assert from "node:assert/strict";

import {
  DurableSchoolSourceRegistry,
  SOURCE_TYPES,
  SOURCE_HEALTH,
} from "../../src/lib/intelligence/academic/DurableSchoolSourceRegistry.js";
import { SchoolIngestionWorker } from "../../src/lib/intelligence/academic/SchoolIngestionWorker.js";
import {
  DeadlineExtractionService,
  EXTRACTION_METHODS,
  VERIFIED_STATUS,
} from "../../src/lib/intelligence/academic/DeadlineExtractionService.js";
import {
  DeterministicReminderService,
  REMINDER_THRESHOLDS,
} from "../../src/lib/intelligence/academic/DeterministicReminderService.js";

test("DurableSchoolSourceRegistry: Priority ordering & conditional caching headers", () => {
  const registry = new DurableSchoolSourceRegistry();

  const hcmuteSources = registry.getSourcesForSchool("HCMUTE");
  assert.ok(hcmuteSources.length >= 3, "HCMUTE has multiple registered sources");

  // Verify priority order: API (priority 1) > RSS (priority 2) > HTML (priority 3)
  assert.equal(hcmuteSources[0].sourceType, SOURCE_TYPES.API, "Top priority source must be API");
  assert.equal(hcmuteSources[1].sourceType, SOURCE_TYPES.RSS, "Second priority source must be RSS");
  assert.equal(hcmuteSources[2].sourceType, SOURCE_TYPES.HTML_SCRAPER, "Third priority source must be HTML");

  // Conditional headers update
  const sourceId = "src_hcmute_api";
  registry.updateConditionalHeaders(sourceId, {
    etag: '"etag-hash-999"',
    lastModified: "Wed, 06 Sep 2026 10:00:00 GMT",
  });

  const meta = registry.getMetadata(sourceId);
  assert.equal(meta.etag, '"etag-hash-999"');
  assert.equal(meta.lastModified, "Wed, 06 Sep 2026 10:00:00 GMT");

  // Failure tracking
  registry.recordFailure(sourceId);
  assert.equal(registry.getMetadata(sourceId).health, SOURCE_HEALTH.DEGRADED);
  registry.recordSuccess(sourceId);
  assert.equal(registry.getMetadata(sourceId).health, SOURCE_HEALTH.HEALTHY);
});

test("SchoolIngestionWorker: 304 Not Modified and Conditional Headers Handling", async () => {
  const registry = new DurableSchoolSourceRegistry();
  registry.updateConditionalHeaders("src_hcmute_rss", {
    etag: '"etag-feed-123"',
    lastModified: "Sun, 06 Sep 2026 00:00:00 GMT",
  });

  let capturedHeaders = {};
  const mockFetch = async (url, options) => {
    capturedHeaders = options.headers;
    // Simulate server returning 304 Not Modified
    return {
      status: 304,
      ok: false,
      headers: {
        get: (h) => null,
      },
    };
  };

  const worker = new SchoolIngestionWorker(registry, {
    fetchFn: mockFetch,
    minHostIntervalMs: 0,
  });

  const pollResult = await worker.pollSource("src_hcmute_rss");

  assert.equal(capturedHeaders["If-None-Match"], '"etag-feed-123"', "Worker must transmit If-None-Match header");
  assert.equal(capturedHeaders["If-Modified-Since"], "Sun, 06 Sep 2026 00:00:00 GMT", "Worker must transmit If-Modified-Since header");
  assert.equal(pollResult.status, "NOT_MODIFIED");
  assert.equal(pollResult.statusCode, 304);
  assert.equal(pollResult.data, null, "304 results in zero unnecessary parsing work");
});

test("DeadlineExtractionService: Strict Provenance & Vietnamese Date Extraction", () => {
  // Case 1: Explicit deadline in text
  const noticeText1 = "Phòng Đào Tạo thông báo: Sinh viên nộp đơn hoãn thi kết thúc học phần trước 17h00 ngày 25/09/2026.";
  const res1 = DeadlineExtractionService.extractDeadline({ text: noticeText1 });

  assert.equal(res1.hasDeadline, true, "Must identify deadline");
  assert.equal(res1.method, EXTRACTION_METHODS.REGEX_DATE_EXTRACTION);
  assert.equal(res1.verifiedStatus, VERIFIED_STATUS.VERIFIED);
  assert.ok(res1.displayText.includes("25/09/2026"), "Display text must include extracted date");
  assert.ok(res1.deadlineIso, "Must contain valid ISO string");

  // Case 2: Announcement with NO deadline -> Strictly defaults to "Chưa xác định hạn chót"
  const noticeText2 = "Thông báo danh sách phòng học bổ sung tuần sinh hoạt đầu năm. Chúc các bạn sinh viên một kỳ học mới tốt lành!";
  const res2 = DeadlineExtractionService.extractDeadline({ text: noticeText2 });

  assert.equal(res2.hasDeadline, false);
  assert.equal(res2.deadlineIso, null);
  assert.equal(res2.displayText, "Chưa xác định hạn chót", "Must strictly default to 'Chưa xác định hạn chót' when unverified");
  assert.equal(res2.verifiedStatus, VERIFIED_STATUS.UNVERIFIED);
  assert.equal(res2.confidence, 0);

  // Case 3: Explicit structured field provided
  const explicitIso = "2026-10-15T17:00:00.000Z";
  const res3 = DeadlineExtractionService.extractDeadline({
    explicitDeadline: explicitIso,
    text: "Nội dung chung",
  });
  assert.equal(res3.hasDeadline, true);
  assert.equal(res3.method, EXTRACTION_METHODS.EXPLICIT_FIELD);
  assert.equal(res3.verifiedStatus, VERIFIED_STATUS.VERIFIED);
});

test("DeterministicReminderService: Due Thresholds and Single-Delivery Idempotency", () => {
  // Reference time: 2026-09-10T00:00:00Z
  const refTime = new Date("2026-09-10T00:00:00Z").getTime();
  const reminderService = new DeterministicReminderService({
    clock: { now: () => refTime },
  });

  const userId = "user-test-std-01";
  const noticeId = "notice-grad-2026";
  const noticeTitle = "Nộp hồ sơ xét tốt nghiệp đợt 3";

  // Deadline 20 hours away -> T-0 is due
  const deadlineT0 = new Date(refTime + 20 * 60 * 60 * 1000).toISOString();
  const dueThresholdsT0 = reminderService.getDueThresholds(deadlineT0, refTime);
  assert.equal(dueThresholdsT0.length, 1);
  assert.equal(dueThresholdsT0[0].id, "T-0");

  // Dispatch T-0 reminder: First delivery succeeds
  const dispatch1 = reminderService.dispatchReminder({
    userId,
    noticeId,
    noticeTitle,
    deadline: deadlineT0,
    thresholdId: "T-0",
  });

  assert.equal(dispatch1.dispatched, true, "First delivery must succeed");
  assert.ok(dispatch1.receiptKey.includes("user-test-std-01::notice-grad-2026::T-0"));

  // Dispatch T-0 reminder AGAIN: Must reject as ALREADY_DELIVERED
  const dispatch2 = reminderService.dispatchReminder({
    userId,
    noticeId,
    noticeTitle,
    deadline: deadlineT0,
    thresholdId: "T-0",
  });

  assert.equal(dispatch2.dispatched, false, "Second delivery must be prevented");
  assert.equal(dispatch2.reason, "ALREADY_DELIVERED");

  // Outbox must contain only 1 notification payload
  assert.equal(reminderService.getPendingOutbox().length, 1);
});
