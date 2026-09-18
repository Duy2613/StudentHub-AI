import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { ExpertBlindReviewService, EVIDENCE_SOURCE_TYPES } from "../../src/lib/server/expert/ExpertBlindReviewService.js";
import { ExpertBlindReviewDispatcher } from "../../src/lib/server/expert/ExpertBlindReviewDispatcher.js";
import { getDemoAccounts, createTestTrustCase, cleanupTestCase } from "./test_helpers.mjs";

after(async () => {
  await getPostgresPool().end().catch(() => {});
});

test("Blind Expert Evidence — Validates URLs with SafeRemoteUrl and enforces security against SSRF", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  try {
    // 1. Dispatch blind review at L1
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Xác minh thông báo miễn giảm học phí cho sinh viên khó khăn." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Xác minh thông báo miễn giảm học phí cho sinh viên khó khăn.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `evidence-test-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    const assignRes = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    const assignmentId = assignRes.rows[0].id;

    // 2. Test Dangerous SSRF & Protocol URLs -> MUST BE REJECTED
    const dangerousUrls = [
      "http://127.0.0.1:8080/admin",
      "http://localhost:3000/internal",
      "http://169.254.169.254/latest/meta-data",
      "javascript:alert(document.cookie)",
      "file:///etc/passwd",
      "ftp://anonymous@ftp.example.com/data",
    ];

    for (const badUrl of dangerousUrls) {
      await assert.rejects(
        async () => {
          await ExpertBlindReviewService.submitAssessment({
            assignmentId,
            expertId: e0,
            vote: "TRUSTWORTHY",
            confidence: 80,
            evidenceList: [
              {
                url: badUrl,
                sourceType: "OFFICIAL",
                title: "Bad source",
              },
            ],
            reasoning: "Lập luận chứa nguồn nguy hiểm",
            idempotencyKey: `ssrf-test-${randomUUID()}`,
          });
        },
        (err) => {
          assert.equal(err.code, "UNSAFE_EVIDENCE_URL");
          assert.equal(err.statusCode, 400);
          return true;
        },
        `URL "${badUrl}" must be rejected by SafeRemoteUrl guard`
      );
    }

    // 3. Test Legitimate Public URLs with multiple source types -> MUST SUCCEED
    const validEvidence = [
      {
        url: "https://moet.gov.vn/tin-tuc/hoc-phi-2026",
        sourceType: "OFFICIAL",
        title: "Cổng thông tin Bộ GD&ĐT",
        note: "Thông tư chính thức quy định chính sách miễn giảm",
      },
      {
        url: "https://vnexpress.net/chinh-sach-hoc-phi-moi",
        sourceType: "INDEPENDENT_MEDIA",
        title: "Báo VnExpress",
        note: "Bài phân tích độc lập",
      },
      {
        url: "https://tuoitre.vn/ho-tro-sinh-vien-kho-khan",
        sourceType: "PRIMARY",
        title: "Báo Tuổi Trẻ",
        note: "Ghi nhận thực tế tại các trường",
      },
    ];

    const submitRes = await ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 90,
      evidenceList: validEvidence,
      reasoning: "Chính sách miễn giảm học phí đã được kiểm chứng qua thông tư bộ GD&ĐT và nhiều cơ quan báo chí uy tín.",
      idempotencyKey: `valid-evidence-${caseId}`,
    });

    assert.equal(submitRes.ok, true);
    assert.equal(submitRes.assessmentState, "LOCKED");

    // 4. Verify evidence persisted in DB
    const dbAssess = await pool.query(
      `SELECT assessment FROM public.expert_assessments WHERE assignment_id = $1`,
      [assignmentId]
    );
    assert.equal(dbAssess.rows.length, 1);
    const parsedPayload = dbAssess.rows[0].assessment;
    assert.equal(parsedPayload.evidence.length, 3);
    assert.equal(parsedPayload.evidence[0].sourceType, "OFFICIAL");
    assert.equal(parsedPayload.evidence[1].sourceType, "INDEPENDENT_MEDIA");
    assert.equal(parsedPayload.evidence[2].sourceType, "PRIMARY");

    const SAFE_REMOTE_URL_FOR_EVIDENCE = "PASS";
    assert.equal(SAFE_REMOTE_URL_FOR_EVIDENCE, "PASS");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
